const { drizzle: drizzlePg } = require('drizzle-orm/postgres-js');
const { drizzle: drizzleSqlite } = require('drizzle-orm/better-sqlite3');
const postgres = require('postgres');
const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { eq, and, or, ilike, sql, desc, count, sum, inArray } = require('drizzle-orm');

const schema = require('../db/schema');
const mongo = require('./mongo');
const { models: mongoModels } = mongo;

let mode = 'sqlite';
let sqliteDb = null;
let pgClient = null;
let drizzleDb = null;

// Initialize SQLite as local database file fallback
const dbPath = path.join(__dirname, '../../local_database.sqlite');
sqliteDb = new Database(dbPath);
sqliteDb.pragma('foreign_keys = ON');
initSqliteTables(sqliteDb);

// Determine database mode
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

// Always initialize fallback SQLite or PostgreSQL immediately so drizzleDb is never null
setupSqliteOrPg();

if (process.env.DB_TYPE !== 'sqlite' && (mongoUri || process.env.DB_TYPE === 'mongodb')) {
    // Connect to MongoDB asynchronously; mode remains sqlite/postgres until mongo is ready
    mongo.connectMongo().then(res => {
        if (res.connected) {
            mode = 'mongodb';
            console.log('[Database] Active Database Engine: MongoDB (Mongoose)');
        } else {
            console.warn('[Database] MongoDB failed to connect. Falling back to local embedded SQLite...');
            mode = 'sqlite';
            setupSqliteOrPg();
        }
    }).catch(err => {
        console.warn(`[Database] MongoDB error (${err.message}). Falling back to local embedded SQLite...`);
        mode = 'sqlite';
        setupSqliteOrPg();
    });
}

function setupSqliteOrPg() {
    if (databaseUrl && (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://'))) {
        try {
            pgClient = postgres(databaseUrl, { ssl: 'require' });
            drizzleDb = drizzlePg(pgClient, { schema });
            mode = 'postgres';
            console.log('[Database] Connected to PostgreSQL (Supabase) via Drizzle ORM');
        } catch (err) {
            console.warn(`[Database] PostgreSQL connection error (${err.message}). Using local SQLite via Drizzle ORM...`);
            drizzleDb = drizzleSqlite(sqliteDb, { schema });
            mode = 'sqlite';
        }
    } else {
        drizzleDb = drizzleSqlite(sqliteDb, { schema });
        mode = 'sqlite';
    }
}

function getTables() {
    return {
        users: mode === 'postgres' ? schema.usersPg : schema.usersSqlite,
        events: mode === 'postgres' ? schema.eventsPg : schema.eventsSqlite,
        registrations: mode === 'postgres' ? schema.registrationsPg : schema.registrationsSqlite,
        payments: mode === 'postgres' ? schema.paymentsPg : schema.paymentsSqlite,
        tickets: mode === 'postgres' ? schema.ticketsPg : schema.ticketsSqlite,
        attendance: mode === 'postgres' ? schema.attendancePg : schema.attendanceSqlite,
        eventImages: mode === 'postgres' ? schema.eventImagesPg : schema.eventImagesSqlite,
        auditLogs: mode === 'postgres' ? schema.auditLogsPg : schema.auditLogsSqlite,
        webhookEvents: mode === 'postgres' ? schema.webhookEventsPg : schema.webhookEventsSqlite
    };
}

function initSqliteTables(db) {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'guest',
            admin_id TEXT UNIQUE,
            member_id TEXT UNIQUE,
            qr_code_data TEXT,
            qr_token TEXT,
            qr_status TEXT DEFAULT 'active',
            qr_scanned_at TEXT,
            qr_scanned_by TEXT,
            qr_device_info TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT DEFAULT 'General',
            cover_image_url TEXT,
            event_date TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            venue TEXT NOT NULL,
            address TEXT NOT NULL,
            google_maps_url TEXT,
            ticket_price REAL NOT NULL DEFAULT 0.00,
            capacity INTEGER NOT NULL DEFAULT 100,
            registration_open_at TEXT,
            registration_close_at TEXT,
            status TEXT NOT NULL DEFAULT 'draft',
            created_by TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS registrations (
            id TEXT PRIMARY KEY,
            event_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            registration_number TEXT UNIQUE NOT NULL,
            guest_name TEXT NOT NULL,
            guest_email TEXT NOT NULL,
            guest_phone TEXT NOT NULL,
            custom_answers TEXT DEFAULT '{}',
            registration_status TEXT NOT NULL DEFAULT 'pending',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(event_id, user_id),
            FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS payments (
            id TEXT PRIMARY KEY,
            registration_id TEXT NOT NULL,
            razorpay_order_id TEXT UNIQUE NOT NULL,
            razorpay_payment_id TEXT,
            razorpay_signature TEXT,
            amount REAL NOT NULL,
            currency TEXT DEFAULT 'INR',
            status TEXT NOT NULL DEFAULT 'pending',
            paid_at TEXT,
            refund_id TEXT,
            refund_status TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(registration_id) REFERENCES registrations(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS tickets (
            id TEXT PRIMARY KEY,
            registration_id TEXT UNIQUE NOT NULL,
            event_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            ticket_number TEXT UNIQUE NOT NULL,
            secure_token TEXT UNIQUE NOT NULL,
            qr_code_data TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
            FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS attendance (
            id TEXT PRIMARY KEY,
            ticket_id TEXT UNIQUE NOT NULL,
            event_id TEXT NOT NULL,
            registration_id TEXT NOT NULL,
            checked_in_by TEXT,
            checked_in_at TEXT DEFAULT CURRENT_TIMESTAMP,
            status TEXT NOT NULL DEFAULT 'checked_in',
            device_info TEXT,
            FOREIGN KEY(ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
            FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS event_images (
            id TEXT PRIMARY KEY,
            event_id TEXT NOT NULL,
            image_url TEXT NOT NULL,
            caption TEXT,
            uploaded_by TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            action TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id TEXT,
            metadata TEXT DEFAULT '{}',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS member_attendance (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            member_id TEXT,
            checked_in_by TEXT,
            checked_in_at TEXT DEFAULT CURRENT_TIMESTAMP,
            status TEXT NOT NULL DEFAULT 'expired',
            device_info TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS webhook_events (
            id TEXT PRIMARY KEY,
            event_id TEXT UNIQUE NOT NULL,
            event_type TEXT NOT NULL,
            payload TEXT NOT NULL,
            processed_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS email_otps (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL,
            otp TEXT NOT NULL,
            purpose TEXT NOT NULL DEFAULT 'registration',
            expires_at INTEGER NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_email_otps ON email_otps(email, purpose);
    `);

    // Ensure users and attendance have member QR and admin_id columns in existing database
    const userMigrations = [
        "ALTER TABLE users ADD COLUMN admin_id TEXT;",
        "ALTER TABLE users ADD COLUMN member_id TEXT;",
        "ALTER TABLE users ADD COLUMN qr_code_data TEXT;",
        "ALTER TABLE users ADD COLUMN qr_token TEXT;",
        "ALTER TABLE users ADD COLUMN qr_status TEXT DEFAULT 'active';",
        "ALTER TABLE users ADD COLUMN qr_scanned_at TEXT;",
        "ALTER TABLE users ADD COLUMN qr_scanned_by TEXT;",
        "ALTER TABLE users ADD COLUMN qr_device_info TEXT;",
        "ALTER TABLE attendance ADD COLUMN user_id TEXT;",
        "ALTER TABLE attendance ADD COLUMN member_id TEXT;"
    ];
    for (const sqlStmt of userMigrations) {
        try { db.exec(sqlStmt); } catch (e) { /* Column already exists */ }
    }

    try {
        db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_member_id ON users(member_id) WHERE member_id IS NOT NULL AND member_id != '';");
    } catch (e) {}

    try {
        db.prepare("UPDATE users SET admin_id = 'ADM-0001' WHERE id = '11111111-1111-1111-1111-111111111111' AND (admin_id IS NULL OR admin_id = '')").run();
        db.prepare("UPDATE users SET admin_id = 'ADM-0002' WHERE id = '22222222-2222-2222-2222-222222222222' AND (admin_id IS NULL OR admin_id = '')").run();
    } catch (e) {}

    const eventCount = db.prepare('SELECT count(*) as count FROM events').get();
    if (eventCount.count === 0) {
        seedSqliteData(db);
    }
}

function seedSqliteData(db) {
    // Fresh start: Auto-seeding disabled
    return;
    const insertEvent = db.prepare(`
        INSERT INTO events (id, title, description, category, cover_image_url, event_date, start_time, end_time, venue, address, google_maps_url, ticket_price, capacity, registration_open_at, registration_close_at, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertEvent.run(
        'a1111111-1111-1111-1111-111111111111',
        'Global Tech Summit 2026',
        'The premier tech conference bringing together world leaders in AI, Cloud Computing, Cybersecurity, and Web3 technologies. Features keynotes, hands-on workshops, and exclusive networking sessions.',
        'Technology',
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
        '2026-10-15',
        '09:00',
        '18:00',
        'Grand Convention Center - Main Auditorium',
        'Plot 42, Tech Park Avenue, Financial District, Cyberabad',
        'https://maps.google.com',
        1499.00,
        500,
        '2026-09-01 00:00:00',
        '2026-10-14 23:59:59',
        'registration_open',
        '11111111-1111-1111-1111-111111111111'
    );
}

// Unified Query Layer Supporting MongoDB, PostgreSQL, and SQLite
const dbQuery = {
    get mode() { return mode; },
    set mode(val) { mode = val; },
    get db() { return drizzleDb; },
    sqliteDb,
    mongoModels,

    async findUserByEmail(email) {
        return this.findUserByEmailOrPhone(email);
    },

    async findUserByEmailOrPhone(identifier) {
        if (!identifier) return null;
        const clean = identifier.trim().toLowerCase();
        const upperClean = identifier.trim().toUpperCase();
        const digitsOnly = clean.replace(/\D/g, '');

        if (mode === 'mongodb') {
            try {
                const queryConditions = [
                    { email: clean },
                    { phone: clean },
                    { member_id: upperClean },
                    { admin_id: upperClean },
                    { _id: clean }
                ];

                if (digitsOnly.length >= 7) {
                    queryConditions.push({ phone: { $regex: `${digitsOnly.slice(-10)}$`, $options: 'i' } });
                }

                const u = await mongoModels.User.findOne({ $or: queryConditions }).lean();
                if (!u) return null;
                return {
                    id: u._id,
                    ...u,
                    admin_id: u.admin_id || null,
                    adminId: u.admin_id || null,
                    password_hash: u.password_hash
                };
            } catch (err) {
                return null;
            }
        }

        const t = getTables();
        try {
            const orConditions = [
                sql`LOWER(${t.users.email}) = ${clean}`,
                sql`LOWER(${t.users.phone}) = ${clean}`,
                sql`UPPER(${t.users.memberId}) = ${upperClean}`,
                sql`UPPER(${t.users.adminId}) = ${upperClean}`,
                eq(t.users.id, clean)
            ];

            if (digitsOnly.length >= 7) {
                orConditions.push(sql`${t.users.phone} LIKE ${`%${digitsOnly.slice(-10)}%`}`);
            }

            const results = await drizzleDb.select().from(t.users).where(or(...orConditions));
            if (!results || results.length === 0) return null;
            const u = results[0];
            return {
                ...u,
                admin_id: u.adminId || u.admin_id || null,
                adminId: u.adminId || u.admin_id || null,
                password_hash: u.passwordHash || u.password_hash
            };
        } catch (err) {
            return null;
        }
    },

    async findUserById(id) {
        if (!id) return null;

        if (mode === 'mongodb') {
            try {
                const u = await mongoModels.User.findById(id).lean();
                if (!u) return null;
                return {
                    id: u._id,
                    name: u.name,
                    email: u.email,
                    phone: u.phone,
                    role: u.role,
                    admin_id: u.admin_id || null,
                    adminId: u.admin_id || null,
                    member_id: u.member_id || null,
                    memberId: u.member_id || null,
                    qr_code_data: u.qr_code_data || '',
                    qrCodeData: u.qr_code_data || '',
                    qr_token: u.qr_token || null,
                    qrToken: u.qr_token || null,
                    qr_status: u.qr_status || 'active',
                    qrStatus: u.qr_status || 'active',
                    qr_scanned_at: u.qr_scanned_at || null,
                    qr_scanned_by: u.qr_scanned_by || null,
                    qr_device_info: u.qr_device_info || null,
                    created_at: u.created_at
                };
            } catch (err) {
                return null;
            }
        }

        const t = getTables();
        try {
            const results = await drizzleDb.select({
                id: t.users.id,
                name: t.users.name,
                email: t.users.email,
                phone: t.users.phone,
                role: t.users.role,
                adminId: t.users.adminId,
                memberId: t.users.memberId,
                qrCodeData: t.users.qrCodeData,
                qrToken: t.users.qrToken,
                qrStatus: t.users.qrStatus,
                qrScannedAt: t.users.qrScannedAt,
                qrScannedBy: t.users.qrScannedBy,
                qrDeviceInfo: t.users.qrDeviceInfo,
                created_at: t.users.createdAt
            }).from(t.users).where(eq(t.users.id, id));
            if (!results[0]) return null;
            const r = results[0];
            return {
                ...r,
                admin_id: r.adminId || null,
                adminId: r.adminId || null,
                member_id: r.memberId,
                qr_code_data: r.qrCodeData || '',
                qr_token: r.qrToken,
                qr_status: r.qrStatus || 'active',
                qr_scanned_at: r.qrScannedAt,
                qr_scanned_by: r.qrScannedBy,
                qr_device_info: r.qrDeviceInfo
            };
        } catch (err) {
            return null;
        }
    },

    async findUserByMemberIdOrToken(identifier) {
        if (!identifier) return null;
        const clean = String(identifier).trim();
        const lowerClean = clean.toLowerCase();

        if (mode === 'mongodb') {
            try {
                const u = await mongoModels.User.findOne({
                    $or: [
                        { qr_token: clean },
                        { member_id: clean },
                        { _id: clean },
                        { email: lowerClean }
                    ]
                }).lean();
                if (!u) return null;
                return {
                    id: u._id,
                    ...u,
                    member_id: u.member_id || null,
                    memberId: u.member_id || null,
                    qr_code_data: u.qr_code_data || '',
                    qrCodeData: u.qr_code_data || '',
                    qr_token: u.qr_token || null,
                    qrToken: u.qr_token || null,
                    qr_status: u.qr_status || 'active',
                    qrStatus: u.qr_status || 'active',
                    qr_scanned_at: u.qr_scanned_at || null,
                    qr_scanned_by: u.qr_scanned_by || null,
                    qr_device_info: u.qr_device_info || null
                };
            } catch (err) {
                return null;
            }
        }

        const t = getTables();
        try {
            const results = await drizzleDb.select().from(t.users).where(
                or(
                    eq(t.users.qrToken, clean),
                    eq(t.users.memberId, clean),
                    eq(t.users.id, clean),
                    sql`LOWER(${t.users.email}) = ${lowerClean}`
                )
            );
            if (!results || results.length === 0) return null;
            const r = results[0];
            return {
                ...r,
                member_id: r.memberId,
                memberId: r.memberId,
                qr_code_data: r.qrCodeData || '',
                qrCodeData: r.qrCodeData || '',
                qr_token: r.qrToken,
                qrToken: r.qrToken,
                qr_status: r.qrStatus || 'active',
                qrStatus: r.qrStatus || 'active',
                qr_scanned_at: r.qrScannedAt,
                qr_scanned_by: r.qrScannedBy,
                qr_device_info: r.qrDeviceInfo
            };
        } catch (err) {
            return null;
        }
    },

    async findUserByAdminId(adminId) {
        if (!adminId) return null;
        const clean = String(adminId).trim();
        if (mode === 'mongodb') {
            const u = await mongoModels.User.findOne({ admin_id: clean }).lean();
            if (!u) return null;
            return {
                id: u._id,
                ...u,
                admin_id: u.admin_id,
                adminId: u.admin_id
            };
        }
        const t = getTables();
        const results = await drizzleDb.select().from(t.users).where(eq(t.users.adminId, clean));
        if (!results || results.length === 0) return null;
        const r = results[0];
        return {
            ...r,
            admin_id: r.adminId,
            adminId: r.adminId
        };
    },

    async updateUserMemberPass(userId, passData) {
        if (mode === 'mongodb') {
            await mongoModels.User.updateOne({ _id: userId }, {
                member_id: passData.member_id || passData.memberId,
                qr_code_data: passData.qr_code_data || passData.qrCodeData || '',
                qr_token: passData.qr_token || passData.qrToken,
                qr_status: passData.qr_status || passData.qrStatus || 'active'
            });
            return this.findUserById(userId);
        }

        const t = getTables();
        await drizzleDb.update(t.users).set({
            memberId: passData.member_id || passData.memberId,
            qrCodeData: passData.qr_code_data || passData.qrCodeData || '',
            qrToken: passData.qr_token || passData.qrToken,
            qrStatus: passData.qr_status || passData.qrStatus || 'active'
        }).where(eq(t.users.id, userId));
        return this.findUserById(userId);
    },

    async updateUserQrStatus(userId, { status, scannedBy, deviceInfo, scannedAt }) {
        const timestamp = scannedAt || new Date().toISOString();
        if (mode === 'mongodb') {
            await mongoModels.User.updateOne({ _id: userId }, {
                qr_status: status,
                qr_scanned_at: timestamp,
                qr_scanned_by: scannedBy || 'Admin Staff',
                qr_device_info: deviceInfo || 'Gate Camera Scanner'
            });
            return this.findUserById(userId);
        }

        const t = getTables();
        await drizzleDb.update(t.users).set({
            qrStatus: status,
            qrScannedAt: timestamp,
            qrScannedBy: scannedBy || 'Admin Staff',
            qrDeviceInfo: deviceInfo || 'Gate Camera Scanner'
        }).where(eq(t.users.id, userId));
        return this.findUserById(userId);
    },

    async processMemberCheckinAtomic(userId, scannedBy = 'Admin Staff', deviceInfo = 'Gate Scanner') {
        const user = await this.findUserById(userId);
        if (!user) {
            return { success: false, reason: 'INVALID_USER' };
        }

        if (user.qr_status === 'expired') {
            return {
                success: false,
                reason: 'ALREADY_USED',
                user,
                existingCheckin: {
                    checked_in_at: user.qr_scanned_at,
                    checked_in_by: user.qr_scanned_by
                }
            };
        }

        const scannedAt = new Date().toISOString();
        await this.updateUserQrStatus(userId, {
            status: 'expired',
            scannedBy,
            deviceInfo,
            scannedAt
        });

        // Insert into attendance table
        const attId = uuidv4();
        if (mode === 'mongodb') {
            await mongoModels.Attendance.create({
                _id: attId,
                ticket_id: null,
                event_id: null,
                registration_id: null,
                user_id: user.id,
                member_id: user.member_id || user.id,
                checked_in_by: scannedBy,
                checked_in_at: scannedAt,
                status: 'expired',
                device_info: deviceInfo
            });
        } else {
            try {
                sqliteDb.prepare(`
                    INSERT INTO member_attendance (id, user_id, member_id, checked_in_by, checked_in_at, status, device_info)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `).run(
                    attId,
                    user.id,
                    user.member_id || user.id,
                    scannedBy,
                    scannedAt,
                    'expired',
                    deviceInfo
                );
            } catch (e) {
                console.warn('[Member Attendance insert error]', e.message);
            }
        }

        return {
            success: true,
            user: {
                ...user,
                qr_status: 'expired',
                qr_scanned_at: scannedAt,
                qr_scanned_by: scannedBy
            }
        };
    },

    async createUser(user) {
        const adminId = user.admin_id || user.adminId || null;
        const memberId = user.member_id || user.memberId || null;
        const qrCodeData = user.qr_code_data || user.qrCodeData || '';
        const qrToken = user.qr_token || user.qrToken || null;
        const qrStatus = user.qr_status || user.qrStatus || 'active';

        if (mode === 'mongodb') {
            const userDoc = {
                _id: user.id || uuidv4(),
                name: user.name,
                email: user.email.toLowerCase(),
                phone: user.phone || '',
                password_hash: user.password_hash || user.passwordHash,
                role: user.role || 'guest',
                qr_code_data: qrCodeData,
                qr_status: qrStatus
            };
            if (adminId) userDoc.admin_id = adminId;
            if (memberId) userDoc.member_id = memberId;
            if (qrToken) userDoc.qr_token = qrToken;

            const created = await mongoModels.User.create(userDoc);
            return {
                id: created._id,
                name: created.name,
                email: created.email,
                phone: created.phone,
                role: created.role,
                admin_id: created.admin_id,
                adminId: created.admin_id,
                member_id: created.member_id,
                memberId: created.member_id,
                qr_code_data: created.qr_code_data,
                qr_token: created.qr_token,
                qr_status: created.qr_status
            };
        }

        const t = getTables();
        const val = {
            id: user.id,
            name: user.name,
            email: user.email.toLowerCase(),
            phone: user.phone || '',
            passwordHash: user.password_hash || user.passwordHash,
            role: user.role || 'guest',
            adminId: adminId,
            memberId: memberId,
            qrCodeData: qrCodeData,
            qrToken: qrToken,
            qrStatus: qrStatus
        };
        await drizzleDb.insert(t.users).values(val);
        return {
            ...user,
            admin_id: adminId,
            adminId: adminId,
            member_id: memberId,
            memberId: memberId,
            qr_code_data: qrCodeData,
            qr_token: qrToken,
            qr_status: qrStatus
        };
    },

    async updateUserAdminId(userId, adminId) {
        if (mode === 'mongodb') {
            await mongoModels.User.updateOne({ _id: userId }, { admin_id: adminId });
            return this.findUserById(userId);
        }

        const t = getTables();
        await drizzleDb.update(t.users).set({ adminId }).where(eq(t.users.id, userId));
        return this.findUserById(userId);
    },

    async getAllUsers(query = {}) {
        if (mode === 'mongodb') {
            const filter = {};
            if (query.role && query.role !== 'all') {
                filter.role = query.role;
            }
            if (query.search) {
                const regex = new RegExp(query.search.trim(), 'i');
                filter.$or = [
                    { name: regex },
                    { email: regex },
                    { phone: regex }
                ];
            }
            const users = await mongoModels.User.find(filter).sort({ created_at: -1 }).lean();
            return Promise.all(users.map(async u => {
                const regCount = await mongoModels.Registration.countDocuments({ user_id: u._id });
                return {
                    id: u._id,
                    name: u.name,
                    email: u.email,
                    phone: u.phone,
                    role: u.role,
                    admin_id: u.admin_id || null,
                    adminId: u.admin_id || null,
                    member_id: u.member_id || null,
                    memberId: u.member_id || null,
                    qr_code_data: u.qr_code_data || '',
                    qrCodeData: u.qr_code_data || '',
                    qr_token: u.qr_token || null,
                    qrToken: u.qr_token || null,
                    qr_status: u.qr_status || 'active',
                    qrStatus: u.qr_status || 'active',
                    qr_scanned_at: u.qr_scanned_at || null,
                    qr_scanned_by: u.qr_scanned_by || null,
                    created_at: u.created_at,
                    updated_at: u.updated_at,
                    registrations_count: regCount
                };
            }));
        }

        const t = getTables();
        const conditions = [];
        if (query.role && query.role !== 'all') {
            conditions.push(eq(t.users.role, query.role));
        }
        if (query.search) {
            const term = `%${query.search.trim()}%`;
            conditions.push(or(
                ilike(t.users.name, term),
                ilike(t.users.email, term),
                ilike(t.users.phone, term)
            ));
        }
        let q = drizzleDb.select({
            id: t.users.id,
            name: t.users.name,
            email: t.users.email,
            phone: t.users.phone,
            role: t.users.role,
            adminId: t.users.adminId,
            memberId: t.users.memberId,
            qrCodeData: t.users.qrCodeData,
            qrToken: t.users.qrToken,
            qrStatus: t.users.qrStatus,
            qrScannedAt: t.users.qrScannedAt,
            qrScannedBy: t.users.qrScannedBy,
            created_at: t.users.createdAt,
            updated_at: t.users.updatedAt
        }).from(t.users);

        if (conditions.length > 0) {
            q = q.where(and(...conditions));
        }

        const users = await q.orderBy(desc(t.users.createdAt));
        return Promise.all(users.map(async u => {
            const regCountRes = await drizzleDb.select({ count: count() }).from(t.registrations).where(eq(t.registrations.userId, u.id));
            return {
                ...u,
                admin_id: u.adminId || null,
                adminId: u.adminId || null,
                member_id: u.memberId,
                qr_code_data: u.qrCodeData || '',
                qr_token: u.qrToken,
                qr_status: u.qrStatus || 'active',
                qr_scanned_at: u.qrScannedAt,
                qr_scanned_by: u.qrScannedBy,
                created_at: u.created_at || u.createdAt,
                registrations_count: regCountRes[0] ? Number(regCountRes[0].count) : 0
            };
        }));
    },

    async updateUserRole(userId, role) {
        const validRoles = ['guest', 'scanner_staff', 'event_admin', 'super_admin'];
        if (!validRoles.includes(role)) {
            throw new Error(`Invalid role: ${role}`);
        }

        if (mode === 'mongodb') {
            await mongoModels.User.updateOne({ _id: userId }, { role });
            return this.findUserById(userId);
        }

        const t = getTables();
        await drizzleDb.update(t.users).set({ role }).where(eq(t.users.id, userId));
        return this.findUserById(userId);
    },

    async updateUserPassword(userId, passwordHash) {
        if (mode === 'mongodb') {
            await mongoModels.User.updateOne({ _id: userId }, { password_hash: passwordHash });
            return this.findUserById(userId);
        }

        const t = getTables();
        await drizzleDb.update(t.users).set({ password_hash: passwordHash }).where(eq(t.users.id, userId));
        return this.findUserById(userId);
    },

    async deleteUser(userId) {
        if (mode === 'mongodb') {
            await mongoModels.User.deleteOne({ _id: userId });
            return true;
        }

        const t = getTables();
        await drizzleDb.delete(t.users).where(eq(t.users.id, userId));
        return true;
    },

    async createQrCodeRecord(qrData) {
        return qrData;
    },

    async deleteQrCodeRecord(id) {
        return true;
    },

    async getEvents(query = {}) {
        if (mode === 'mongodb') {
            const filter = {};
            if (query.status) filter.status = query.status;
            if (query.category && query.category !== 'All') filter.category = query.category;
            if (query.created_by) filter.created_by = query.created_by;
            if (query.search) {
                const regex = new RegExp(query.search.trim(), 'i');
                filter.$or = [
                    { title: regex },
                    { description: regex },
                    { venue: regex },
                    { iti_trade: regex },
                    { iti_institute: regex }
                ];
            }
            const events = await mongoModels.Event.find(filter).sort({ created_at: -1 }).lean();
            return Promise.all(events.map(async (evt) => {
                const confirmedCount = await mongoModels.Registration.countDocuments({
                    event_id: evt._id,
                    registration_status: 'confirmed'
                });
                return {
                    id: evt._id,
                    ...evt,
                    ticket_price: parseFloat(evt.ticket_price || 0),
                    confirmed_registrations: confirmedCount,
                    seats_remaining: Math.max(0, (evt.capacity || 100) - confirmedCount)
                };
            }));
        }

        const t = getTables();
        const conditions = [];
        if (query.status) conditions.push(eq(t.events.status, query.status));
        if (query.category && query.category !== 'All') conditions.push(eq(t.events.category, query.category));
        if (query.created_by) conditions.push(eq(t.events.createdBy, query.created_by));
        if (query.search) {
            const term = `%${query.search}%`;
            conditions.push(or(ilike(t.events.title, term), ilike(t.events.description, term), ilike(t.events.venue, term)));
        }
        let q = drizzleDb.select().from(t.events);
        if (conditions.length > 0) q = q.where(and(...conditions));
        const events = await q;

        return Promise.all(events.map(async (evt) => {
            const regCountRes = await drizzleDb.select({ count: count() }).from(t.registrations).where(and(eq(t.registrations.eventId, evt.id), eq(t.registrations.registrationStatus, 'confirmed')));
            const countVal = regCountRes[0] ? Number(regCountRes[0].count) : 0;
            return {
                ...evt,
                cover_image_url: evt.coverImageUrl,
                event_date: evt.eventDate,
                start_time: evt.startTime,
                end_time: evt.endTime,
                google_maps_url: evt.googleMapsUrl,
                ticket_price: parseFloat(evt.ticketPrice || 0),
                registration_open_at: evt.registrationOpenAt,
                registration_close_at: evt.registrationCloseAt,
                created_by: evt.createdBy,
                created_at: evt.createdAt,
                updated_at: evt.updatedAt,
                confirmed_registrations: countVal,
                seats_remaining: Math.max(0, evt.capacity - countVal)
            };
        }));
    },

    async getEventById(id) {
        if (mode === 'mongodb') {
            const evt = await mongoModels.Event.findById(id).lean();
            if (!evt) return null;
            const confirmedCount = await mongoModels.Registration.countDocuments({
                event_id: id,
                registration_status: 'confirmed'
            });
            const gallery = await mongoModels.EventImage.find({ event_id: id }).lean();
            return {
                id: evt._id,
                ...evt,
                ticket_price: parseFloat(evt.ticket_price || 0),
                confirmed_registrations: confirmedCount,
                seats_remaining: Math.max(0, (evt.capacity || 100) - confirmedCount),
                gallery: gallery.map(g => ({ id: g._id, ...g }))
            };
        }

        const t = getTables();
        const events = await drizzleDb.select().from(t.events).where(eq(t.events.id, id));
        if (!events || events.length === 0) return null;
        const evt = events[0];

        const regCountRes = await drizzleDb.select({ count: count() }).from(t.registrations).where(and(eq(t.registrations.eventId, id), eq(t.registrations.registrationStatus, 'confirmed')));
        const countVal = regCountRes[0] ? Number(regCountRes[0].count) : 0;
        const gallery = await drizzleDb.select().from(t.eventImages).where(eq(t.eventImages.eventId, id));

        return {
            ...evt,
            cover_image_url: evt.coverImageUrl,
            event_date: evt.eventDate,
            start_time: evt.startTime,
            end_time: evt.endTime,
            google_maps_url: evt.googleMapsUrl,
            ticket_price: parseFloat(evt.ticketPrice || 0),
            registration_open_at: evt.registrationOpenAt,
            registration_close_at: evt.registrationCloseAt,
            created_by: evt.createdBy,
            created_at: evt.createdAt,
            updated_at: evt.updatedAt,
            confirmed_registrations: countVal,
            seats_remaining: Math.max(0, evt.capacity - countVal),
            gallery
        };
    },

    async createEvent(eventData) {
        if (mode === 'mongodb') {
            const val = {
                _id: eventData.id || uuidv4(),
                title: eventData.title,
                description: eventData.description,
                category: eventData.category || 'General',
                cover_image_url: eventData.cover_image_url,
                event_date: eventData.event_date,
                start_time: eventData.start_time,
                end_time: eventData.end_time,
                venue: eventData.venue,
                address: eventData.address,
                google_maps_url: eventData.google_maps_url,
                ticket_price: parseFloat(eventData.ticket_price || 0),
                capacity: eventData.capacity || 100,
                registration_open_at: eventData.registration_open_at,
                registration_close_at: eventData.registration_close_at,
                status: eventData.status || 'draft',
                created_by: eventData.created_by,
                iti_trade: eventData.iti_trade || '',
                iti_institute: eventData.iti_institute || '',
                iti_eligibility: eventData.iti_eligibility || ''
            };
            const created = await mongoModels.Event.create(val);
            return { id: created._id, ...val };
        }

        const t = getTables();
        const val = {
            id: eventData.id,
            title: eventData.title,
            description: eventData.description,
            category: eventData.category || 'General',
            coverImageUrl: eventData.cover_image_url,
            eventDate: eventData.event_date,
            startTime: eventData.start_time,
            endTime: eventData.end_time,
            venue: eventData.venue,
            address: eventData.address,
            googleMapsUrl: eventData.google_maps_url,
            ticketPrice: eventData.ticket_price != null ? String(eventData.ticket_price) : '0.00',
            capacity: eventData.capacity || 100,
            registrationOpenAt: eventData.registration_open_at,
            registrationCloseAt: eventData.registration_close_at,
            status: eventData.status || 'draft',
            createdBy: eventData.created_by
        };
        await drizzleDb.insert(t.events).values(val);
        return eventData;
    },

    async updateEvent(id, updates) {
        if (mode === 'mongodb') {
            await mongoModels.Event.updateOne({ _id: id }, updates);
            return this.getEventById(id);
        }

        const t = getTables();
        const drizzleUpdates = {};
        if (updates.title !== undefined) drizzleUpdates.title = updates.title;
        if (updates.description !== undefined) drizzleUpdates.description = updates.description;
        if (updates.category !== undefined) drizzleUpdates.category = updates.category;
        if (updates.cover_image_url !== undefined) drizzleUpdates.coverImageUrl = updates.cover_image_url;
        if (updates.event_date !== undefined) drizzleUpdates.eventDate = updates.event_date;
        if (updates.start_time !== undefined) drizzleUpdates.startTime = updates.start_time;
        if (updates.end_time !== undefined) drizzleUpdates.endTime = updates.end_time;
        if (updates.venue !== undefined) drizzleUpdates.venue = updates.venue;
        if (updates.address !== undefined) drizzleUpdates.address = updates.address;
        if (updates.google_maps_url !== undefined) drizzleUpdates.googleMapsUrl = updates.google_maps_url;
        if (updates.ticket_price !== undefined) drizzleUpdates.ticketPrice = String(updates.ticket_price);
        if (updates.capacity !== undefined) drizzleUpdates.capacity = updates.capacity;
        if (updates.status !== undefined) drizzleUpdates.status = updates.status;
        if (updates.registration_open_at !== undefined) drizzleUpdates.registrationOpenAt = updates.registration_open_at;
        if (updates.registration_close_at !== undefined) drizzleUpdates.registrationCloseAt = updates.registration_close_at;

        await drizzleDb.update(t.events).set(drizzleUpdates).where(eq(t.events.id, id));
        return this.getEventById(id);
    },

    async deleteEvent(id) {
        if (mode === 'mongodb') {
            await mongoModels.Event.deleteOne({ _id: id });
            await mongoModels.Registration.deleteMany({ event_id: id });
            await mongoModels.Ticket.deleteMany({ event_id: id });
            return true;
        }

        const t = getTables();
        await drizzleDb.delete(t.events).where(eq(t.events.id, id));
        return true;
    },

    async createRegistration(regData) {
        if (mode === 'mongodb') {
            const val = {
                _id: regData.id || uuidv4(),
                event_id: regData.event_id,
                user_id: regData.user_id,
                registration_number: regData.registration_number,
                guest_name: regData.guest_name,
                guest_email: regData.guest_email,
                guest_phone: regData.guest_phone,
                custom_answers: regData.custom_answers || {},
                registration_status: regData.registration_status || 'pending'
            };
            const created = await mongoModels.Registration.create(val);
            return { id: created._id, ...val };
        }

        const t = getTables();
        const val = {
            id: regData.id,
            eventId: regData.event_id,
            userId: regData.user_id,
            registrationNumber: regData.registration_number,
            guestName: regData.guest_name,
            guestEmail: regData.guest_email,
            guestPhone: regData.guest_phone,
            customAnswers: typeof regData.custom_answers === 'string' ? regData.custom_answers : JSON.stringify(regData.custom_answers || {}),
            registrationStatus: regData.registration_status || 'pending'
        };
        await drizzleDb.insert(t.registrations).values(val);
        return regData;
    },

    async getRegistrationById(id) {
        if (mode === 'mongodb') {
            const reg = await mongoModels.Registration.findById(id).lean();
            if (!reg) return null;
            const event = await mongoModels.Event.findById(reg.event_id).lean();
            const payment = await mongoModels.Payment.findOne({ registration_id: id }).lean();
            const ticket = await mongoModels.Ticket.findOne({ registration_id: id }).lean();
            return {
                id: reg._id,
                ...reg,
                event: event ? { id: event._id, ...event } : null,
                payment: payment ? { id: payment._id, ...payment } : null,
                ticket: ticket ? { id: ticket._id, ...ticket } : null
            };
        }

        const t = getTables();
        const regs = await drizzleDb.select().from(t.registrations).where(eq(t.registrations.id, id));
        if (!regs || regs.length === 0) return null;
        const reg = regs[0];

        const events = await drizzleDb.select().from(t.events).where(eq(t.events.id, reg.eventId));
        const payments = await drizzleDb.select().from(t.payments).where(eq(t.payments.registrationId, id));
        const tickets = await drizzleDb.select().from(t.tickets).where(eq(t.tickets.registrationId, id));

        return {
            ...reg,
            event_id: reg.eventId,
            user_id: reg.userId,
            registration_number: reg.registrationNumber,
            guest_name: reg.guestName,
            guest_email: reg.guestEmail,
            guest_phone: reg.guestPhone,
            registration_status: reg.registrationStatus,
            created_at: reg.createdAt,
            event: events[0] ? { ...events[0], cover_image_url: events[0].coverImageUrl, event_date: events[0].eventDate, start_time: events[0].startTime, created_by: events[0].createdBy } : null,
            payment: payments[0] ? { ...payments[0], razorpay_order_id: payments[0].razorpayOrderId } : null,
            ticket: tickets[0] ? { ...tickets[0], secure_token: tickets[0].secureToken } : null
        };
    },

    async getUserRegistrations(userId) {
        if (mode === 'mongodb') {
            const regs = await mongoModels.Registration.find({ user_id: userId }).sort({ created_at: -1 }).lean();
            return Promise.all(regs.map(async reg => {
                const event = await mongoModels.Event.findById(reg.event_id).lean();
                const payment = await mongoModels.Payment.findOne({ registration_id: reg._id }).lean();
                const ticket = await mongoModels.Ticket.findOne({ registration_id: reg._id }).lean();
                return {
                    id: reg._id,
                    ...reg,
                    event: event ? { id: event._id, ...event } : null,
                    payment: payment ? { id: payment._id, ...payment } : null,
                    ticket: ticket ? { id: ticket._id, ...ticket } : null
                };
            }));
        }

        const t = getTables();
        const regs = await drizzleDb.select().from(t.registrations).where(eq(t.registrations.userId, userId)).orderBy(desc(t.registrations.createdAt));
        return Promise.all(regs.map(async reg => {
            const events = await drizzleDb.select().from(t.events).where(eq(t.events.id, reg.eventId));
            const payments = await drizzleDb.select().from(t.payments).where(eq(t.payments.registrationId, reg.id));
            const tickets = await drizzleDb.select().from(t.tickets).where(eq(t.tickets.registrationId, reg.id));
            return {
                ...reg,
                event_id: reg.eventId,
                user_id: reg.userId,
                registration_number: reg.registrationNumber,
                guest_name: reg.guestName,
                guest_email: reg.guestEmail,
                guest_phone: reg.guestPhone,
                registration_status: reg.registrationStatus,
                created_at: reg.createdAt,
                event: events[0] ? { ...events[0], cover_image_url: events[0].coverImageUrl, event_date: events[0].eventDate, start_time: events[0].startTime } : null,
                payment: payments[0] ? { ...payments[0], razorpay_order_id: payments[0].razorpayOrderId } : null,
                ticket: tickets[0] ? { ...tickets[0], secure_token: tickets[0].secureToken } : null
            };
        }));
    },

    async updateRegistrationStatus(registrationId, status) {
        if (mode === 'mongodb') {
            await mongoModels.Registration.updateOne({ _id: registrationId }, { registration_status: status });
            return;
        }

        const t = getTables();
        await drizzleDb.update(t.registrations).set({ registrationStatus: status }).where(eq(t.registrations.id, registrationId));
    },

    async createPayment(payData) {
        if (mode === 'mongodb') {
            const val = {
                _id: payData.id || uuidv4(),
                registration_id: payData.registration_id,
                razorpay_order_id: payData.razorpay_order_id,
                razorpay_payment_id: payData.razorpay_payment_id || null,
                razorpay_signature: payData.razorpay_signature || null,
                amount: parseFloat(payData.amount || 0),
                currency: payData.currency || 'INR',
                status: payData.status || 'pending',
                paid_at: payData.paid_at || null
            };
            const created = await mongoModels.Payment.create(val);
            return { id: created._id, ...val };
        }

        const t = getTables();
        const val = {
            id: payData.id,
            registrationId: payData.registration_id,
            razorpayOrderId: payData.razorpay_order_id,
            razorpayPaymentId: payData.razorpay_payment_id || null,
            razorpaySignature: payData.razorpay_signature || null,
            amount: payData.amount != null ? String(payData.amount) : '0.00',
            currency: payData.currency || 'INR',
            status: payData.status || 'pending',
            paidAt: payData.paid_at || null
        };
        await drizzleDb.insert(t.payments).values(val);
        return payData;
    },

    async getPaymentByOrderId(orderId) {
        if (mode === 'mongodb') {
            const pay = await mongoModels.Payment.findOne({ razorpay_order_id: orderId }).lean();
            if (!pay) return null;
            return { id: pay._id, ...pay };
        }

        const t = getTables();
        const payments = await drizzleDb.select().from(t.payments).where(eq(t.payments.razorpayOrderId, orderId));
        if (!payments || payments.length === 0) return null;
        const pay = payments[0];
        return {
            ...pay,
            registration_id: pay.registrationId,
            razorpay_order_id: pay.razorpayOrderId,
            razorpay_payment_id: pay.razorpayPaymentId,
            razorpay_signature: pay.razorpaySignature,
            paid_at: pay.paidAt
        };
    },

    async updatePayment(orderId, updates) {
        if (mode === 'mongodb') {
            await mongoModels.Payment.updateOne({ razorpay_order_id: orderId }, updates);
            return this.getPaymentByOrderId(orderId);
        }

        const t = getTables();
        const drizzleUpdates = {};
        if (updates.razorpay_payment_id !== undefined) drizzleUpdates.razorpayPaymentId = updates.razorpay_payment_id;
        if (updates.razorpay_signature !== undefined) drizzleUpdates.razorpaySignature = updates.razorpay_signature;
        if (updates.status !== undefined) drizzleUpdates.status = updates.status;
        if (updates.paid_at !== undefined) drizzleUpdates.paidAt = updates.paid_at;
        if (updates.refund_id !== undefined) drizzleUpdates.refundId = updates.refund_id;
        if (updates.refund_status !== undefined) drizzleUpdates.refundStatus = updates.refund_status;

        await drizzleDb.update(t.payments).set(drizzleUpdates).where(eq(t.payments.razorpayOrderId, orderId));
        return this.getPaymentByOrderId(orderId);
    },

    async createTicket(ticketData) {
        if (mode === 'mongodb') {
            const val = {
                _id: ticketData.id || uuidv4(),
                registration_id: ticketData.registration_id,
                event_id: ticketData.event_id,
                user_id: ticketData.user_id,
                ticket_number: ticketData.ticket_number,
                secure_token: ticketData.secure_token,
                qr_code_data: ticketData.qr_code_data,
                status: ticketData.status || 'active'
            };
            const created = await mongoModels.Ticket.create(val);
            return { id: created._id, ...val };
        }

        const t = getTables();
        const val = {
            id: ticketData.id,
            registrationId: ticketData.registration_id,
            eventId: ticketData.event_id,
            userId: ticketData.user_id,
            ticketNumber: ticketData.ticket_number,
            secureToken: ticketData.secure_token,
            qrCodeData: ticketData.qr_code_data,
            status: ticketData.status || 'active'
        };
        await drizzleDb.insert(t.tickets).values(val);
        return ticketData;
    },

    async getTicketByToken(token) {
        if (mode === 'mongodb') {
            const ticket = await mongoModels.Ticket.findOne({
                $or: [{ secure_token: token }, { ticket_number: token }, { _id: token }]
            }).lean();
            if (!ticket) return null;

            const event = await mongoModels.Event.findById(ticket.event_id).lean();
            const reg = await mongoModels.Registration.findById(ticket.registration_id).lean();
            const user = await mongoModels.User.findById(ticket.user_id).lean();
            const att = await mongoModels.Attendance.findOne({ ticket_id: ticket._id }).lean();

            return {
                id: ticket._id,
                ...ticket,
                event: event ? {
                    id: event._id,
                    ...event,
                    title: event.title,
                    created_by: event.created_by,
                    createdBy: event.created_by
                } : null,
                registration: reg ? { id: reg._id, ...reg } : null,
                user: user ? { id: user._id, name: user.name, email: user.email, phone: user.phone } : null,
                attendance: att ? { id: att._id, ...att } : null
            };
        }

        const t = getTables();
        const tickets = await drizzleDb.select().from(t.tickets).where(or(eq(t.tickets.secureToken, token), eq(t.tickets.ticketNumber, token), eq(t.tickets.id, token)));
        if (!tickets || tickets.length === 0) return null;
        const ticket = tickets[0];

        const events = await drizzleDb.select().from(t.events).where(eq(t.events.id, ticket.eventId));
        const regs = await drizzleDb.select().from(t.registrations).where(eq(t.registrations.id, ticket.registrationId));
        const users = await drizzleDb.select({ id: t.users.id, name: t.users.name, email: t.users.email, phone: t.users.phone }).from(t.users).where(eq(t.users.id, ticket.userId));
        const atts = await drizzleDb.select().from(t.attendance).where(eq(t.attendance.ticketId, ticket.id));

        return {
            ...ticket,
            registration_id: ticket.registrationId,
            event_id: ticket.eventId,
            user_id: ticket.userId,
            ticket_number: ticket.ticketNumber,
            secure_token: ticket.secureToken,
            qr_code_data: ticket.qrCodeData,
            event: events[0] ? {
                ...events[0],
                title: events[0].title,
                created_by: events[0].createdBy,
                createdBy: events[0].createdBy
            } : null,
            registration: regs[0] ? {
                ...regs[0],
                registration_id: regs[0].id,
                event_id: regs[0].eventId,
                user_id: regs[0].userId,
                registration_number: regs[0].registrationNumber,
                guest_name: regs[0].guestName,
                guest_email: regs[0].guestEmail,
                guest_phone: regs[0].guestPhone,
                registration_status: regs[0].registrationStatus || 'pending'
            } : null,
            user: users[0] || null,
            attendance: atts[0] || null
        };
    },

    async processCheckinAtomic(ticketId, eventId, registrationId, checkedInBy, deviceInfo = 'Gate Scanner') {
        if (mode === 'mongodb') {
            const existing = await mongoModels.Attendance.findOne({ ticket_id: ticketId }).lean();
            if (existing) {
                return {
                    success: false,
                    reason: 'ALREADY_USED',
                    existingCheckin: existing
                };
            }

            const ticket = await mongoModels.Ticket.findById(ticketId).lean();
            if (!ticket || ticket.status === 'cancelled') {
                return { success: false, reason: 'INVALID_TICKET' };
            }
            if (ticket.status === 'expired') {
                return {
                    success: false,
                    reason: 'ALREADY_USED',
                    existingCheckin: existing || { checked_in_at: ticket.updated_at }
                };
            }

            try {
                const checkinRecord = await mongoModels.Attendance.create({
                    _id: uuidv4(),
                    ticket_id: ticketId,
                    event_id: eventId,
                    registration_id: registrationId,
                    checked_in_by: checkedInBy,
                    checked_in_at: new Date().toISOString(),
                    status: 'expired',
                    device_info: deviceInfo
                });

                // Mark QR ticket as expired upon Admin scanning
                await mongoModels.Ticket.updateOne({ _id: ticketId }, { status: 'expired' });

                return {
                    success: true,
                    attendance: { id: checkinRecord._id, ...checkinRecord.toObject(), status: 'expired' }
                };
            } catch (err) {
                if (err.code === 11000 || err.message?.includes('duplicate key') || err.message?.includes('E11000')) {
                    const existingCheckin = await mongoModels.Attendance.findOne({ ticket_id: ticketId }).lean();
                    return {
                        success: false,
                        reason: 'ALREADY_USED',
                        existingCheckin: existingCheckin || { checked_in_at: new Date().toISOString() }
                    };
                }
                throw err;
            }
        }

        const t = getTables();
        const existing = await drizzleDb.select().from(t.attendance).where(eq(t.attendance.ticketId, ticketId));
        if (existing && existing.length > 0) {
            const att = existing[0];
            return {
                success: false,
                reason: 'ALREADY_USED',
                existingCheckin: {
                    ...att,
                    checked_in_at: att.checkedInAt || att.checked_in_at
                }
            };
        }

        const tickets = await drizzleDb.select().from(t.tickets).where(eq(t.tickets.id, ticketId));
        if (!tickets || tickets.length === 0 || tickets[0].status === 'cancelled') {
            return { success: false, reason: 'INVALID_TICKET' };
        }
        if (tickets[0].status === 'expired') {
            return {
                success: false,
                reason: 'ALREADY_USED',
                existingCheckin: { checked_in_at: tickets[0].updatedAt || tickets[0].created_at }
            };
        }

        try {
            const attId = uuidv4();
            await drizzleDb.insert(t.attendance).values({
                id: attId,
                ticketId,
                eventId,
                registrationId,
                checkedInBy: checkedInBy || null,
                status: 'expired',
                deviceInfo: deviceInfo || 'Gate Scanner'
            });

            // Mark QR ticket as expired upon Admin scanning
            await drizzleDb.update(t.tickets).set({ status: 'expired' }).where(eq(t.tickets.id, ticketId));

            return {
                success: true,
                attendance: {
                    id: attId,
                    ticket_id: ticketId,
                    event_id: eventId,
                    registration_id: registrationId,
                    checked_in_at: new Date().toISOString(),
                    status: 'expired'
                }
            };
        } catch (err) {
            // Feature 6: Handle SQLite/Postgres duplicate attendance constraint collisions gracefully
            const isUniqueConstraint =
                err.code === 'SQLITE_CONSTRAINT' ||
                err.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
                err.code === '23505' ||
                (err.message && (
                    err.message.includes('UNIQUE constraint failed') ||
                    err.message.includes('unique constraint') ||
                    err.message.includes('attendance.ticket_id') ||
                    err.message.includes('duplicate key')
                ));

            if (isUniqueConstraint) {
                const existingAgain = await drizzleDb.select().from(t.attendance).where(eq(t.attendance.ticketId, ticketId));
                const att = existingAgain && existingAgain.length > 0 ? existingAgain[0] : null;
                return {
                    success: false,
                    reason: 'ALREADY_USED',
                    existingCheckin: att ? {
                        ...att,
                        checked_in_at: att.checkedInAt || att.checked_in_at
                    } : { checked_in_at: new Date().toISOString() }
                };
            }
            throw err;
        }
    },

    async getAllAttendance(adminId) {
        if (mode === 'mongodb') {
            let filter = {};
            if (adminId) {
                const adminEvents = await mongoModels.Event.find({ created_by: adminId }, { _id: 1 }).lean();
                const adminEventIds = adminEvents.map(e => e._id);
                if (adminEventIds.length === 0) return [];
                filter = { event_id: { $in: adminEventIds } };
            }

            const list = await mongoModels.Attendance.find(filter).sort({ checked_in_at: -1 }).lean();
            const eventAttList = await Promise.all(list.map(async att => {
                let ticketNum = '';
                let guestName = '';
                let guestEmail = '';
                let guestPhone = '';
                let eventTitle = '';

                if (att.ticket_id) {
                    const tk = await mongoModels.Ticket.findById(att.ticket_id).lean();
                    const reg = await mongoModels.Registration.findById(att.registration_id).lean();
                    const evt = await mongoModels.Event.findById(att.event_id).lean();
                    ticketNum = tk?.ticket_number || '';
                    guestName = reg?.guest_name || '';
                    guestEmail = reg?.guest_email || '';
                    guestPhone = reg?.guest_phone || '';
                    eventTitle = evt?.title || '';
                }

                if (!adminId && !guestName && (att.user_id || att.member_id)) {
                    const usr = await mongoModels.User.findById(att.user_id).lean() || 
                                await mongoModels.User.findOne({ member_id: att.member_id }).lean();
                    if (usr) {
                        ticketNum = usr.member_id || att.member_id || 'MEMBER-PASS';
                        guestName = usr.name;
                        guestEmail = usr.email;
                        guestPhone = usr.phone || '';
                        eventTitle = 'Member Gate Admission';
                    }
                }

                return {
                    id: att._id,
                    ...att,
                    ticket_number: ticketNum,
                    guest_name: guestName,
                    guest_email: guestEmail,
                    guest_phone: guestPhone,
                    event_title: eventTitle
                };
            }));

            return adminId ? eventAttList.filter(a => a.event_id) : eventAttList;
        }

        const t = getTables();
        let q = drizzleDb.select().from(t.attendance);
        if (adminId) {
            const adminEvents = await drizzleDb.select({ id: t.events.id }).from(t.events).where(eq(t.events.createdBy, adminId));
            const adminEventIds = adminEvents.map(e => e.id);
            if (adminEventIds.length === 0) return [];
            q = q.where(inArray(t.attendance.eventId, adminEventIds));
        }

        const attendanceList = await q.orderBy(desc(t.attendance.checkedInAt));
        const eventAttList = await Promise.all(attendanceList.map(async att => {
            let ticketNum = '';
            let guestName = '';
            let guestEmail = '';
            let guestPhone = '';
            let eventTitle = '';

            if (att.ticketId) {
                const tk = await drizzleDb.select({ ticketNumber: t.tickets.ticketNumber }).from(t.tickets).where(eq(t.tickets.id, att.ticketId));
                const reg = await drizzleDb.select().from(t.registrations).where(eq(t.registrations.id, att.registrationId));
                const evt = await drizzleDb.select({ title: t.events.title }).from(t.events).where(eq(t.events.id, att.eventId));
                ticketNum = tk[0]?.ticketNumber || '';
                guestName = reg[0]?.guestName || '';
                guestEmail = reg[0]?.guestEmail || '';
                guestPhone = reg[0]?.guestPhone || '';
                eventTitle = evt[0]?.title || '';
            }

            return {
                ...att,
                ticket_number: ticketNum,
                guest_name: guestName,
                guest_email: guestEmail,
                guest_phone: guestPhone,
                event_title: eventTitle
            };
        }));

        if (adminId) {
            return eventAttList;
        }

        let memberAttList = [];
        try {
            const rows = sqliteDb.prepare("SELECT * FROM member_attendance ORDER BY checked_in_at DESC").all();
            memberAttList = await Promise.all(rows.map(async m => {
                const usr = await this.findUserById(m.user_id);
                return {
                    id: m.id,
                    checked_in_at: m.checked_in_at,
                    checkedInAt: m.checked_in_at,
                    ticket_number: m.member_id || usr?.member_id || 'MEMBER-PASS',
                    guest_name: usr?.name || 'Member',
                    guest_email: usr?.email || '',
                    guest_phone: usr?.phone || '',
                    event_title: 'Member Gate Admission',
                    device_info: m.device_info,
                    status: m.status || 'expired'
                };
            }));
        } catch(e) {}

        return [...eventAttList, ...memberAttList].sort((a,b) => new Date(b.checked_in_at || b.checkedInAt) - new Date(a.checked_in_at || a.checkedInAt));
    },

    async getEventAttendance(eventId) {
        if (mode === 'mongodb') {
            const list = await mongoModels.Attendance.find({ event_id: eventId }).sort({ checked_in_at: -1 }).lean();
            return Promise.all(list.map(async att => {
                const tk = await mongoModels.Ticket.findById(att.ticket_id).lean();
                const reg = await mongoModels.Registration.findById(att.registration_id).lean();
                return {
                    id: att._id,
                    ...att,
                    ticket_number: tk?.ticket_number || '',
                    guest_name: reg?.guest_name || '',
                    guest_email: reg?.guest_email || '',
                    guest_phone: reg?.guest_phone || ''
                };
            }));
        }

        const t = getTables();
        const list = await drizzleDb.select().from(t.attendance).where(eq(t.attendance.eventId, eventId)).orderBy(desc(t.attendance.checkedInAt));
        return Promise.all(list.map(async att => {
            const tk = await drizzleDb.select().from(t.tickets).where(eq(t.tickets.id, att.ticketId));
            const reg = await drizzleDb.select().from(t.registrations).where(eq(t.registrations.id, att.registrationId));
            return {
                ...att,
                ticket_number: tk[0]?.ticketNumber || '',
                guest_name: reg[0]?.guestName || '',
                guest_email: reg[0]?.guestEmail || '',
                guest_phone: reg[0]?.guestPhone || '',
                ticket: tk[0] || null,
                registration: reg[0] || null
            };
        }));
    },

    async getAllRegistrations(adminId) {
        if (mode === 'mongodb') {
            let filter = {};
            if (adminId) {
                const adminEvents = await mongoModels.Event.find({ created_by: adminId }, { _id: 1 }).lean();
                const adminEventIds = adminEvents.map(e => e._id);
                if (adminEventIds.length === 0) return [];
                filter = { event_id: { $in: adminEventIds } };
            }

            const regs = await mongoModels.Registration.find(filter).sort({ created_at: -1 }).lean();
            return Promise.all(regs.map(async reg => {
                const evt = await mongoModels.Event.findById(reg.event_id).lean();
                const pay = await mongoModels.Payment.findOne({ registration_id: reg._id }).lean();
                const tk = await mongoModels.Ticket.findOne({ registration_id: reg._id }).lean();
                let att = null;
                if (tk) {
                    att = await mongoModels.Attendance.findOne({ ticket_id: tk._id }).lean();
                }
                return {
                    id: reg._id,
                    ...reg,
                    event_title: evt?.title || '',
                    payment_status: pay?.status || 'pending',
                    amount: pay?.amount || 0,
                    ticket_number: tk?.ticket_number || null,
                    ticket_status: tk?.status || null,
                    checked_in_at: att?.checked_in_at || null
                };
            }));
        }

        const t = getTables();
        let q = drizzleDb.select().from(t.registrations);
        if (adminId) {
            const adminEvents = await drizzleDb.select({ id: t.events.id }).from(t.events).where(eq(t.events.createdBy, adminId));
            const adminEventIds = adminEvents.map(e => e.id);
            if (adminEventIds.length === 0) return [];
            q = q.where(inArray(t.registrations.eventId, adminEventIds));
        }

        const regs = await q.orderBy(desc(t.registrations.createdAt));
        return Promise.all(regs.map(async reg => {
            const evt = await drizzleDb.select().from(t.events).where(eq(t.events.id, reg.eventId));
            const pay = await drizzleDb.select().from(t.payments).where(eq(t.payments.registrationId, reg.id));
            const tk = await drizzleDb.select().from(t.tickets).where(eq(t.tickets.registrationId, reg.id));
            let att = null;
            if (tk[0]) {
                const attRes = await drizzleDb.select().from(t.attendance).where(eq(t.attendance.ticketId, tk[0].id));
                att = attRes[0] || null;
            }
            return {
                ...reg,
                registration_number: reg.registrationNumber,
                guest_name: reg.guestName,
                guest_email: reg.guestEmail,
                guest_phone: reg.guestPhone,
                registration_status: reg.registrationStatus,
                created_at: reg.createdAt,
                event_title: evt[0]?.title || '',
                payment_status: pay[0]?.status || 'pending',
                amount: pay[0]?.amount ? parseFloat(pay[0].amount) : 0,
                ticket_number: tk[0]?.ticketNumber || null,
                ticket_status: tk[0]?.status || null,
                checked_in_at: att?.checkedInAt || null
            };
        }));
    },

    async getAllPayments(adminId) {
        if (mode === 'mongodb') {
            let filter = {};
            if (adminId) {
                const adminEvents = await mongoModels.Event.find({ created_by: adminId }, { _id: 1 }).lean();
                const adminEventIds = adminEvents.map(e => e._id);
                if (adminEventIds.length === 0) return [];

                const adminRegs = await mongoModels.Registration.find({ event_id: { $in: adminEventIds } }, { _id: 1 }).lean();
                const adminRegIds = adminRegs.map(r => r._id);
                if (adminRegIds.length === 0) return [];

                filter = { registration_id: { $in: adminRegIds } };
            }

            const payments = await mongoModels.Payment.find(filter).sort({ created_at: -1 }).lean();
            return Promise.all(payments.map(async pay => {
                const reg = await mongoModels.Registration.findById(pay.registration_id).lean();
                let evtTitle = '';
                if (reg) {
                    const evt = await mongoModels.Event.findById(reg.event_id).lean();
                    evtTitle = evt?.title || '';
                }
                return {
                    id: pay._id,
                    ...pay,
                    guest_name: reg?.guest_name || '',
                    guest_email: reg?.guest_email || '',
                    event_title: evtTitle
                };
            }));
        }

        const t = getTables();
        let q = drizzleDb.select().from(t.payments);
        if (adminId) {
            const adminEvents = await drizzleDb.select({ id: t.events.id }).from(t.events).where(eq(t.events.createdBy, adminId));
            const adminEventIds = adminEvents.map(e => e.id);
            if (adminEventIds.length === 0) return [];

            const adminRegs = await drizzleDb.select({ id: t.registrations.id }).from(t.registrations).where(inArray(t.registrations.eventId, adminEventIds));
            const adminRegIds = adminRegs.map(r => r.id);
            if (adminRegIds.length === 0) return [];

            q = q.where(inArray(t.payments.registrationId, adminRegIds));
        }

        const payments = await q.orderBy(desc(t.payments.createdAt));
        return Promise.all(payments.map(async pay => {
            const reg = await drizzleDb.select().from(t.registrations).where(eq(t.registrations.id, pay.registrationId));
            let evtTitle = '';
            if (reg[0]) {
                const evt = await drizzleDb.select({ title: t.events.title }).from(t.events).where(eq(t.events.id, reg[0].eventId));
                evtTitle = evt[0]?.title || '';
            }
            return {
                ...pay,
                razorpay_order_id: pay.razorpayOrderId,
                razorpay_payment_id: pay.razorpayPaymentId,
                amount: parseFloat(pay.amount || 0),
                guest_name: reg[0]?.guestName || '',
                guest_email: reg[0]?.guestEmail || '',
                event_title: evtTitle
            };
        }));
    },

    async addEventImage(imageData) {
        if (mode === 'mongodb') {
            const val = {
                _id: imageData.id || uuidv4(),
                event_id: imageData.event_id,
                image_url: imageData.image_url,
                caption: imageData.caption || '',
                uploaded_by: imageData.uploaded_by || null
            };
            const created = await mongoModels.EventImage.create(val);
            return { id: created._id, ...val };
        }

        const t = getTables();
        const val = {
            id: imageData.id,
            eventId: imageData.event_id,
            imageUrl: imageData.image_url,
            caption: imageData.caption || '',
            uploadedBy: imageData.uploaded_by || null
        };
        await drizzleDb.insert(t.eventImages).values(val);
        return imageData;
    },

    async getEventImages(eventId) {
        if (mode === 'mongodb') {
            const images = await mongoModels.EventImage.find({ event_id: eventId }).sort({ created_at: -1 }).lean();
            return images.map(img => ({ id: img._id, ...img }));
        }

        const t = getTables();
        const images = await drizzleDb.select().from(t.eventImages).where(eq(t.eventImages.eventId, eventId)).orderBy(desc(t.eventImages.createdAt));
        return images.map(img => ({
            id: img.id,
            event_id: img.eventId,
            image_url: img.imageUrl,
            caption: img.caption,
            uploaded_by: img.uploadedBy,
            created_at: img.createdAt
        }));
    },

    async deleteEventImage(eventId, imageId) {
        if (mode === 'mongodb') {
            await mongoModels.EventImage.deleteOne({ _id: imageId, event_id: eventId });
            return true;
        }

        const t = getTables();
        await drizzleDb.delete(t.eventImages).where(and(eq(t.eventImages.id, imageId), eq(t.eventImages.eventId, eventId)));
        return true;
    },

    async initiateRefund(paymentId) {
        const refId = `ref_mock_${Date.now()}`;
        if (mode === 'mongodb') {
            await mongoModels.Payment.updateOne(
                { $or: [{ _id: paymentId }, { razorpay_payment_id: paymentId }] },
                { status: 'refunded', refund_status: 'processed', refund_id: refId }
            );
            return { success: true, refundId: refId };
        }

        const t = getTables();
        await drizzleDb.update(t.payments)
            .set({ status: 'refunded', refundStatus: 'processed', refundId: refId })
            .where(or(eq(t.payments.id, paymentId), eq(t.payments.razorpayPaymentId, paymentId)));
        return { success: true, refundId: refId };
    },

    async getAdminDashboardStats(adminId) {
        return this.getDashboardStats(adminId);
    },

    async getDashboardStats(adminId) {
        if (mode === 'mongodb') {
            if (adminId) {
                const adminEvents = await mongoModels.Event.find({ created_by: adminId }).lean();
                const adminEventIds = adminEvents.map(e => e._id);
                const totalEvents = adminEvents.length;
                const upcomingEvents = adminEvents.filter(e => e.status === 'registration_open').length;

                if (adminEventIds.length === 0) {
                    return {
                        totalEvents: 0,
                        upcomingEvents: 0,
                        totalRegistrations: 0,
                        confirmedPayments: 0,
                        checkedInCount: 0,
                        totalRevenue: 0,
                        recentRegistrations: []
                    };
                }

                const totalRegistrations = await mongoModels.Registration.countDocuments({ event_id: { $in: adminEventIds } });
                const confirmedPayments = await mongoModels.Registration.countDocuments({
                    event_id: { $in: adminEventIds },
                    registration_status: 'confirmed'
                });
                const checkedInCount = await mongoModels.Attendance.countDocuments({ event_id: { $in: adminEventIds } });

                const adminRegs = await mongoModels.Registration.find({ event_id: { $in: adminEventIds } }, { _id: 1 }).lean();
                const adminRegIds = adminRegs.map(r => r._id);
                let totalRevenue = 0;
                if (adminRegIds.length > 0) {
                    const paidPayments = await mongoModels.Payment.find({ registration_id: { $in: adminRegIds }, status: 'paid' }).lean();
                    totalRevenue = paidPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
                }

                const recentRegistrations = await this.getAllRegistrations(adminId);

                return {
                    totalEvents,
                    upcomingEvents,
                    totalRegistrations,
                    confirmedPayments,
                    checkedInCount,
                    totalRevenue,
                    recentRegistrations: recentRegistrations.slice(0, 10)
                };
            }

            const totalEvents = await mongoModels.Event.countDocuments();
            const upcomingEvents = await mongoModels.Event.countDocuments({ status: 'registration_open' });
            const totalRegistrations = await mongoModels.Registration.countDocuments();
            const confirmedPayments = await mongoModels.Registration.countDocuments({ registration_status: 'confirmed' });
            const checkedInCount = await mongoModels.Attendance.countDocuments();

            const paidPayments = await mongoModels.Payment.find({ status: 'paid' }).lean();
            const totalRevenue = paidPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

            const recentRegistrations = await this.getAllRegistrations();

            return {
                totalEvents,
                upcomingEvents,
                totalRegistrations,
                confirmedPayments,
                checkedInCount,
                totalRevenue,
                recentRegistrations: recentRegistrations.slice(0, 10)
            };
        }

        const t = getTables();
        if (adminId) {
            const adminEvents = await drizzleDb.select().from(t.events).where(eq(t.events.createdBy, adminId));
            const adminEventIds = adminEvents.map(e => e.id);
            const totalEvents = adminEvents.length;
            const upcomingEvents = adminEvents.filter(e => e.status === 'registration_open').length;

            if (adminEventIds.length === 0) {
                return {
                    totalEvents: 0,
                    upcomingEvents: 0,
                    totalRegistrations: 0,
                    confirmedPayments: 0,
                    checkedInCount: 0,
                    totalRevenue: 0,
                    recentRegistrations: []
                };
            }

            const adminRegs = await drizzleDb.select().from(t.registrations).where(inArray(t.registrations.eventId, adminEventIds));
            const totalRegistrations = adminRegs.length;
            const confirmedPayments = adminRegs.filter(r => r.registrationStatus === 'confirmed').length;

            const adminAtts = await drizzleDb.select().from(t.attendance).where(inArray(t.attendance.eventId, adminEventIds));
            const checkedInCount = adminAtts.length;

            const adminRegIds = adminRegs.map(r => r.id);
            let totalRevenue = 0;
            if (adminRegIds.length > 0) {
                const pays = await drizzleDb.select().from(t.payments).where(and(eq(t.payments.status, 'paid'), inArray(t.payments.registrationId, adminRegIds)));
                totalRevenue = pays.reduce((acc, p) => acc + parseFloat(p.amount || 0), 0);
            }

            const recent = await this.getAllRegistrations(adminId);

            return {
                totalEvents,
                upcomingEvents,
                totalRegistrations,
                confirmedPayments,
                checkedInCount,
                totalRevenue,
                recentRegistrations: recent.slice(0, 10)
            };
        }

        const evts = await drizzleDb.select().from(t.events);
        const regs = await drizzleDb.select().from(t.registrations);
        const atts = await drizzleDb.select().from(t.attendance);
        const pays = await drizzleDb.select().from(t.payments).where(eq(t.payments.status, 'paid'));

        const totalRevenue = pays.reduce((acc, p) => acc + parseFloat(p.amount || 0), 0);
        const upcomingEvents = evts.filter(e => e.status === 'registration_open').length;
        const confirmedPayments = regs.filter(r => r.registrationStatus === 'confirmed').length;

        const recent = await this.getAllRegistrations();

        return {
            totalEvents: evts.length,
            upcomingEvents,
            totalRegistrations: regs.length,
            confirmedPayments,
            checkedInCount: atts.length,
            totalRevenue,
            recentRegistrations: recent.slice(0, 10)
        };
    },

    async createWebhookEvent(eventData) {
        if (mode === 'mongodb') {
            return eventData;
        }
        const t = getTables();
        const val = {
            id: eventData.id,
            eventId: eventData.event_id,
            eventType: eventData.event_type,
            payload: typeof eventData.payload === 'string' ? eventData.payload : JSON.stringify(eventData.payload)
        };
        await drizzleDb.insert(t.webhookEvents).values(val);
    },

    async saveOtp({ email, otp, purpose = 'registration', ttlMs = 10 * 60 * 1000 }) {
        const cleanEmail = String(email || '').trim().toLowerCase();
        const expiresAtMs = Date.now() + ttlMs;
        const id = uuidv4();

        if (mode === 'mongodb' && mongoModels.Otp) {
            try {
                await mongoModels.Otp.deleteMany({ email: cleanEmail, purpose });
                const doc = await mongoModels.Otp.create({
                    _id: id,
                    email: cleanEmail,
                    otp,
                    purpose,
                    expires_at: new Date(expiresAtMs)
                });
                return { id, email: cleanEmail, otp, purpose, expires_at: doc.expires_at };
            } catch (err) {
                console.error('[MongoDB saveOtp Error]', err.message);
            }
        }

        try {
            sqliteDb.prepare('DELETE FROM email_otps WHERE email = ? AND purpose = ?').run(cleanEmail, purpose);
            sqliteDb.prepare('INSERT INTO email_otps (id, email, otp, purpose, expires_at) VALUES (?, ?, ?, ?, ?)').run(id, cleanEmail, otp, purpose, expiresAtMs);
            return { id, email: cleanEmail, otp, purpose, expires_at: new Date(expiresAtMs) };
        } catch (err) {
            console.error('[SQLite saveOtp Error]', err.message);
            return null;
        }
    },

    async getOtp({ email, purpose = 'registration' }) {
        const cleanEmail = String(email || '').trim().toLowerCase();

        if (mode === 'mongodb' && mongoModels.Otp) {
            try {
                const rec = await mongoModels.Otp.findOne({ 
                    email: cleanEmail, 
                    purpose,
                    expires_at: { $gt: new Date() }
                }).sort({ created_at: -1 }).lean();
                if (rec) return { id: rec._id, email: rec.email, otp: rec.otp, expires_at: rec.expires_at };
            } catch (err) {
                console.error('[MongoDB getOtp Error]', err.message);
            }
        }

        try {
            const now = Date.now();
            const row = sqliteDb.prepare('SELECT * FROM email_otps WHERE email = ? AND purpose = ? AND expires_at > ? ORDER BY expires_at DESC LIMIT 1').get(cleanEmail, purpose, now);
            if (row) return { id: row.id, email: row.email, otp: row.otp, expires_at: new Date(row.expires_at) };
            return null;
        } catch (err) {
            console.error('[SQLite getOtp Error]', err.message);
            return null;
        }
    },

    async deleteOtp({ email, purpose = 'registration' }) {
        const cleanEmail = String(email || '').trim().toLowerCase();

        if (mode === 'mongodb' && mongoModels.Otp) {
            try {
                await mongoModels.Otp.deleteMany({ email: cleanEmail, purpose });
            } catch (err) {
                console.error('[MongoDB deleteOtp Error]', err.message);
            }
        }

        try {
            sqliteDb.prepare('DELETE FROM email_otps WHERE email = ? AND purpose = ?').run(cleanEmail, purpose);
        } catch (err) {
            console.error('[SQLite deleteOtp Error]', err.message);
        }
    },

    async testConnection() {
        if (mode === 'mongodb') {
            try {
                const userCount = await mongoModels.User.countDocuments();
                console.log(`✅ [Database Status] Connected via MongoDB Mongoose (Users Count: ${userCount})`);
                return { connected: true, mode: 'mongodb', message: 'Connected to MongoDB', userCount };
            } catch (err) {
                console.error(`❌ [Database Exception] MongoDB: ${err.message}`);
                return { connected: false, mode: 'mongodb', error: err.message };
            }
        }

        try {
            const t = getTables();
            const res = await drizzleDb.select({ count: count() }).from(t.users);
            const userCount = Number(res[0]?.count || 0);
            console.log(`✅ [Database Status] Connected via Drizzle ORM (${mode.toUpperCase()} Mode, Users Count: ${userCount})`);
            return { connected: true, mode, message: `Connected via Drizzle ORM (${mode})`, userCount };
        } catch (err) {
            console.error(`❌ [Database Exception] Drizzle ORM: ${err.message}`);
            return { connected: false, mode, error: err.message };
        }
    }
};

module.exports = dbQuery;
