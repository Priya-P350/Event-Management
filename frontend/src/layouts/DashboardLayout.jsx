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
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-slate-100 selection:text-slate-950">
      <Navbar />
      
      {/* Dashboard Sub-Header */}
      <div className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-md sticky top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                Guest Portal <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700 uppercase font-mono">{user?.role}</span>
              </h1>
              <p className="text-xs text-slate-400">Welcome back, {user?.name} ({user?.email})</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              <Link
                to="/dashboard"
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                  isActive('/dashboard') 
                    ? 'bg-slate-100 text-slate-950 border border-slate-100' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Upcoming
              </Link>
              <Link
                to="/dashboard/tickets"
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                  isActive('/dashboard/tickets') 
                    ? 'bg-slate-100 text-slate-950 border border-slate-100' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Ticket className="w-3.5 h-3.5" />
                My QR Tickets
              </Link>
              <Link
                to="/dashboard/history"
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                  isActive('/dashboard/history') 
                    ? 'bg-slate-100 text-slate-950 border border-slate-100' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
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
