const request = require('supertest');
const app = require('../server');

describe('Event Management & QR Ticket REST APIs', () => {

    let authToken = '';

    beforeAll(async () => {
        const dbQuery = require('../config/db');
        const tk = await dbQuery.getTicketByToken('EVT-TK-9a8b7c6d5e4f3a2b1c0d');
        if (tk && dbQuery.mode === 'sqlite') {
            dbQuery.sqliteDb.prepare("DELETE FROM attendance WHERE ticket_id = ?").run(tk.id);
            dbQuery.sqliteDb.prepare("UPDATE tickets SET status = 'active' WHERE id = ?").run(tk.id);
        }
    });

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
