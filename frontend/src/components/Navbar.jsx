import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Ticket, ShieldCheck, QrCode, LogOut, 
  Menu, X, History, PlusCircle, Waves
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, isStaff, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-[#020d1a]/85 border-b border-cyan-500/20 shadow-[0_4px_30px_rgba(2,8,23,0.7)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Oceanic Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00f2fe] to-[#0284c7] flex items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(0,242,254,0.4)]">
              <Ticket className="w-5 h-5 text-[#020817]" />
            </div>
            <div>
              <span className="text-xl font-black tracking-widest text-[#e0f2fe] uppercase flex items-center gap-1.5">
                EVENT<span className="text-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]">HUB</span>
              </span>
              <span className="block text-[10px] text-[#67e8f9] font-mono font-bold tracking-widest uppercase -mt-1 flex items-center gap-1">
                <Waves className="w-3 h-3 text-[#38bdf8]" /> Oceanic Pass Engine
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1.5">
            <Link
              to="/"
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive('/') 
                  ? 'bg-gradient-to-r from-[#00f2fe] to-[#0284c7] text-[#020817] font-extrabold shadow-[0_0_15px_rgba(0,242,254,0.35)]' 
                  : 'text-[#94b8d6] hover:text-[#e0f2fe] hover:bg-cyan-950/40 border border-transparent hover:border-cyan-500/30'
              }`}
            >
              Home
            </Link>

            <Link
              to="/events"
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive('/events') 
                  ? 'bg-gradient-to-r from-[#00f2fe] to-[#0284c7] text-[#020817] font-extrabold shadow-[0_0_15px_rgba(0,242,254,0.35)]' 
                  : 'text-[#94b8d6] hover:text-[#e0f2fe] hover:bg-cyan-950/40 border border-transparent hover:border-cyan-500/30'
              }`}
            >
              Explore Events
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive('/dashboard') 
                      ? 'bg-gradient-to-r from-[#00f2fe] to-[#0284c7] text-[#020817] font-extrabold shadow-[0_0_15px_rgba(0,242,254,0.35)]' 
                      : 'text-[#94b8d6] hover:text-[#e0f2fe] hover:bg-cyan-950/40 border border-transparent hover:border-cyan-500/30'
                  }`}
                >
                  My Dashboard
                </Link>

                <Link
                  to="/dashboard/tickets"
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                    isActive('/dashboard/tickets') 
                      ? 'bg-gradient-to-r from-[#00f2fe] to-[#0284c7] text-[#020817] font-extrabold shadow-[0_0_15px_rgba(0,242,254,0.35)]' 
                      : 'text-[#94b8d6] hover:text-[#e0f2fe] hover:bg-cyan-950/40 border border-transparent hover:border-cyan-500/30'
                  }`}
                >
                  <Ticket className="w-4 h-4" />
                  My Tickets
                </Link>

                <Link
                  to="/dashboard/history"
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                    isActive('/dashboard/history') 
                      ? 'bg-gradient-to-r from-[#00f2fe] to-[#0284c7] text-[#020817] font-extrabold shadow-[0_0_15px_rgba(0,242,254,0.35)]' 
                      : 'text-[#94b8d6] hover:text-[#e0f2fe] hover:bg-cyan-950/40 border border-transparent hover:border-cyan-500/30'
                  }`}
                >
                  <History className="w-4 h-4" />
                  Event History
                </Link>
              </>
            )}

            {isStaff && (
              <Link
                to="/scanner"
                className="px-3.5 py-2 rounded-xl text-sm font-semibold bg-[#041124] border border-cyan-500/30 text-[#e0f2fe] hover:bg-cyan-950/60 hover:border-cyan-400 flex items-center gap-1.5 ml-2 transition-all duration-200 shadow-sm"
              >
                <QrCode className="w-4 h-4 text-[#38bdf8]" />
                Gate Scanner
              </Link>
            )}

            {isAdmin && (
              <>
                <Link
                  to="/admin/events/create"
                  className="px-3.5 py-2 rounded-xl text-sm font-extrabold bg-gradient-to-r from-[#00f2fe] to-[#0284c7] text-[#020817] hover:from-[#38bdf8] hover:to-[#00f2fe] border border-[#38bdf8] flex items-center gap-1.5 ml-1 transition-all duration-200 shadow-[0_0_15px_rgba(0,242,254,0.35)]"
                >
                  <PlusCircle className="w-4 h-4 text-[#020817]" />
                  + Create Event
                </Link>
                <Link
                  to="/admin"
                  className="px-3.5 py-2 rounded-xl text-sm font-semibold bg-[#041124] border border-cyan-500/30 text-[#e0f2fe] hover:bg-cyan-950/60 hover:border-cyan-400 flex items-center gap-1.5 ml-1 transition-all duration-200"
                >
                  <ShieldCheck className="w-4 h-4 text-[#38bdf8]" />
                  Admin Portal
                </Link>
              </>
            )}
          </nav>

          {/* User Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 px-3 py-1.5 bg-[#041124] border border-cyan-500/25 rounded-xl">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00f2fe] to-[#0284c7] text-[#020817] flex items-center justify-center text-xs font-bold shadow-[0_0_10px_rgba(0,242,254,0.3)]">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="text-left">
                    <span className="block text-xs font-semibold text-[#e0f2fe] leading-tight">{user?.name}</span>
                    <span className="block text-[10px] text-[#67e8f9] font-mono capitalize leading-tight">{user?.role?.replace('_', ' ')}</span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-xl text-[#94b8d6] hover:text-[#e0f2fe] hover:bg-cyan-950/40 border border-transparent hover:border-cyan-500/30 transition-all duration-200"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-[#e0f2fe] hover:text-white bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 transition-all duration-200"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#00f2fe] to-[#0284c7] text-[#020817] hover:from-[#38bdf8] hover:to-[#00f2fe] border border-[#38bdf8] transition-all duration-200 font-extrabold shadow-[0_0_15px_rgba(0,242,254,0.35)]"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#e0f2fe] hover:text-white bg-[#041124] border border-cyan-500/30"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-cyan-500/20 bg-[#020d1a]/95 backdrop-blur-2xl px-4 pt-2 pb-6 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-2.5 rounded-xl text-sm font-medium text-[#e0f2fe] hover:bg-cyan-950/40"
          >
            Home
          </Link>
          <Link
            to="/events"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-2.5 rounded-xl text-sm font-medium text-[#e0f2fe] hover:bg-cyan-950/40"
          >
            Explore Events
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-medium text-[#e0f2fe] hover:bg-cyan-950/40"
              >
                My Dashboard
              </Link>
              <Link
                to="/dashboard/tickets"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-medium text-[#e0f2fe] hover:bg-cyan-950/40"
              >
                My Tickets
              </Link>
              <Link
                to="/dashboard/history"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-medium text-[#e0f2fe] hover:bg-cyan-950/40"
              >
                Event History
              </Link>

              {isStaff && (
                <Link
                  to="/scanner"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-[#e0f2fe] bg-[#041124] border border-cyan-500/30"
                >
                  Gate Scanner
                </Link>
              )}

              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-[#e0f2fe] bg-[#041124] border border-cyan-500/30"
                >
                  Admin Dashboard
                </Link>
              )}

              <div className="pt-4 border-t border-cyan-500/20 flex items-center justify-between px-2">
                <span className="text-xs text-[#67e8f9] font-medium">{user?.email}</span>
                <button
                  onClick={handleLogout}
                  className="text-xs text-[#00f2fe] font-bold hover:underline"
                >
                  Log Out
                </button>
              </div>
            </>
          ) : (
            <div className="pt-4 border-t border-cyan-500/20 grid grid-cols-2 gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center px-4 py-2.5 rounded-xl text-sm font-semibold text-[#e0f2fe] bg-cyan-950/40 border border-cyan-500/30"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center px-4 py-2.5 rounded-xl text-sm font-semibold text-[#020817] bg-gradient-to-r from-[#00f2fe] to-[#0284c7] font-extrabold"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
