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
    <div className="min-h-screen flex flex-col bg-[#0B1928] text-[#E5F4F9] selection:bg-[#4A96BA] selection:text-[#0B1928]">
      <Navbar />

      {/* Admin Control Banner with Woven Texture */}
      <div className="texture-banner border-b border-[#1E394E] sticky top-20 z-30 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E5F4F9] text-[#0B1928] flex items-center justify-center font-bold shadow-md">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#E5F4F9] flex items-center gap-2">
                  Admin Control Portal
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#0B1928] text-[#E5F4F9] border border-[#1E394E] uppercase font-mono">
                    {user?.role}
                  </span>
                </h1>
                <p className="text-xs text-[#95B8C9]">System management & analytics studio</p>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="flex items-center gap-3">
              <Link
                to="/admin/events/create"
                className="px-4 py-2 rounded-xl bg-[#E5F4F9] text-[#0B1928] font-extrabold text-xs flex items-center gap-1.5 hover:bg-[#C3E2ED] border border-[#E5F4F9] transition-all duration-200 shadow-sm"
              >
                <PlusCircle className="w-4 h-4 text-[#0B1928]" />
                Create New Event
              </Link>
            </div>
          </div>

          {/* Admin Horizontal Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pt-4 pb-1 border-t border-[#1E394E] mt-4 no-scrollbar">
            <Link
              to="/admin"
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all duration-200 ${
                isActive('/admin') 
                  ? 'bg-[#E5F4F9] text-[#0B1928] border border-[#E5F4F9] font-bold shadow-sm' 
                  : 'text-[#95B8C9] hover:text-[#E5F4F9] hover:bg-[#1E394E] border border-transparent'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Overview Stats
            </Link>

            <Link
              to="/admin/users"
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all duration-200 ${
                isActive('/admin/users') 
                  ? 'bg-[#E5F4F9] text-[#0B1928] border border-[#E5F4F9] font-bold shadow-sm' 
                  : 'text-[#95B8C9] hover:text-[#E5F4F9] hover:bg-[#1E394E] border border-transparent'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-[#95B8C9]" />
              Manage Users & Admins
            </Link>

            <Link
              to="/admin/events"
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all duration-200 ${
                isActive('/admin/events') 
                  ? 'bg-[#E5F4F9] text-[#0B1928] border border-[#E5F4F9] font-bold shadow-sm' 
                  : 'text-[#95B8C9] hover:text-[#E5F4F9] hover:bg-[#1E394E] border border-transparent'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Manage Events
            </Link>

            <Link
              to="/admin/registrations"
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all duration-200 ${
                isActive('/admin/registrations') 
                  ? 'bg-[#E5F4F9] text-[#0B1928] border border-[#E5F4F9] font-bold shadow-sm' 
                  : 'text-[#95B8C9] hover:text-[#E5F4F9] hover:bg-[#1E394E] border border-transparent'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Registrations
            </Link>

            <Link
              to="/admin/payments"
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all duration-200 ${
                isActive('/admin/payments') 
                  ? 'bg-[#E5F4F9] text-[#0B1928] border border-[#E5F4F9] font-bold shadow-sm' 
                  : 'text-[#95B8C9] hover:text-[#E5F4F9] hover:bg-[#1E394E] border border-transparent'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Razorpay Payments
            </Link>

            <Link
              to="/admin/attendance"
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all duration-200 ${
                isActive('/admin/attendance') 
                  ? 'bg-[#E5F4F9] text-[#0B1928] border border-[#E5F4F9] font-bold shadow-sm' 
                  : 'text-[#95B8C9] hover:text-[#E5F4F9] hover:bg-[#1E394E] border border-transparent'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Attendance Records
            </Link>

            <Link
              to="/admin/gallery"
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all duration-200 ${
                isActive('/admin/gallery') 
                  ? 'bg-[#E5F4F9] text-[#0B1928] border border-[#E5F4F9] font-bold shadow-sm' 
                  : 'text-[#95B8C9] hover:text-[#E5F4F9] hover:bg-[#1E394E] border border-transparent'
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
