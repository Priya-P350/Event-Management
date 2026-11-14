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
    <div className="min-h-screen flex flex-col bg-transparent text-[#e0f2fe] selection:bg-[#38bdf8] selection:text-[#020817] relative z-10">
      <Navbar />
      
      {/* Dashboard Sub-Header with Oceanic Frosted Texture */}
      <div className="texture-banner border-b border-cyan-500/20 sticky top-20 z-30 shadow-xl backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-[#e0f2fe] flex items-center gap-2">
                Guest Ocean Portal <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#041124] text-[#38bdf8] border border-cyan-500/30 uppercase font-mono">{user?.role}</span>
              </h1>
              <p className="text-xs text-[#94b8d6]">Welcome back, {user?.name} ({user?.email})</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 bg-[#041124]/90 p-1.5 rounded-xl border border-cyan-500/25">
              <Link
                to="/dashboard"
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                  isActive('/dashboard') 
                    ? 'bg-gradient-to-r from-[#00f2fe] to-[#0284c7] text-[#020817] font-extrabold shadow-[0_0_15px_rgba(0,242,254,0.35)]' 
                    : 'text-[#94b8d6] hover:text-[#e0f2fe] hover:bg-cyan-950/40 border border-transparent'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Upcoming
              </Link>
              <Link
                to="/dashboard/tickets"
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                  isActive('/dashboard/tickets') 
                    ? 'bg-gradient-to-r from-[#00f2fe] to-[#0284c7] text-[#020817] font-extrabold shadow-[0_0_15px_rgba(0,242,254,0.35)]' 
                    : 'text-[#94b8d6] hover:text-[#e0f2fe] hover:bg-cyan-950/40 border border-transparent'
                }`}
              >
                <Ticket className="w-3.5 h-3.5" />
                My QR Tickets
              </Link>
              <Link
                to="/dashboard/history"
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                  isActive('/dashboard/history') 
                    ? 'bg-gradient-to-r from-[#00f2fe] to-[#0284c7] text-[#020817] font-extrabold shadow-[0_0_15px_rgba(0,242,254,0.35)]' 
                    : 'text-[#94b8d6] hover:text-[#e0f2fe] hover:bg-cyan-950/40 border border-transparent'
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
