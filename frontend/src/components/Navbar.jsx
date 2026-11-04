import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Ticket, ShieldCheck, QrCode, LogOut, 
  Menu, X, History, PlusCircle
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
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#0B2B26]/90 border-b border-[#163832] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#E5F4F9] flex items-center justify-center group-hover:scale-105 group-hover:bg-[#C3E2ED] transition-all duration-300 shadow-md">
              <Ticket className="w-5 h-5 text-[#0B1928]" />
            </div>
            <div>
              <span className="text-xl font-black tracking-widest text-[#E5F4F9] uppercase">
                EVENT<span className="text-[#4A96BA]">HUB</span>
              </span>
              <span className="block text-[10px] text-[#95B8C9] font-mono font-bold tracking-widest uppercase -mt-1">
                Pass & Entry Platform
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1.5">
            <Link
              to="/"
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive('/') 
                  ? 'text-[#0B1928] bg-[#E5F4F9] border border-[#E5F4F9] font-bold shadow-sm' 
                  : 'text-[#95B8C9] hover:text-[#E5F4F9] hover:bg-[#1E394E] border border-transparent hover:border-[#2B4E66]'
              }`}
            >
              Home
            </Link>

            <Link
              to="/events"
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive('/events') 
                  ? 'text-[#0B1928] bg-[#E5F4F9] border border-[#E5F4F9] font-bold shadow-sm' 
                  : 'text-[#95B8C9] hover:text-[#E5F4F9] hover:bg-[#1E394E] border border-transparent hover:border-[#2B4E66]'
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
                      ? 'text-[#0B1928] bg-[#E5F4F9] border border-[#E5F4F9] font-bold shadow-sm' 
                      : 'text-[#95B8C9] hover:text-[#E5F4F9] hover:bg-[#1E394E] border border-transparent hover:border-[#2B4E66]'
                  }`}
                >
                  My Dashboard
                </Link>

                <Link
                  to="/dashboard/tickets"
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                    isActive('/dashboard/tickets') 
                      ? 'text-[#0B1928] bg-[#E5F4F9] border border-[#E5F4F9] font-bold shadow-sm' 
                      : 'text-[#95B8C9] hover:text-[#E5F4F9] hover:bg-[#1E394E] border border-transparent hover:border-[#2B4E66]'
                  }`}
                >
                  <Ticket className="w-4 h-4" />
                  My Tickets
                </Link>

                <Link
                  to="/dashboard/history"
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                    isActive('/dashboard/history') 
                      ? 'text-[#0B1928] bg-[#E5F4F9] border border-[#E5F4F9] font-bold shadow-sm' 
                      : 'text-[#95B8C9] hover:text-[#E5F4F9] hover:bg-[#1E394E] border border-transparent hover:border-[#2B4E66]'
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
                className="px-3.5 py-2 rounded-xl text-sm font-semibold bg-[#1E394E] border border-[#2B4E66] text-[#E5F4F9] hover:bg-[#2B4E66] hover:border-[#4A96BA] flex items-center gap-1.5 ml-2 transition-all duration-200"
              >
                <QrCode className="w-4 h-4 text-[#4A96BA]" />
                Gate Scanner
              </Link>
            )}

            {isAdmin && (
              <>
                <Link
                  to="/admin/events/create"
                  className="px-3.5 py-2 rounded-xl text-sm font-extrabold bg-[#E5F4F9] text-[#0B1928] hover:bg-[#C3E2ED] border border-[#E5F4F9] flex items-center gap-1.5 ml-1 transition-all duration-200 shadow-sm"
                >
                  <PlusCircle className="w-4 h-4 text-[#0B1928]" />
                  + Create Event
                </Link>
                <Link
                  to="/admin"
                  className="px-3.5 py-2 rounded-xl text-sm font-semibold bg-[#1E394E] border border-[#2B4E66] text-[#E5F4F9] hover:bg-[#2B4E66] hover:border-[#4A96BA] flex items-center gap-1.5 ml-1 transition-all duration-200"
                >
                  <ShieldCheck className="w-4 h-4 text-[#4A96BA]" />
                  Admin Portal
                </Link>
              </>
            )}
          </nav>

          {/* User Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 px-3 py-1.5 bg-[#0B1928] border border-[#1E394E] rounded-xl">
                  <div className="w-7 h-7 rounded-lg bg-[#E5F4F9] text-[#0B1928] flex items-center justify-center text-xs font-bold">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="text-left">
                    <span className="block text-xs font-semibold text-[#E5F4F9] leading-tight">{user?.name}</span>
                    <span className="block text-[10px] text-[#95B8C9] font-mono capitalize leading-tight">{user?.role?.replace('_', ' ')}</span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-xl text-[#95B8C9] hover:text-[#E5F4F9] hover:bg-[#1E394E] border border-transparent hover:border-[#2B4E66] transition-all duration-200"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-[#E5F4F9] hover:text-white bg-[#1E394E] hover:bg-[#2B4E66] border border-[#2B4E66] transition-all duration-200"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#E5F4F9] text-[#0B1928] hover:bg-[#C3E2ED] border border-[#E5F4F9] transition-all duration-200 font-bold"
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
              className="p-2 rounded-xl text-[#E5F4F9] hover:text-white bg-[#1E394E] border border-[#2B4E66]"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#1E394E] bg-[#0B1928]/95 backdrop-blur-xl px-4 pt-2 pb-6 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-2.5 rounded-xl text-sm font-medium text-[#E5F4F9] hover:bg-[#1E394E]"
          >
            Home
          </Link>
          <Link
            to="/events"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-2.5 rounded-xl text-sm font-medium text-[#E5F4F9] hover:bg-[#1E394E]"
          >
            Explore Events
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-medium text-[#E5F4F9] hover:bg-[#1E394E]"
              >
                My Dashboard
              </Link>
              <Link
                to="/dashboard/tickets"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-medium text-[#E5F4F9] hover:bg-[#1E394E]"
              >
                My Tickets
              </Link>
              <Link
                to="/dashboard/history"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-medium text-[#E5F4F9] hover:bg-[#1E394E]"
              >
                Event History
              </Link>

              {isStaff && (
                <Link
                  to="/scanner"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-[#E5F4F9] bg-[#1E394E] border border-[#2B4E66]"
                >
                  Gate Scanner
                </Link>
              )}

              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-[#E5F4F9] bg-[#1E394E] border border-[#2B4E66]"
                >
                  Admin Dashboard
                </Link>
              )}

              <div className="pt-4 border-t border-[#1E394E] flex items-center justify-between px-2">
                <span className="text-xs text-[#95B8C9] font-medium">{user?.email}</span>
                <button
                  onClick={handleLogout}
                  className="text-xs text-[#E5F4F9] font-bold hover:underline"
                >
                  Log Out
                </button>
              </div>
            </>
          ) : (
            <div className="pt-4 border-t border-[#1E394E] grid grid-cols-2 gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center px-4 py-2.5 rounded-xl text-sm font-semibold text-[#E5F4F9] bg-[#1E394E] border border-[#2B4E66]"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center px-4 py-2.5 rounded-xl text-sm font-semibold text-[#0B1928] bg-[#E5F4F9]"
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
