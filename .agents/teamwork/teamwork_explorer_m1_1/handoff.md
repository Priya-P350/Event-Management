# Database Schemas and Scoped Query Implementation Strategy for Milestone 1

**Agent**: `teamwork_explorer_m1_1`  
**Date**: 2026-11-04  
**Target Milestone**: Milestone 1 (Backend Admin Unique Identifier & Strict Data Isolation)  
**Working Directory**: `c:\Users\priya\OneDrive\Desktop\QR\.agents\teamwork\teamwork_explorer_m1_1`  

---

## 1. Observation

### 1.1 Current Database Schemas and Entity Relationships
The backend operates a dual ORM / database access layer supporting both **Mongoose (MongoDB)** and **Drizzle ORM (embedded SQLite & Supabase PostgreSQL)** located in `backend/src/config/db.js`, `backend/src/db/schema.js`, and `backend/src/models/`:

1. **`User` Entity**:
   - **Postgres Drizzle** (`backend/src/db/schema.js:9-25`):
     ```javascript
     const usersPg = pgTable('users', {
         id: uuid('id').primaryKey().defaultRandom(),
         name: varchar('name', { length: 255 }).notNull(),
         email: varchar('email', { length: 255 }).notNull().unique(),
         phone: varchar('phone', { length: 50 }),
         passwordHash: varchar('password_hash', { length: 255 }).notNull(),
         role: varchar('role', { length: 50 }).notNull().default('guest'),
         memberId: varchar('member_id', { length: 100 }),
         ...
     ```
   - **SQLite Drizzle** (`backend/src/db/schema.js:131-147`):
     ```javascript
     const usersSqlite = sqliteTable('users', {
         id: sqliteText('id').primaryKey(),
         name: sqliteText('name').notNull(),
         email: sqliteText('email').notNull().unique(),
         phone: sqliteText('phone'),
         passwordHash: sqliteText('password_hash').notNull(),
         role: sqliteText('role').notNull().default('guest'),
         memberId: sqliteText('member_id'),
         ...
     ```
   - **SQLite Raw DDL & Migrations** (`backend/src/config/db.js:84-100` and `db.js:225-238`):
     Table `users` contains `member_id TEXT`, but lacks `admin_id`.
   - **Mongoose Model** (`backend/src/models/User.js:3-25`):
     ```javascript
     const userSchema = new mongoose.Schema({
         _id: { type: String, required: true },
         name: { type: String, required: true, trim: true },
         email: { type: String, required: true, unique: true, lowercase: true, trim: true },
         phone: { type: String, default: '', trim: true },
         password_hash: { type: String, required: true },
         role: { type: String, enum: ['guest', 'scanner_staff', 'event_admin', 'super_admin'], default: 'guest' },
         member_id: { type: String, sparse: true, index: true },
         ...
     ```
   - **Seeded Admins** (`backend/src/config/db.js:255-256`):
     - Super Admin: ID `'11111111-1111-1111-1111-111111111111'`, Role `'super_admin'`.
     - Event Organizer Admin: ID `'22222222-2222-2222-2222-222222222222'`, Role `'event_admin'`.
   - **Current State**: Admins have primary key UUID `id`, but **no dedicated `admin_id`** column or auto-generator.

2. **`Event` Entity**:
   - `backend/src/db/schema.js:27-47` (Postgres), `schema.js:149-169` (SQLite), `backend/src/models/Event.js:3-24` (MongoDB):
     Contains field `created_by` (UUID / String).
   - In `backend/src/controllers/eventController.js:67`:
     ```javascript
     created_by: req.user ? req.user.id : null
     ```
   - In `backend/src/config/db.js:283`:
     Seed event has `created_by: '11111111-1111-1111-1111-111111111111'`.

3. **`Registration` Entity**:
   - `backend/src/db/schema.js:49-60` (Postgres), `schema.js:171-182` (SQLite), `backend/src/models/Registration.js:3-13` (MongoDB):
     Contains `eventId` / `event_id` referencing `events.id`, and `userId` / `user_id` referencing `users.id`.

4. **`Payment` Entity**:
   - `backend/src/db/schema.js:62-75` (Postgres), `schema.js:184-197` (SQLite), `backend/src/models/Payment.js:3-15` (MongoDB):
     Contains `registrationId` / `registration_id` referencing `registrations.id`.

5. **`Attendance` Entity**:
   - `backend/src/db/schema.js:89-98` (Postgres), `schema.js:211-220` (SQLite), `backend/src/models/Attendance.js:3-14` (MongoDB):
     Contains `eventId` / `event_id` referencing `events.id`, `ticketId` / `ticket_id`, `registrationId` / `registration_id`.
   - SQLite also has a separate `member_attendance` table (`backend/src/config/db.js:204-213`) for general organization member gate entries.

### 1.2 Existing Query Methods in `backend/src/config/db.js`
- **`getDashboardStats()`** (`db.js:1658-1703`):
  - MongoDB: calls `Event.countDocuments()`, `Registration.countDocuments()`, `Attendance.countDocuments()`, `Payment.find({ status: 'paid' })` globally without creator filter.
  - Drizzle: performs `drizzleDb.select().from(t.events)`, `from(t.registrations)`, `from(t.attendance)`, `from(t.payments)` across the entire database without creator filter.
- **`getAllRegistrations()`** (`db.js:1489-1540`):
  - Fetches all records from `registrations` table/collection; accepts no arguments.
- **`getAllPayments()`** (`db.js:1542-1581`):
  - Fetches all records from `payments` table/collection; accepts no arguments.
- **`getAllAttendance()`** (`db.js:1357-1453`):
  - Fetches all event check-ins from `attendance` and combines them with `member_attendance` without checking event creator.
- **`getEvents(query)`** (`db.js:771-834`):
  - Filters by `status`, `category`, and `search`, but does NOT filter by `created_by`.

### 1.3 Controller Usage & Syntax Issue
- In `backend/src/controllers/adminController.js`:
  - Line 10: `getDashboardStats` calls `await dbQuery.getAdminDashboardStats();`
  - Line 161: `getAllRegistrations` calls `await dbQuery.getAllRegistrations();`
  - Line 170: `getAllPayments` calls `await dbQuery.getAllPayments();`
  - Line 179: `getAllAttendance` calls `await dbQuery.getAllAttendance();`
  - Line 188: `exportRegistrationsCSV` calls `await dbQuery.getAllRegistrations();`
  - Line 214: `exportPaymentsCSV` calls `await dbQuery.getAllPayments();`
  - **Syntax Error at line 122**: Stray extra closing curly brace `}` right after `resetMemberQr()` causes Node/Jest parser to fail immediately.

---

## 2. Logic Chain

1. **Deterministic Relational Hierarchy**:
   Every attendee record in the system traces back to an event creator through foreign key relations:
   $$\text{Payment} \xrightarrow{\text{registration\_id}} \text{Registration} \xrightarrow{\text{event\_id}} \text{Event} \xrightarrow{\text{created\_by}} \text{User (Admin)}$$
   $$\text{Attendance} \xrightarrow{\text{event\_id}} \text{Event} \xrightarrow{\text{created\_by}} \text{User (Admin)}$$

2. **Scoping Parameter Contract**:
   By adding an optional parameter `adminId` to:
   - `getDashboardStats(adminId)`
   - `getAllRegistrations(adminId)`
   - `getAllPayments(adminId)`
   - `getAllAttendance(adminId)`
   - `getEvents(query)` (where `query.created_by` can be set)
   We establish a clean bifurcation:
   - When `adminId` is provided: Fetch the admin's owned events (`event.created_by === adminId`), collect the set of owned event IDs, and restrict all subordinate queries (registrations, payments, attendance) strictly to those event IDs.
   - When `adminId` is undefined or omitted: Retain global oversight for platform `super_admin`.

3. **Defensive Array Handling in SQL / Drizzle**:
   When an admin owns 0 events, `adminEventIds` is empty (`[]`). Calling SQL `IN ()` in Drizzle can trigger a SQL syntax error. Therefore, queries must check `if (adminEventIds.length === 0)` and immediately return an empty array `[]` (or 0 counts for dashboard stats) before invoking Drizzle's `inArray()`.

4. **Member Attendance vs. Event Attendance Isolation**:
   `member_attendance` represents organization-wide door/gate passes (`member_id`), unrelated to any specific event. For `event_admin`, `getAllAttendance(adminId)` must strictly exclude `member_attendance`. For `super_admin`, `member_attendance` remains visible in global attendance logs.

5. **`admin_id` Identity Lifecycle**:
   - Schema: Add `admin_id` column to `users` (unique, nullable/sparse).
   - Generator: In `backend/src/utils/ticketToken.js`, export `generateAdminId()` returning format `ADM-2026-${Math.floor(100000 + Math.random() * 900000)}`.
   - Seeded users: Seed Super Admin with `'ADM-0001'` and Organizer with `'ADM-0002'`.
   - Auto-generation: When an admin registers (`role === 'event_admin'`), assign `admin_id`. During `login` or `getMe`, backfill `admin_id` if missing on existing admin accounts.
   - JWT & Payload: Include `admin_id` in JWT payload and user responses.

---

## 3. Formulated Implementation Strategy

### 3.1 Schema Changes for `admin_id` on `User`

#### A. Drizzle PostgreSQL Dialect (`backend/src/db/schema.js:9-25`)
Add `adminId`:
```javascript
const usersPg = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    phone: varchar('phone', { length: 50 }),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    role: varchar('role', { length: 50 }).notNull().default('guest'),
    adminId: varchar('admin_id', { length: 100 }).unique(),       // <--- NEW
    memberId: varchar('member_id', { length: 100 }),
    qrCodeData: text('qr_code_data'),
    qrToken: varchar('qr_token', { length: 255 }),
    qrStatus: varchar('qr_status', { length: 50 }).notNull().default('active'),
    qrScannedAt: timestamp('qr_scanned_at', { withTimezone: true }),
    qrScannedBy: varchar('qr_scanned_by', { length: 255 }),
    qrDeviceInfo: varchar('qr_device_info', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});
```

#### B. Drizzle SQLite Dialect (`backend/src/db/schema.js:131-147`)
Add `adminId`:
```javascript
const usersSqlite = sqliteTable('users', {
    id: sqliteText('id').primaryKey(),
    name: sqliteText('name').notNull(),
    email: sqliteText('email').notNull().unique(),
    phone: sqliteText('phone'),
    passwordHash: sqliteText('password_hash').notNull(),
    role: sqliteText('role').notNull().default('guest'),
    adminId: sqliteText('admin_id').unique(),                     // <--- NEW
    memberId: sqliteText('member_id'),
    qrCodeData: sqliteText('qr_code_data'),
    qrToken: sqliteText('qr_token'),
    qrStatus: sqliteText('qr_status').notNull().default('active'),
    qrScannedAt: sqliteText('qr_scanned_at'),
    qrScannedBy: sqliteText('qr_scanned_by'),
    qrDeviceInfo: sqliteText('qr_device_info'),
    createdAt: sqliteText('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: sqliteText('updated_at').default(sql`CURRENT_TIMESTAMP`)
});
```

#### C. SQLite Raw Table DDL & Automatic Migration (`backend/src/config/db.js:84-100` and `225-238`)
1. In `initSqliteTables(db)` DDL:
   ```sql
   CREATE TABLE IF NOT EXISTS users (
       id TEXT PRIMARY KEY,
       name TEXT NOT NULL,
       email TEXT UNIQUE NOT NULL,
       phone TEXT,
       password_hash TEXT NOT NULL,
       role TEXT NOT NULL DEFAULT 'guest',
       admin_id TEXT UNIQUE,
       member_id TEXT,
       ...
   );
   ```
2. In `userMigrations` array:
   ```javascript
   const userMigrations = [
       "ALTER TABLE users ADD COLUMN admin_id TEXT;",
       "ALTER TABLE users ADD COLUMN member_id TEXT;",
       ...
   ];
   ```
3. In `seedSqliteData(db)`:
   ```javascript
   const insertUser = db.prepare(`
       INSERT INTO users (id, name, email, phone, password_hash, role, admin_id) VALUES (?, ?, ?, ?, ?, ?, ?)
   `);

   insertUser.run('11111111-1111-1111-1111-111111111111', 'Global Super Admin', 'admin@eventhub.com', '+91 9876543210', passwordHash, 'super_admin', 'ADM-0001');
   insertUser.run('22222222-2222-2222-2222-222222222222', 'Event Organizer Admin', 'organizer@eventhub.com', '+91 9876543211', passwordHash, 'event_admin', 'ADM-0002');
   ```

#### D. Mongoose User Model (`backend/src/models/User.js`)
```javascript
const userSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: '', trim: true },
    password_hash: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['guest', 'scanner_staff', 'event_admin', 'super_admin'], 
        default: 'guest' 
    },
    admin_id: { type: String, sparse: true, index: true, unique: true }, // <--- NEW
    member_id: { type: String, sparse: true, index: true },
    ...
```

#### E. Generator in `backend/src/utils/ticketToken.js`
```javascript
/**
 * Generates a unique admin identifier (e.g. ADM-2026-123456).
 */
function generateAdminId() {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `ADM-2026-${randomNum}`;
}

module.exports = {
    generateTicketToken,
    generateMemberToken,
    generateAdminId
};
```

---

### 3.2 Exact Scoped Query Designs in `backend/src/config/db.js`

Make sure `inArray` is imported at `backend/src/config/db.js:8`:
```javascript
const { eq, and, or, ilike, sql, desc, count, sum, inArray } = require('drizzle-orm');
```

#### Query 1: `getEvents(query = {})`
Supports filtering by `created_by` (and category/status/search).
```javascript
async getEvents(query = {}) {
    if (mode === 'mongodb') {
        const filter = {};
        if (query.status) filter.status = query.status;
        if (query.category && query.category !== 'All') filter.category = query.category;
        if (query.created_by) filter.created_by = query.created_by; // <--- Scoped
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
    if (query.created_by) conditions.push(eq(t.events.createdBy, query.created_by)); // <--- Scoped
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
}
```

#### Query 2: `getAllRegistrations(adminId)`
When `adminId` is provided, fetches only registrations for events where `created_by === adminId`.
```javascript
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
}
```

#### Query 3: `getAllPayments(adminId)`
When `adminId` is provided, fetches payments only for registrations belonging to events created by `adminId`.
```javascript
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
}
```

#### Query 4: `getAllAttendance(adminId)`
When `adminId` is provided, fetches only check-ins for events created by `adminId` and excludes generic `member_attendance`.
```javascript
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

            // Generic member admission only for super-admin (adminId undefined)
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

        // Filter out empty entries if regular event admin
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

    // For event_admin (adminId provided), strictly exclude member gate admissions
    if (adminId) {
        return eventAttList;
    }

    // For super_admin, include member attendance
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
}
```

#### Query 5: `getDashboardStats(adminId)`
When `adminId` is provided, computes counts, upcoming events, confirmed registrations, check-ins, revenue, and recent registrations strictly for events owned by `adminId`.
```javascript
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

        // Global stats for super_admin
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

    // Global stats for super_admin
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
}
```

---

### 3.3 Controller and Route Integration

#### A. Scoping Helper in `backend/src/controllers/adminController.js`
```javascript
function getAdminIdFilter(req) {
    if (req.user && req.user.role === 'super_admin') {
        return undefined; // Global oversight
    }
    return req.user ? req.user.id : undefined;
}
```
Update controller functions:
- `getDashboardStats`: `const stats = await dbQuery.getAdminDashboardStats(getAdminIdFilter(req));`
- `getAllRegistrations`: `const registrations = await dbQuery.getAllRegistrations(getAdminIdFilter(req));`
- `getAllPayments`: `const payments = await dbQuery.getAllPayments(getAdminIdFilter(req));`
- `getAllAttendance`: `const attendance = await dbQuery.getAllAttendance(getAdminIdFilter(req));`
- `exportRegistrationsCSV`: `const registrations = await dbQuery.getAllRegistrations(getAdminIdFilter(req));`
- `exportPaymentsCSV`: `const payments = await dbQuery.getAllPayments(getAdminIdFilter(req));`
- **Fix Syntax Error**: Delete the extra `}` at line 122.

#### B. Event Mutation Authorization in `backend/src/controllers/eventController.js`
In `updateEvent(req, res, next)` and `deleteEvent(req, res, next)`:
```javascript
const existing = await dbQuery.getEventById(req.params.id);
if (!existing) {
    return res.status(404).json({ success: false, message: 'Event not found.' });
}
if (req.user && req.user.role !== 'super_admin' && existing.created_by !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Access denied. You do not have permission to modify this event.' });
}
```

#### C. Event Attendance Scoping in `backend/src/controllers/checkinController.js`
In `getEventAttendance(req, res, next)`:
```javascript
const eventId = req.params.id;
if (req.user && req.user.role !== 'super_admin') {
    const event = await dbQuery.getEventById(eventId);
    if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found.' });
    }
    if (event.created_by !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied. You do not have permission to view attendance for this event.' });
    }
}
const attendanceList = await dbQuery.getEventAttendance(eventId);
```

#### D. Registration Detail Scoping in `backend/src/controllers/registrationController.js`
In `getRegistrationById(req, res, next)`:
```javascript
const registration = await dbQuery.getRegistrationById(req.params.id);
if (!registration) {
    return res.status(404).json({ success: false, message: 'Registration not found.' });
}
if (req.user) {
    const isSuperAdmin = req.user.role === 'super_admin';
    const isRegistrant = registration.user_id === req.user.id;
    const isEventOwner = registration.event && registration.event.created_by === req.user.id;
    if (!isSuperAdmin && !isRegistrant && !isEventOwner) {
        return res.status(403).json({ success: false, message: 'Access denied. Not authorized to view this registration.' });
    }
}
```

#### E. CSV Export Token Query Param Support in `backend/src/middleware/auth.js`
Support query param token so browser downloads (`window.open('/api/admin/export/registrations?token=' + token)`) succeed:
```javascript
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;
    ...
```

---

## 4. Caveats

1. **Dual DB Mode Parity**:
   Any test running under SQLite must behave identically under MongoDB. The design above implements exact query parity, including empty array guards before `$in` / `inArray`.
2. **`created_by` Key Consistency**:
   In Drizzle SQLite/Postgres schemas, `createdBy` is the camelCase property mapping to column `created_by`. In Mongoose, `created_by` is the property name. Queries returning events normalize to `created_by`. Controllers must consistently check `event.created_by === req.user.id`.
3. **Admin Registration vs Member Registration**:
   Normal member registration produces `member_id` (`MEM-2026-XXXXXX`). Only accounts with `role: 'event_admin'` or `role: 'super_admin'` receive an `admin_id` (`ADM-2026-XXXXXX`). Regular guests should NOT receive an `admin_id`.
4. **Jest Open Handles**:
   The `QUERYWRAP` open handles during `npm test` are caused by remote MongoDB Atlas connection attempts while offline or on test failure. The `beforeAll` / `afterAll` hooks in `api.test.js` should ensure Mongoose is cleanly disconnected when tests complete.

---

## 5. Conclusion

1. **Root Cause**: The current system has zero query-level or controller-level tenant filtering for `event_admin`. An event organizer has unrestricted visibility into all registrations, payments, and attendance across the entire platform.
2. **Actionable Implementation**:
   - Add `admin_id` to `User` schema across Postgres, SQLite (DDL + migration), and Mongoose.
   - Implement `generateAdminId()` in `ticketToken.js` and include `admin_id` in registration, login, and JWT payload.
   - Remove the stray syntax error at `adminController.js:122`.
   - Update `getDashboardStats`, `getAllRegistrations`, `getAllPayments`, `getAllAttendance`, and `getEvents` in `backend/src/config/db.js` to accept `adminId` and filter by `event.created_by === adminId`.
   - Update `adminController.js`, `eventController.js`, `checkinController.js`, and `registrationController.js` to pass `req.user.id` for `event_admin` and enforce 403 checks for cross-organizer mutation/inspection.
3. **Ready for Implementation**: With this design, the implementer can apply the exact changes systematically without ambiguity.

---

## 6. Verification Method

### 6.1 Syntax Check
Run node syntax check on backend files:
```powershell
cd backend
node -c src/controllers/adminController.js
node -c src/controllers/eventController.js
node -c src/controllers/checkinController.js
node -c src/controllers/registrationController.js
node -c src/config/db.js
node -c src/db/schema.js
```
*Expected: Code 0, no syntax errors.*

### 6.2 Test Suite Execution
Run existing backend test suite:
```powershell
cd backend
npm test
```
*Expected: 100% test pass.*

### 6.3 Automated Multi-Admin Tenancy Isolation Tests
Add the following assertions in `backend/src/tests/api.test.js`:
1. Register `admin1@eventhub.com` (`event_admin`) and `admin2@eventhub.com` (`event_admin`).
2. Verify both have distinct `admin_id` starting with `ADM-`.
3. Create `Event 1` with Admin 1; create `Event 2` with Admin 2.
4. Register a guest to `Event 1` and a guest to `Event 2`.
5. Call `GET /api/admin/registrations` with Admin 1 token: returns ONLY Event 1 guest.
6. Call `GET /api/admin/registrations` with Admin 2 token: returns ONLY Event 2 guest.
7. Call `GET /api/admin/registrations` with Super Admin token: returns BOTH guests.
8. Call `PUT /api/events/:event1_id` with Admin 2 token: returns HTTP 403 Forbidden.
9. Call `DELETE /api/events/:event1_id` with Admin 2 token: returns HTTP 403 Forbidden.
10. Call `GET /api/checkin/events/:event1_id/attendance` with Admin 2 token: returns HTTP 403 Forbidden.
11. Call `GET /api/admin/dashboard` with Admin 1 token: reports `totalEvents: 1`, `totalRegistrations: 1`, `recentRegistrations` containing only Event 1 guest.

