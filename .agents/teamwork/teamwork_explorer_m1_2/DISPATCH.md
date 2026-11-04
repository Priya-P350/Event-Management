## 2026-11-04T07:01:23Z
You are teamwork_explorer_m1_2.
Working directory: c:\Users\priya\OneDrive\Desktop\QR\.agents\teamwork\teamwork_explorer_m1_2
Original request path: c:\Users\priya\OneDrive\Desktop\QR\.agents\teamwork\ORIGINAL_REQUEST.md

MANDATORY: Read c:\Users\priya\OneDrive\Desktop\QR\.agents\teamwork\ORIGINAL_REQUEST.md and c:\Users\priya\OneDrive\Desktop\QR\PROJECT.md before starting your investigation.
Also read survey findings in c:\Users\priya\OneDrive\Desktop\QR\.agents\teamwork\teamwork_explorer_survey_1\handoff.md.

Task:
Investigate backend controllers, auth, and authorization checks for Milestone 1:
1. Examine `backend/src/controllers/adminController.js`, `eventController.js`, `checkinController.js`, `registrationController.js`, and `authController.js`.
2. Locate the syntax error on line 122 of `adminController.js` and specify the exact fix.
3. Detail how `admin_id` (e.g. `ADM-2026-XXXXXX` / `ADM-0001`) will be generated (via `ticketToken.js`), assigned upon registration/seeding, included in JWT payload/auth responses, and returned to client.
4. Detail authorization scoping in all endpoints:
   - `/api/admin/dashboard`: pass `req.user.id` if `req.user.role !== 'super_admin'`.
   - `/api/admin/registrations`: pass `req.user.id` if not super_admin.
   - `/api/admin/payments`: pass `req.user.id` if not super_admin.
   - `/api/admin/attendance`: pass `req.user.id` if not super_admin.
   - `/api/admin/export/*`: pass `req.user.id` if not super_admin.
   - `PUT /api/events/:id` & `DELETE /api/events/:id`: verify `event.created_by === req.user.id` (or super_admin), returning 403 Forbidden otherwise.
   - `GET /api/checkin/events/:id/attendance`: verify event ownership (or super_admin), returning 403 Forbidden otherwise.
   - `GET /api/registrations/:id`: verify caller is registered guest, event creator, or super_admin.
5. Document recommended implementation strategy in `c:\Users\priya\OneDrive\Desktop\QR\.agents\teamwork\teamwork_explorer_m1_2\handoff.md`.
Do NOT modify any source code files. Send a message when finished.
