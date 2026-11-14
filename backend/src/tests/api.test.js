process.env.DB_TYPE = 'sqlite';
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = '';

jest.mock('../config/resend', () => null);
jest.setTimeout(30000);

const request = require('supertest');
const app = require('../server');

describe('Event Management & QR Ticket REST APIs', () => {

    let authToken = '';

    beforeAll(async () => {
        const dbQuery = require('../config/db');
        // Give connection a brief moment if asynchronous
        if (dbQuery.mode === 'mongodb') {
            await new Promise(r => setTimeout(r, 1200));
        }
        const tk = await dbQuery.getTicketByToken('EVT-TK-9a8b7c6d5e4f3a2b1c0d');
        if (tk) {
            if (dbQuery.mode === 'mongodb') {
                await dbQuery.mongoModels.Attendance.deleteOne({ ticket_id: tk.id });
                await dbQuery.mongoModels.Ticket.updateOne({ _id: tk.id }, { status: 'active' });
            } else if (dbQuery.mode === 'sqlite') {
                dbQuery.sqliteDb.prepare("DELETE FROM attendance WHERE ticket_id = ?").run(tk.id);
                dbQuery.sqliteDb.prepare("UPDATE tickets SET status = 'active' WHERE id = ?").run(tk.id);
            }
        }
    }, 25000);

    it('GET /api/health - should return OK status', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('OK');
    });

    it('POST /api/auth/login - should authenticate admin and return JWT', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@eventhub.com',
                password: 'Admin@123'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.token).toBeDefined();
        authToken = res.body.token;
    });

    it('GET /api/events - should return array of seeded events', async () => {
        const res = await request(app).get('/api/events');
        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.events)).toBe(true);
        expect(res.body.events.length).toBeGreaterThan(0);
    });

    it('POST /api/checkin/scan - valid seeded active ticket should approve entry', async () => {
        const res = await request(app)
            .post('/api/checkin/scan')
            .send({
                ticketToken: 'EVT-TK-9a8b7c6d5e4f3a2b1c0d',
                eventId: 'a1111111-1111-1111-1111-111111111111'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.code).toEqual('ENTRY_APPROVED');
    });

    it('POST /api/checkin/scan - duplicate scan of same ticket should return ALREADY_USED', async () => {
        const res = await request(app)
            .post('/api/checkin/scan')
            .send({
                ticketToken: 'EVT-TK-9a8b7c6d5e4f3a2b1c0d',
                eventId: 'a1111111-1111-1111-1111-111111111111'
            });

        expect(res.statusCode).toEqual(409);
        expect(res.body.success).toBe(false);
        expect(res.body.code).toEqual('ALREADY_USED');
    });

    it('GET /api/admin/dashboard - should return admin metrics for authorized super_admin', async () => {
        const res = await request(app)
            .get('/api/admin/dashboard')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.stats.totalEvents).toBeGreaterThan(0);
    });

    it('GET /api/admin/dashboard - should deny access without JWT token', async () => {
        const res = await request(app).get('/api/admin/dashboard');
        expect(res.statusCode).toEqual(401);
    });

    it('POST /api/auth/register - should allow creating account as any role', async () => {
        const testEmail = `organizer_${Date.now()}@eventhub.com`;
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test Organizer',
                email: testEmail,
                phone: '+91 9998887776',
                password: 'Password123!',
                role: 'event_admin'
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.success).toBe(true);
        expect(res.body.user.role).toEqual('event_admin');
    });

    it('GET /api/admin/users - should return list of all users for admin', async () => {
        const res = await request(app)
            .get('/api/admin/users')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.users)).toBe(true);
        expect(res.body.users.length).toBeGreaterThan(0);
    });

    it('PUT /api/admin/users/:id/role - should update user role', async () => {
        // Fetch users first
        const usersRes = await request(app)
            .get('/api/admin/users')
            .set('Authorization', `Bearer ${authToken}`);

        const targetUser = usersRes.body.users.find(u => u.role !== 'super_admin') || usersRes.body.users[0];
        expect(targetUser).toBeDefined();

        const updateRes = await request(app)
            .put(`/api/admin/users/${targetUser.id}/role`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ role: 'scanner_staff' });

        expect(updateRes.statusCode).toEqual(200);
        expect(updateRes.body.success).toBe(true);
    });

    it('POST /api/qr/generate - should generate unique QR code and prepare email delivery', async () => {
        const res = await request(app)
            .post('/api/qr/generate')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toEqual(201);
        expect(res.body.success).toBe(true);
        expect(res.body.qrCode).toBeDefined();
        expect(res.body.qrCode.secureToken).toMatch(/^QR-TOKEN-/);
    }, 15000);
});

describe('R3: Multi-Admin Tenancy & Strict Data Isolation', () => {
    let superAdminToken = '';
    let adminAToken = '';
    let adminBToken = '';
    let adminAUser = null;
    let adminBUser = null;
    let eventAId = '';
    let eventBId = '';
    let registrationAId = '';
    let registrationBId = '';

    const timestamp = Date.now();
    const adminAEmail = `admin_alpha_${timestamp}@eventhub.com`;
    const adminBEmail = `admin_beta_${timestamp}@eventhub.com`;
    const guestAEmail = `guest_alpha_${timestamp}@example.com`;
    const guestBEmail = `guest_beta_${timestamp}@example.com`;

    beforeAll(async () => {
        // 1. Login seeded Super Admin
        const superRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@eventhub.com',
                password: 'Admin@123'
            });
        expect(superRes.statusCode).toEqual(200);
        superAdminToken = superRes.body.token;

        // 2. Register Admin A (Event Admin)
        const regARes = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Admin Alpha',
                email: adminAEmail,
                phone: `+91 91${String(timestamp).slice(-8)}`,
                password: 'Password123!',
                role: 'event_admin'
            });
        expect(regARes.statusCode).toEqual(201);
        expect(regARes.body.success).toBe(true);
        adminAToken = regARes.body.token;
        adminAUser = regARes.body.user;

        // 3. Register Admin B (Event Admin)
        const regBRes = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Admin Beta',
                email: adminBEmail,
                phone: `+91 92${String(timestamp).slice(-8)}`,
                password: 'Password123!',
                role: 'event_admin'
            });
        expect(regBRes.statusCode).toEqual(201);
        expect(regBRes.body.success).toBe(true);
        adminBToken = regBRes.body.token;
        adminBUser = regBRes.body.user;
    }, 35000);

    it('1. Unique Admin Identifier: Admin accounts must possess distinct unique admin_id format', async () => {
        expect(adminAUser.admin_id).toBeDefined();
        expect(adminBUser.admin_id).toBeDefined();

        expect(adminAUser.admin_id).toMatch(/^ADM-/);
        expect(adminBUser.admin_id).toMatch(/^ADM-/);

        expect(adminAUser.admin_id).not.toEqual(adminBUser.admin_id);

        const loginARes = await request(app)
            .post('/api/auth/login')
            .send({
                email: adminAEmail,
                password: 'Password123!'
            });
        expect(loginARes.statusCode).toEqual(200);
        expect(loginARes.body.user.admin_id).toEqual(adminAUser.admin_id);

        const superLoginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@eventhub.com',
                password: 'Admin@123'
            });
        expect(superLoginRes.statusCode).toEqual(200);
        expect(superLoginRes.body.user.admin_id).toEqual('ADM-0001');
    }, 25000);

    it('2. Event Creation: Admin A and Admin B create separate events', async () => {
        const resA = await request(app)
            .post('/api/events')
            .set('Authorization', `Bearer ${adminAToken}`)
            .send({
                title: `Alpha Tech Summit ${timestamp}`,
                description: 'Organized exclusively by Admin Alpha',
                category: 'Tech Summit',
                event_date: '2026-11-25',
                start_time: '10:00:00',
                end_time: '18:00:00',
                venue: 'Alpha Convention Hall',
                address: '100 Innovation Way, Cyber City',
                ticket_price: 0,
                capacity: 100,
                status: 'registration_open'
            });
        expect(resA.statusCode).toEqual(201);
        expect(resA.body.success).toBe(true);
        eventAId = resA.body.event.id || resA.body.event._id;
        expect(eventAId).toBeDefined();

        const resB = await request(app)
            .post('/api/events')
            .set('Authorization', `Bearer ${adminBToken}`)
            .send({
                title: `Beta Trade Expo ${timestamp}`,
                description: 'Organized exclusively by Admin Beta',
                category: 'ITI Trade Fair',
                event_date: '2026-12-05',
                start_time: '09:00:00',
                end_time: '17:00:00',
                venue: 'Beta Exhibition Center',
                address: '200 Industrial Park, Metro Hub',
                ticket_price: 0,
                capacity: 200,
                status: 'registration_open'
            });
        expect(resB.statusCode).toEqual(201);
        expect(resB.body.success).toBe(true);
        eventBId = resB.body.event.id || resB.body.event._id;
        expect(eventBId).toBeDefined();
    });

    it('3. Guest Registration: Guests register for Event A and Event B', async () => {
        const regARes = await request(app)
            .post('/api/registrations')
            .send({
                eventId: eventAId,
                name: 'Guest Alpha Attendee',
                email: guestAEmail,
                phone: '+91 9888811111',
                customAnswers: { note: 'Alpha delegate' }
            });
        expect(regARes.statusCode).toEqual(201);
        expect(regARes.body.success).toBe(true);
        expect(regARes.body.isFree).toBe(true);
        registrationAId = regARes.body.registrationId || (regARes.body.registration && (regARes.body.registration.id || regARes.body.registration._id));
        expect(registrationAId).toBeDefined();

        const regBRes = await request(app)
            .post('/api/registrations')
            .send({
                eventId: eventBId,
                name: 'Guest Beta Attendee',
                email: guestBEmail,
                phone: '+91 9777722222',
                customAnswers: { note: 'Beta delegate' }
            });
        expect(regBRes.statusCode).toEqual(201);
        expect(regBRes.body.success).toBe(true);
        expect(regBRes.body.isFree).toBe(true);
        registrationBId = regBRes.body.registrationId || (regBRes.body.registration && (regBRes.body.registration.id || regBRes.body.registration._id));
        expect(registrationBId).toBeDefined();
    });

    it('4. Scoped Dashboard Check: Admin A sees only Event A, Admin B sees only Event B, Super Admin sees both', async () => {
        const dashARes = await request(app)
            .get('/api/admin/dashboard')
            .set('Authorization', `Bearer ${adminAToken}`);
        expect(dashARes.statusCode).toEqual(200);
        expect(dashARes.body.success).toBe(true);

        const recentAEmails = (dashARes.body.stats.recentRegistrations || []).map(r => r.guest_email || r.guestEmail);
        expect(recentAEmails).toContain(guestAEmail);
        expect(recentAEmails).not.toContain(guestBEmail);

        const dashBRes = await request(app)
            .get('/api/admin/dashboard')
            .set('Authorization', `Bearer ${adminBToken}`);
        expect(dashBRes.statusCode).toEqual(200);
        expect(dashBRes.body.success).toBe(true);

        const recentBEmails = (dashBRes.body.stats.recentRegistrations || []).map(r => r.guest_email || r.guestEmail);
        expect(recentBEmails).toContain(guestBEmail);
        expect(recentBEmails).not.toContain(guestAEmail);

        const dashSuperRes = await request(app)
            .get('/api/admin/dashboard')
            .set('Authorization', `Bearer ${superAdminToken}`);
        expect(dashSuperRes.statusCode).toEqual(200);
        expect(dashSuperRes.body.stats.totalEvents).toBeGreaterThanOrEqual(2);
    });

    it('5. Scoped Registrations List: Admin A sees only Event A attendees, Admin B sees only Event B attendees, Super Admin sees all', async () => {
        const listARes = await request(app)
            .get('/api/admin/registrations')
            .set('Authorization', `Bearer ${adminAToken}`);
        expect(listARes.statusCode).toEqual(200);
        const listAEmails = listARes.body.registrations.map(r => r.guest_email);
        expect(listAEmails).toContain(guestAEmail);
        expect(listAEmails).not.toContain(guestBEmail);

        const listBRes = await request(app)
            .get('/api/admin/registrations')
            .set('Authorization', `Bearer ${adminBToken}`);
        expect(listBRes.statusCode).toEqual(200);
        const listBEmails = listBRes.body.registrations.map(r => r.guest_email);
        expect(listBEmails).toContain(guestBEmail);
        expect(listBEmails).not.toContain(guestAEmail);

        const listSuperRes = await request(app)
            .get('/api/admin/registrations')
            .set('Authorization', `Bearer ${superAdminToken}`);
        expect(listSuperRes.statusCode).toEqual(200);
        const superEmails = listSuperRes.body.registrations.map(r => r.guest_email);
        expect(superEmails).toContain(guestAEmail);
        expect(superEmails).toContain(guestBEmail);
    });

    it('6. Scoped CSV Export: Admin A export contains only Event A attendees, Admin B contains only Event B', async () => {
        const exportARes = await request(app)
            .get('/api/admin/export/registrations')
            .set('Authorization', `Bearer ${adminAToken}`);
        expect(exportARes.statusCode).toEqual(200);
        expect(exportARes.headers['content-type']).toMatch(/text\/csv/);
        expect(exportARes.text).toContain(guestAEmail);
        expect(exportARes.text).not.toContain(guestBEmail);

        const exportBRes = await request(app)
            .get('/api/admin/export/registrations')
            .set('Authorization', `Bearer ${adminBToken}`);
        expect(exportBRes.statusCode).toEqual(200);
        expect(exportBRes.headers['content-type']).toMatch(/text\/csv/);
        expect(exportBRes.text).toContain(guestBEmail);
        expect(exportBRes.text).not.toContain(guestAEmail);
    });

    it('7. Cross-Organizer Mutation Protection: Admin B attempting PUT or DELETE on Event A receives 403 Forbidden', async () => {
        const putRes = await request(app)
            .put(`/api/events/${eventAId}`)
            .set('Authorization', `Bearer ${adminBToken}`)
            .send({ title: 'Hacked Title by Admin Beta' });
        expect(putRes.statusCode).toEqual(403);
        expect(putRes.body.success).toBe(false);

        const delRes = await request(app)
            .delete(`/api/events/${eventAId}`)
            .set('Authorization', `Bearer ${adminBToken}`);
        expect(delRes.statusCode).toEqual(403);
        expect(delRes.body.success).toBe(false);

        const getRes = await request(app).get(`/api/events/${eventAId}`);
        expect(getRes.statusCode).toEqual(200);
        expect(getRes.body.event.title).toEqual(`Alpha Tech Summit ${timestamp}`);
        expect(getRes.body.event.status).toEqual('registration_open');

        const updateARes = await request(app)
            .put(`/api/events/${eventAId}`)
            .set('Authorization', `Bearer ${adminAToken}`)
            .send({ title: `Alpha Tech Summit ${timestamp} - Updated` });
        expect(updateARes.statusCode).toEqual(200);
        expect(updateARes.body.success).toBe(true);

        const superUpdateRes = await request(app)
            .put(`/api/events/${eventAId}`)
            .set('Authorization', `Bearer ${superAdminToken}`)
            .send({ title: `Alpha Tech Summit ${timestamp} - Verified by SuperAdmin` });
        expect(superUpdateRes.statusCode).toEqual(200);
        expect(superUpdateRes.body.success).toBe(true);
    });

    it('8. Cross-Organizer Attendance Protection: Admin B requesting Event A attendance receives 403 Forbidden', async () => {
        const attBRes = await request(app)
            .get(`/api/checkin/events/${eventAId}/attendance`)
            .set('Authorization', `Bearer ${adminBToken}`);
        expect(attBRes.statusCode).toEqual(403);
        expect(attBRes.body.success).toBe(false);

        const attARes = await request(app)
            .get(`/api/checkin/events/${eventAId}/attendance`)
            .set('Authorization', `Bearer ${adminAToken}`);
        expect(attARes.statusCode).toEqual(200);
        expect(attARes.body.success).toBe(true);

        const attSuperRes = await request(app)
            .get(`/api/checkin/events/${eventAId}/attendance`)
            .set('Authorization', `Bearer ${superAdminToken}`);
        expect(attSuperRes.statusCode).toEqual(200);
        expect(attSuperRes.body.success).toBe(true);
    });

    it('9. Registration Detail Scoping: Unauthorized admins cannot view registration, owner and creator can', async () => {
        // Admin B attempts to access Registration A -> 403 Forbidden
        const regDetailBRes = await request(app)
            .get(`/api/registrations/${registrationAId}`)
            .set('Authorization', `Bearer ${adminBToken}`);
        expect(regDetailBRes.statusCode).toEqual(403);
        expect(regDetailBRes.body.success).toBe(false);

        // Unauthenticated request -> 401 Unauthorized
        const regDetailNoAuth = await request(app)
            .get(`/api/registrations/${registrationAId}`);
        expect(regDetailNoAuth.statusCode).toEqual(401);

        // Admin A (Event Creator) -> 200 OK
        const regDetailARes = await request(app)
            .get(`/api/registrations/${registrationAId}`)
            .set('Authorization', `Bearer ${adminAToken}`);
        expect(regDetailARes.statusCode).toEqual(200);
        expect(regDetailARes.body.success).toBe(true);
        expect(regDetailARes.body.registration.guest_email).toEqual(guestAEmail);

        // Super Admin -> 200 OK
        const regDetailSuperRes = await request(app)
            .get(`/api/registrations/${registrationAId}`)
            .set('Authorization', `Bearer ${superAdminToken}`);
        expect(regDetailSuperRes.statusCode).toEqual(200);
        expect(regDetailSuperRes.body.success).toBe(true);
    });
});

afterAll(async () => {
    const mongoose = require('mongoose');
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
    }
    const dbQuery = require('../config/db');
    if (dbQuery.sqliteDb) {
        try { dbQuery.sqliteDb.close(); } catch (e) {}
    }
}, 10000);
