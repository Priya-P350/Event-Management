# Event Management & QR Ticketing API Specifications

Base URL: `/api`

## 1. Authentication Endpoints

### POST `/api/auth/register`
Create a new user account.
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+91 9876543210",
    "password": "Password@123",
    "role": "guest" // Optional: 'guest', 'scanner_staff', 'event_admin'
  }
  ```
- **Response**: `201 Created` with JWT token and user info.

### POST `/api/auth/login`
Authenticate user and retrieve token.
- **Request Body**:
  ```json
  {
    "email": "admin@eventhub.com",
    "password": "Admin@123"
  }
  ```
- **Response**: `200 OK` with JWT token and role payload.

### GET `/api/auth/me`
Retrieve currently logged-in user profile. Header: `Authorization: Bearer <token>`.

---

## 2. Event Endpoints

### GET `/api/events`
Fetch all active/published events with filtering.
- **Query Params**: `search`, `category`, `status`

### GET `/api/events/:id`
Fetch single event details including capacity and remaining available seats.

### POST `/api/events` *(Admin Only)*
Create a new event.

### PUT `/api/events/:id` *(Admin Only)*
Update event details or status (`draft`, `published`, `registration_open`, `registration_closed`, `ongoing`, `completed`, `cancelled`).

---

## 3. Registration & Payment Endpoints

### POST `/api/registrations`
Initiate guest registration.
- **Request Body**:
  ```json
  {
    "eventId": "a1111111-1111-1111-1111-111111111111",
    "name": "Rahul Sharma",
    "email": "guest@gmail.com",
    "phone": "+91 9876543213"
  }
  ```
- **Response**: Pending registration object & Razorpay Order object.

### POST `/api/payments/verify`
Verify Razorpay signature after frontend payment completes.
- **Request Body**:
  ```json
  {
    "registrationId": "r1111111-...",
    "razorpay_order_id": "order_Pz...",
    "razorpay_payment_id": "pay_Pz...",
    "razorpay_signature": "sig_..."
  }
  ```
- **Action**: Confirms payment, generates secure QR ticket, sends high-contrast Black & Slate HTML ticket email.

### POST `/api/payments/webhook`
Razorpay Webhook endpoint for server-to-server confirmation with raw body signature verification and idempotency check.

---

## 4. Ticket & QR Scanner Endpoints

### GET `/api/tickets/my-tickets`
Retrieve all tickets for the authenticated guest.

### GET `/api/tickets/:id`
Retrieve single ticket details and high-resolution QR payload.

### POST `/api/checkin/scan` *(Staff/Admin Only)*
Validate guest QR ticket on event day.
- **Request Body**:
  ```json
  {
    "ticketToken": "EVT-TK-9a8b7c6d5e4f3a2b1c0d",
    "eventId": "a1111111-1111-1111-1111-111111111111"
  }
  ```
- **Possible Responses**:
  - `APPROVED` (200): Entry granted, guest details, check-in timestamp.
  - `ALREADY_USED` (409): Ticket was already scanned. Returns original check-in time.
  - `WRONG_EVENT` (400): Ticket belongs to another event.
  - `UNPAID` (400): Payment was not completed.
  - `INVALID` (404): Token not found or cancelled.

---

## 5. Admin Analytics & Exports

### GET `/api/admin/dashboard`
Returns total events, revenue, total registrations, attendance count, and charts.

### GET `/api/admin/export/registrations`
Export registrations data table as CSV download.

### GET `/api/admin/export/payments`
Export payments table as CSV download.
