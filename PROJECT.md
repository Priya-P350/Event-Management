# Project: Event Platform Overhaul (Wizard, Minimalist UI, & Admin Data Isolation)

## Architecture
Fullstack Node.js / React event management platform with digital QR passes, attendance scanning, and role-based administration.
- **Backend**: Express.js REST API with dual ORM/database engine (Drizzle SQLite for lightweight/embedded persistence, Mongoose MongoDB for document persistence). JWT-based authentication with role-based access control (`guest`, `scanner_staff`, `event_admin`, `super_admin`).
- **Frontend**: Vite + React 18 SPA, React Router DOM v6, React Hook Form v7, Tailwind CSS with custom Oceanic color tokens (`#0B1928`, `#122538`, `#1E394E`, `#2B4E66`, `#4A96BA`, `#95B8C9`, `#E5F4F9`), and Lucide icons.
- **Data Flow**:
  - Event Admin creates event via 4-step wizard -> `POST /api/events` (sets `created_by: req.user.id`).
  - Guests register for events -> `POST /api/registrations` (links `event_id`).
  - Attendance check-in -> `POST /api/checkin/scan` (validates QR pass against `event_id`).
  - Admin queries (/dashboard, /registrations, /payments, /attendance, exports) -> scoped by `event.created_by === req.user.id` for `event_admin`, unrestricted for `super_admin`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Stray Syntax Error Fix | Remove extra closing brace at `backend/src/controllers/adminController.js:122` | M1 | Survey 1, 3 |
| 2 | Unique Admin Identifier (`admin_id`) | Assign distinct business identifier (e.g. `ADM-2026-XXXXXX` / `ADM-0001`) to all admin accounts in schema, registration, login, and JWT | M1 | Survey 1, R3 |
| 3 | Admin Data Isolation: Dashboard | Scope `/api/admin/dashboard` metrics, revenue, and recent registrations strictly to events owned by the authenticated admin (`created_by`) | M1 | Survey 1, R3 |
| 4 | Admin Data Isolation: Registrations & Attendees | Scope `/api/admin/registrations` and attendee lists to events owned by the authenticated admin | M1 | Survey 1, R3 |
| 5 | Admin Data Isolation: CSV Exports | Scope `/api/admin/export/registrations` and `/api/admin/export/payments` to owned events only | M1 | Survey 1, R3 |
| 6 | Admin Data Isolation: Payments & Financials | Scope `/api/admin/payments` transactions strictly to events created by the authenticated admin | M1 | Survey 1, R3 |
| 7 | Admin Data Isolation: Attendance Logs | Scope `/api/admin/attendance` check-in logs and `/api/checkin/events/:id/attendance` to owned events (403 for unauthorized event admins) | M1 | Survey 1, R3 |
| 8 | Event Mutation Authorization | Ensure `PUT /api/events/:id` and `DELETE /api/events/:id` reject unauthorized event admins with 403 Forbidden | M1 | Survey 1, R3 |
| 9 | Multi-Admin Tenancy Automated Tests | Add tests in `backend/src/tests/api.test.js` validating cross-admin isolation, unique identifiers, and 403 rejections | M1 | Survey 1, Acceptance Criteria |
| 10 | Member Registration Redesign (`RegisterPage.jsx`) | Remove 5-column marketing sidebar, text walls, and clutter; center single card; fix `RadioCardsField` state binding; preserve all 6 inputs, validations, and QR pass generation | M2 | Survey 3, R2 |
| 11 | Guest Registration Redesign (`GuestRegistration.jsx`) | Remove asymmetric 3-col layout and developer jargon; add compact event summary strip; preserve all inputs, validations, free pass issuance, and Razorpay flow | M2 | Survey 3, R2 |
| 12 | Event Creation Wizard: Step 1 (Category) | Preset selection (`Tech Summit`, `ITI Trade Fair`, `Workshop`, `Music Gala`, `Conference`) + Custom Category input with dynamic binding | M3 | Survey 2, R1 |
| 13 | Event Creation Wizard: Step 2 (Core Details) | Title, venue, address, date, time, cover image with preview, description, map URL with validation | M3 | Survey 2, R1 |
| 14 | Event Creation Wizard: Step 3 (Ticketing & Criteria) | Pricing, capacity, registration window (open/close dates), custom criteria/eligibility (`iti_eligibility`, `iti_trade`, `iti_institute`), status | M3 | Survey 2, R1 |
| 15 | Event Creation Wizard: Step 4 (Review & Publish) | Consolidated review summary with section jump/edit links, and final creation action calling `eventService.createEvent` | M3 | Survey 2, R1 |
| 16 | Event Creation Wizard: State Preservation | Continuous form state preservation across forward and backward step navigation without data loss | M3 | Survey 2, R1 |
| 17 | Final Build & Regression Verification | Verify zero frontend build errors (`npm run build`) and 100% backend test pass (`npm test`) | M4 | Survey 1, 2, 3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Backend Admin Unique Identifier & Strict Data Isolation (R3) | Fix syntax error, introduce `admin_id`, enforce data isolation across all admin queries and controllers, add automated tests in `backend/src/tests/api.test.js` | none | IN_PROGRESS |
| 2 | Minimalist Registration UI Overhaul (R2) | Redesign `RegisterPage.jsx` and `GuestRegistration.jsx` to clean, modern, minimal interfaces without text walls while preserving all inputs, validations, and flows | M1 | PLANNED |
| 3 | Multi-Step Event Creation Wizard (R1) | Convert `AdminCreateEvent.jsx` into 4-step guided wizard with presets + custom category, core details, ticketing & criteria, review summary, and backward/forward state preservation | M1 | PLANNED |
| 4 | Comprehensive End-to-End Verification & Regression | Full test suite execution, frontend build verification, and acceptance criteria audit | M1, M2, M3 | PLANNED |

## Interface Contracts

### Admin Account & JWT Payload
```typescript
interface AdminUser {
  id: string; // UUID
  admin_id: string; // e.g. "ADM-2026-XXXXXX" or "ADM-0001"
  name: string;
  email: string;
  role: 'event_admin' | 'super_admin';
}

interface JwtPayload {
  id: string;
  admin_id?: string;
  name: string;
  email: string;
  role: string;
}
```

### Scoped Database Queries (`dbQuery`)
```typescript
getDashboardStats(adminId?: string): Promise<DashboardStats>
getAllRegistrations(adminId?: string): Promise<Registration[]>
getAllPayments(adminId?: string): Promise<Payment[]>
getAllAttendance(adminId?: string): Promise<AttendanceLog[]>
getEvents(filters?: { created_by?: string; category?: string }): Promise<Event[]>
```
- If caller is `super_admin` (`adminId` omitted or undefined): Return global platform records.
- If caller is `event_admin` (`adminId` provided): Filter strictly where `event.created_by === adminId`.

### Event Creation Payload (`POST /api/events`)
```typescript
interface CreateEventPayload {
  title: string;
  description: string;
  category: string; // "Tech Summit" | "ITI Trade Fair" | "Workshop" | "Music Gala" | "Conference" | string
  cover_image_url?: string;
  event_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  address: string;
  google_maps_url?: string;
  ticket_price: number;
  capacity: number;
  registration_open_at?: string;
  registration_close_at?: string;
  status: 'registration_open' | 'draft' | 'completed' | 'cancelled';
  iti_institute?: string;
  iti_trade?: string;
  iti_eligibility?: string;
}
```

## Code Layout
- `backend/src/controllers/adminController.js`: Dashboard stats, registration lists, payments, exports, user role management.
- `backend/src/controllers/eventController.js`: Event CRUD, creator assignment, update/delete authorization checks.
- `backend/src/controllers/checkinController.js`: QR ticket scanning, event attendance list authorization.
- `backend/src/controllers/registrationController.js`: Registration creation, ticket generation, registration detail scoping.
- `backend/src/controllers/authController.js`: User/Admin registration, login, JWT token generation with `admin_id`.
- `backend/src/utils/ticketToken.js`: Unique identifier generation (`generateAdminId`).
- `backend/src/config/db.js`: Database queries with `adminId` filtering for Drizzle and MongoDB.
- `backend/src/tests/api.test.js`: Automated API test suite with multi-admin isolation tests.
- `frontend/src/pages/RegisterPage.jsx`: Member account registration and digital QR pass.
- `frontend/src/pages/GuestRegistration.jsx`: Event guest registration with free/paid checkout.
- `frontend/src/pages/admin/AdminCreateEvent.jsx`: 4-step event creation wizard flow.
