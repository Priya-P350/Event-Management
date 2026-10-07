import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, LayoutDashboard, Calendar, Users, 
  CreditCard, CheckSquare, Image as ImageIcon, PlusCircle
} from 'lucide-react';

export const AdminLayout = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-slate-100 selection:text-slate-950">
      <Navbar />

      {/* Admin Control Banner */}
      <div className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-950 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  Admin Control Portal
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 uppercase font-mono">
                    {user?.role}
                  </span>
                </h1>
                <p className="text-xs text-slate-400">System management & analytics studio</p>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="flex items-center gap-3">
              <Link
                to="/admin/events/create"
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-950 font-semibold text-xs flex items-center gap-1.5 hover:bg-white border border-slate-100 transition-all duration-200"
              >
                <PlusCircle className="w-4 h-4" />
                Create New Event
              </Link>
            </div>
          </div>

          {/* Admin Horizontal Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pt-4 pb-1 border-t border-slate-800 mt-4 no-scrollbar">
            <Link
              to="/admin"
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all duration-200 ${
                isActive('/admin') 
                  ? 'bg-slate-100 text-slate-950 border border-slate-100' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Overview Stats
            </Link>

            <Link
              to="/admin/users"
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all duration-200 ${
                isActive('/admin/users') 
                  ? 'bg-slate-100 text-slate-950 border border-slate-100' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-sky-400" />
              Manage Users & Admins
            </Link>

            <Link
              to="/admin/events"
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all duration-200 ${
                isActive('/admin/events') 
                  ? 'bg-slate-100 text-slate-950 border border-slate-100' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Manage Events
            </Link>

            <Link
              to="/admin/registrations"
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all duration-200 ${
                isActive('/admin/registrations') 
                  ? 'bg-slate-100 text-slate-950 border border-slate-100' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Registrations
            </Link>

            <Link
              to="/admin/payments"
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all duration-200 ${
                isActive('/admin/payments') 
                  ? 'bg-slate-100 text-slate-950 border border-slate-100' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Razorpay Payments
            </Link>

            <Link
              to="/admin/attendance"
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all duration-200 ${
                isActive('/admin/attendance') 
                  ? 'bg-slate-100 text-slate-950 border border-slate-100' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Attendance Records
            </Link>

            <Link
              to="/admin/gallery"
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all duration-200 ${
                isActive('/admin/gallery') 
                  ? 'bg-slate-100 text-slate-950 border border-slate-100' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Event Gallery
            </Link>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};
