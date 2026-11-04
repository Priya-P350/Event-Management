# Original User Request

## Initial Request — 2026-11-04T06:44:15Z

Implement a multi-step event creation wizard flow, overhaul registration interfaces for a clean and minimal experience, and enforce strict data isolation so guest registration data is private and visible only to the event creator via unique admin identifiers.

Working directory: c:\Users\priya\OneDrive\Desktop\QR
Integrity mode: development

## Requirements

### R1. Multi-Step Event Creation Wizard
Convert the event creation process in `AdminCreateEvent.jsx` (and associated event management endpoints) into a multi-step guided wizard:
- Step 1 (Event Category): Present category selection with preset options (e.g., Tech Summit, ITI Trade Fair, Workshop, Music Gala, Conference) and an option to input a custom category.
- Step 2 (Core Details): Capture event title, venue/location, date, time, and cover image.
- Step 3 (Ticketing & Criteria): Configure pricing, ticket capacity, eligibility / custom criteria, and registration window.
- Step 4 (Review & Publish): Display a consolidated summary of all entered information with a final action to create and persist the event.
The wizard must preserve user inputs across all steps so creators can move backwards and forwards to edit fields without losing data before final submission.

### R2. Minimalist Registration UI
Redesign both the member account registration (`RegisterPage.jsx`) and event guest registration (`GuestRegistration.jsx`) interfaces:
- Remove dense blocks and walls of text, replacing them with a sleek, clean, modern, and minimal design.
- Retain all required form inputs, real-time validation, and submission feedback while reducing visual clutter.

### R3. Event Admin Data Isolation and Unique Identifier
Ensure every admin has a distinct unique identifier associated with their account, and enforce strict data isolation so that guest registration details, attendee records, tickets, and check-in logs are strictly private to the specific event admin who created that event:
- No event admin may access, query, view, or export attendee data, registrations, or event records belonging to another admin.
- Data queries and authorization checks in backend controllers and API endpoints must partition/scope records by the event creator's unique admin identifier to prevent cross-organizer data leakage.
- Platform super-admin (if applicable) retains global oversight, while regular event admins are strictly restricted to their own owned events and attendees.

## Acceptance Criteria

### Event Creation Flow
- [ ] Navigating to event creation displays Step 1 with preset categories (Tech Summit, ITI Trade Fair, Workshop, Music Gala, Conference) and an option for custom category input.
- [ ] Advancing through Step 2 (Core Details) and Step 3 (Ticketing & Criteria) collects respective fields correctly.
- [ ] Stepping backward and forward preserves previously entered values across all steps.
- [ ] Step 4 displays a complete review summary, and confirming creation successfully calls the backend API and creates the event.

### Registration Interfaces
- [ ] `RegisterPage.jsx` renders a clean, uncluttered registration form free of dense text blocks.
- [ ] `GuestRegistration.jsx` renders a minimal, focused registration form free of text walls.
- [ ] Form submission, error validation handling, and post-registration confirmation/navigation work reliably on both screens.

### Admin Data Isolation & Privacy
- [ ] Each admin account is associated with a distinct unique identifier.
- [ ] Guest registrations, attendee records, tickets, and check-in logs are accessible and visible exclusively to the event admin who created that event.
- [ ] API endpoints for event attendees, registrations, and exports reject unauthorized access attempts by other event admins.
- [ ] Admin dashboard, registrations, and attendee lists display only events and guest data owned by the authenticated admin.

### Verification & Regression
- [ ] Frontend builds cleanly with zero compilation errors (`npm run build` in `frontend`).
- [ ] Existing automated tests pass (`npm test` in `backend`).

## Verification Resources
- Backend tests: `backend/src/tests/api.test.js` runnable via `npm test` in `backend`.
- Frontend build check: `npm run build` in `frontend`.
