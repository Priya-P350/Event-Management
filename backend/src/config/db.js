const { drizzle: drizzlePg } = require('drizzle-orm/postgres-js');
const { drizzle: drizzleSqlite } = require('drizzle-orm/better-sqlite3');
const postgres = require('postgres');
const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const { eq, and, or, ilike, sql, desc, count, sum } = require('drizzle-orm');

const schema = require('../db/schema');

let mode = 'sqlite';
let sqliteDb = null;
let pgClient = null;
let drizzleDb = null;

// Initialize SQLite as local database file
const dbPath = path.join(__dirname, '../../local_database.sqlite');
sqliteDb = new Database(dbPath);
sqliteDb.pragma('foreign_keys = ON');
initSqliteTables(sqliteDb);

const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

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
    console.log('[Database] DATABASE_URL not found. Using local SQLite via Drizzle ORM...');
    drizzleDb = drizzleSqlite(sqliteDb, { schema });
    mode = 'sqlite';
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

        CREATE TABLE IF NOT EXISTS webhook_events (
            id TEXT PRIMARY KEY,
            event_id TEXT UNIQUE NOT NULL,
            event_type TEXT NOT NULL,
            payload TEXT NOT NULL,
            processed_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
    `);

    const userCount = db.prepare('SELECT count(*) as count FROM users').get();
    if (userCount.count === 0) {
        seedSqliteData(db);
    }
}

function seedSqliteData(db) {
    const passwordHash = bcrypt.hashSync('Admin@123', 10);
    const guestHash = bcrypt.hashSync('Guest@123', 10);
    const staffHash = bcrypt.hashSync('Staff@123', 10);

    const insertUser = db.prepare(`
        INSERT INTO users (id, name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertUser.run('11111111-1111-1111-1111-111111111111', 'Global Super Admin', 'admin@eventhub.com', '+91 9876543210', passwordHash, 'super_admin');
    insertUser.run('22222222-2222-2222-2222-222222222222', 'Event Organizer Admin', 'organizer@eventhub.com', '+91 9876543211', passwordHash, 'event_admin');
    insertUser.run('33333333-3333-3333-3333-333333333333', 'Scanner Gate Staff', 'staff@eventhub.com', '+91 9876543212', staffHash, 'scanner_staff');
    insertUser.run('44444444-4444-4444-4444-444444444444', 'Rahul Sharma', 'guest@gmail.com', '+91 9876543213', guestHash, 'guest');
    insertUser.run('55555555-5555-5555-5555-555555555555', 'Priya Patel', 'priya@gmail.com', '+91 9876543214', guestHash, 'guest');

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

    insertEvent.run(
        'a2222222-2222-2222-2222-222222222222',
        'Neon Pulsar Music Festival',
        'An immersive electronic & synthwave music festival with high-octane stage lights, top international DJs, gourmet food trucks, and VIP lounge experiences.',
        'Music',
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
        '2026-11-20',
        '16:00',
        '23:30',
        'Skyline Open Air Arena',
        'Sector 18, Riverside Boulevard, Downtown City',
        'https://maps.google.com',
        2999.00,
        1200,
        '2026-09-05 00:00:00',
        '2026-11-19 23:59:59',
        'registration_open',
        '22222222-2222-2222-2222-222222222222'
    );

    insertEvent.run(
        'a3333333-3333-3333-3333-333333333333',
        'Startup Pitch & Venture Gala',
        'Connect top venture capitalists, angel investors, and high-growth startup founders. Watch live pitch sessions with funding opportunities over $5M.',
        'Business',
        'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
        '2026-12-05',
        '10:00',
        '17:00',
        'The Zenith Business Hub',
        '8th Floor Executive Hall, Commercial Center, Metro City',
        'https://maps.google.com',
        999.00,
        250,
        '2026-09-10 00:00:00',
        '2026-12-04 23:59:59',
        'registration_open',
        '11111111-1111-1111-1111-111111111111'
    );

    insertEvent.run(
        'a4444444-4444-4444-4444-444444444444',
        'Generative AI Masterclass Workshop',
        'Hands-on masterclass building LLM agents, RAG systems, multimodal apps, and fine-tuning open source models with industry AI experts.',
        'Education',
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
        '2026-08-10',
        '11:00',
        '16:00',
        'Innovation Labs Hall A',
        'Knowledge Village, Tech Hub Campus',
        'https://maps.google.com',
        499.00,
        100,
        '2026-07-01 00:00:00',
        '2026-08-09 23:59:59',
        'completed',
        '11111111-1111-1111-1111-111111111111'
    );

    const insertReg = db.prepare(`
        INSERT INTO registrations (id, event_id, user_id, registration_number, guest_name, guest_email, guest_phone, registration_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertReg.run('r1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'REG-2026-000101', 'Rahul Sharma', 'guest@gmail.com', '+91 9876543213', 'confirmed');
    insertReg.run('r2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'REG-2026-000102', 'Priya Patel', 'priya@gmail.com', '+91 9876543214', 'confirmed');
    insertReg.run('r3333333-3333-3333-3333-333333333333', 'a4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'REG-2026-000099', 'Rahul Sharma', 'guest@gmail.com', '+91 9876543213', 'confirmed');

    const insertPay = db.prepare(`
        INSERT INTO payments (id, registration_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, currency, status, paid_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertPay.run('p1111111-1111-1111-1111-111111111111', 'r1111111-1111-1111-1111-111111111111', 'order_Pz111111111111', 'pay_Pz111111111111', 'sig_mock_hash_111111111111', 1499.00, 'INR', 'paid', new Date().toISOString());
    insertPay.run('p2222222-2222-2222-2222-222222222222', 'r2222222-2222-2222-2222-222222222222', 'order_Pz222222222222', 'pay_Pz222222222222', 'sig_mock_hash_222222222222', 1499.00, 'INR', 'paid', new Date().toISOString());
    insertPay.run('p3333333-3333-3333-3333-333333333333', 'r3333333-3333-3333-3333-333333333333', 'order_Pz333333333333', 'pay_Pz333333333333', 'sig_mock_hash_333333333333', 499.00, 'INR', 'paid', '2026-08-10T10:30:00Z');

    const insertTicket = db.prepare(`
        INSERT INTO tickets (id, registration_id, event_id, user_id, ticket_number, secure_token, qr_code_data, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertTicket.run('t1111111-1111-1111-1111-111111111111', 'r1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'EVT-2026-000101', 'EVT-TK-9a8b7c6d5e4f3a2b1c0d', 'EVENT-TICKET:EVT-TK-9a8b7c6d5e4f3a2b1c0d', 'active');
    insertTicket.run('t2222222-2222-2222-2222-222222222222', 'r2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'EVT-2026-000102', 'EVT-TK-1f2e3d4c5b6a7b8c9d0e', 'EVENT-TICKET:EVT-TK-1f2e3d4c5b6a7b8c9d0e', 'active');
    insertTicket.run('t3333333-3333-3333-3333-333333333333', 'r3333333-3333-3333-3333-333333333333', 'a4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'EVT-2026-000099', 'EVT-TK-887766554433221100aa', 'EVENT-TICKET:EVT-TK-887766554433221100aa', 'checked_in');

    const insertAtt = db.prepare(`
        INSERT INTO attendance (id, ticket_id, event_id, registration_id, checked_in_by, checked_in_at, status, device_info)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAtt.run('att11111-1111-1111-1111-111111111111', 't3333333-3333-3333-3333-333333333333', 'a4444444-4444-4444-4444-444444444444', 'r3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', '2026-08-10T10:45:12Z', 'checked_in', 'Gate Scanner Mobile #01');

    console.log('[Database] Local SQLite Database populated with seed data successfully.');
}

// Unified Drizzle ORM Query Layer
const dbQuery = {
    get mode() { return mode; },
    set mode(val) { mode = val; },
    get db() { return drizzleDb; },
    sqliteDb,

    async findUserByEmail(email) {
        return this.findUserByEmailOrPhone(email);
    },

    async findUserByEmailOrPhone(identifier) {
        if (!identifier) return null;
        const t = getTables();
        const clean = identifier.trim().toLowerCase();
        try {
            const results = await drizzleDb.select().from(t.users).where(
                or(
                    sql`LOWER(${t.users.email}) = ${clean}`,
                    sql`LOWER(${t.users.phone}) = ${clean}`,
                    eq(t.users.id, clean)
                )
            );
            if (!results || results.length === 0) return null;
            const u = results[0];
            return {
                ...u,
                password_hash: u.passwordHash || u.password_hash
            };
        } catch (err) {
            return null;
        }
    },

    async findUserById(id) {
        if (!id) return null;
        const t = getTables();
        try {
            const results = await drizzleDb.select({
                id: t.users.id,
                name: t.users.name,
                email: t.users.email,
                phone: t.users.phone,
                role: t.users.role,
                created_at: t.users.createdAt
            }).from(t.users).where(eq(t.users.id, id));
            return results[0] || null;
        } catch (err) {
            return null;
        }
    },

    async createUser(user) {
        const t = getTables();
        const val = {
            id: user.id,
            name: user.name,
            email: user.email.toLowerCase(),
            phone: user.phone || '',
            passwordHash: user.password_hash || user.passwordHash,
            role: user.role || 'guest'
        };
        await drizzleDb.insert(t.users).values(val);
        return user;
    },

    async getAllUsers(query = {}) {
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
                created_at: u.created_at || u.createdAt,
                registrations_count: regCountRes[0] ? Number(regCountRes[0].count) : 0
            };
        }));
    },

    async updateUserRole(userId, role) {
        const t = getTables();
        const validRoles = ['guest', 'scanner_staff', 'event_admin', 'super_admin'];
        if (!validRoles.includes(role)) {
            throw new Error(`Invalid role: ${role}`);
        }
        await drizzleDb.update(t.users).set({ role }).where(eq(t.users.id, userId));
        return this.findUserById(userId);
    },

    async deleteUser(userId) {
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
        const t = getTables();
        const conditions = [];
        if (query.status) conditions.push(eq(t.events.status, query.status));
        if (query.category) conditions.push(eq(t.events.category, query.category));
        if (query.search) {
            const term = `%${query.search}%`;
            conditions.push(or(ilike(t.events.title, term), ilike(t.events.description, term), ilike(t.events.venue, term)));
        }
        let q = drizzleDb.select().from(t.events);
        if (conditions.length > 0) q = q.where(and(...conditions));
        const events = await q;

        const parseItiMeta = (desc) => {
            if (!desc) return { description: '', iti_trade: '', iti_institute: '', iti_eligibility: '' };
            const match = desc.match(/---ITI_META---\s*\n([\s\S]*?)\n\s*---END_ITI_META---\s*\n?([\s\S]*)/);
            if (match) {
                try {
                    const meta = JSON.parse(match[1]);
                    return {
                        description: match[2].trim(),
                        iti_trade: meta.trade || '',
                        iti_institute: meta.institute || '',
                        iti_eligibility: meta.eligibility || ''
                    };
                } catch (e) {
                    return { description: desc, iti_trade: '', iti_institute: '', iti_eligibility: '' };
                }
            }
            return { description: desc, iti_trade: '', iti_institute: '', iti_eligibility: '' };
        };

        return Promise.all(events.map(async (evt) => {
            const regCountRes = await drizzleDb.select({ count: count() }).from(t.registrations).where(and(eq(t.registrations.eventId, evt.id), eq(t.registrations.registrationStatus, 'confirmed')));
            const countVal = regCountRes[0] ? Number(regCountRes[0].count) : 0;
            const parsedDesc = parseItiMeta(evt.description);
            return {
                ...evt,
                description: parsedDesc.description,
                iti_trade: parsedDesc.iti_trade,
                iti_institute: parsedDesc.iti_institute,
                iti_eligibility: parsedDesc.iti_eligibility,
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
        const t = getTables();
        const events = await drizzleDb.select().from(t.events).where(eq(t.events.id, id));
        if (!events || events.length === 0) return null;
        const evt = events[0];

        const regCountRes = await drizzleDb.select({ count: count() }).from(t.registrations).where(and(eq(t.registrations.eventId, id), eq(t.registrations.registrationStatus, 'confirmed')));
        const countVal = regCountRes[0] ? Number(regCountRes[0].count) : 0;
        const gallery = await drizzleDb.select().from(t.eventImages).where(eq(t.eventImages.eventId, id));

        const parseItiMeta = (desc) => {
            if (!desc) return { description: '', iti_trade: '', iti_institute: '', iti_eligibility: '' };
            const match = desc.match(/---ITI_META---\s*\n([\s\S]*?)\n\s*---END_ITI_META---\s*\n?([\s\S]*)/);
            if (match) {
                try {
                    const meta = JSON.parse(match[1]);
                    return {
                        description: match[2].trim(),
                        iti_trade: meta.trade || '',
                        iti_institute: meta.institute || '',
                        iti_eligibility: meta.eligibility || ''
                    };
                } catch (e) {
                    return { description: desc, iti_trade: '', iti_institute: '', iti_eligibility: '' };
                }
            }
            return { description: desc, iti_trade: '', iti_institute: '', iti_eligibility: '' };
        };

        const parsedDesc = parseItiMeta(evt.description);

        return {
            ...evt,
            description: parsedDesc.description,
            iti_trade: parsedDesc.iti_trade,
            iti_institute: parsedDesc.iti_institute,
            iti_eligibility: parsedDesc.iti_eligibility,
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

    async createRegistration(regData) {
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
            custom_answers: reg.customAnswers,
            created_at: reg.createdAt,
            event: events[0] ? { ...events[0], cover_image_url: events[0].coverImageUrl, event_date: events[0].eventDate, start_time: events[0].startTime } : null,
            payment: payments[0] ? { ...payments[0], razorpay_order_id: payments[0].razorpayOrderId } : null,
            ticket: tickets[0] ? { ...tickets[0], secure_token: tickets[0].secureToken } : null
        };
    },

    async getUserRegistrations(userId) {
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
        const t = getTables();
        await drizzleDb.update(t.registrations).set({ registrationStatus: status }).where(eq(t.registrations.id, registrationId));
    },

    async createPayment(payData) {
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
        const t = getTables();
        const tickets = await drizzleDb.select().from(t.tickets).where(or(eq(t.tickets.secureToken, token), eq(t.tickets.ticketNumber, token)));
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
            event: events[0] ? { ...events[0], title: events[0].title } : null,
            registration: regs[0] ? {
                ...regs[0],
                registration_id: regs[0].id,
                event_id: regs[0].eventId,
                user_id: regs[0].userId,
                registration_number: regs[0].registrationNumber,
                guest_name: regs[0].guestName,
                guest_email: regs[0].guestEmail,
                guest_phone: regs[0].guestPhone,
                registration_status: regs[0].registrationStatus || regs[0].registration_status || 'pending'
            } : null,
            user: users[0] || null,
            attendance: atts[0] || null
        };
    },

    async processCheckinAtomic(ticketId, eventId, registrationId, checkedInBy, deviceInfo = 'Gate Scanner') {
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

        const attId = require('crypto').randomUUID();
        const val = {
            id: attId,
            ticketId,
            eventId,
            registrationId,
            checkedInBy: checkedInBy || null,
            status: 'checked_in',
            deviceInfo: deviceInfo || 'Gate Scanner'
        };
        await drizzleDb.insert(t.attendance).values(val);
        await drizzleDb.update(t.tickets).set({ status: 'checked_in' }).where(eq(t.tickets.id, ticketId));

        const newAtt = await drizzleDb.select().from(t.attendance).where(eq(t.attendance.id, attId));
        return { success: true, checkin: newAtt[0] };
    },

    async getAdminDashboardStats() {
        const t = getTables();
        const totalEventsRes = await drizzleDb.select({ count: count() }).from(t.events);
        const totalEvents = Number(totalEventsRes[0]?.count || 0);

        const upcomingEventsRes = await drizzleDb.select({ count: count() }).from(t.events).where(or(eq(t.events.status, 'published'), eq(t.events.status, 'registration_open')));
        const upcomingEvents = Number(upcomingEventsRes[0]?.count || 0);

        const totalRegsRes = await drizzleDb.select({ count: count() }).from(t.registrations);
        const totalRegistrations = Number(totalRegsRes[0]?.count || 0);

        const paidPaymentsRes = await drizzleDb.select({ count: count(), totalRev: sum(t.payments.amount) }).from(t.payments).where(eq(t.payments.status, 'paid'));
        const confirmedPayments = Number(paidPaymentsRes[0]?.count || 0);
        const totalRevenue = parseFloat(paidPaymentsRes[0]?.totalRev || 0);

        const checkedInRes = await drizzleDb.select({ count: count() }).from(t.attendance).where(eq(t.attendance.status, 'checked_in'));
        const checkedInCount = Number(checkedInRes[0]?.count || 0);

        const recentRegs = await drizzleDb.select().from(t.registrations).orderBy(desc(t.registrations.createdAt)).limit(10);
        const recentRegistrations = await Promise.all(recentRegs.map(async reg => {
            const evt = await drizzleDb.select({ title: t.events.title }).from(t.events).where(eq(t.events.id, reg.eventId));
            const pay = await drizzleDb.select({ status: t.payments.status }).from(t.payments).where(eq(t.payments.registrationId, reg.id));
            return {
                ...reg,
                registration_number: reg.registrationNumber,
                guest_name: reg.guestName,
                guest_email: reg.guestEmail,
                guest_phone: reg.guestPhone,
                event_title: evt[0]?.title || '',
                payment_status: pay[0]?.status || 'pending'
            };
        }));

        return {
            totalEvents,
            upcomingEvents,
            totalRegistrations,
            confirmedPayments,
            totalRevenue,
            checkedInCount,
            recentRegistrations
        };
    },

    async getEventImages(eventId) {
        const t = getTables();
        const images = await drizzleDb.select().from(t.eventImages).where(eq(t.eventImages.eventId, eventId)).orderBy(desc(t.eventImages.createdAt));
        return images.map(img => ({
            ...img,
            event_id: img.eventId,
            image_url: img.imageUrl,
            uploaded_by: img.uploadedBy,
            created_at: img.createdAt
        }));
    },

    async addEventImage(imageData) {
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

    async deleteEventImage(imageId) {
        const t = getTables();
        await drizzleDb.delete(t.eventImages).where(eq(t.eventImages.id, imageId));
    },

    async getWebhookEvent(eventId) {
        const t = getTables();
        const res = await drizzleDb.select().from(t.webhookEvents).where(eq(t.webhookEvents.eventId, eventId));
        return res[0] || null;
    },

    async createWebhookEvent(eventData) {
        const t = getTables();
        const val = {
            id: eventData.id,
            eventId: eventData.event_id,
            eventType: eventData.event_type,
            payload: typeof eventData.payload === 'string' ? eventData.payload : JSON.stringify(eventData.payload)
        };
        await drizzleDb.insert(t.webhookEvents).values(val);
    },

    async getEventAttendance(eventId) {
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

    async getAllRegistrations() {
        const t = getTables();
        const regs = await drizzleDb.select().from(t.registrations).orderBy(desc(t.registrations.createdAt));
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

    async getAllPayments() {
        const t = getTables();
        const payments = await drizzleDb.select().from(t.payments).orderBy(desc(t.payments.createdAt));
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

    async getAllAttendance() {
        const t = getTables();
        const attendanceList = await drizzleDb.select().from(t.attendance).orderBy(desc(t.attendance.checkedInAt));
        return Promise.all(attendanceList.map(async att => {
            const tk = await drizzleDb.select({ ticketNumber: t.tickets.ticketNumber }).from(t.tickets).where(eq(t.tickets.id, att.ticketId));
            const reg = await drizzleDb.select().from(t.registrations).where(eq(t.registrations.id, att.registrationId));
            const evt = await drizzleDb.select({ title: t.events.title }).from(t.events).where(eq(t.events.id, att.eventId));
            return {
                ...att,
                ticket_number: tk[0]?.ticketNumber || '',
                guest_name: reg[0]?.guestName || '',
                guest_email: reg[0]?.guestEmail || '',
                guest_phone: reg[0]?.guestPhone || '',
                event_title: evt[0]?.title || ''
            };
        }));
    },

    async initiateRefund(paymentId) {
        const t = getTables();
        const refId = `ref_mock_${Date.now()}`;
        await drizzleDb.update(t.payments)
            .set({ status: 'refunded', refundStatus: 'processed', refundId: refId })
            .where(or(eq(t.payments.id, paymentId), eq(t.payments.razorpayPaymentId, paymentId)));
        return { success: true, refundId: refId };
    },

    async testConnection() {
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
