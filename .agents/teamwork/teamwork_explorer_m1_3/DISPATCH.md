## 2026-11-04T07:01:35Z
You are teamwork_explorer_m1_3.
Working directory: c:\Users\priya\OneDrive\Desktop\QR\.agents\teamwork\teamwork_explorer_m1_3
Original request path: c:\Users\priya\OneDrive\Desktop\QR\.agents\teamwork\ORIGINAL_REQUEST.md

MANDATORY: Read c:\Users\priya\OneDrive\Desktop\QR\.agents\teamwork\ORIGINAL_REQUEST.md and c:\Users\priya\OneDrive\Desktop\QR\PROJECT.md before starting your investigation.
Also read survey findings in c:\Users\priya\OneDrive\Desktop\QR\.agents\teamwork\teamwork_explorer_survey_1\handoff.md.

Task:
Investigate and design automated test suites in `backend/src/tests/api.test.js` for Milestone 1:
1. Examine existing tests in `backend/src/tests/api.test.js` and identify how Jest runs them.
2. Design comprehensive tests covering R3:
   - Registration and login of two separate event admins (Admin A, Admin B) and super admin.
   - Verification of distinct unique `admin_id` format on both admins.
   - Event creation by Admin A (Event A) and Admin B (Event B).
   - Guest registration to Event A and Event B.
   - Scoped dashboard check: Admin A sees only Event A data, Admin B sees only Event B data, Super Admin sees both.
   - Scoped registrations list check: Admin A sees only Event A attendees, Admin B sees only Event B attendees, Super Admin sees all.
   - Scoped CSV export check: Admin A's export contains only Event A attendees.
   - Cross-organizer mutation protection: Admin B attempting `PUT /api/events/:eventA_id` or `DELETE /api/events/:eventA_id` receives 403 Forbidden.
   - Cross-organizer attendance check: Admin B requesting `/api/checkin/events/:eventA_id/attendance` receives 403 Forbidden.
3. Formulate how to keep tests robust, self-contained, and free of open handles.
4. Document the recommended test implementation strategy in `c:\Users\priya\OneDrive\Desktop\QR\.agents\teamwork\teamwork_explorer_m1_3\handoff.md`.
Do NOT modify any source code files. Send a message when finished.
