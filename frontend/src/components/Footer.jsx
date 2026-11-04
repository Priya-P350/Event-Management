import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-[#0B1928] border-t border-[#1E394E] pt-16 pb-12 text-[#95B8C9] text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#1E394E]">
          
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E5F4F9] flex items-center justify-center text-[#0B1928] shadow-sm">
                <Ticket className="w-4 h-4" />
              </div>
              <span className="text-lg font-black tracking-wider text-[#E5F4F9]">
                EVENT<span className="text-[#4A96BA]">HUB</span>
              </span>
            </Link>
            <p className="text-[#95B8C9] text-xs leading-relaxed">
              Enterprise event management, online Razorpay payment processing, digital QR passes, fast gate check-ins, and attendance analytics.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#E5F4F9] bg-[#122538] px-2.5 py-1 rounded-full border border-[#1E394E]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#4A96BA]" /> Razorpay Verified
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-[#E5F4F9] font-bold text-sm tracking-wider uppercase">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/events" className="hover:text-[#E5F4F9] transition-colors">Explore Events</Link></li>
              <li><Link to="/dashboard/tickets" className="hover:text-[#E5F4F9] transition-colors">My QR Tickets</Link></li>
              <li><Link to="/dashboard/history" className="hover:text-[#E5F4F9] transition-colors">Event History</Link></li>
              <li><Link to="/scanner" className="hover:text-[#E5F4F9] transition-colors">Gate Staff Scanner</Link></li>
            </ul>
          </div>

          {/* How it works */}
          <div className="space-y-3">
            <h4 className="text-[#E5F4F9] font-bold text-sm tracking-wider uppercase">How It Works</h4>
            <ul className="space-y-2 text-xs text-[#95B8C9]">
              <li className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[#E5F4F9] text-[#0B1928] flex items-center justify-center font-bold text-[10px]">1</span> Register for an Event</li>
              <li className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[#E5F4F9] text-[#0B1928] flex items-center justify-center font-bold text-[10px]">2</span> Secure Payment via Razorpay</li>
              <li className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[#E5F4F9] text-[#0B1928] flex items-center justify-center font-bold text-[10px]">3</span> Instant Unique QR Ticket Email</li>
              <li className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[#E5F4F9] text-[#0B1928] flex items-center justify-center font-bold text-[10px]">4</span> Scan at Gate for Approved Entry</li>
            </ul>
          </div>

          {/* Compliance & Policy */}
          <div className="space-y-3">
            <h4 className="text-[#E5F4F9] font-bold text-sm tracking-wider uppercase">Legal & Contact</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#privacy" className="hover:text-[#E5F4F9] transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" className="hover:text-[#E5F4F9] transition-colors">Terms of Service</a></li>
              <li><a href="#refund" className="hover:text-[#E5F4F9] transition-colors">Refund & Cancellation Policy</a></li>
              <li><a href="mailto:support@eventhub.com" className="hover:text-[#E5F4F9] transition-colors">Support: support@eventhub.com</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#95B8C9]">
          <p>&copy; 2026 EventHub Platform. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[#E5F4F9]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#4A96BA]" /> Production Grade Architecture
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
