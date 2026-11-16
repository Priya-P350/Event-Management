import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, LayoutDashboard, Calendar, Users, 
  CreditCard, CheckSquare, Image as ImageIcon, PlusCircle, QrCode
} from 'lucide-react';

export const AdminLayout = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-[#e0f2fe] selection:bg-[#38bdf8] selection:text-[#020817] relative z-10">
      <Navbar />

      {/* Admin Control Banner with Oceanic Texture */}
      <div className="texture-banner border-b border-cyan-500/20 sticky top-20 z-30 shadow-xl backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00f2fe] to-[#0284c7] text-[#020817] flex items-center justify-center font-bold shadow-[0_0_15px_rgba(0,242,254,0.35)]">
                <ShieldCheck className="w-5 h-5 text-[#020817]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#e0f2fe] flex items-center gap-2">
                  Admin Command Deck
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#041124] text-[#38bdf8] border border-cyan-500/30 uppercase font-mono">
                    {user?.role}
                  </span>
                </h1>
                <p className="text-xs text-[#94b8d6]">System management, QR control & analytics studio</p>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="flex items-center gap-2.5">
              <Link
                to="/scanner"
                className="px-4 py-2 rounded-xl bg-[#041124] hover:bg-cyan-950/60 text-[#e0f2fe] font-bold text-xs flex items-center gap-1.5 border border-cyan-500/30 transition-all duration-200"
              >
                <QrCode className="w-4 h-4 text-[#38bdf8]" />
                Live Gate Scanner
              </Link>
              <Link
                to="/admin/events/create"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00f2fe] to-[#0284c7] text-[#020817] font-extrabold text-xs flex items-center gap-1.5 hover:from-[#38bdf8] hover:to-[#00f2fe] transition-all duration-200 shadow-[0_0_15px_rgba(0,242,254,0.35)] border border-[#38bdf8]"
              >
                <PlusCircle className="w-4 h-4 text-[#020817]" />
                Create New Event
              </Link>
            </div>
          </div>

          {/* Admin Horizontal Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pt-4 pb-1 border-t border-cyan-500/20 mt-4 no-scrollbar">
            <Link
              to="/admin"
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all duration-200 ${
                isActive('/admin') 
                  ? 'bg-gradient-to-r from-[#00f2fe] to-[#0284c7] text-[#020817] font-extrabold shadow-[0_0_15px_rgba(0,242,254,0.35)]' 
                  : 'text-[#94b8d6] hover:text-[#e0f2fe] hover:bg-cyan-950/40 border border-transparent'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Overview Stats
            </Link>

            <Link
              to="/scanner"
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all duration-200 ${
                isActive('/scanner') 
                  ? 'bg-gradient-to-r from-[#00f2fe] to-[#0284c7] text-[#020817] font-extrabold shadow-[0_0_15px_rgba(0,242,254,0.35)]' 
                  : 'text-[#94b8d6] hover:text-[#e0f2fe] hover:bg-cyan-950/40 border border-transparent'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-[#38bdf8]" />
              Scan Attendee Passes
            </Link>

            <Link
              to="/admin/users"
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all duration-200 ${
                isActive('/admin/users') 
                  ? 'bg-gradient-to-r from-[#00f2fe] to-[#0284c7] text-[#020817] font-extrabold shadow-[0_0_15px_rgba(0,242,254,0.35)]' 
                  : 'text-[#94b8d6] hover:text-[#e0f2fe] hover:bg-cyan-950/40 border border-transparent'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Manage Users & Admins
            </Link>

            <Link
              to="/admin/events"
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all duration-200 ${
                isActive('/admin/events') 
                  ? 'bg-gradient-to-r from-[#00f2fe] to-[#0284c7] text-[#020817] font-extrabold shadow-[0_0_15px_rgba(0,242,254,0.35)]' 
                  : 'text-[#94b8d6] hover:text-[#e0f2fe] hover:bg-cyan-950/40 border border-transparent'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Manage Events
            </Link>

            <Link
              to="/admin/registrations"
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all duration-200 ${
                isActive('/admin/registrations') 
                  ? 'bg-gradient-to-r from-[#00f2fe] to-[#0284c7] text-[#020817] font-extrabold shadow-[0_0_15px_rgba(0,242,254,0.35)]' 
                  : 'text-[#94b8d6] hover:text-[#e0f2fe] hover:bg-cyan-950/40 border border-transparent'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Registrations
            </Link>

            <Link
              to="/admin/payments"
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all duration-200 ${
                isActive('/admin/payments') 
                  ? 'bg-gradient-to-r from-[#00f2fe] to-[#0284c7] text-[#020817] font-extrabold shadow-[0_0_15px_rgba(0,242,254,0.35)]' 
                  : 'text-[#94b8d6] hover:text-[#e0f2fe] hover:bg-cyan-950/40 border border-transparent'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Razorpay Payments
            </Link>

            <Link
              to="/admin/attendance"
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all duration-200 ${
                isActive('/admin/attendance') 
                  ? 'bg-gradient-to-r from-[#00f2fe] to-[#0284c7] text-[#020817] font-extrabold shadow-[0_0_15px_rgba(0,242,254,0.35)]' 
                  : 'text-[#94b8d6] hover:text-[#e0f2fe] hover:bg-cyan-950/40 border border-transparent'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Attendance Records
            </Link>

            <Link
              to="/admin/gallery"
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all duration-200 ${
                isActive('/admin/gallery') 
                  ? 'bg-gradient-to-r from-[#00f2fe] to-[#0284c7] text-[#020817] font-extrabold shadow-[0_0_15px_rgba(0,242,254,0.35)]' 
                  : 'text-[#94b8d6] hover:text-[#e0f2fe] hover:bg-cyan-950/40 border border-transparent'
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
