import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket, ShieldCheck, CheckCircle2, Waves } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-[#020817]/90 border-t border-cyan-500/20 pt-16 pb-12 text-[#94b8d6] text-sm relative z-10 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-cyan-500/20">
          
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00f2fe] to-[#0284c7] flex items-center justify-center text-[#020817] shadow-[0_0_15px_rgba(0,242,254,0.35)]">
                <Ticket className="w-4 h-4 text-[#020817]" />
              </div>
              <span className="text-lg font-black tracking-wider text-[#e0f2fe]">
                EVENT<span className="text-[#38bdf8]">HUB</span>
              </span>
            </Link>
            <p className="text-[#94b8d6] text-xs leading-relaxed">
              Enterprise event management, online Razorpay payment processing, digital single-use QR passes, fast gate check-ins, and attendance analytics.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#38bdf8] bg-[#041124] px-3 py-1 rounded-full border border-cyan-500/30">
                <Waves className="w-3.5 h-3.5 text-[#38bdf8]" /> Oceanic Depth Architecture
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-[#e0f2fe] font-bold text-sm tracking-wider uppercase">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/events" className="hover:text-[#38bdf8] transition-colors">Explore Events</Link></li>
              <li><Link to="/dashboard/tickets" className="hover:text-[#38bdf8] transition-colors">My QR Tickets</Link></li>
              <li><Link to="/dashboard/history" className="hover:text-[#38bdf8] transition-colors">Event History</Link></li>
              <li><Link to="/scanner" className="hover:text-[#38bdf8] transition-colors">Gate Staff Scanner</Link></li>
            </ul>
          </div>

          {/* How it works */}
          <div className="space-y-3">
            <h4 className="text-[#e0f2fe] font-bold text-sm tracking-wider uppercase">How It Works</h4>
            <ul className="space-y-2 text-xs text-[#94b8d6]">
              <li className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-cyan-400 text-[#020817] flex items-center justify-center font-black text-[10px]">1</span> Register for an Event</li>
              <li className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-cyan-400 text-[#020817] flex items-center justify-center font-black text-[10px]">2</span> Secure Payment via Razorpay</li>
              <li className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-cyan-400 text-[#020817] flex items-center justify-center font-black text-[10px]">3</span> Instant Unique QR Pass to Email</li>
              <li className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-cyan-400 text-[#020817] flex items-center justify-center font-black text-[10px]">4</span> Single-Use Gate Check-in & Expiration</li>
            </ul>
          </div>

          {/* Compliance & Policy */}
          <div className="space-y-3">
            <h4 className="text-[#e0f2fe] font-bold text-sm tracking-wider uppercase">Legal & Contact</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#privacy" className="hover:text-[#38bdf8] transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" className="hover:text-[#38bdf8] transition-colors">Terms of Service</a></li>
              <li><a href="#refund" className="hover:text-[#38bdf8] transition-colors">Refund & Cancellation Policy</a></li>
              <li><a href="mailto:support@eventhub.com" className="hover:text-[#38bdf8] transition-colors">Support: support@eventhub.com</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#94b8d6]">
          <p>&copy; 2026 EventHub Platform. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[#38bdf8]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#38bdf8]" /> Production Deep-Sea Stack
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
