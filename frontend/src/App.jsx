import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { ProtectedRoute } from './components/ProtectedRoutes';

// Public Pages
import { Home } from './pages/Home';
import { EventDirectory } from './pages/EventDirectory';
import { EventDetails } from './pages/EventDetails';
import { GuestRegistration } from './pages/GuestRegistration';
import { PaymentSuccess } from './pages/PaymentSuccess';
import { PaymentFailed } from './pages/PaymentFailed';
import { Login } from './pages/Login';
import { RegisterPage } from './pages/RegisterPage';
import { SingleTicketView } from './pages/SingleTicketView';
import { ScannerPage } from './pages/ScannerPage';
import { NotFound } from './pages/NotFound';
import { Unauthorized } from './pages/Unauthorized';

// Guest Dashboard Pages
import { DashboardHome } from './pages/DashboardHome';
import { MyTickets } from './pages/MyTickets';
import { EventHistory } from './pages/EventHistory';

// Admin Portal Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminEvents } from './pages/admin/AdminEvents';
import { AdminCreateEvent } from './pages/admin/AdminCreateEvent';
import { AdminEditEvent } from './pages/admin/AdminEditEvent';
import { AdminRegistrations } from './pages/admin/AdminRegistrations';
import { AdminPayments } from './pages/admin/AdminPayments';
import { AdminAttendance } from './pages/admin/AdminAttendance';
import { AdminGallery } from './pages/admin/AdminGallery';

// Custom Cursor
import { CustomCursor } from './components/CustomCursor';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CustomCursor />
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<EventDirectory />} />
            <Route path="/events/:id" element={<EventDetails />} />
            <Route path="/register/:eventId" element={<GuestRegistration />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/failed" element={<PaymentFailed />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/ticket/:id" element={<SingleTicketView />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Staff Mobile QR Scanner Route */}
            <Route element={<ProtectedRoute allowedRoles={['super_admin', 'event_admin', 'scanner_staff']} />}>
              <Route path="/scanner" element={<ScannerPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Guest Dashboard Routes */}
          <Route element={<ProtectedRoute allowedRoles={['guest', 'super_admin', 'event_admin', 'scanner_staff']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardHome />} />
              <Route path="/dashboard/tickets" element={<MyTickets />} />
              <Route path="/dashboard/history" element={<EventHistory />} />
            </Route>
          </Route>

          {/* Admin Control Routes */}
          <Route element={<ProtectedRoute allowedRoles={['super_admin', 'event_admin']} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/events" element={<AdminEvents />} />
              <Route path="/admin/events/create" element={<AdminCreateEvent />} />
              <Route path="/admin/events/:id" element={<AdminEditEvent />} />
              <Route path="/admin/registrations" element={<AdminRegistrations />} />
              <Route path="/admin/payments" element={<AdminPayments />} />
              <Route path="/admin/attendance" element={<AdminAttendance />} />
              <Route path="/admin/gallery" element={<AdminGallery />} />
            </Route>
          </Route>

        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
