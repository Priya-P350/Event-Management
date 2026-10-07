# Setup and Deployment Guide

## Prerequisites
- Node.js v18 or higher
- npm or yarn

## Quick Start (Local Demo Mode)

1. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

3. Run Backend Server:
   ```bash
   cd ../backend
   npm run dev
   ```

4. Run Frontend App:
   ```bash
   cd ../frontend
   npm run dev
   ```

5. Access the Web Application at `http://localhost:5100`

## Demo Credentials (Pre-seeded)

- **Super Admin**: `admin@eventhub.com` / `Admin@123`
- **Event Admin**: `organizer@eventhub.com` / `Admin@123`
- **Scanner Gate Staff**: `staff@eventhub.com` / `Staff@123`
- **Demo Guest**: `guest@gmail.com` / `Guest@123`

## Integrating Real Supabase & Razorpay Services

To connect live production services, copy `.env.example` to `.env` in `backend/` and fill in:
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASSWORD` (SMTP credentials)
