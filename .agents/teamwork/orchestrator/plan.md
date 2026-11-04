# Plan: Event Creation Wizard, Registration UI Overhaul, & Admin Data Isolation

## Objective
Implement R1 (Multi-Step Event Creation Wizard), R2 (Minimalist Registration UI), and R3 (Admin Data Isolation with Unique Identifier) while maintaining 100% backend test pass and zero frontend build errors.

## Execution Strategy (Project Pattern)

### Phase 0: Survey & Discovery
- Dispatch 3 Explorers in parallel:
  1. `explorer_backend`: Investigate backend auth, User model/identifiers, Event/Guest/Attendee models, controller queries, data isolation scopes, and test suites.
  2. `explorer_wizard`: Investigate `AdminCreateEvent.jsx`, step-based wizard flows, category presets, field validation, state preservation, API integration.
  3. `explorer_reg`: Investigate `RegisterPage.jsx` and `GuestRegistration.jsx`, styles, input forms, validation, and minimal redesign requirements.

### Phase 1: PROJECT.md & Decomposition
- Synthesize explorer reports into `PROJECT.md`:
  - Feature inventory & architecture
  - Interface contracts
  - Milestone decomposition:
    - Milestone 1: Backend Admin Unique Identifier & Data Isolation (R3)
    - Milestone 2: Minimalist Registration UI overhaul (R2)
    - Milestone 3: Multi-Step Event Creation Wizard (R1)
    - Milestone 4: Dual-Track E2E & Regression Verification

### Phase 2: Milestone Iteration Loop
- For each milestone:
  - Spawn Worker with explorer findings and strict integrity warnings.
  - Spawn Reviewers and Challengers.
  - Spawn Forensic Auditor (`teamwork_auditor`) for integrity verification.
  - Gate evaluation: strict AND of tests, reviews, challenger verdicts, and CLEAN audit.

### Phase 3: Final Acceptance & Sentinel Reporting
- Run full regression tests (`npm test` in backend, `npm run build` in frontend).
- Synthesize results, prepare handoff, notify Sentinel.
