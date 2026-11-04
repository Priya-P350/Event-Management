# Backend Controller, Auth & Authorization Investigation Report (Milestone 1)

**Agent**: `teamwork_explorer_m1_2`  
**Date**: 2026-11-04  
**Target Milestone**: Milestone 1 (Backend Admin Unique Identifier & Strict Data Isolation — R3)  
**Working Directory**: `c:\Users\priya\OneDrive\Desktop\QR\.agents\teamwork\teamwork_explorer_m1_2`  

---

## 1. Observation

### 1.1 Syntax Error in `backend/src/controllers/adminController.js`
- **Location**: `backend/src/controllers/adminController.js:121-123`
- **Verbatim Error**:
  ```
  C:\Users\priya\OneDrive\Desktop\QR\backend\src\controllers\adminController.js:122
  }
  ^
  SyntaxError: Unexpected token '}'
      at wrapSafe (node:internal/modules/cjs/loader:1486:18)
      at checkSyntax (node:internal/main/check_syntax:78:3)
  ```
- **Direct Cause**:
  Lines 89–121 define function `resetMemberQr(req, res, next)`:
  ```javascript
  89:  async function resetMemberQr(req, res, next) {
  90:    try {
  ...
  118:   } catch (err) {
  119:     next(err);
  120:   }
  121: }
  122: }
  123: 
  124: async function updateUserRole(req, res, next) {
  ```
  Line 121 closes the function. Line 122 contains a stray closing brace `}` with no matching opening brace, causing Node.js and Jest parsing to fail immediately.
- **Verification Tool Command**:
  `cd backend; node -c src/controllers/adminController.js` exits with code 1 and prints the `SyntaxError: Unexpected token '}'` on line 122.
- **Exact Fix**:
  Delete line 122 (`}`).

---

### 1.2 Admin Identifier Structure (`admin_id`)
- **Current State in `backend/src/utils/ticketToken.js`**:
  Contains `generateTicketToken(extra = {})` (generates `EVT-2026-XXXXXX` and `EVT-TK-hex`) and `generateMemberToken(user = {})` (generates `MEM-2026-XXXXXX` and `MEM-TK-hex`).
  There is **no** generator for admin identifiers.
- **Current State in `backend/src/controllers/authController.js`**:
  - `register` (lines 63–67):
    ```javascript
    const token = jwt.sign(
        { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
        jwtSecret,
        { expiresIn: '7d' }
    );
    ```
  - `login` (lines 127–131):
    ```javascript
    const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role },
        jwtSecret,
        { expiresIn: '7d' }
    );
    ```
  - Returned `user` object in `register` (lines 73–84), `login` (lines 137–150), and `getMe` (lines 183–193) contains `id`, `name`, `email`, `role`, `member_id`, but **omits `admin_id`**.
- **Current State in Database Schemas & Seeds**:
  - `backend/src/models/User.js`: Schema lacks `admin_id`.
  - `backend/src/db/schema.js`: `usersPg` (lines 9–25) and `usersSqlite` (lines 131–147) lack `admin_id` / `adminId`.
  - `backend/src/config/db.js:251–260` (`seedSqliteData`):
    - Super Admin `11111111-1111-1111-1111-111111111111` (`admin@eventhub.com`) has no `admin_id`.
    - Event Organizer `22222222-2222-2222-2222-222222222222` (`organizer@eventhub.com`) has no `admin_id`.

---

### 1.3 Authorization Scoping Audit across All Endpoints

| Endpoint & HTTP Method | File & Line | Current Behavior | Data Isolation & Security Defect |
|---|---|---|---|
| `GET /api/admin/dashboard` | `adminController.js:8–15` | Calls `dbQuery.getAdminDashboardStats()` with zero arguments. | Event admin sees platform-wide event counts, total revenue, and guest registrations from other organizers. |
| `GET /api/admin/registrations` | `adminController.js:159–166` | Calls `dbQuery.getAllRegistrations()` with zero arguments. | Event admin sees all guest names, phones, emails, and tickets across all events. |
| `GET /api/admin/payments` | `adminController.js:168–175` | Calls `dbQuery.getAllPayments()` with zero arguments. | Event admin sees competitor transactions, payment amounts, and buyer details. |
| `GET /api/admin/attendance` | `adminController.js:177–184` | Calls `dbQuery.getAllAttendance()` with zero arguments. | Event admin sees check-in logs and gate entries from all events. |
| `GET /api/admin/export/registrations` | `adminController.js:186–210` | Calls `dbQuery.getAllRegistrations()` with zero arguments and streams CSV. | Any admin can download CSV of all attendees on the platform. |
| `GET /api/admin/export/payments` | `adminController.js:212–238` | Calls `dbQuery.getAllPayments()` with zero arguments and streams CSV. | Any admin can export all financial transaction records across the platform. |
| `PUT /api/events/:id` | `eventController.js:77–105` | Calls `dbQuery.updateEvent(req.params.id, updates)`. Protected by `requireAdmin`. Fetches `existing` event for description merging (line 84), but does NOT verify `existing.created_by === req.user.id`. | Any regular admin can mutate, alter title, venue, capacity, or ticket price of another admin's event. |
| `DELETE /api/events/:id` | `eventController.js:107–114` | Calls `dbQuery.updateEvent(req.params.id, { status: 'cancelled' })` directly without checking existing event or creator ownership. | Any regular admin can cancel/delete another admin's event. |
| `GET /api/checkin/events/:id/attendance` | `checkinController.js:287–295` | Calls `dbQuery.getEventAttendance(req.params.id)`. Protected by `requireStaffOrAdmin`. Does NOT check event ownership. | Any admin or staff member can inspect attendance records for any arbitrary event ID. |
| `GET /api/registrations/:id` | `registrationController.js:208–218` | Protected only by `optionalAuth`. Returns registration record, ticket, and payment data for any ID. | Unauthenticated users or arbitrary admins can view attendee contact details and tickets. |
| `PUT /api/admin/users/:id/role` & `DELETE /api/admin/users/:id` | `adminController.js:124–157` | Protected by `requireAdmin` (`event_admin` OR `super_admin`). | An event admin can escalate privileges or delete other user accounts. |

---

## 2. Logic Chain

### 2.1 Syntax Error Resolution
1. Observation 1.1 identified `adminController.js:122` as an extra closing brace `}` immediately following line 121 (which already closed `resetMemberQr`).
2. Removing line 122 allows the JavaScript runtime and Jest VM to parse `adminController.js` and properly export the controller functions.

### 2.2 `admin_id` Lifecycle: Generation, Persistence, JWT & Response Delivery
1. **Identifier Schema**:
   Standardized identifier format: `ADM-2026-XXXXXX` (e.g. `ADM-2026-847291`) for newly registered admins, and seeded identifiers `ADM-0001` (Super Admin) and `ADM-0002` (Event Organizer).
2. **Generation Function**:
   In `backend/src/utils/ticketToken.js`, add and export `generateAdminId`:
   ```javascript
   function generateAdminId() {
       const randomSixDigits = Math.floor(100000 + Math.random() * 900000);
       return `ADM-2026-${randomSixDigits}`;
   }
   ```
3. **Database Schema & Migration**:
   - In `backend/src/db/schema.js`:
     - In `usersPg`: add `adminId: varchar('admin_id', { length: 100 })`
     - In `usersSqlite`: add `adminId: sqliteText('admin_id')`
   - In `backend/src/models/User.js`:
     - Add `admin_id: { type: String, sparse: true, index: true }`
   - In `backend/src/config/db.js`:
     - In `initSqliteTables`:
       Add `"ALTER TABLE users ADD COLUMN admin_id TEXT;"` to `userMigrations` array (lines 225–235).
       Add backfill query for existing database records:
       ```javascript
       try {
           db.prepare("UPDATE users SET admin_id = 'ADM-0001' WHERE id = '11111111-1111-1111-1111-111111111111' AND (admin_id IS NULL OR admin_id = '')").run();
           db.prepare("UPDATE users SET admin_id = 'ADM-0002' WHERE id = '22222222-2222-2222-2222-222222222222' AND (admin_id IS NULL OR admin_id = '')").run();
       } catch (e) {}
       ```
     - In `seedSqliteData`:
       Include `admin_id` in the `INSERT INTO users` statement (`'ADM-0001'` for super_admin, `'ADM-0002'` for organizer).
     - In `findUserById` and `findUserByEmailOrPhone`:
       Map and return `admin_id: u.admin_id || u.adminId || null` and `adminId: u.admin_id || u.adminId || null`.
     - In `createUser`:
       Persist `admin_id` in both MongoDB and Drizzle branches.
     - Add helper method:
       `updateUserAdminId(userId, adminId)` to allow dynamic backfilling.
4. **Assignment upon Registration & Creation**:
   - In `backend/src/controllers/authController.js` (`register`):
     ```javascript
     const isAdmin = ['event_admin', 'super_admin'].includes(userRole);
     const adminId = isAdmin ? generateAdminId() : null;
     // Include admin_id in newUser object:
     newUser.admin_id = adminId;
     newUser.adminId = adminId;
     ```
   - In `backend/src/controllers/adminController.js` (`createUser`):
     ```javascript
     const isAdmin = ['event_admin', 'super_admin'].includes(userRole);
     const adminId = isAdmin ? generateAdminId() : null;
     newUser.admin_id = adminId;
     newUser.adminId = adminId;
     ```
5. **Session Backfilling in `login` and `getMe`**:
   - In `authController.login` and `authController.getMe`:
     If `['event_admin', 'super_admin'].includes(user.role) && !user.admin_id`:
     ```javascript
     const assignedAdminId = user.role === 'super_admin' ? 'ADM-0001' : generateAdminId();
     await dbQuery.updateUserAdminId(user.id, assignedAdminId);
     user.admin_id = assignedAdminId;
     user.adminId = assignedAdminId;
     ```
6. **JWT Payload & Auth Responses**:
   - JWT payload signed in `register` and `login`:
     ```javascript
     const token = jwt.sign(
         {
             id: user.id,
             admin_id: user.admin_id || user.adminId || null,
             name: user.name,
             email: user.email,
             role: user.role
         },
         jwtSecret,
         { expiresIn: '7d' }
     );
     ```
   - Returned client response in `register`, `login`, and `getMe`:
     ```javascript
     res.json({
         success: true,
         token,
         user: {
             id: user.id,
             admin_id: user.admin_id || user.adminId || null,
             adminId: user.admin_id || user.adminId || null,
             name: user.name,
             email: user.email,
             phone: user.phone,
             role: user.role,
             ...
         }
     });
     ```
   - When verified by `authenticateToken` middleware, `req.user` receives `req.user.admin_id` along with `req.user.id` and `req.user.role`.

---

### 2.3 Detailed Authorization Scoping Strategy across All Endpoints

The isolation rule is uniform:
- If `req.user.role === 'super_admin'`: Pass `adminId = null` (unscoped, full platform visibility).
- If `req.user.role !== 'super_admin'`: Pass `adminId = req.user.id` (strictly scoped to events where `event.created_by === req.user.id`).

#### 1. `/api/admin/dashboard`
- **Controller**: `adminController.js` -> `getDashboardStats`
- **Scoping Snippet**:
  ```javascript
  const adminId = (req.user && req.user.role !== 'super_admin') ? req.user.id : null;
  const stats = await dbQuery.getAdminDashboardStats(adminId);
  res.json({ success: true, stats });
  ```
- **Query Scoping in `db.js` (`getDashboardStats(adminId)`)**:
  - **SQLite / Drizzle**:
    - When `adminId` provided:
      - Fetch creator events: `t.events.createdBy === adminId`.
      - If 0 events found: return `totalEvents: 0, upcomingEvents: 0, totalRegistrations: 0, confirmedPayments: 0, checkedInCount: 0, totalRevenue: 0, recentRegistrations: []`.
      - Collect `eventIds = new Set(evts.map(e => e.id))`.
      - Count registrations where `eventId in eventIds`.
      - Count confirmed registrations where `registrationStatus === 'confirmed'`.
      - Count attendance where `eventId in eventIds`.
      - Sum payment amounts where `registrationId` belongs to creator's events and `status === 'paid'`.
      - `recentRegistrations = (await this.getAllRegistrations(adminId)).slice(0, 10)`.
    - When `adminId` omitted: compute global platform aggregates.
  - **MongoDB**:
    - When `adminId` provided:
      - `const evts = await mongoModels.Event.find({ created_by: adminId }).lean();`
      - If 0 events found: return zeros.
      - `const eventIds = evts.map(e => e._id);`
      - `totalRegistrations = await mongoModels.Registration.countDocuments({ event_id: { $in: eventIds } });`
      - `confirmedPayments = await mongoModels.Registration.countDocuments({ event_id: { $in: eventIds }, registration_status: 'confirmed' });`
      - `checkedInCount = await mongoModels.Attendance.countDocuments({ event_id: { $in: eventIds } });`
      - Calculate revenue from payments linked to those registrations.
      - `recentRegistrations = (await this.getAllRegistrations(adminId)).slice(0, 10);`

#### 2. `/api/admin/registrations`
- **Controller**: `adminController.js` -> `getAllRegistrations`
- **Scoping Snippet**:
  ```javascript
  const adminId = (req.user && req.user.role !== 'super_admin') ? req.user.id : null;
  const registrations = await dbQuery.getAllRegistrations(adminId);
  res.json({ success: true, count: registrations.length, registrations });
  ```
- **Query Scoping in `db.js` (`getAllRegistrations(adminId)`)**:
  - When `adminId` provided:
    - In SQLite: Fetch events where `t.events.createdBy === adminId`. If none, return `[]`. Filter `t.registrations` by those `eventIds`.
    - In MongoDB: Find events with `{ created_by: adminId }`. If none, return `[]`. Query `mongoModels.Registration.find({ event_id: { $in: eventIds } })`.
  - When `adminId` omitted: return all registrations.

#### 3. `/api/admin/payments`
- **Controller**: `adminController.js` -> `getAllPayments`
- **Scoping Snippet**:
  ```javascript
  const adminId = (req.user && req.user.role !== 'super_admin') ? req.user.id : null;
  const payments = await dbQuery.getAllPayments(adminId);
  res.json({ success: true, count: payments.length, payments });
  ```
- **Query Scoping in `db.js` (`getAllPayments(adminId)`)**:
  - When `adminId` provided:
    - In SQLite: Find creator's events, find registrations for those events, filter payments matching those `registrationId` values.
    - In MongoDB: Find creator's events, find registrations, query `mongoModels.Payment.find({ registration_id: { $in: regIds } })`.
  - When `adminId` omitted: return all payments.

#### 4. `/api/admin/attendance`
- **Controller**: `adminController.js` -> `getAllAttendance`
- **Scoping Snippet**:
  ```javascript
  const adminId = (req.user && req.user.role !== 'super_admin') ? req.user.id : null;
  const attendance = await dbQuery.getAllAttendance(adminId);
  res.json({ success: true, count: attendance.length, attendance });
  ```
- **Query Scoping in `db.js` (`getAllAttendance(adminId)`)**:
  - When `adminId` provided:
    - Filter event attendance records where `event.created_by === adminId`.
    - Strictly exclude global `member_attendance` (gate passes not bound to specific events).
  - When `adminId` omitted:
    - Return all event attendance plus global member gate admissions.

#### 5. `/api/admin/export/*`
- **Controller**: `adminController.js` -> `exportRegistrationsCSV` and `exportPaymentsCSV`
- **Scoping Snippet**:
  ```javascript
  async function exportRegistrationsCSV(req, res, next) {
    try {
      const adminId = (req.user && req.user.role !== 'super_admin') ? req.user.id : null;
      const registrations = await dbQuery.getAllRegistrations(adminId);
      const columns = [
        "registration_number", "guest_name", "guest_email", "guest_phone",
        "event_title", "registration_status", "created_at"
      ];
      const csvString = convertToCSV(registrations, columns);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="registrations_export.csv"');
      res.status(200).send(csvString);
    } catch (err) {
      next(err);
    }
  }

  async function exportPaymentsCSV(req, res, next) {
    try {
      const adminId = (req.user && req.user.role !== 'super_admin') ? req.user.id : null;
      const payments = await dbQuery.getAllPayments(adminId);
      const columns = [
        "razorpay_order_id", "razorpay_payment_id", "guest_name", "guest_email",
        "event_title", "amount", "currency", "status", "paid_at"
      ];
      const csvString = convertToCSV(payments, columns);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="payments_export.csv"');
      res.status(200).send(csvString);
    } catch (err) {
      next(err);
    }
  }
  ```

#### 6. `PUT /api/events/:id` & `DELETE /api/events/:id`
- **Controller**: `eventController.js` -> `updateEvent` and `deleteEvent`
- **Authorization Enforcement**:
  - In `updateEvent`:
    ```javascript
    const existing = await dbQuery.getEventById(req.params.id);
    if (!existing) {
        return res.status(404).json({ success: false, message: 'Event not found.' });
    }
    if (req.user && req.user.role !== 'super_admin' && existing.created_by !== req.user.id) {
        return res.status(403).json({
            success: false,
            message: 'Forbidden. You do not have permission to modify this event.'
        });
    }
    ```
  - In `deleteEvent`:
    ```javascript
    const existing = await dbQuery.getEventById(req.params.id);
    if (!existing) {
        return res.status(404).json({ success: false, message: 'Event not found.' });
    }
    if (req.user && req.user.role !== 'super_admin' && existing.created_by !== req.user.id) {
        return res.status(403).json({
            success: false,
            message: 'Forbidden. You do not have permission to cancel or delete this event.'
        });
    }
    await dbQuery.updateEvent(req.params.id, { status: 'cancelled' });
    res.json({ success: true, message: 'Event cancelled successfully.' });
    ```

#### 7. `GET /api/checkin/events/:id/attendance`
- **Controller**: `checkinController.js` -> `getEventAttendance`
- **Authorization Enforcement**:
  ```javascript
  async function getEventAttendance(req, res, next) {
      try {
          const eventId = req.params.id;
          const event = await dbQuery.getEventById(eventId);
          if (!event) {
              return res.status(404).json({ success: false, message: 'Event not found.' });
          }

          if (req.user && req.user.role !== 'super_admin' && event.created_by !== req.user.id) {
              return res.status(403).json({
                  success: false,
                  message: 'Forbidden. You do not have permission to view attendance for this event.'
              });
          }

          const attendanceList = await dbQuery.getEventAttendance(eventId);
          res.json({ success: true, count: attendanceList.length, attendance: attendanceList });
      } catch (err) {
          next(err);
      }
  }
  ```

#### 8. `GET /api/registrations/:id`
- **Controller**: `registrationController.js` -> `getRegistrationById`
- **Authorization Enforcement**:
  ```javascript
  async function getRegistrationById(req, res, next) {
      try {
          const registration = await dbQuery.getRegistrationById(req.params.id);
          if (!registration) {
              return res.status(404).json({ success: false, message: 'Registration not found.' });
          }

          if (!req.user) {
              return res.status(401).json({
                  success: false,
                  message: 'Authentication required to view registration details.'
              });
          }

          const isSuperAdmin = req.user.role === 'super_admin';
          const isRegisteredGuest = req.user.id === registration.user_id;
          const isEventCreator = registration.event && (
              registration.event.created_by === req.user.id ||
              registration.event.createdBy === req.user.id
          );

          if (!isSuperAdmin && !isRegisteredGuest && !isEventCreator) {
              return res.status(403).json({
                  success: false,
                  message: 'Forbidden. You do not have permission to view this registration.'
              });
          }

          res.json({ success: true, registration });
      } catch (err) {
          next(err);
      }
  }
  ```

#### 9. User Role Escalation & Account Deletion Hardening
- **Controller**: `adminController.js` -> `updateUserRole` and `deleteUser`
- **Enforcement**:
  In `updateUserRole`:
  ```javascript
  if (req.user && req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Forbidden. Only super admins can update user roles.' });
  }
  ```
  In `deleteUser`:
  ```javascript
  if (req.user && req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Forbidden. Only super admins can delete users.' });
  }
  ```

---

## 3. Caveats

1. **Dual Database Engine Consistency**:
   `backend/src/config/db.js` implements both Drizzle (SQLite/PostgreSQL) and Mongoose (MongoDB). All query scoping logic (`getDashboardStats`, `getAllRegistrations`, `getAllPayments`, `getAllAttendance`) must be added to BOTH branches to ensure consistency whether operating in local SQLite mode or MongoDB Atlas mode.
2. **Direct Browser Downloads of CSV Exports**:
   Frontend `AdminRegistrations.jsx` uses `window.open(adminService.exportRegistrationsCSV(), '_blank')` which navigates via a browser window without standard `Authorization: Bearer <token>` headers.
   To prevent 401 Unauthorized errors during CSV export, `authenticateToken` in `backend/src/middleware/auth.js` must be enhanced to accept tokens from the query string:
   ```javascript
   const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;
   ```
3. **Existing Local SQLite Databases**:
   A local database file `backend/local_database.sqlite` may already exist without the `admin_id` column. Wrapping `ALTER TABLE users ADD COLUMN admin_id TEXT;` in a try/catch block inside `initSqliteTables` guarantees zero-downtime schema evolution.
4. **Creator Key Case Mapping in Drizzle**:
   In Drizzle ORM, table column `created_by` is defined as property `createdBy` in JavaScript. `dbQuery.getEvents` and `getEventById` already map `created_by: evt.createdBy`. Controllers should check both `existing.created_by` and `existing.createdBy` to prevent undefined reference bugs.
5. **Event Listing by Creator (`/api/events?created_by=...`)**:
   `dbQuery.getEvents` should support `query.created_by` filtering in both SQLite and MongoDB engines so admin event management views can quickly retrieve only events owned by a specific admin.

---

## 4. Conclusion

1. **Syntax Fix**: Removing the stray closing brace at `adminController.js:122` immediately eliminates the fatal syntax error blocking Jest test execution.
2. **Admin Identifier**: Adding `generateAdminId` to `ticketToken.js`, persisting `admin_id` (`ADM-2026-XXXXXX` / seeded `ADM-0001`/`ADM-0002`), including it in the JWT payload and responses completes the R3 admin identity contract.
3. **Data Isolation Scoping**:
   - `adminController.js`: Pass `adminId = (req.user.role !== 'super_admin') ? req.user.id : null` to `getAdminDashboardStats`, `getAllRegistrations`, `getAllPayments`, `getAllAttendance`, `exportRegistrationsCSV`, and `exportPaymentsCSV`.
   - `eventController.js`: Verify `existing.created_by === req.user.id || req.user.role === 'super_admin'` in `updateEvent` and `deleteEvent`, returning 403 Forbidden on violation.
   - `checkinController.js`: Verify `event.created_by === req.user.id || req.user.role === 'super_admin'` in `getEventAttendance`, returning 403 Forbidden on violation.
   - `registrationController.js`: Require authentication and verify caller is super_admin, registered guest, or event creator in `getRegistrationById`, returning 403 Forbidden on unauthorized requests.
4. **Readiness**: All changes are fully designed, scoped, and ready for clean implementation in Milestone 1 without breaking existing API contracts.

---

## 5. Verification Method

### 5.1 Syntax Verification
Run Node syntax checker on `adminController.js`:
```powershell
cd backend
node -c src/controllers/adminController.js
```
*Expected: Exit code 0 with zero output.*

Run syntax check across all backend files:
```powershell
cd backend
Get-ChildItem -Path src -Filter *.js -Recurse | ForEach-Object { node -c $_.FullName }
```
*Expected: Exit code 0 across all files.*

### 5.2 Automated Multi-Admin Tenancy Test Suite
Add the following comprehensive multi-admin isolation tests to `backend/src/tests/api.test.js`:

1. **Admin Unique Identifier Verification**:
   - Login `admin@eventhub.com` -> verify response `user.admin_id === 'ADM-0001'`.
   - Register a new `event_admin` -> verify response `user.admin_id` matches `/^ADM-2026-\d{6}$/`.
   - Verify JWT decoded payload contains `admin_id`.
2. **Dashboard Metrics Scoping Verification**:
   - Create Event 1 with Admin A. Register 2 guests to Event 1.
   - Create Event 2 with Admin B. Register 1 guest to Event 2.
   - `GET /api/admin/dashboard` with Admin A token -> `stats.totalEvents === 1`, `stats.totalRegistrations === 2`.
   - `GET /api/admin/dashboard` with Admin B token -> `stats.totalEvents === 1`, `stats.totalRegistrations === 1`.
   - `GET /api/admin/dashboard` with Super Admin token -> `stats.totalEvents >= 2`, `stats.totalRegistrations >= 3`.
3. **Registration & Export Scoping Verification**:
   - `GET /api/admin/registrations` with Admin A token -> returns only registrations for Event 1.
   - `GET /api/admin/registrations` with Admin B token -> returns only registrations for Event 2.
   - `GET /api/admin/export/registrations` with Admin A token -> CSV contains only Event 1 attendees.
4. **Payments Scoping Verification**:
   - `GET /api/admin/payments` with Admin A token -> returns only payments for Event 1.
   - `GET /api/admin/payments` with Admin B token -> returns only payments for Event 2.
5. **Cross-Admin Event Mutation Rejection (403 Forbidden)**:
   - `PUT /api/events/:event1_id` with Admin B token -> HTTP 403 Forbidden.
   - `DELETE /api/events/:event1_id` with Admin B token -> HTTP 403 Forbidden.
   - `PUT /api/events/:event1_id` with Admin A token -> HTTP 200 OK.
6. **Cross-Admin Attendance Inspection Rejection (403 Forbidden)**:
   - `GET /api/checkin/events/:event1_id/attendance` with Admin B token -> HTTP 403 Forbidden.
   - `GET /api/checkin/events/:event1_id/attendance` with Admin A token -> HTTP 200 OK.
7. **Registration Detail Access Rejection (403 Forbidden)**:
   - `GET /api/registrations/:registration1_id` with Admin B token -> HTTP 403 Forbidden.
   - `GET /api/registrations/:registration1_id` with Admin A token (creator) -> HTTP 200 OK.
   - `GET /api/registrations/:registration1_id` with unauthenticated request -> HTTP 401 Unauthorized.

### 5.3 Test Execution Command
```powershell
cd backend
npm test
```
*Expected: All test suites pass cleanly with exit code 0.*
