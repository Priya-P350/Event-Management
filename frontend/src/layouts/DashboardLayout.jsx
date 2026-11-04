import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { Ticket, LayoutDashboard, History } from 'lucide-react';

export const DashboardLayout = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-[#0B1928] text-[#E5F4F9] selection:bg-[#4A96BA] selection:text-[#0B1928]">
      <Navbar />
      
      {/* Dashboard Sub-Header with Woven Texture */}
      <div className="texture-banner border-b border-[#1E394E] sticky top-20 z-30 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-[#E5F4F9] flex items-center gap-2">
                Guest Portal <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#0B1928] text-[#E5F4F9] border border-[#1E394E] uppercase font-mono">{user?.role}</span>
              </h1>
              <p className="text-xs text-[#95B8C9]">Welcome back, {user?.name} ({user?.email})</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 bg-[#0B1928] p-1.5 rounded-xl border border-[#1E394E]">
              <Link
                to="/dashboard"
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                  isActive('/dashboard') 
                    ? 'bg-[#E5F4F9] text-[#0B1928] border border-[#E5F4F9] font-bold shadow-sm' 
                    : 'text-[#95B8C9] hover:text-[#E5F4F9] hover:bg-[#1E394E] border border-transparent'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Upcoming
              </Link>
              <Link
                to="/dashboard/tickets"
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                  isActive('/dashboard/tickets') 
                    ? 'bg-[#E5F4F9] text-[#0B1928] border border-[#E5F4F9] font-bold shadow-sm' 
                    : 'text-[#95B8C9] hover:text-[#E5F4F9] hover:bg-[#1E394E] border border-transparent'
                }`}
              >
                <Ticket className="w-3.5 h-3.5" />
                My QR Tickets
              </Link>
              <Link
                to="/dashboard/history"
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                  isActive('/dashboard/history') 
                    ? 'bg-[#E5F4F9] text-[#0B1928] border border-[#E5F4F9] font-bold shadow-sm' 
                    : 'text-[#95B8C9] hover:text-[#E5F4F9] hover:bg-[#1E394E] border border-transparent'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                Past History
              </Link>
            </div>
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
