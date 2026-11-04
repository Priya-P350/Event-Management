# Automated Test Suite Design Report: R3 Multi-Admin Isolation & Test Reliability

**Agent**: `teamwork_explorer_m1_3`  
**Date**: 2026-11-04  
**Target Milestone**: Milestone 1 (Backend Admin Unique Identifier & Strict Data Isolation — Test Engineering)  
**Working Directory**: `c:\Users\priya\OneDrive\Desktop\QR\.agents\teamwork\teamwork_explorer_m1_3`  

---

## 1. Observation

### 1.1 Existing Test Suite Analysis in `backend/src/tests/api.test.js`
The current backend test suite is housed in `backend/src/tests/api.test.js` (159 lines) and executed via Jest 29.7.0 and Supertest 7.0.0.

1. **Test Runner Configuration** (`backend/package.json:11`):
   ```json
   "scripts": {
     "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js --detectOpenHandles --forceExit"
   }
   ```
2. **Current Test Coverage**:
   - `GET /api/health`: Health status check.
   - `POST /api/auth/login`: Authenticates seeded super-admin (`admin@eventhub.com` / `Admin@123`) and saves `authToken`.
   - `GET /api/events`: Fetches seeded events.
   - `POST /api/checkin/scan`: Validates entry with active ticket token `EVT-TK-9a8b7c6d5e4f3a2b1c0d`.
   - `POST /api/checkin/scan`: Validates 409 rejection on duplicate scan.
   - `GET /api/admin/dashboard`: Checks dashboard stats for `super_admin`.
   - `GET /api/admin/dashboard`: Verifies 401 Unauthorized without JWT.
   - `POST /api/auth/register`: Registers a generic organizer account (`organizer_${Date.now()}@eventhub.com`).
   - `GET /api/admin/users`: Verifies user list for `super_admin`.
   - `PUT /api/admin/users/:id/role`: Modifies user role to `scanner_staff`.
   - `POST /api/qr/generate`: Generates member QR code.

3. **Critical Deficiencies in Current Test Suite**:
   - **Zero Multi-Tenancy Tests**: Existing tests operate strictly using a single `super_admin` token (`admin@eventhub.com`). There are no assertions testing isolation between two separate event admins.
   - **No `admin_id` Format Verification**: There are no tests verifying that admin accounts receive a distinct, structured business identifier (e.g., `ADM-2026-XXXXXX` / `ADM-0001`).
   - **No Cross-Organizer Mutation Tests**: Neither `PUT /api/events/:id` nor `DELETE /api/events/:id` are tested for cross-admin authorization or 403 Forbidden rejections.
   - **No Scoped Attendance Tests**: `GET /api/checkin/events/:id/attendance` is not tested against non-owner event admins.
   - **No Scoped CSV Export Tests**: `GET /api/admin/export/registrations` and `/api/admin/export/payments` are completely untested.
   - **No Scoped Registration List Tests**: `GET /api/admin/registrations` is completely untested.

### 1.2 Build & Test Execution Failure Analysis
Running `npm test` produces an immediate failure with:
```
FAIL src/tests/api.test.js
  ● Test suite failed to run
    SyntaxError: C:\Users\priya\OneDrive\Desktop\QR\backend\src\controllers\adminController.js: Unexpected token (122:0)
      120 |   }
      121 | }
    > 122 | }
          | ^
      123 |
      124 | async function updateUserRole(req, res, next) {

Jest has detected the following 2 open handles potentially keeping Jest from exiting:
  ●  QUERYWRAP
      at resolveSRVRecord (node_modules/mongodb/src/connection_string.ts:85:32)
      at MongoClient._connect (node_modules/mongodb/src/mongo_client.ts:646:43)
      at Object.connect [as connectMongo] (src/config/mongo.js:16:24)
      at Object.connectMongo (src/config/db.js:34:11)
      at Object.require (src/controllers/authController.js:4:17)
      at Object.require (src/routes/authRoutes.js:3:24)
      at Object.require (src/server.js:8:20)
      at Object.require (src/tests/api.test.js:2:13)
```

**Root Causes**:
1. **Syntax Error**: Line 122 of `backend/src/controllers/adminController.js` contains a stray closing bracket `}` directly after `resetMemberQr()`. This causes Babel parser to throw a `SyntaxError` when `server.js` requires `adminRoutes.js`.
2. **Open Handle `QUERYWRAP`**: When `server.js` is required by `api.test.js:2:13`, `authRoutes` requires `authController` which imports `../config/db.js`. Lines 32–34 in `backend/src/config/db.js` immediately invoke `mongo.connectMongo()`. Because `backend/.env` has `MONGODB_URI=mongodb+srv://...`, Mongoose immediately starts an asynchronous DNS SRV query (`dns.resolveSrv`). When `server.js` subsequently fails with the syntax error at `adminRoutes`, Jest immediately aborts execution while the DNS query is still in flight, generating an orphaned `QUERYWRAP` open handle.
3. **Background Email Dispatch**: In `backend/src/controllers/authController.js:54-61` and `backend/src/controllers/registrationController.js:126-137`, `sendMemberPassEmail` and `sendQRTicketEmail` are dispatched asynchronously without `await`. In `backend/src/config/resend.js:8`, `resendClient = new Resend(apiKey)` is configured with a live key. In test runs, these unawaited external API calls create in-flight HTTPS socket connections (`TLSWRAP` / `TCPWRAP`) which lead to open handles or test slowness.

---

## 2. Logic Chain

### 2.1 Test Architecture for R3 Multi-Admin Isolation
To reliably prove compliance with R3, the test suite must construct a multi-tenant environment containing:
1. **Super Admin**: Platform oversight, sees all events and registrations.
2. **Admin A** (`event_admin`): Creates Event A, should see only Event A data.
3. **Admin B** (`event_admin`): Creates Event B, should see only Event B data.
4. **Guest A**: Registers for Event A.
5. **Guest B**: Registers for Event B.

The deterministic verification chain is:

$$\begin{aligned}
\text{Admin A} &\longrightarrow \text{Event A} \longrightarrow \text{Guest A} \\
\text{Admin B} &\longrightarrow \text{Event B} \longrightarrow \text{Guest B} \\
\text{Super Admin} &\longrightarrow [\text{Event A, Event B, Guest A, Guest B}]
\end{aligned}$$

### 2.2 Endpoint Isolation Assertions
1. **Admin Unique Identifier (`admin_id`)**:
   - Both Admin A and Admin B must receive distinct, non-empty `admin_id` strings matching `/^ADM-/` (e.g. `ADM-2026-XXXXXX` or seeded `ADM-0001`/`ADM-0002`).
   - `expect(adminA.admin_id).not.toEqual(adminB.admin_id)`.
   - The token returned from `POST /api/auth/login` must include `admin_id` in the JWT payload or user response.

2. **Scoped Dashboard Metrics (`GET /api/admin/dashboard`)**:
   - Admin A sees only registrations from Event A: `recentRegistrations` contains Guest A, zero occurrences of Guest B.
   - Admin B sees only registrations from Event B: `recentRegistrations` contains Guest B, zero occurrences of Guest A.
   - Super Admin sees both Guest A and Guest B.

3. **Scoped Registrations List (`GET /api/admin/registrations`)**:
   - Admin A query returns only Event A attendees (`guest_email === guestAEmail`).
   - Admin B query returns only Event B attendees (`guest_email === guestBEmail`).
   - Super Admin query returns all attendees across all events.

4. **Scoped CSV Export (`GET /api/admin/export/registrations`)**:
   - Admin A export body: Contains `guest_alpha@example.com`, does NOT contain `guest_beta@example.com`.
   - Admin B export body: Contains `guest_beta@example.com`, does NOT contain `guest_alpha@example.com`.

5. **Cross-Organizer Event Mutation Protection**:
   - Admin B attempting `PUT /api/events/:eventA_id` must receive **403 Forbidden**.
   - Admin B attempting `DELETE /api/events/:eventA_id` must receive **403 Forbidden**.
   - Event A details must remain untouched: `GET /api/events/:eventA_id` returns original title and `status: 'registration_open'`.
   - Admin A attempting `PUT /api/events/:eventA_id` receives **200 OK**.
   - Super Admin attempting `PUT /api/events/:eventA_id` receives **200 OK**.

6. **Cross-Organizer Attendance Scoping**:
   - Admin B requesting `GET /api/checkin/events/:eventA_id/attendance` must receive **403 Forbidden**.
   - Admin A requesting `GET /api/checkin/events/:eventA_id/attendance` receives **200 OK**.
   - Super Admin requesting `GET /api/checkin/events/:eventA_id/attendance` receives **200 OK**.

### 2.3 Open Handle Prevention & Test Robustness
To eliminate all open handles and prevent test flakiness:
1. **Mock External Email Client**:
   In `api.test.js`, mock `../config/resend` to `null`:
   ```javascript
   jest.mock('../config/resend', () => null);
   ```
   When `resendClient` is `null`, `emailService.js` routes through console preview mode synchronously without spawning background HTTPS sockets or DNS queries.
2. **Database Teardown in `afterAll`**:
   - Mongoose: Explicitly close the connection with `await mongoose.connection.close(true)`.
   - SQLite: Explicitly close the file handle with `dbQuery.sqliteDb?.close()`.
3. **Seed-Agnostic Assertions**:
   Use `.find()` and `.some()` with dynamically generated timestamp emails (`admin_a_${Date.now()}@test.com`) rather than asserting fixed array lengths (`length === 1`), ensuring tests remain resilient against any existing seed or test data.
4. **Use Free Event Registration**:
   Configure test events with `ticket_price: 0`. This causes `createRegistration` in `registrationController.js:67-148` to instantly confirm the registration and issue an active ticket without needing Razorpay webhook or external payment simulation.

---

## 3. Caveats

1. **Stray Syntax Error Prerequisite**:
   Tests cannot run until `backend/src/controllers/adminController.js:122` (extra closing bracket `}`) is resolved by the implementation agent (Milestone 1 implementer).
2. **Dual Database Engine Compatibility**:
   `dbQuery` dynamically operates under SQLite or MongoDB. All test assertions must test the external Express HTTP interface so they succeed identically regardless of which engine is active.
3. **SQLite File Persistence**:
   SQLite persists to `backend/local_database.sqlite`. Running tests multiple times without wiping the DB requires unique identifiers for created users and events (e.g. `Date.now()`).

---

## 4. Conclusion

The recommended test suite extends `backend/src/tests/api.test.js` with a dedicated, isolated `describe('R3: Multi-Admin Tenancy & Strict Data Isolation', ...)` suite.

### Proposed Code for `backend/src/tests/api.test.js`

```javascript
/**
 * R3: Multi-Admin Tenancy & Strict Data Isolation Test Suite
 * Designed by teamwork_explorer_m1_3
 */

// Place at the top of backend/src/tests/api.test.js
jest.mock('../config/resend', () => null); // Prevents open network handles from Resend API

describe('R3: Multi-Admin Tenancy & Strict Data Isolation', () => {
    let superAdminToken = '';
    let adminAToken = '';
    let adminBToken = '';
    let adminAUser = null;
    let adminBUser = null;
    let eventAId = '';
    let eventBId = '';

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
    });

    it('1. Unique Admin Identifier: Admin accounts must possess distinct unique admin_id format', async () => {
        // Verify admin_id exists on registration responses
        expect(adminAUser.admin_id).toBeDefined();
        expect(adminBUser.admin_id).toBeDefined();

        // Verify format (ADM-XXXX)
        expect(adminAUser.admin_id).toMatch(/^ADM-/);
        expect(adminBUser.admin_id).toMatch(/^ADM-/);

        // Verify distinctness
        expect(adminAUser.admin_id).not.toEqual(adminBUser.admin_id);

        // Verify admin_id persists across login
        const loginARes = await request(app)
            .post('/api/auth/login')
            .send({
                email: adminAEmail,
                password: 'Password123!'
            });
        expect(loginARes.statusCode).toEqual(200);
        expect(loginARes.body.user.admin_id).toEqual(adminAUser.admin_id);
    });

    it('2. Event Creation: Admin A and Admin B create separate events', async () => {
        // Admin A creates Event A
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

        // Admin B creates Event B
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
        // Guest A registers for Event A
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

        // Guest B registers for Event B
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
    });

    it('4. Scoped Dashboard Check: Admin A sees only Event A, Admin B sees only Event B, Super Admin sees both', async () => {
        // Admin A Dashboard
        const dashARes = await request(app)
            .get('/api/admin/dashboard')
            .set('Authorization', `Bearer ${adminAToken}`);
        expect(dashARes.statusCode).toEqual(200);
        expect(dashARes.body.success).toBe(true);

        const recentAEmails = (dashARes.body.stats.recentRegistrations || []).map(r => r.guest_email || r.guestEmail);
        expect(recentAEmails).toContain(guestAEmail);
        expect(recentAEmails).not.toContain(guestBEmail);

        // Admin B Dashboard
        const dashBRes = await request(app)
            .get('/api/admin/dashboard')
            .set('Authorization', `Bearer ${adminBToken}`);
        expect(dashBRes.statusCode).toEqual(200);
        expect(dashBRes.body.success).toBe(true);

        const recentBEmails = (dashBRes.body.stats.recentRegistrations || []).map(r => r.guest_email || r.guestEmail);
        expect(recentBEmails).toContain(guestBEmail);
        expect(recentBEmails).not.toContain(guestAEmail);

        // Super Admin Dashboard
        const dashSuperRes = await request(app)
            .get('/api/admin/dashboard')
            .set('Authorization', `Bearer ${superAdminToken}`);
        expect(dashSuperRes.statusCode).toEqual(200);
        expect(dashSuperRes.body.stats.totalEvents).toBeGreaterThanOrEqual(2);
    });

    it('5. Scoped Registrations List: Admin A sees only Event A attendees, Admin B sees only Event B attendees, Super Admin sees all', async () => {
        // Admin A Registrations
        const listARes = await request(app)
            .get('/api/admin/registrations')
            .set('Authorization', `Bearer ${adminAToken}`);
        expect(listARes.statusCode).toEqual(200);
        const listAEmails = listARes.body.registrations.map(r => r.guest_email);
        expect(listAEmails).toContain(guestAEmail);
        expect(listAEmails).not.toContain(guestBEmail);

        // Admin B Registrations
        const listBRes = await request(app)
            .get('/api/admin/registrations')
            .set('Authorization', `Bearer ${adminBToken}`);
        expect(listBRes.statusCode).toEqual(200);
        const listBEmails = listBRes.body.registrations.map(r => r.guest_email);
        expect(listBEmails).toContain(guestBEmail);
        expect(listBEmails).not.toContain(guestAEmail);

        // Super Admin Registrations
        const listSuperRes = await request(app)
            .get('/api/admin/registrations')
            .set('Authorization', `Bearer ${superAdminToken}`);
        expect(listSuperRes.statusCode).toEqual(200);
        const superEmails = listSuperRes.body.registrations.map(r => r.guest_email);
        expect(superEmails).toContain(guestAEmail);
        expect(superEmails).toContain(guestBEmail);
    });

    it('6. Scoped CSV Export: Admin A export contains only Event A attendees, Admin B contains only Event B', async () => {
        // Admin A Export
        const exportARes = await request(app)
            .get('/api/admin/export/registrations')
            .set('Authorization', `Bearer ${adminAToken}`);
        expect(exportARes.statusCode).toEqual(200);
        expect(exportARes.headers['content-type']).toMatch(/text\/csv/);
        expect(exportARes.text).toContain(guestAEmail);
        expect(exportARes.text).not.toContain(guestBEmail);

        // Admin B Export
        const exportBRes = await request(app)
            .get('/api/admin/export/registrations')
            .set('Authorization', `Bearer ${adminBToken}`);
        expect(exportBRes.statusCode).toEqual(200);
        expect(exportBRes.headers['content-type']).toMatch(/text\/csv/);
        expect(exportBRes.text).toContain(guestBEmail);
        expect(exportBRes.text).not.toContain(guestAEmail);
    });

    it('7. Cross-Organizer Mutation Protection: Admin B attempting PUT or DELETE on Event A receives 403 Forbidden', async () => {
        // Admin B attempts to update Event A
        const putRes = await request(app)
            .put(`/api/events/${eventAId}`)
            .set('Authorization', `Bearer ${adminBToken}`)
            .send({ title: 'Hacked Title by Admin Beta' });
        expect(putRes.statusCode).toEqual(403);
        expect(putRes.body.success).toBe(false);

        // Admin B attempts to delete Event A
        const delRes = await request(app)
            .delete(`/api/events/${eventAId}`)
            .set('Authorization', `Bearer ${adminBToken}`);
        expect(delRes.statusCode).toEqual(403);
        expect(delRes.body.success).toBe(false);

        // Confirm Event A remains intact
        const getRes = await request(app).get(`/api/events/${eventAId}`);
        expect(getRes.statusCode).toEqual(200);
        expect(getRes.body.event.title).toEqual(`Alpha Tech Summit ${timestamp}`);
        expect(getRes.body.event.status).toEqual('registration_open');

        // Admin A can legitimately update Event A
        const updateARes = await request(app)
            .put(`/api/events/${eventAId}`)
            .set('Authorization', `Bearer ${adminAToken}`)
            .send({ title: `Alpha Tech Summit ${timestamp} - Updated` });
        expect(updateARes.statusCode).toEqual(200);
        expect(updateARes.body.success).toBe(true);

        // Super Admin can update Event A
        const superUpdateRes = await request(app)
            .put(`/api/events/${eventAId}`)
            .set('Authorization', `Bearer ${superAdminToken}`)
            .send({ title: `Alpha Tech Summit ${timestamp} - Verified by SuperAdmin` });
        expect(superUpdateRes.statusCode).toEqual(200);
        expect(superUpdateRes.body.success).toBe(true);
    });

    it('8. Cross-Organizer Attendance Protection: Admin B requesting Event A attendance receives 403 Forbidden', async () => {
        // Admin B attempts to read Event A attendance
        const attBRes = await request(app)
            .get(`/api/checkin/events/${eventAId}/attendance`)
            .set('Authorization', `Bearer ${adminBToken}`);
        expect(attBRes.statusCode).toEqual(403);
        expect(attBRes.body.success).toBe(false);

        // Admin A can legitimately read Event A attendance
        const attARes = await request(app)
            .get(`/api/checkin/events/${eventAId}/attendance`)
            .set('Authorization', `Bearer ${adminAToken}`);
        expect(attARes.statusCode).toEqual(200);
        expect(attARes.body.success).toBe(true);

        // Super Admin can legitimately read Event A attendance
        const attSuperRes = await request(app)
            .get(`/api/checkin/events/${eventAId}/attendance`)
            .set('Authorization', `Bearer ${superAdminToken}`);
        expect(attSuperRes.statusCode).toEqual(200);
        expect(attSuperRes.body.success).toBe(true);
    });
});
```

---

## 5. Verification Method

### 5.1 Verification Commands
Once Milestone 1 implementation completes:
1. **Syntax Check**:
   ```powershell
   cd backend
   node -c src/controllers/adminController.js
   ```
   *Expected: Clean exit (code 0).*
2. **Execute Full Test Suite**:
   ```powershell
   cd backend
   npm test
   ```
   *Expected: All existing tests and the new R3 isolation suite pass with zero failed assertions and no open handle warnings.*

### 5.2 Independent Invalidation Conditions
The test suite implementation fails if:
- Any test fails when run against SQLite or MongoDB.
- An open socket or DNS handle is detected by `--detectOpenHandles`.
- An event admin is able to read, update, delete, or export records for an event created by another admin.
- `admin_id` format fails to conform to `/^ADM-/` or is identical across different event admin accounts.
