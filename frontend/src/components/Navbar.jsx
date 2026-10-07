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
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/90 border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:scale-105 group-hover:bg-white transition-all duration-300">
              <Ticket className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="text-xl font-black tracking-widest text-slate-100 uppercase">
                EVENT<span className="text-slate-400">HUB</span>
              </span>
              <span className="block text-[10px] text-slate-400 font-mono font-bold tracking-widest uppercase -mt-1">
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
                  ? 'text-slate-950 bg-slate-100 border border-slate-100' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800'
              }`}
            >
              Home
            </Link>

            <Link
              to="/events"
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive('/events') 
                  ? 'text-slate-950 bg-slate-100 border border-slate-100' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800'
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
                      ? 'text-slate-950 bg-slate-100 border border-slate-100' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800'
                  }`}
                >
                  My Dashboard
                </Link>

                <Link
                  to="/dashboard/tickets"
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                    isActive('/dashboard/tickets') 
                      ? 'text-slate-950 bg-slate-100 border border-slate-100' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800'
                  }`}
                >
                  <Ticket className="w-4 h-4" />
                  My Tickets
                </Link>

                <Link
                  to="/dashboard/history"
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                    isActive('/dashboard/history') 
                      ? 'text-slate-950 bg-slate-100 border border-slate-100' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800'
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
                className="px-3.5 py-2 rounded-xl text-sm font-semibold bg-slate-900 border border-slate-700 text-slate-100 hover:bg-slate-800 hover:border-slate-400 flex items-center gap-1.5 ml-2 transition-all duration-200"
              >
                <QrCode className="w-4 h-4 text-slate-100" />
                Gate Scanner
              </Link>
            )}

            {isAdmin && (
              <>
                <Link
                  to="/admin/events/create"
                  className="px-3.5 py-2 rounded-xl text-sm font-extrabold bg-white text-slate-950 hover:bg-slate-200 border border-white flex items-center gap-1.5 ml-1 transition-all duration-200"
                >
                  <PlusCircle className="w-4 h-4 text-slate-950" />
                  + Create Event
                </Link>
                <Link
                  to="/admin"
                  className="px-3.5 py-2 rounded-xl text-sm font-semibold bg-slate-900 border border-slate-700 text-slate-100 hover:bg-slate-800 hover:border-slate-400 flex items-center gap-1.5 ml-1 transition-all duration-200"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-100" />
                  Admin Portal
                </Link>
              </>
            )}
          </nav>

          {/* User Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-950 flex items-center justify-center text-xs font-bold">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="text-left">
                    <span className="block text-xs font-semibold text-slate-200 leading-tight">{user?.name}</span>
                    <span className="block text-[10px] text-slate-400 font-mono capitalize leading-tight">{user?.role?.replace('_', ' ')}</span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all duration-200"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all duration-200"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 text-slate-950 hover:bg-white border border-slate-100 transition-all duration-200"
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
              className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950/95 px-4 pt-2 pb-6 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-900"
          >
            Home
          </Link>
          <Link
            to="/events"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-900"
          >
            Explore Events
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-900"
              >
                My Dashboard
              </Link>
              <Link
                to="/dashboard/tickets"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-900"
              >
                My Tickets
              </Link>
              <Link
                to="/dashboard/history"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-900"
              >
                Event History
              </Link>

              {isStaff && (
                <Link
                  to="/scanner"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-100 bg-slate-900 border border-slate-700"
                >
                  Gate Scanner
                </Link>
              )}

              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-100 bg-slate-900 border border-slate-700"
                >
                  Admin Dashboard
                </Link>
              )}

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between px-2">
                <span className="text-xs text-slate-400 font-medium">{user?.email}</span>
                <button
                  onClick={handleLogout}
                  className="text-xs text-slate-200 font-bold hover:underline"
                >
                  Log Out
                </button>
              </div>
            </>
          ) : (
            <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-200 bg-slate-900 border border-slate-800"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-950 bg-slate-100"
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
