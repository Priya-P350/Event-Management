process.env.DB_TYPE = 'sqlite';
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = '';

jest.mock('../config/resend', () => null);
jest.setTimeout(90000);

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const dbQuery = require('../config/db');
const { generateAdminId } = require('../utils/ticketToken');
const { jwtSecret } = require('../middleware/auth');

describe('Empirical Verification: Database Query Scoping, Exports, and Admin ID Edge Cases', () => {

    let superAdminToken = '';
    let superAdminUser = null;
    let organizerToken = '';
    let organizerUser = null;

    beforeAll(async () => {
        if (dbQuery.mode === 'mongodb') {
            await new Promise(r => setTimeout(r, 1200));
        }

        // Login seeded Super Admin
        const superRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@eventhub.com',
                password: 'Admin@123'
            });
        expect(superRes.statusCode).toEqual(200);
        superAdminToken = superRes.body.token;
        superAdminUser = superRes.body.user;

        // Login seeded Event Organizer
        const orgRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'organizer@eventhub.com',
                password: 'Admin@123'
            });
        expect(orgRes.statusCode).toEqual(200);
        organizerToken = orgRes.body.token;
        organizerUser = orgRes.body.user;
    }, 30000);

    // =========================================================================
    // 1. VERIFY BEHAVIOR WHEN AN ADMIN HAS ZERO EVENTS
    // =========================================================================
    describe('1. Admin with Zero Events Behavior & Query Scoping', () => {
        let zeroAdminToken = '';
        let zeroAdminUser = null;
        const timestamp = Date.now();
        const zeroAdminEmail = `zero_admin_${timestamp}@eventhub.com`;

        beforeAll(async () => {
            const regRes = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Zero Event Admin',
                    email: zeroAdminEmail,
                    phone: `+91 93${String(timestamp).slice(-8)}`,
                    password: 'Password123!',
                    role: 'event_admin'
                });
            expect(regRes.statusCode).toEqual(201);
            zeroAdminToken = regRes.body.token;
            zeroAdminUser = regRes.body.user;
        });

        it('1.1 GET /api/admin/dashboard returns zeroed metrics without crashing', async () => {
            const res = await request(app)
                .get('/api/admin/dashboard')
                .set('Authorization', `Bearer ${zeroAdminToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.stats).toBeDefined();
            expect(res.body.stats.totalEvents).toEqual(0);
            expect(res.body.stats.upcomingEvents).toEqual(0);
            expect(res.body.stats.totalRegistrations).toEqual(0);
            expect(res.body.stats.confirmedPayments).toEqual(0);
            expect(res.body.stats.checkedInCount).toEqual(0);
            expect(res.body.stats.totalRevenue).toEqual(0);
            expect(Array.isArray(res.body.stats.recentRegistrations)).toBe(true);
            expect(res.body.stats.recentRegistrations.length).toEqual(0);
        });

        it('1.2 GET /api/admin/registrations returns empty array', async () => {
            const res = await request(app)
                .get('/api/admin/registrations')
                .set('Authorization', `Bearer ${zeroAdminToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.count).toEqual(0);
            expect(Array.isArray(res.body.registrations)).toBe(true);
            expect(res.body.registrations.length).toEqual(0);
        });

        it('1.3 GET /api/admin/payments returns empty array without SQL error', async () => {
            const res = await request(app)
                .get('/api/admin/payments')
                .set('Authorization', `Bearer ${zeroAdminToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.count).toEqual(0);
            expect(Array.isArray(res.body.payments)).toBe(true);
            expect(res.body.payments.length).toEqual(0);
        });

        it('1.4 GET /api/admin/attendance returns empty array', async () => {
            const res = await request(app)
                .get('/api/admin/attendance')
                .set('Authorization', `Bearer ${zeroAdminToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.count).toEqual(0);
            expect(Array.isArray(res.body.attendance)).toBe(true);
            expect(res.body.attendance.length).toEqual(0);
        });

        it('1.5 GET /api/admin/export/registrations returns CSV with headers only (no rows)', async () => {
            const res = await request(app)
                .get('/api/admin/export/registrations')
                .set('Authorization', `Bearer ${zeroAdminToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.headers['content-type']).toMatch(/text\/csv/);
            expect(res.headers['content-disposition']).toContain('attachment; filename="registrations_export.csv"');

            const lines = res.text.trim().split('\n');
            expect(lines.length).toEqual(1);
            expect(lines[0]).toEqual('registration_number,guest_name,guest_email,guest_phone,event_title,registration_status,created_at');
        });

        it('1.6 GET /api/admin/export/payments returns CSV with headers only (no rows)', async () => {
            const res = await request(app)
                .get('/api/admin/export/payments')
                .set('Authorization', `Bearer ${zeroAdminToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.headers['content-type']).toMatch(/text\/csv/);
            expect(res.headers['content-disposition']).toContain('attachment; filename="payments_export.csv"');

            const lines = res.text.trim().split('\n');
            expect(lines.length).toEqual(1);
            expect(lines[0]).toEqual('razorpay_order_id,razorpay_payment_id,guest_name,guest_email,event_title,amount,currency,status,paid_at');
        });

        it('1.7 Direct dbQuery functions handle zero events gracefully without inArray SQL crash', async () => {
            const regs = await dbQuery.getAllRegistrations(zeroAdminUser.id);
            expect(Array.isArray(regs)).toBe(true);
            expect(regs.length).toEqual(0);

            const pays = await dbQuery.getAllPayments(zeroAdminUser.id);
            expect(Array.isArray(pays)).toBe(true);
            expect(pays.length).toEqual(0);

            const atts = await dbQuery.getAllAttendance(zeroAdminUser.id);
            expect(Array.isArray(atts)).toBe(true);
            expect(atts.length).toEqual(0);

            const stats = await dbQuery.getDashboardStats(zeroAdminUser.id);
            expect(stats.totalEvents).toEqual(0);
            expect(stats.totalRegistrations).toEqual(0);
            expect(stats.totalRevenue).toEqual(0);
            expect(stats.recentRegistrations.length).toEqual(0);
        });

        it('1.8 Admin with 1 event but ZERO registrations does not crash in getAllPayments or getDashboardStats', async () => {
            // Create an event for zeroAdminUser
            const createEventRes = await request(app)
                .post('/api/events')
                .set('Authorization', `Bearer ${zeroAdminToken}`)
                .send({
                    title: `Single Event Zero Regs ${timestamp}`,
                    description: 'Testing 0 registrations edge case in payment queries',
                    category: 'Workshop',
                    event_date: '2026-12-15',
                    start_time: '14:00:00',
                    end_time: '16:00:00',
                    venue: 'Innovation Lab',
                    address: 'Suite 404, Tech Park',
                    ticket_price: 250,
                    capacity: 50,
                    status: 'registration_open'
                });
            expect(createEventRes.statusCode).toEqual(201);

            // Dashboard should show 1 event, but 0 registrations, 0 revenue
            const dashRes = await request(app)
                .get('/api/admin/dashboard')
                .set('Authorization', `Bearer ${zeroAdminToken}`);
            expect(dashRes.statusCode).toEqual(200);
            expect(dashRes.body.stats.totalEvents).toEqual(1);
            expect(dashRes.body.stats.totalRegistrations).toEqual(0);
            expect(dashRes.body.stats.totalRevenue).toEqual(0);
            expect(dashRes.body.stats.recentRegistrations.length).toEqual(0);

            // Payments should return empty array (crucial test: inArray on empty registrationIds must not fail)
            const payRes = await request(app)
                .get('/api/admin/payments')
                .set('Authorization', `Bearer ${zeroAdminToken}`);
            expect(payRes.statusCode).toEqual(200);
            expect(payRes.body.payments.length).toEqual(0);

            // CSV export for payments should return headers only
            const payCsvRes = await request(app)
                .get('/api/admin/export/payments')
                .set('Authorization', `Bearer ${zeroAdminToken}`);
            expect(payCsvRes.statusCode).toEqual(200);
            const csvLines = payCsvRes.text.trim().split('\n');
            expect(csvLines.length).toEqual(1);
        });
    });

    // =========================================================================
    // 2. VERIFY CSV EXPORTS FOR REGISTRATIONS AND PAYMENTS ARE STRICTLY SCORED
    // =========================================================================
    describe('2. Multi-Tenant CSV Exports Scoping (Registrations & Payments)', () => {
        let adminXToken = '';
        let adminYToken = '';
        let eventXId = '';
        let eventYId = '';
        const timestamp = Date.now();

        const guestXEmail = `guest_x_${timestamp}@corp.example.com`;
        const guestYEmail = `guest_y_${timestamp}@firm.example.com`;
        const guestXName = `Guest X "The Leader"`;
        const guestYName = `Guest Y, Senior Director`;

        beforeAll(async () => {
            // Register Admin X
            const regX = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Admin X-Corp',
                    email: `admin_x_${timestamp}@eventhub.com`,
                    phone: `+91 94${String(timestamp).slice(-8)}`,
                    password: 'Password123!',
                    role: 'event_admin'
                });
            expect(regX.statusCode).toEqual(201);
            adminXToken = regX.body.token;

            // Register Admin Y
            const regY = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Admin Y-Tech',
                    email: `admin_y_${timestamp}@eventhub.com`,
                    phone: `+91 95${String(timestamp).slice(-8)}`,
                    password: 'Password123!',
                    role: 'event_admin'
                });
            expect(regY.statusCode).toEqual(201);
            adminYToken = regY.body.token;

            // Create Event X
            const evtXRes = await request(app)
                .post('/api/events')
                .set('Authorization', `Bearer ${adminXToken}`)
                .send({
                    title: `Exclusive X Summit ${timestamp}`,
                    description: 'Admin X Summit',
                    category: 'Conference',
                    event_date: '2026-11-20',
                    start_time: '09:00:00',
                    end_time: '17:00:00',
                    venue: 'Hall X',
                    address: '100 X Street',
                    ticket_price: 0,
                    capacity: 100,
                    status: 'registration_open'
                });
            expect(evtXRes.statusCode).toEqual(201);
            eventXId = evtXRes.body.event.id || evtXRes.body.event._id;

            // Create Event Y
            const evtYRes = await request(app)
                .post('/api/events')
                .set('Authorization', `Bearer ${adminYToken}`)
                .send({
                    title: `Exclusive Y Expo ${timestamp}`,
                    description: 'Admin Y Expo',
                    category: 'ITI Trade Fair',
                    event_date: '2026-11-22',
                    start_time: '10:00:00',
                    end_time: '18:00:00',
                    venue: 'Hall Y',
                    address: '200 Y Avenue',
                    ticket_price: 0,
                    capacity: 100,
                    status: 'registration_open'
                });
            expect(evtYRes.statusCode).toEqual(201);
            eventYId = evtYRes.body.event.id || evtYRes.body.event._id;

            // Guest X registers for Event X (with quotes in name to stress CSV escaping)
            const guestXRes = await request(app)
                .post('/api/registrations')
                .send({
                    eventId: eventXId,
                    name: guestXName,
                    email: guestXEmail,
                    phone: '+91 9888800001'
                });
            expect(guestXRes.statusCode).toEqual(201);

            // Guest Y registers for Event Y (with comma in name to stress CSV escaping)
            const guestYRes = await request(app)
                .post('/api/registrations')
                .send({
                    eventId: eventYId,
                    name: guestYName,
                    email: guestYEmail,
                    phone: '+91 9888800002'
                });
            expect(guestYRes.statusCode).toEqual(201);
        }, 80000);

        it('2.1 Registrations CSV Export is strictly isolated between Admin X and Admin Y', async () => {
            // Admin X Export
            const exportXRes = await request(app)
                .get('/api/admin/export/registrations')
                .set('Authorization', `Bearer ${adminXToken}`);
            expect(exportXRes.statusCode).toEqual(200);
            expect(exportXRes.headers['content-type']).toMatch(/text\/csv/);
            expect(exportXRes.text).toContain(guestXEmail);
            expect(exportXRes.text).not.toContain(guestYEmail);
            expect(exportXRes.text).toContain(`Exclusive X Summit ${timestamp}`);
            expect(exportXRes.text).not.toContain(`Exclusive Y Expo ${timestamp}`);

            // Admin Y Export
            const exportYRes = await request(app)
                .get('/api/admin/export/registrations')
                .set('Authorization', `Bearer ${adminYToken}`);
            expect(exportYRes.statusCode).toEqual(200);
            expect(exportYRes.headers['content-type']).toMatch(/text\/csv/);
            expect(exportYRes.text).toContain(guestYEmail);
            expect(exportYRes.text).not.toContain(guestXEmail);
            expect(exportYRes.text).toContain(`Exclusive Y Expo ${timestamp}`);
            expect(exportYRes.text).not.toContain(`Exclusive X Summit ${timestamp}`);
        });

        it('2.2 Payments CSV Export is strictly isolated between Admin X and Admin Y', async () => {
            // Admin X Payments Export
            const payExportXRes = await request(app)
                .get('/api/admin/export/payments')
                .set('Authorization', `Bearer ${adminXToken}`);
            expect(payExportXRes.statusCode).toEqual(200);
            expect(payExportXRes.headers['content-type']).toMatch(/text\/csv/);
            expect(payExportXRes.text).toContain(guestXEmail);
            expect(payExportXRes.text).not.toContain(guestYEmail);
            expect(payExportXRes.text).toContain(`Exclusive X Summit ${timestamp}`);
            expect(payExportXRes.text).not.toContain(`Exclusive Y Expo ${timestamp}`);

            // Admin Y Payments Export
            const payExportYRes = await request(app)
                .get('/api/admin/export/payments')
                .set('Authorization', `Bearer ${adminYToken}`);
            expect(payExportYRes.statusCode).toEqual(200);
            expect(payExportYRes.headers['content-type']).toMatch(/text\/csv/);
            expect(payExportYRes.text).toContain(guestYEmail);
            expect(payExportYRes.text).not.toContain(guestXEmail);
            expect(payExportYRes.text).toContain(`Exclusive Y Expo ${timestamp}`);
            expect(payExportYRes.text).not.toContain(`Exclusive X Summit ${timestamp}`);
        });

        it('2.3 Super Admin export contains records from both Admin X and Admin Y', async () => {
            const superRegCsv = await request(app)
                .get('/api/admin/export/registrations')
                .set('Authorization', `Bearer ${superAdminToken}`);
            expect(superRegCsv.statusCode).toEqual(200);
            expect(superRegCsv.text).toContain(guestXEmail);
            expect(superRegCsv.text).toContain(guestYEmail);

            const superPayCsv = await request(app)
                .get('/api/admin/export/payments')
                .set('Authorization', `Bearer ${superAdminToken}`);
            expect(superPayCsv.statusCode).toEqual(200);
            expect(superPayCsv.text).toContain(guestXEmail);
            expect(superPayCsv.text).toContain(guestYEmail);
        });

        it('2.4 Query parameter token authentication (?token=...) works and retains tenant scoping', async () => {
            // Download registrations CSV via query param
            const queryRegRes = await request(app)
                .get(`/api/admin/export/registrations?token=${adminXToken}`);
            expect(queryRegRes.statusCode).toEqual(200);
            expect(queryRegRes.headers['content-type']).toMatch(/text\/csv/);
            expect(queryRegRes.text).toContain(guestXEmail);
            expect(queryRegRes.text).not.toContain(guestYEmail);

            // Download payments CSV via query param
            const queryPayRes = await request(app)
                .get(`/api/admin/export/payments?token=${adminXToken}`);
            expect(queryPayRes.statusCode).toEqual(200);
            expect(queryPayRes.headers['content-type']).toMatch(/text\/csv/);
            expect(queryPayRes.text).toContain(guestXEmail);
            expect(queryPayRes.text).not.toContain(guestYEmail);

            // Rejection on invalid token
            const invalidRes = await request(app)
                .get('/api/admin/export/registrations?token=invalid_forged_token');
            expect(invalidRes.statusCode).toEqual(403);

            // Rejection on missing token
            const missingRes = await request(app)
                .get('/api/admin/export/registrations');
            expect(missingRes.statusCode).toEqual(401);
        });

        it('2.5 CSV safely escapes characters like quotes and commas without breaking column structure', async () => {
            const exportXRes = await request(app)
                .get('/api/admin/export/registrations')
                .set('Authorization', `Bearer ${adminXToken}`);
            expect(exportXRes.statusCode).toEqual(200);

            // Quotes inside guestXName: Guest X "The Leader" should be escaped as ""
            expect(exportXRes.text).toContain('Guest X ""The Leader""');

            const exportYRes = await request(app)
                .get('/api/admin/export/registrations')
                .set('Authorization', `Bearer ${adminYToken}`);
            expect(exportYRes.statusCode).toEqual(200);

            // Comma in name: Guest Y, Senior Director should be enclosed in quotes
            expect(exportYRes.text).toContain('"Guest Y, Senior Director"');
        });
    });

    // =========================================================================
    // 3. VERIFY admin_id FORMAT (ADM-2026-XXXXXX) AND SEEDED ADMINS
    // =========================================================================
    describe('3. Admin ID Format Compliance & Seeded Identifiers', () => {

        it('3.1 Seeded Super Admin possesses ADM-0001 in DB, Login, and JWT Token', async () => {
            // Verify in user response from login
            expect(superAdminUser.admin_id).toEqual('ADM-0001');

            // Verify in decoded JWT payload
            const decoded = jwt.verify(superAdminToken, jwtSecret);
            expect(decoded.admin_id).toEqual('ADM-0001');
            expect(decoded.role).toEqual('super_admin');

            // Verify via GET /api/auth/me
            const meRes = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${superAdminToken}`);
            expect(meRes.statusCode).toEqual(200);
            expect(meRes.body.user.admin_id).toEqual('ADM-0001');

            // Verify directly in DB
            const dbSuperUser = await dbQuery.findUserByEmail('admin@eventhub.com');
            expect(dbSuperUser.admin_id || dbSuperUser.adminId).toEqual('ADM-0001');
        });

        it('3.2 Seeded Event Organizer possesses ADM-0002 in DB, Login, and JWT Token', async () => {
            // Verify in user response from login
            expect(organizerUser.admin_id).toEqual('ADM-0002');

            // Verify in decoded JWT payload
            const decoded = jwt.verify(organizerToken, jwtSecret);
            expect(decoded.admin_id).toEqual('ADM-0002');
            expect(decoded.role).toEqual('event_admin');

            // Verify via GET /api/auth/me
            const meRes = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${organizerToken}`);
            expect(meRes.statusCode).toEqual(200);
            expect(meRes.body.user.admin_id).toEqual('ADM-0002');

            // Verify directly in DB
            const dbOrgUser = await dbQuery.findUserByEmail('organizer@eventhub.com');
            expect(dbOrgUser.admin_id || dbOrgUser.adminId).toEqual('ADM-0002');
        });

        it('3.3 Newly registered event admin accounts receive ADM-2026-XXXXXX matching regex', async () => {
            const timestamp = Date.now();
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'New Formatted Admin',
                    email: `formatted_admin_${timestamp}@eventhub.com`,
                    phone: `+91 96${String(timestamp).slice(-8)}`,
                    password: 'Password123!',
                    role: 'event_admin'
                });

            expect(res.statusCode).toEqual(201);
            const user = res.body.user;
            expect(user.admin_id).toBeDefined();
            expect(user.admin_id).toMatch(/^ADM-2026-\d{6}$/);
            expect(user.admin_id.length).toEqual(15);

            // JWT must also carry the exact admin_id
            const decoded = jwt.verify(res.body.token, jwtSecret);
            expect(decoded.admin_id).toEqual(user.admin_id);
        });

        it('3.4 Admin accounts created via POST /api/admin/users receive ADM-2026-XXXXXX', async () => {
            const timestamp = Date.now();
            const res = await request(app)
                .post('/api/admin/users')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({
                    name: 'Created Admin User',
                    email: `created_admin_${timestamp}@eventhub.com`,
                    phone: `+91 97${String(timestamp).slice(-8)}`,
                    password: 'Password123!',
                    role: 'event_admin'
                });

            expect(res.statusCode).toEqual(201);
            const user = res.body.user;
            expect(user.admin_id).toBeDefined();
            expect(user.admin_id).toMatch(/^ADM-2026-\d{6}$/);
            expect(user.admin_id.length).toEqual(15);
        });

        it('3.5 Non-admin accounts (guest, scanner_staff) do NOT receive an admin_id', async () => {
            const timestamp = Date.now();

            // Guest
            const guestRes = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Normal Guest',
                    email: `guest_noadmin_${timestamp}@example.com`,
                    phone: `+91 98${String(timestamp).slice(-8)}`,
                    password: 'Password123!',
                    role: 'guest'
                });
            expect(guestRes.statusCode).toEqual(201);
            expect(guestRes.body.user.admin_id).toBeFalsy();

            // Scanner Staff
            const staffRes = await request(app)
                .post('/api/admin/users')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({
                    name: 'Gate Scanner Staff',
                    email: `staff_noadmin_${timestamp}@eventhub.com`,
                    phone: `+91 99${String(timestamp).slice(-8)}`,
                    password: 'Password123!',
                    role: 'scanner_staff'
                });
            expect(staffRes.statusCode).toEqual(201);
            expect(staffRes.body.user.admin_id).toBeFalsy();
        });

        it('3.6 Statistical stress harness: generateAdminId() 10,000 iterations verifies 100% regex match', () => {
            const sampleSize = 10000;
            const generatedIds = new Set();
            const regex = /^ADM-2026-\d{6}$/;

            for (let i = 0; i < sampleSize; i++) {
                const id = generateAdminId();
                expect(regex.test(id)).toBe(true);
                expect(id.length).toBe(15);

                const numPart = parseInt(id.replace('ADM-2026-', ''), 10);
                expect(isNaN(numPart)).toBe(false);
                expect(numPart).toBeGreaterThanOrEqual(100000);
                expect(numPart).toBeLessThanOrEqual(999999);

                generatedIds.add(id);
            }

            // In 10,000 uniformly random draws from 900,000 numbers:
            // Expected unique items > 9,800 (high entropy)
            expect(generatedIds.size).toBeGreaterThan(9800);
        });
    });
});

afterAll(async () => {
    const mongoose = require('mongoose');
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
    }
    if (dbQuery.sqliteDb) {
        try { dbQuery.sqliteDb.close(); } catch (e) {}
    }
}, 10000);
