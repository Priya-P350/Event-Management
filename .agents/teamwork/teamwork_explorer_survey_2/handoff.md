# Investigation & Architectural Survey Report: Frontend Multi-Step Event Creation Wizard (R1)

**Investigator Agent:** `teamwork_explorer_survey_2`  
**Working Directory:** `c:\Users\priya\OneDrive\Desktop\QR\.agents\teamwork\teamwork_explorer_survey_2`  
**Scope:** R1 Multi-Step Event Creation Wizard, `AdminCreateEvent.jsx`, Frontend Build & Dependencies, Backend Event Creation API Compatibility.

---

## 1. Observation

### 1.1 Existing `AdminCreateEvent.jsx` Implementation
- **File Location:** `frontend/src/pages/admin/AdminCreateEvent.jsx` (322 lines).
- **Current Flow:** A single monolithic form on a single page, rendering all fields simultaneously inside one `<form>` container.
- **Form Management:** Uses `useForm` from `react-hook-form` (lines 13-40) initialized with hardcoded default values:
  ```javascript
  // frontend/src/pages/admin/AdminCreateEvent.jsx:20-40
  defaultValues: {
    title: '',
    description: '',
    category: 'ITI & Vocational',
    cover_image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
    event_date: '2026-11-15',
    start_time: '09:30',
    end_time: '17:00',
    venue: 'Govt ITI Main Campus Auditorium',
    address: 'Plot 12, Industrial Training Zone, Technical Campus',
    google_maps_url: 'https://maps.google.com',
    ticket_price: 0,
    capacity: 500,
    registration_open_at: '2026-10-01',
    registration_close_at: '2026-11-10',
    status: 'registration_open',
    iti_institute: 'Government Industrial Training Institute (Govt ITI)',
    iti_trade: 'Electrician, Fitter, Welder, COPA, Machinist, Motor Mechanic',
    iti_eligibility: '10th / 12th Pass + ITI NCVT/SCVT Certificate'
  }
  ```
- **Category Options:** Hardcoded dropdown options in a standard `<SelectField>` (lines 83-89):
  - `'ITI & Vocational'`, `'Technology'`, `'Music'`, `'Business'`, `'Education'`.
  - Missing the preset options required by R1 (`Tech Summit`, `ITI Trade Fair`, `Workshop`, `Music Gala`, `Conference`) and lacks an input mechanism for custom categories.
- **Form Submission & API Request (lines 65-81):**
  ```javascript
  const onSubmit = async (data) => {
    try {
      const formattedData = {
        ...data,
        ticket_price: parseFloat(data.ticket_price || 0),
        capacity: parseInt(data.capacity || 100, 10)
      };

      const res = await eventService.createEvent(formattedData);
      if (res.success) {
        toast.success('Event published successfully!');
        navigate('/admin/events');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create event');
    }
  };
  ```
- **Navigation & Routing:**
  - Route defined in `frontend/src/App.jsx:89`: `<Route path="/admin/events/create" element={<AdminCreateEvent />} />`.
  - Linked from `AdminEvents.jsx:46`, `AdminLayout.jsx:43`, `AdminDashboard.jsx:49`, and `EventDirectory.jsx:54`.
  - On submission success, navigates to `/admin/events`.
  - Back button (line 102) navigates to `/admin/events`.

### 1.2 Frontend Build & Dependencies
- **Build Tooling:** Vite v5.4.2, React 18.3.1, React-DOM 18.3.1, React Router DOM 6.26.1, React Hook Form 7.89.0 (`frontend/package.json`).
- **Icons & Styling:**
  - `lucide-react` v0.439.0 installed.
  - Tailwind CSS v3.4.10 configured with custom oceanic/forest palette tokens (`#0B1928`, `#122538`, `#1E394E`, `#4A96BA`, `#95B8C9`, `#E5F4F9`).
  - Global CSS rule in `frontend/src/index.css:6-9`: `box-shadow: none !important;`.
- **Build Verification:**
  - Executed command: `npm run build` in `frontend`.
  - Result: Exit code 0, 1692 modules transformed, built in 19.29s (`dist/index.html` 1.26 kB, `dist/assets/index-CHQQHBZ8.css` 50.85 kB, `dist/assets/index-VN1to0DD.js` 828.54 kB).

### 1.3 Backend Event Creation API & Schema Compatibility
- **API Endpoint:** `POST /api/events` handled by `backend/src/routes/eventRoutes.js:9` with middleware `authenticateToken, requireAdmin` and controller `eventController.createEvent`.
- **Payload Handling in `backend/src/controllers/eventController.js:25-75`:**
  - Destructures from `req.body`:
    - `title`, `description`, `category`, `cover_image_url`, `event_date`, `start_time`, `end_time`, `venue`, `address`, `google_maps_url`, `ticket_price`, `capacity`, `registration_open_at`, `registration_close_at`, `status`, `iti_trade`, `iti_institute`, `iti_eligibility`.
  - Mandatory backend validation:
    ```javascript
    // backend/src/controllers/eventController.js:35-37
    if (!title || !event_date || !venue || !address) {
        return res.status(400).json({ success: false, message: 'Title, event date, venue, and address are required.' });
    }
    ```
  - Eligibility & Trade metadata serialization:
    ```javascript
    // backend/src/controllers/eventController.js:40-48
    if (iti_trade || iti_institute || iti_eligibility) {
        const metaStr = JSON.stringify({
            trade: iti_trade || '',
            institute: iti_institute || '',
            eligibility: iti_eligibility || ''
        });
        finalDescription = finalDescription.replace(/---ITI_META---[\s\S]*?---END_ITI_META---\n?/g, '');
        finalDescription = `---ITI_META---\n${metaStr}\n---END_ITI_META---\n${finalDescription.trim()}`;
    }
    ```
  - Database persistence: Invokes `dbQuery.createEvent(newEvent)`. Both PostgreSQL/SQLite (`backend/src/db/schema.js`) and MongoDB (`backend/src/models/Event.js`) have matching schemas.
  - Response: Returns HTTP 201 with `{ success: true, message: 'Event created successfully.', event: created }`.
- **Backend Test Status Observation:**
  - Executed command: `npm test` in `backend`.
  - Result: Failed with exit code 1 due to a syntax error in `backend/src/controllers/adminController.js:122` (an extra closing brace `}` at line 122). Note: This does not affect `eventController.js`, but must be resolved before test verification.

---

## 2. Logic Chain

1. **Mapping R1 to Frontend Multi-Step Wizard Architecture:**
   - From Observation 1.1, `AdminCreateEvent.jsx` is currently a single page form with all inputs crammed into one view.
   - R1 explicitly requires converting this into a 4-step guided wizard:
     - **Step 1 (Event Category):** Preset categories (`Tech Summit`, `ITI Trade Fair`, `Workshop`, `Music Gala`, `Conference`) + Custom Category text input.
     - **Step 2 (Core Details):** Event title, venue/location, date, time, cover image, and description.
     - **Step 3 (Ticketing & Criteria):** Pricing, ticket capacity, eligibility / custom criteria, registration window, and initial status.
     - **Step 4 (Review & Publish):** Consolidated summary preview with section edit shortcuts and a final "Publish Event" submission button.

2. **State Preservation Across Backward/Forward Navigation:**
   - From Observation 1.1, React Hook Form `useForm` manages form values.
   - If form step subcomponents unmount, or if separate form instances are used per step, data loss occurs upon backward navigation.
   - To guarantee zero data loss:
     - Keep a single `useForm` instance at the top-level `AdminCreateEvent` component.
     - Maintain an active step indicator state: `const [step, setStep] = useState(1);`.
     - Render step panels with conditional display classes (e.g. `step === 1 ? 'block' : 'hidden'`) or keep all registered values active without unmounting/resetting.
     - Provide a stepper header showing 4 stages (1: Category, 2: Core Details, 3: Ticketing & Criteria, 4: Review). Users can click previously visited steps or use "Back" and "Next" buttons without resetting any field values.

3. **Step 1 Design & Field Dynamics:**
   - Preset cards for:
     1. `Tech Summit` (Icon: `Cpu` / `Laptop`, badge: `Tech & AI`, default cover image option)
     2. `ITI Trade Fair` (Icon: `Award` / `Wrench`, badge: `Vocational & Skills`)
     3. `Workshop` (Icon: `Sparkles` / `BookOpen`, badge: `Hands-on Training`)
     4. `Music Gala` (Icon: `Music`, badge: `Entertainment & Live`)
     5. `Conference` (Icon: `Users`, badge: `Keynotes & Panels`)
     6. `Custom Category` (Icon: `Plus` / `Edit3`, badge: `Custom Domain`)
   - If the user selects "Custom Category" or clicks a custom toggle, a text input `custom_category` appears, bound to the `category` form field.
   - Category validation: Ensures a category is selected/entered before clicking "Next: Core Details".

4. **Step 2 Design & Validation:**
   - Collects:
     - `title` (required)
     - `venue` (required)
     - `address` (required)
     - `event_date` (required)
     - `start_time` & `end_time` (time inputs)
     - `cover_image_url` (url input with image preview)
     - `description` (multiline textarea)
     - `google_maps_url` (optional)
   - Step 2 Validation: Triggered on clicking "Next: Ticketing & Criteria" to ensure `title`, `event_date`, `venue`, and `address` are valid per backend requirements observed in Observation 1.3 (`backend/src/controllers/eventController.js:36`).

5. **Step 3 Design & Criteria Configuration:**
   - Collects:
     - `ticket_price`: number (₹), min 0 (0 for Free admission)
     - `capacity`: number, min 1 (default 100 or 500)
     - `registration_open_at`: date (Registration start date)
     - `registration_close_at`: date (Registration deadline)
     - `iti_eligibility`: text (Eligibility / Custom Criteria, e.g. "Open to All", "Students & Working Professionals", "10th/12th Pass + ITI NCVT")
     - `iti_trade`: text (Eligible Trades / Streams / Departments)
     - `iti_institute`: text (Host Organization / College / Campus)
     - `status`: select ('registration_open', 'draft', 'published')
   - Step 3 Validation: Price must be >= 0, capacity >= 1.

6. **Step 4 Design & Submission Execution:**
   - Consolidates all entered data into a modern review interface:
     - Visual poster preview card with category badge, title, date, time, and venue.
     - Section cards: Ticketing breakdown, Eligibility & Criteria breakdown, Description & Address details.
     - Edit shortcuts (e.g. "Edit Category", "Edit Details", "Edit Criteria") allowing users to jump back directly to any step.
     - Final "Publish Event" button that calls `eventService.createEvent(formattedData)` as observed in Observation 1.1.
     - Upon API response `res.success === true`, issues `toast.success` and redirects to `/admin/events`.

7. **Backend Payload Compatibility:**
   - From Observation 1.3, every single field collected across Steps 1-3 (`title`, `description`, `category`, `cover_image_url`, `event_date`, `start_time`, `end_time`, `venue`, `address`, `google_maps_url`, `ticket_price`, `capacity`, `registration_open_at`, `registration_close_at`, `status`, `iti_trade`, `iti_institute`, `iti_eligibility`) is already accepted, processed, and persisted by `backend/src/controllers/eventController.js:25-75`.
   - Therefore, no backend route or database schema modifications are required for R1.

---

## 3. Caveats

1. **Backend Syntax Error in `adminController.js:122`:**
   - As observed in Observation 1.3, running `npm test` fails due to an extra closing brace `}` in `backend/src/controllers/adminController.js:122`. While this belongs to another investigation domain (R3), any test runner checks will fail until this single character syntax error is corrected.
2. **Template Pre-fill Functionality:**
   - The current `AdminCreateEvent.jsx` has a button `Auto-Fill ITI Event Template` (lines 44-63). In the new wizard, preset selection can automatically populate default cover images and sample placeholders for convenience without obstructing custom input.
3. **Responsive Mobile Viewports:**
   - The stepper header and category selection cards must be responsive (e.g., `grid-cols-2 sm:grid-cols-3` for categories, scrollable or compact indicator for small screens) to maintain UI elegance on mobile viewports.

---

## 4. Conclusion

- The frontend multi-step event creation wizard (R1) can be cleanly implemented in `frontend/src/pages/admin/AdminCreateEvent.jsx` with full backwards compatibility and zero breaking changes to backend services or database schemas.
- By structuring the component with:
  1. A 4-stage visual stepper (Category → Core Details → Ticketing & Criteria → Review & Publish).
  2. Category selector supporting the 5 presets (`Tech Summit`, `ITI Trade Fair`, `Workshop`, `Music Gala`, `Conference`) plus custom input.
  3. Continuous state preservation using top-level `useForm` / hidden step panels preventing data loss on back/forward navigation.
  4. Complete consolidated review screen with per-section jump-links and submission handling.
- All R1 requirements and acceptance criteria will be 100% satisfied.

---

## 5. Verification Method

### 5.1 Verification Commands
1. **Frontend Build Compilation Check:**
   ```powershell
   cd c:\Users\priya\OneDrive\Desktop\QR\frontend
   npm run build
   ```
   *Expected Result:* Exit code 0, 0 compilation/syntax errors, Vite bundles cleanly into `dist/`.

2. **Backend Test Suite Run:**
   ```powershell
   cd c:\Users\priya\OneDrive\Desktop\QR\backend
   npm test
   ```
   *Expected Result:* All tests in `src/tests/api.test.js` execute and pass (after fixing `adminController.js:122`).

### 5.2 Independent Verification Checklist for Implementer
- [ ] **Step 1 (Category):**
  - Verify preset tiles render for: `Tech Summit`, `ITI Trade Fair`, `Workshop`, `Music Gala`, `Conference`.
  - Verify selecting "Custom Category" displays an input field and binds the custom value to the form state.
  - Verify clicking "Next" advances to Step 2.
- [ ] **Step 2 (Core Details):**
  - Verify inputs for title, venue, address, date, time, cover image, description.
  - Verify required field validation prevents advancing if title, venue, address, or date is missing.
  - Verify clicking "Back" returns to Step 1 and previously selected category is preserved.
- [ ] **Step 3 (Ticketing & Criteria):**
  - Verify inputs for price (₹), ticket capacity, registration start date, registration deadline, eligibility / custom criteria, eligible trades, host institution, and status.
  - Verify price and capacity validation.
  - Verify clicking "Back" returns to Step 2 and previously entered details are preserved.
- [ ] **Step 4 (Review & Publish):**
  - Verify consolidated summary accurately reflects all values from Steps 1, 2, and 3.
  - Verify clicking "Edit" or "Back" returns to earlier steps with all values intact.
  - Verify clicking "Publish Event" triggers `eventService.createEvent(payload)`, displays success toast, and redirects to `/admin/events`.
- [ ] **Database / API Verification:**
  - Verify newly created event appears in `GET /api/events` and in the Admin Events list (`/admin/events`).

---
*Report compiled by teamwork_explorer_survey_2 for orchestrator and implementer agents.*
