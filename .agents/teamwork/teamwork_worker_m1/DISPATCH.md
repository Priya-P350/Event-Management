## 2026-11-04T07:12:56Z
You are teamwork_worker_m1.
Working directory: c:\Users\priya\OneDrive\Desktop\QR\.agents\teamwork\teamwork_worker_m1
Original request path: c:\Users\priya\OneDrive\Desktop\QR\.agents\teamwork\ORIGINAL_REQUEST.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY: Read c:\Users\priya\OneDrive\Desktop\QR\.agents\teamwork\ORIGINAL_REQUEST.md and c:\Users\priya\OneDrive\Desktop\QR\PROJECT.md.
Also read the detailed specifications in:
- `c:\Users\priya\OneDrive\Desktop\QR\.agents\teamwork\teamwork_explorer_m1_1\handoff.md` (database schemas, migrations, scoped queries)
- `c:\Users\priya\OneDrive\Desktop\QR\.agents\teamwork\teamwork_explorer_m1_2\handoff.md` (controllers, auth, token generator, authorization checks)
- `c:\Users\priya\OneDrive\Desktop\QR\.agents\teamwork\teamwork_explorer_m1_3\handoff.md` (Jest test suite, open-handle prevention)

Files you own exclusively:
- `backend/src/controllers/adminController.js`
- `backend/src/controllers/eventController.js`
- `backend/src/controllers/checkinController.js`
- `backend/src/controllers/registrationController.js`
- `backend/src/controllers/authController.js`
- `backend/src/utils/ticketToken.js`
- `backend/src/config/db.js`
- `backend/src/db/schema.js`
- `backend/src/models/User.js`
- `backend/src/middleware/auth.js`
- `backend/src/tests/api.test.js`

Tasks to implement:
1. Fix syntax error in `backend/src/controllers/adminController.js:122` (remove stray closing brace `}`).
2. Implement `generateAdminId()` in `backend/src/utils/ticketToken.js`.
3. Add `admin_id` / `adminId` to User schemas across Postgres, SQLite, and Mongoose, with SQLite table creation DDL, migration, and seeding (`ADM-0001` and `ADM-0002`).
4. Update `authController.js` and `adminController.js` to assign `admin_id` to admin accounts upon registration/creation, include it in the JWT payload `{ id, admin_id, name, email, role }`, and return it in user responses. Backfill `admin_id` on login/getMe if missing.
5. Update `backend/src/config/db.js` queries (`getEvents`, `getAllRegistrations`, `getAllPayments`, `getAllAttendance`, `getDashboardStats` / `getAdminDashboardStats`) to support an optional `adminId` parameter:
   - When `adminId` is provided: Scope records to events where `created_by === adminId`. For attendance, exclude global member gate passes. Guard against empty arrays.
   - When `adminId` is undefined: Return global platform records for `super_admin`.
6. Enforce authorization checks in controllers:
   - `adminController.js`: Use `getAdminIdFilter(req)` to pass `req.user.id` when role !== 'super_admin' across dashboard, registrations, payments, attendance, and export routes.
   - `eventController.js`: In `updateEvent` and `deleteEvent`, verify `event.created_by === req.user.id || req.user.role === 'super_admin'`, return 403 Forbidden otherwise.
   - `checkinController.js`: In `getEventAttendance`, verify event ownership or super_admin, return 403 Forbidden otherwise.
   - `registrationController.js`: In `getRegistrationById`, verify requester is registered guest, event creator, or super_admin.
   - `middleware/auth.js`: Allow token via `req.query.token` in `authenticateToken`.
7. Add automated tests in `backend/src/tests/api.test.js`:
   - Mock Resend (`jest.mock('../config/resend', () => null);`) to eliminate open network handles.
   - Add graceful teardown in `afterAll` (close Mongoose and SQLite connections).
   - Implement the complete multi-admin tenancy test suite from `teamwork_explorer_m1_3/handoff.md`.
8. Verify everything:
   - Run syntax check: `node -c src/controllers/adminController.js`
   - Run tests: `npm test` in `backend`
   - Verify frontend build: `npm run build` in `frontend`
9. Write `handoff.md` in your working directory documenting all changes, test commands, and passing output. Send a message when finished.
