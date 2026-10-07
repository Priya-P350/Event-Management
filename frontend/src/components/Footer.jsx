import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket, ShieldCheck } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 pt-16 pb-12 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800/80">
          
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-950">
                <Ticket className="w-4 h-4" />
              </div>
              <span className="text-lg font-black tracking-wider text-slate-100">
                EVENT<span className="text-slate-500">HUB</span>
              </span>
            </Link>
            <p className="text-slate-400 text-xs leading-relaxed">
              Enterprise event management, online Razorpay payment processing, digital QR passes, fast gate check-ins, and attendance analytics.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-200 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-100" /> Razorpay Verified
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-slate-100 font-bold text-sm tracking-wider uppercase">Platform</h4>
            <ul className="space-y-2">
              <li><Link to="/events" className="hover:text-white transition-colors">Explore Events</Link></li>
              <li><Link to="/dashboard/tickets" className="hover:text-white transition-colors">My QR Tickets</Link></li>
              <li><Link to="/dashboard/history" className="hover:text-white transition-colors">Event History</Link></li>
              <li><Link to="/scanner" className="hover:text-white transition-colors">Gate Staff Scanner</Link></li>
            </ul>
          </div>

          {/* How it works */}
          <div className="space-y-3">
            <h4 className="text-slate-100 font-bold text-sm tracking-wider uppercase">How It Works</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-slate-100 text-slate-950 flex items-center justify-center font-bold text-[10px]">1</span> Register for an Event</li>
              <li className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-slate-100 text-slate-950 flex items-center justify-center font-bold text-[10px]">2</span> Secure Payment via Razorpay</li>
              <li className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-slate-100 text-slate-950 flex items-center justify-center font-bold text-[10px]">3</span> Instant Unique QR Ticket Email</li>
              <li className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-slate-100 text-slate-950 flex items-center justify-center font-bold text-[10px]">4</span> Scan at Gate for Approved Entry</li>
            </ul>
          </div>

          {/* Compliance & Policy */}
          <div className="space-y-3">
            <h4 className="text-slate-100 font-bold text-sm tracking-wider uppercase">Legal & Contact</h4>
            <ul className="space-y-2">
              <li><a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#refund" className="hover:text-white transition-colors">Refund & Cancellation Policy</a></li>
              <li><a href="mailto:support@eventhub.com" className="hover:text-white transition-colors">Support: support@eventhub.com</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>&copy; 2026 EventHub Platform. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-400">
              Slate Dark Edition
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
