# Backend Investigation Report: Data Models, Admin Identifiers, Data Isolation, and Test Infrastructure

**Agent**: `teamwork_explorer_survey_1`  
**Date**: 2026-11-04  
**Target Milestone**: Survey / Backend Investigation for R3  
**Working Directory**: `c:\Users\priya\OneDrive\Desktop\QR\.agents\teamwork\teamwork_explorer_survey_1`  

---

## 1. Observation

### 1.1 Data Models and Database Engines
The backend implements a dual-database access layer supporting both **Mongoose (MongoDB)** and **Drizzle ORM (embedded SQLite & Supabase PostgreSQL)** located in `backend/src/config/db.js`, `backend/src/db/schema.js`, and `backend/src/models/`:

1. **User Model** (`backend/src/models/User.js`, `backend/src/db/schema.js:9-25`, `schema.js:131-147`):
   - Fields: `id` (UUID), `name`, `email`, `phone`, `password_hash`, `role` (`'guest'`, `'scanner_staff'`, `'event_admin'`, `'super_admin'`), `member_id` (e.g. `'MEM-2026-XXXXXX'`), `qr_code_data`, `qr_token`, `qr_status`, `qr_scanned_at`, `qr_scanned_by`, `qr_device_info`, `created_at`, `updated_at`.
   - Seeded admins in `backend/src/config/db.js:255-256`:
     - Super Admin: ID `11111111-1111-1111-1111-111111111111`, Email `admin@eventhub.com`, Role `'super_admin'`
     - Event Organizer Admin: ID `22222222-2222-2222-2222-222222222222`, Email `organizer@eventhub.com`, Role `'event_admin'`
2. **Event Model** (`backend/src/models/Event.js`, `schema.js:27-47`, `schema.js:149-169`):
   - Fields: `id` (UUID), `title`, `description`, `category`, `cover_image_url`, `event_date`, `start_time`, `end_time`, `venue`, `address`, `google_maps_url`, `ticket_price`, `capacity`, `registration_open_at`, `registration_close_at`, `status` (`'draft'`, `'registration_open'`, `'completed'`, `'cancelled'`), `created_by` (UUID referencing `users.id`), `iti_trade`, `iti_institute`, `iti_eligibility`.
   - In `backend/src/controllers/eventController.js:67`:
     ```javascript
     created_by: req.user ? req.user.id : null
     ```
3. **Registration Model** (`backend/src/models/Registration.js`, `schema.js:49-60`, `schema.js:171-182`):
   - Fields: `id` (UUID), `event_id` (UUID foreign key -> `events.id`), `user_id` (UUID foreign key -> `users.id`), `registration_number`, `guest_name`, `guest_email`, `guest_phone`, `custom_answers`, `registration_status` (`'pending'`, `'confirmed'`, `'cancelled'`), `created_at`.
4. **Ticket Model** (`backend/src/models/Ticket.js`, `schema.js:77-87`, `schema.js:199-209`):
   - Fields: `id` (UUID), `registration_id` (UUID foreign key), `event_id` (UUID foreign key -> `events.id`), `user_id` (UUID foreign key -> `users.id`), `ticket_number`, `secure_token`, `qr_code_data`, `status` (`'active'`, `'expired'`, `'cancelled'`), `created_at`.
5. **Attendance Model** (`backend/src/models/Attendance.js`, `schema.js:89-98`, `schema.js:211-220`):
   - Fields: `id` (UUID), `ticket_id` (UUID foreign key), `event_id` (UUID foreign key -> `events.id`), `registration_id` (UUID foreign key), `checked_in_by` (UUID -> `users.id`), `checked_in_at`, `status` (`'checked_in'`, `'expired'`), `device_info`.
6. **Payment Model** (`schema.js:62-75`, `schema.js:184-197`):
   - Fields: `id`, `registration_id`, `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`, `amount`, `currency`, `status`, `paid_at`, `refund_id`, `refund_status`.

---

### 1.2 Admin Identifier Structure
- Admins are stored in the `users` table/collection where `role = 'event_admin'` or `role = 'super_admin'`.
- In `backend/src/controllers/authController.js:63-67` and `127-131`, authentication generates a JWT with:
  ```javascript
  const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '7d' }
  );
  ```
- In `backend/src/utils/ticketToken.js:39-64`, normal members are assigned a structured identifier `member_id` (e.g. `MEM-2026-XXXXXX`). However, there is **no dedicated `admin_id`** column or generator for event admins currently; admins only have their primary key UUID `id`.

---

### 1.3 Data Isolation Audit across Endpoints and Queries

Every admin-facing endpoint was audited for data scoping:

| Endpoint | Controller & Route | Current Behavior | Data Isolation Risk |
|---|---|---|---|
| `GET /api/admin/dashboard` | `adminController.js:8-15` & `adminRoutes.js:7` | Calls `dbQuery.getAdminDashboardStats()` / `getDashboardStats()`. Calculates total events, upcoming events, total registrations, confirmed passes, entry check-ins, and total platform revenue globally without checking `req.user.id`. | **CRITICAL LEAKAGE**: An event organizer admin sees the platform's aggregate metrics, total revenue, and top 10 recent guest registrations across all other organizers. |
| `GET /api/admin/registrations` | `adminController.js:159-166` & `adminRoutes.js:14` | Calls `dbQuery.getAllRegistrations()`. Fetches all registrations across all events. | **CRITICAL LEAKAGE**: Regular event admins see full guest lists (names, emails, phones, ticket numbers) from other organizers' events. |
| `GET /api/admin/export/registrations` | `adminController.js:186-210` & `adminRoutes.js:18` | Calls `dbQuery.getAllRegistrations()` and dumps CSV of all guest names, emails, phones, and events. | **CRITICAL LEAKAGE**: Any regular admin can download and export all guest attendee data from all organizers. |
| `GET /api/admin/payments` | `adminController.js:168-175` & `adminRoutes.js:15` | Calls `dbQuery.getAllPayments()`. Returns all payment transactions across all events. | **CRITICAL LEAKAGE**: Event admins see financial records, transaction amounts, and buyer details of competitor events. |
| `GET /api/admin/export/payments` | `adminController.js:212-238` & `adminRoutes.js:19` | Calls `dbQuery.getAllPayments()` and converts all payments to CSV. | **CRITICAL LEAKAGE**: Competitor financial transaction leak. |
| `GET /api/admin/attendance` | `adminController.js:177-184` & `adminRoutes.js:16` | Calls `dbQuery.getAllAttendance()`. Returns check-in logs from all events. | **CRITICAL LEAKAGE**: Event admins see check-in timestamps and attendee logs of other organizers. |
| `GET /api/checkin/events/:id/attendance` | `checkinController.js:287-295` & `checkinRoutes.js:9` | Calls `dbQuery.getEventAttendance(req.params.id)`. Protected by `requireStaffOrAdmin`. Does NOT check if `event.created_by === req.user.id`. | **CRITICAL LEAKAGE**: Any event admin can request attendance records for any event ID. |
| `PUT /api/events/:id` | `eventController.js:77-105` & `eventRoutes.js:10` | Calls `dbQuery.updateEvent(req.params.id, updates)`. Protected by `requireAdmin`. Does NOT verify if `event.created_by === req.user.id`. | **CRITICAL MUTABILITY LEAK**: Any event admin can modify title, venue, pricing, capacity, or description of another admin's event. |
| `DELETE /api/events/:id` | `eventController.js:107-114` & `eventRoutes.js:11` | Calls `dbQuery.updateEvent(req.params.id, { status: 'cancelled' })`. Does NOT verify event ownership. | **CRITICAL DELETION LEAK**: Any event admin can cancel/delete another admin's event. |
| `GET /api/registrations/:id` | `registrationController.js:208-218` & `registrationRoutes.js:8` | Protected only by `optionalAuth`. Returns registration record, ticket, payment, and guest details by registration ID to anyone. | **DATA LEAKAGE**: An unauthenticated guest or malicious admin can view arbitrary guest records by guessing or obtaining IDs. |
| `GET /api/admin/users*` | `adminRoutes.js:8-12` | Protected by `requireAdmin` (`super_admin` OR `event_admin`). | Regular event admins can list all users and alter roles (`updateUserRole`). Should be restricted to `super_admin`. |

---

### 1.4 Test Infrastructure in `backend/src/tests/api.test.js`
- Test framework: Jest 29.7.0, Supertest 7.0.0 (`backend/package.json:35-42`).
- Environment: Node CommonJS, runner invoked via `node --experimental-vm-modules node_modules/jest/bin/jest.js --detectOpenHandles --forceExit`.
- Tests currently test:
  1. `GET /api/health`
  2. `POST /api/auth/login` (logs in seeded `admin@eventhub.com` / `Admin@123`)
  3. `GET /api/events`
  4. `POST /api/checkin/scan` (valid ticket token `EVT-TK-9a8b7c6d5e4f3a2b1c0d`)
  5. `POST /api/checkin/scan` (duplicate scan 409 rejection)
  6. `GET /api/admin/dashboard` (super_admin metrics check)
  7. `GET /api/admin/dashboard` (401 without auth)
  8. `POST /api/auth/register` (registers an event admin)
  9. `GET /api/admin/users`
  10. `PUT /api/admin/users/:id/role`
  11. `POST /api/qr/generate`
- Current test limitation: **Zero tests verify multi-admin tenancy or data isolation.** All existing admin tests use super_admin permissions.

---

### 1.5 Build & Runtime Issue with `npm test` in `backend`

Running `npm test` produces an immediate failure:
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
```
- Direct verification with `node -c src/controllers/adminController.js`:
  ```
  C:\Users\priya\OneDrive\Desktop\QR\backend\src\controllers\adminController.js:122
  }
  ^
  SyntaxError: Unexpected token '}'
  ```
- **Direct Cause**: Line 122 of `backend/src/controllers/adminController.js` has an extra closing curly brace `}` after `resetMemberQr()` that prematurely closes the file or module scope.
- In addition, Jest reported open handles (`QUERYWRAP` in mongodb SRV resolution) because `backend/.env` specifies a live remote MongoDB Atlas URI (`MONGODB_URI=mongodb+srv://...`). When tests run without active internet or when Jest aborts on syntax error, unhandled Mongoose connection attempts remain open.
- In contrast, the frontend build cleanly succeeds:
  `cd frontend; npm run build` completed with zero compilation errors (`built in 18.17s`).

---

## 2. Logic Chain

1. **Admin Structure & Ownership Reference**:
   - `Event` schema has `created_by` storing the creator's user identifier (e.g., `eventsPg.createdBy`, `eventsSqlite.createdBy`, `Event.created_by`).
   - In `eventController.js:67`, `createEvent` sets `created_by: req.user.id`.
   - All attendee entities (`registrations`, `tickets`, `attendance`) reference `events.id` via `event_id`.
   - Therefore, any guest registration, ticket, payment, or check-in record has a deterministic 1-to-1 relationship with the event creator:
     $$\text{Registration} \xrightarrow{\text{event\_id}} \text{Event} \xrightarrow{\text{created\_by}} \text{Admin}$$

2. **Root Cause of Cross-Organizer Data Leakage**:
   - The query methods in `backend/src/config/db.js` (`getAllRegistrations`, `getAllPayments`, `getAllAttendance`, `getDashboardStats`, and `getEvents`) take no `adminId` or creator filtering parameter.
   - The controllers in `adminController.js`, `eventController.js`, and `checkinController.js` invoke these queries without passing `req.user.id` or checking `req.user.role`.
   - Consequently, when any authenticated user with `role: 'event_admin'` hits `/api/admin/registrations`, `/api/admin/dashboard`, `/api/admin/attendance`, `/api/admin/export/registrations`, or `/api/checkin/events/:id/attendance`, the database returns all rows across all organizers.

3. **Required Isolation Architecture**:
   - Platform **Super Admin** (`role === 'super_admin'`): Retains global oversight (no filters applied; can inspect and manage all events and registrations).
   - Event Admin (`role === 'event_admin'`):
     - **Query Scoping**:
       - `getDashboardStats(adminId)`: Computes counts, revenue, and recent registrations strictly where `event.created_by === adminId`.
       - `getAllRegistrations(adminId)`: Joins or filters where `event.created_by === adminId`.
       - `getAllPayments(adminId)`: Filters payments where `registration.event.created_by === adminId`.
       - `getAllAttendance(adminId)`: Filters attendance where `event.created_by === adminId`.
       - `exportRegistrationsCSV(adminId)`: Exports only attendees registered for events where `event.created_by === adminId`.
       - `exportPaymentsCSV(adminId)`: Exports only payments for events where `event.created_by === adminId`.
       - `getEvents({ created_by })`: Filters event list by creator.
     - **Resource Ownership Authorization Checks**:
       - `updateEvent`: If `req.user.role !== 'super_admin'`, fetch event; if `event.created_by !== req.user.id`, return `403 Forbidden`.
       - `deleteEvent`: If `req.user.role !== 'super_admin'`, verify `event.created_by === req.user.id`; if mismatch, return `403 Forbidden`.
       - `getEventAttendance(eventId)`: If `req.user.role !== 'super_admin'`, verify event creator; if mismatch, return `403 Forbidden`.
       - `getRegistrationById(id)`: Verify requester is either the registered guest (`user_id === req.user.id`), the event creator (`event.created_by === req.user.id`), or super-admin.
       - User management (`/api/admin/users*`): Restrict role assignment and user deletion to `super_admin` only.

4. **Unique Admin Identifier Implementation Strategy**:
   - To associate a distinct, unique identifier with every admin account:
     - Add `admin_id` to the `User` schema / SQLite migration: `admin_id TEXT UNIQUE` (e.g. `ADM-2026-XXXXXX` or seeded `ADM-0001`, `ADM-0002`).
     - In `ticketToken.js`, add `generateAdminToken(adminData)` or `generateAdminId()` that returns `ADM-2026-${Math.floor(100000 + Math.random() * 900000)}`.
     - When an admin registers (`POST /api/auth/register` with role `event_admin`) or is created via `adminController.createUser`, generate and persist `admin_id`.
     - In `login` and `getMe`, auto-populate `admin_id` if missing on an existing admin account (mirroring the existing member pass pattern).
     - Include `admin_id` in the JWT payload and `req.user` (`{ id, admin_id, name, email, role }`).
     - Display `admin_id` in the admin portal header, user directory, and event metadata.
     - Note: Primary foreign key `events.created_by` can continue referencing the UUID `users.id` (or `users.admin_id`), guaranteeing relational integrity across SQLite, PostgreSQL, and MongoDB.

---

## 3. Caveats

1. **Database Mode Switch**:
   `backend/src/config/db.js` dynamically switches between SQLite and MongoDB based on `MONGODB_URI` and network availability. Any changes to `dbQuery` methods must be implemented for both the Drizzle ORM (SQLite/PostgreSQL) branch and the Mongoose (MongoDB) branch.
2. **Member Passes vs. Event Tickets**:
   Member passes (`member_attendance`, `qrController.js`) represent generic organization-wide gate entries, not tied to a specific single event. For regular event admins, gate logs should exclude global member passes and only show attendees checked into that admin's events. Super-admins will continue seeing both event check-ins and member admissions.
3. **CSV Export Authorization in Browser**:
   `window.open(adminService.exportRegistrationsCSV(), '_blank')` in `AdminRegistrations.jsx` opens a URL directly in a browser window without HTTP Authorization headers. The backend CSV export routes must either support token validation via query string parameter (e.g., `?token=...`) in `authenticateToken`, or the frontend must fetch the CSV as a Blob via authenticated Axios call.

---

## 4. Conclusion

1. **Data Isolation Status**: The backend currently possesses no tenant isolation between event admins. Any event admin can view all attendee records, export all guest contact information, inspect platform financial totals, and cancel or overwrite events created by other admins.
2. **Remediation Plan**:
   - Introduce an `admin_id` (e.g. `ADM-2026-XXXXXX`) for every admin account.
   - Add creator scoping parameters (`adminId`) to `dbQuery.getDashboardStats`, `dbQuery.getAllRegistrations`, `dbQuery.getAllPayments`, `dbQuery.getAllAttendance`, and `dbQuery.getEvents` for both Drizzle and MongoDB engines.
   - Enforce authorization checks in `adminController.js`, `eventController.js`, `checkinController.js`, and `registrationController.js` so `super_admin` has global oversight, while `event_admin` is strictly scoped to `event.created_by === req.user.id`.
3. **Automated Test Suite Fixes**:
   - Eliminate line 122 in `backend/src/controllers/adminController.js` (stray closing brace `}`).
   - Ensure `npm test` operates cleanly without network hanging on MongoDB Atlas.
   - Add automated test assertions in `backend/src/tests/api.test.js` covering two distinct event admins: verifying Admin 1 cannot view or export Admin 2's attendee registrations, cannot mutate Admin 2's events, cannot view Admin 2's attendance logs, and receives scoped dashboard metrics.

---

## 5. Verification Method

### 5.1 Syntax & Build Verification
1. Run syntax check across backend:
   ```powershell
   cd backend
   node -c src/controllers/adminController.js
   ```
   *Expected once line 122 is fixed: Zero syntax errors, exits with code 0.*
2. Run frontend production build:
   ```powershell
   cd frontend
   npm run build
   ```
   *Expected: Zero compilation errors, completes successfully.*

### 5.2 Test Suite Execution
Run the Jest test suite:
```powershell
cd backend
npm test
```
*Expected: All test suites pass without parsing or runtime syntax errors.*

### 5.3 Automated R3 Data Isolation Verification Strategy
Add the following test suite to `backend/src/tests/api.test.js`:
1. Register/Login `adminA` (`event_admin`) and `adminB` (`event_admin`).
2. Verify both accounts possess distinct unique `admin_id` values.
3. Create Event A with `adminA` token, Event B with `adminB` token.
4. Register Guest A to Event A, Guest B to Event B.
5. **Isolation Assertion 1**:
   - `GET /api/admin/registrations` with `adminA` token returns only Guest A (`length === 1`).
   - `GET /api/admin/registrations` with `adminB` token returns only Guest B (`length === 1`).
   - `GET /api/admin/registrations` with `super_admin` token returns both Guest A and Guest B.
6. **Isolation Assertion 2**:
   - `PUT /api/events/:eventA_id` with `adminB` token returns HTTP 403 Forbidden.
   - `DELETE /api/events/:eventA_id` with `adminB` token returns HTTP 403 Forbidden.
7. **Isolation Assertion 3**:
   - `GET /api/checkin/events/:eventA_id/attendance` with `adminB` token returns HTTP 403 Forbidden.
   - `GET /api/checkin/events/:eventA_id/attendance` with `adminA` token returns HTTP 200 OK.
8. **Isolation Assertion 4**:
   - `GET /api/admin/export/registrations` with `adminA` token yields CSV with Guest A only, zero occurrences of Guest B.
