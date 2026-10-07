# 🎟️ EventHub — Event Management, Registration & QR Entry Platform

EventHub is a full-stack, enterprise-grade event management system designed for managing summits, live concerts, corporate pitch galas, and **ITI (Industrial Training Institute) Vocational Trade Fairs**. 

It features instant digital QR ticket issuance, Razorpay payment gateway integration, gate scanner atomic check-in, live registration tracking, and role-based admin controls.

---

## 🚀 Key Features

### 🛠️ Admin Event Management & ITI Vocational Fairs
* **Event Creation & Editing**: Create, publish, update, or cancel events with custom cover images, ticket pricing, capacities, and venues.
* **ITI Trade Support**: Dedicated support for ITI events featuring **Institute Name**, **Eligible ITI Trades** (e.g., Electrician, Fitter, Welder, COPA, Machinist), and **Qualification Eligibility**.
* **Registration Window Control**: Set explicit **Registration Start Date** and **Registration Close Date (Deadline)**.
* **1-Click ITI Preset**: Built-in template auto-fill button for creating ITI Job Fairs & Skill Expos instantly.

### 📊 Live Registration Tracking & Analytics
* **Real-time Registration Counters**: Shows live confirmed candidates registered vs total seat capacity with visual progress bars.
* **Seat Availability**: Automatically tracks remaining seats and handles sold-out states.
* **Admin Overview**: Comprehensive dashboard metrics covering revenue, registration volume, gate attendance rate, and guest logs.

### 💳 Razorpay Payment & Digital QR Pass Issuance
* **Razorpay Gateway**: Integrated checkout supporting UPI, Credit/Debit cards, and Netbanking with backend HMAC-SHA256 signature verification.
* **Free Event Instant Pass**: Direct instant ticket generation for free entry (₹0 ticket price) events.
* **Unpredictable QR Tokens**: Security tokens generated without exposing guest PII inside raw QR text.

### 📱 Gate Camera QR Scanner
* **Atomic Check-In**: Camera-based scanner for gate staff to scan guest QR passes.
* **Fraud & Duplicate Prevention**: Database-level atomic locks prevent duplicate re-entry or forged passes.

### 🔐 Role-Based Access Control (RBAC)
* `super_admin` / `event_admin`: Full system control, event management, user role updates, and revenue analytics.
* `scanner_staff`: Gate entry scanner permissions.
* `guest`: Browse events, register, complete checkout, and view digital tickets.

---

## 🛠️ Tech Stack

* **Frontend**: React (Vite), React Router v6, React Hook Form, Lucide Icons, TailwindCSS, `html5-qrcode`, `qrcode.react`, Canvas Confetti.
* **Backend**: Node.js, Express.js, Drizzle ORM, SQLite (`better-sqlite3`) / PostgreSQL (Supabase), JWT, BcryptJS.
* **Payments & Email**: Razorpay SDK, Resend API Client.

---

## 📁 Project Structure

```text
├── backend/
│   ├── src/
│   │   ├── config/          # DB config, Razorpay, Resend setup
│   │   ├── controllers/     # Event, Auth, Payment, Check-in controllers
│   │   ├── db/              # Drizzle ORM schema definitions
│   │   ├── middleware/      # Auth JWT & Role-based access control
│   │   ├── routes/          # Express API route modules
│   │   ├── tests/           # Jest API test suite
│   │   └── server.js        # Express application entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, Footer, Form Builders, Countdown
│   │   ├── context/         # Auth & Toast context providers
│   │   ├── layouts/         # Public, Dashboard & Admin Layouts
│   │   ├── pages/           # Home, Event Directory, Event Details, Admin Portal
│   │   ├── services/        # Axios API service modules
│   │   └── App.jsx          # React Router configuration
│   └── package.json
└── README.md
```

---

## 🚦 Getting Started

### Prerequisites
* Node.js (v18 or higher)
* npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-repo/eventhub.git
   cd eventhub
   ```

2. **Install Backend Dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**:
   ```bash
   cd ../frontend
   npm install
   ```

---

## 🏃 Running the Application

### 1. Run Backend Server
In the `backend` directory:
```bash
npm run dev
```
*The backend API will run on `http://localhost:5000` (uses local SQLite database automatically if PostgreSQL URL is not set).*

### 2. Run Frontend Web App
In the `frontend` directory:
```bash
npm run dev
```
*The Vite frontend will start on `http://localhost:5100`.*

---

## 🧪 Running Automated Tests

Run backend Jest test suite:
```bash
cd backend
npm test
```

---

## 🔑 Demo Admin & Test Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@eventhub.com` | `Admin@123` |
| **Event Organizer** | `organizer@eventhub.com` | `Admin@123` |
| **Scanner Staff** | `staff@eventhub.com` | `Staff@123` |
| **Guest User** | `guest@gmail.com` | `Guest@123` |

---

## 📄 License
Distributed under the **MIT License**.
