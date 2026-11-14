# Project: EventHub Fullstack Audit, Remediation & Automated Test Suite

## Architecture
Fullstack Node.js / Express / React event management platform with digital QR passes, attendance scanning, multi-tenant organizer isolation, and dual database support (Drizzle SQLite and Mongoose MongoDB).
- **Backend**: Express.js REST API with JWT authentication, RBAC (`guest`, `scanner_staff`, `event_admin`, `super_admin`), multi-tenant data scoping by `created_by` / `admin_id`.
- **Frontend**: Vite + React 18 SPA, React Router DOM v6, React Hook Form v7, Tailwind CSS with Oceanic theme tokens (`#0B1928`, `#122538`, `#1E394E`, `#2B4E66`, `#4A96BA`, `#95B8C9`, `#E5F4F9`), and Lucide icons.
- **Data Flow**:
  - Registration / Auth -> `POST /api/auth/register` (strictly creates `guest`), `POST /api/auth/login` (issues JWT with `id`, `role`, `member_id`, `admin_id`).
  - Event Management -> `POST /api/events`, `GET /api/events`, `GET /api/events/:id`, `PUT /api/events/:id`, `DELETE /api/events/:id`.
  - Registration & Passes -> `POST /api/registrations` (checks capacity, generates `REG-2026-XXXXXX` and digital pass `EVT-2026-XXXXXX`), `GET /api/tickets/:token`.
  - Gate Check-in -> `POST /api/checkin/scan` (requires `scanner_staff`, `event_admin`, or `super_admin`; enforces event ownership for event admins; atomically expires pass and blocks duplicate entries with `409 ALREADY_USED`).
  - Admin & Isolation -> `/api/admin/*` (dashboard metrics, registrations, payments, attendance, and CSV exports strictly scoped to events owned by authenticated admin; `/api/admin/users` restricted to `super_admin`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Auth Role Self-Escalation Fix | Enforce public registration defaults strictly to `guest`; reject or strip privileged roles (`super_admin`, `event_admin`, `scanner_staff`) from unauthenticated requests | M1 | Survey 1, R1.1 |
| 2 | Member ID Uniqueness & Retry Loop | Add UNIQUE constraints in SQLite, Postgres, and Mongo schemas; implement collision retry loop for `member_id` (`MEM-2026-XXXXXX`) | M1 | Survey 1, R1.1 |
| 3 | Super Admin `admin_id` Collision Fix | Prevent hardcoded `ADM-0001` crash on login when non-primary super admins log in; assign unique `admin_id` dynamically | M1 | Survey 1, R1.1 |
| 4 | Gate Check-in Authentication & RBAC | Replace `optionalAuth` on `POST /api/checkin/scan` with `authenticateToken, requireStaffOrAdmin`; block unauthenticated or guest check-in attempts | M1 | Survey 2, R1.4 |
| 5 | Gate Check-in Organizer Data Isolation | In `POST /api/checkin/scan`, verify that `event_admin` can only scan tickets for events they created (`created_by === req.user.id`); return 403 Forbidden otherwise | M1 | Survey 2, R1.4, R1.5 |
| 6 | Gate Check-in SQLite Concurrency Fix | Handle SQLite duplicate attendance unique constraint collisions gracefully in `processCheckinAtomic`, returning `409 ALREADY_USED` instead of unhandled 500 | M1 | Survey 2, R1.4 |
| 7 | Global User Data Isolation (`/api/admin/users`) | Restrict `GET /api/admin/users` strictly to `super_admin`; return 403 Forbidden to regular `event_admin` to prevent cross-tenant data leakage | M1 | Survey 2, R1.5 |
| 8 | Payment Refund Tenant Authorization | Verify event ownership in `POST /api/admin/refund` so `event_admin` can only refund payments for their own events; return 403 Forbidden otherwise | M1 | Survey 2, R1.5 |
| 9 | Gallery Image Delete Argument & Ownership Fix | Fix argument passing to `dbQuery.deleteEventImage(eventId, imageId)` and enforce event creator authorization | M1 | Survey 2, R1.5 |
| 10 | Capacity Oversubscription Race Condition Fix | Account for active pending checkout registrations in `seats_remaining` calculation; add capacity verification gate in `paymentController.verifyPayment` before confirming | M2 | Survey 1, R1.2 |
| 11 | ITI Metadata Unpacking in SQLite | Automatically unpack `---ITI_META---` JSON delimiters in `dbQuery.getEvents` and `getEventById` so `iti_trade`, `iti_institute`, and `iti_eligibility` populate cleanly | M2 | Survey 1, R1.2 |
| 12 | Public Event Directory Default Status | Default unauthenticated requests to `GET /api/events` to `status = 'registration_open'`, hiding draft and cancelled events | M2 | Survey 1, R1.2 |
| 13 | Ticket & Registration Number Collision Retry | Wrap `ticket_number` (`EVT-2026-XXXXXX`) and `registration_number` (`REG-2026-XXXXXX`) creation in retry loops to prevent duplicate key 500 errors | M2 | Survey 1, R1.3 |
| 14 | Cross-Database Ticket Lookup Parity | Support ticket UUID lookup in SQLite `getTicketByToken` to match MongoDB functionality | M2 | Survey 1, R1.3 |
| 15 | Scanner Staff Registration Details Access | Allow `scanner_staff` to access `GET /api/registrations/:id` for gate attendee verification | M2 | Survey 1, R1.3, R1.4 |
| 16 | Automatic Offline Stubs for Resend & Razorpay | Add `NODE_ENV === 'test'` automatic stub guards in `config/resend.js` and `config/razorpay.js` to guarantee no live external calls in test environments | M2 | Survey 1, Survey 2, R3 |
| 17 | Admin CSV Export Token Authentication | Append `?token=${token}` to CSV export URLs in `serviceModules.js` so `window.open` downloads CSVs with HTTP 200 rather than failing with 401 | M3 | Survey 3, R1.6 |
| 18 | Register Role Radio Card State Highlight | Pass `value={selectedRole}` and `onChange` to `RadioCardsField` in `RegisterPage.jsx` so account type cards visually highlight on selection | M3 | Survey 3, R1.6 |
| 19 | Countdown Timer Date Parsing Robustness | Normalize date/time strings and add `isNaN(difference)` fallback in `CountdownTimer.jsx` to prevent NaN display | M3 | Survey 3, R1.6 |
| 20 | Homepage Featured Event Dynamic Link | Dynamically link featured card on `Home.jsx` to `events[0]?.id || '/events'` rather than hardcoded stale UUID | M3 | Survey 3, R1.6 |
| 21 | Homepage Free Ticket Badge Consistency | Display `'FREE ENTRY'` on `Home.jsx` when `ticket_price === 0` to match Event Directory badge | M3 | Survey 3, R1.6 |
| 22 | Axios 401 Session Expiry Interceptor | Handle 401 in `api.js` response interceptor to clear `localStorage` token and redirect gracefully | M3 | Survey 3, R1.6 |
| 23 | Jest Test Runner Concurrency Fix | Update `backend/package.json` test script with `--runInBand` to prevent SQLite file lock contention and timeouts | M4 | Survey 2, R3 |
| 24 | Seed SQLite Missing Test Ticket | Seed ticket `t1111111-1111-1111-1111-111111111111` in `seedSqliteData` so `api.test.js` checkin test passes reliably | M4 | Survey 2, R3 |
| 25 | Comprehensive Automated Test Expansion | Expand automated integration tests in `backend/src/tests/` to verify all 6 components (RBAC, capacity, tickets, duplicate checkin 409, multi-tenant isolation, external stubs) with 100% pass | M4 | Survey 2, Acceptance Criteria |
| 26 | Final Fullstack Verification Gate | Verify 100% test pass on backend (`npm test`) and 100% clean production build on frontend (`npm run build`) | M4 | Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Backend Security, RBAC & Multi-Tenant Data Isolation | Features 1–9: Auth role self-escalation fix, member_id uniqueness, admin_id collision fix, check-in scan auth & organizer isolation, check-in race condition fix, admin users super_admin restriction, refund isolation, gallery delete fix | none | IN_PROGRESS |
| 2 | Event Management, Ticketing & Capacity Integrity | Features 10–16: Capacity oversubscription fix, ITI metadata unpacking, public events status filter, ticket/reg collision retry loops, SQLite ticket lookup by ID, scanner staff registration view, automatic Resend & Razorpay test stubs | M1 | PLANNED |
| 3 | Frontend UI, Form Workflows & Export Remediation | Features 17–22: Admin CSV export token URL fix, RegisterPage radio card visual highlight, CountdownTimer NaN fix, Home.jsx dynamic link & badge consistency, Axios 401 interceptor, frontend build verification | none | PLANNED |
| 4 | Comprehensive Automated Test Expansion & Final Verification | Features 23–26: Jest runner --runInBand fix, SQLite seed ticket fix, comprehensive unit & integration tests covering all 6 components with 100% pass, final frontend build verification | M1, M2, M3 | PLANNED |

## Interface Contracts

### Authenticated Check-in Request (`POST /api/checkin/scan`)
- **Headers**: `Authorization: Bearer <token>`
- **Authorized Roles**: `scanner_staff`, `event_admin`, `super_admin`
- **Request Body**: `{ "ticketToken": string, "eventId"?: string }`
- **Responses**:
  - `200 OK`: `{ "success": true, "code": "ENTRY_APPROVED", "title": "ADMISSION GRANTED", "ticket": { ... } }`
  - `401 Unauthorized`: Token missing or invalid.
  - `403 Forbidden`: Role is `guest`, or `event_admin` is scanning ticket for an event they do not own (`ticket.event.created_by !== req.user.id`).
  - `404 Not Found`: Ticket token does not exist.
  - `409 Conflict`: Ticket already used (`code: "ALREADY_USED"`).

### Admin CSV Export Endpoints
- **Endpoints**: `GET /api/admin/export/registrations`, `GET /api/admin/export/payments`
- **Authentication**: Accepts Bearer header or `?token=<jwt_token>` query parameter.
- **Access Control**: Scoped by `admin_id` (`event.created_by === req.user.id`) for `event_admin`, global for `super_admin`.

### Capacity Check Contract (`seats_remaining`)
```typescript
seats_remaining = Math.max(0, event.capacity - (confirmed_registrations + active_pending_registrations))
```
- In `verifyPayment`, if `seats_remaining <= 0`, payment is marked for refund and registration returns 400 SOLD OUT.

## Code Layout
- `backend/src/controllers/authController.js`: Registration role validation, login, member_id and admin_id generation.
- `backend/src/controllers/checkinController.js`: QR ticket scanning, organizer authorization, atomic check-in transitions.
- `backend/src/controllers/adminController.js`: Admin metrics, user list (super_admin only), payments, refunds with ownership checks.
- `backend/src/controllers/eventController.js`: Event CRUD, status filtering, ITI metadata unpacking.
- `backend/src/controllers/registrationController.js`: Free/paid registrations, ticket generation, collision retry loops.
- `backend/src/controllers/paymentController.js`: Razorpay order creation, payment verification with capacity check.
- `backend/src/controllers/galleryController.js`: Event gallery image management with ownership checks.
- `backend/src/routes/checkinRoutes.js`: Scan route middleware (`authenticateToken, requireStaffOrAdmin`).
- `backend/src/routes/adminRoutes.js`: Admin routes middleware (`requireRole(['super_admin'])` for `/users`).
- `backend/src/config/db.js`: Database queries, schema migrations, seed functions, transaction/retry helpers.
- `backend/src/config/resend.js`: Resend client with test environment auto-stub.
- `backend/src/config/razorpay.js`: Razorpay client with test environment auto-stub.
- `backend/src/tests/`: Automated unit and integration test suites.
- `frontend/src/services/serviceModules.js`: API service functions with token query params for exports.
- `frontend/src/pages/RegisterPage.jsx`: Member registration with radio card state binding.
- `frontend/src/components/CountdownTimer.jsx`: Date calculation with robust time parsing.
- `frontend/src/pages/Home.jsx`: Dynamic featured event card and price badge.
- `frontend/src/services/api.js`: Axios client and response interceptors.
