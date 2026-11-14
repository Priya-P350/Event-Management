import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../services/serviceModules';
import { CountdownTimer } from '../components/CountdownTimer';
import { 
  Ticket, Calendar, MapPin, QrCode, ShieldCheck, ArrowRight, 
  Sparkles, Zap, CheckCircle2, Users, Waves
} from 'lucide-react';

export const Home = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventService.getEvents({ status: 'registration_open' })
      .then(res => {
        if (res.success) setEvents(res.events);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-24 pb-20 relative z-10">
      
      {/* HERO SECTION */}
      <section className="relative pt-12 lg:pt-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#041124] border border-cyan-500/30 text-[#38bdf8] text-xs font-semibold uppercase tracking-widest shadow-[0_0_12px_rgba(0,242,254,0.15)]">
                <Sparkles className="w-3.5 h-3.5 text-[#38bdf8]" />
                Oceanic Event & Single-Use QR Pass Engine
              </div>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[#e0f2fe] leading-none">
                Deep Sea Events. <br />
                <span className="bg-gradient-to-r from-[#00f2fe] via-[#38bdf8] to-[#e0f2fe] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(0,242,254,0.3)]">
                  Connect. Celebrate.
                </span>
              </h1>

              <p className="text-[#94b8d6] text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Discover world-class tech summits, ITI fairs, and gala workshops. Register seamlessly, pay securely via Razorpay, and receive your digital single-use QR pass instantly on email.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/events"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-[#00f2fe] to-[#0284c7] text-[#020817] font-black text-base hover:from-[#38bdf8] hover:to-[#00f2fe] hover:scale-[1.02] transition-all duration-200 border border-[#38bdf8] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,242,254,0.4)]"
                >
                  Explore Events <ArrowRight className="w-5 h-5 text-[#020817]" />
                </Link>

                <Link
                  to="/scanner"
                  className="w-full sm:w-auto px-6 py-4 rounded-xl bg-[#041124] border border-cyan-500/30 text-[#e0f2fe] hover:border-cyan-400 hover:bg-cyan-950/40 font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
                >
                  <QrCode className="w-5 h-5 text-[#38bdf8]" /> Gate Scanner
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 flex items-center justify-center lg:justify-start gap-8 border-t border-cyan-500/20 text-[#94b8d6] text-xs font-medium">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#38bdf8]" />
                  <span>Razorpay Verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#38bdf8]" />
                  <span>Single-Use QR Pass</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#38bdf8]" />
                  <span>Atomic Check-in</span>
                </div>
              </div>
            </div>

            {/* Hero Graphic / Featured Showcase with Oceanic Glass Canvas */}
            <div className="relative">
              <div className="relative glass-card rounded-3xl p-6 border border-cyan-500/30 space-y-6 shadow-2xl overflow-hidden backdrop-blur-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="relative h-64 rounded-2xl overflow-hidden group border border-cyan-500/25">
                  <img
                    src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80"
                    alt="Featured Tech Summit"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-[#020817]/40 to-transparent"></div>
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-gradient-to-r from-[#00f2fe] to-[#0284c7] text-[#020817] font-black text-xs uppercase tracking-wider shadow-[0_0_12px_rgba(0,242,254,0.4)]">
                    Featured Event
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#94b8d6] font-semibold uppercase tracking-wider">
                    <span>Technology • Grand Oceanic Convention Center</span>
                    <span className="text-[#38bdf8] font-mono font-bold">₹1,499.00</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#e0f2fe]">Global Tech Summit 2026</h3>
                  <p className="text-xs text-[#94b8d6] line-clamp-2 leading-relaxed">
                    Bringing together global visionaries in AI, Cloud Computing, Cybersecurity, and Web3 technologies.
                  </p>
                </div>

                {/* Live Countdown Component */}
                <CountdownTimer targetDate="2026-10-15" startTime="09:00:00" />

                <Link
                  to="/events/a1111111-1111-1111-1111-111111111111"
                  className="block w-full text-center py-3.5 rounded-xl bg-gradient-to-r from-[#00f2fe] to-[#0284c7] hover:from-[#38bdf8] hover:to-[#00f2fe] text-[#020817] font-black text-sm border border-[#38bdf8] transition-all duration-200 shadow-[0_0_15px_rgba(0,242,254,0.35)]"
                >
                  View Details & Register
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* UPCOMING EVENTS CATALOG */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-[#38bdf8] font-semibold text-xs uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5" /> Live Events Catalog
            </div>
            <h2 className="text-3xl font-extrabold text-[#e0f2fe]">Upcoming Events</h2>
          </div>
          <Link
            to="/events"
            className="text-sm font-semibold text-[#94b8d6] hover:text-[#38bdf8] flex items-center gap-1.5 transition-colors"
          >
            View All Events <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-96 rounded-2xl bg-[#041124] animate-pulse border border-cyan-500/20"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {events.slice(0, 3).map((evt) => (
              <div
                key={evt.id}
                className="group bg-[#041124]/85 border border-cyan-500/20 hover:border-cyan-400/60 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col shadow-xl hover:shadow-[0_10px_30px_rgba(0,242,254,0.15)]"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={evt.cover_image_url}
                    alt={evt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-transparent to-transparent"></div>
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[#020817]/90 backdrop-blur-md border border-cyan-500/30 text-[#e0f2fe] font-bold text-[11px]">
                    {evt.category}
                  </span>
                  <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#00f2fe] to-[#0284c7] text-[#020817] font-black text-xs shadow-[0_0_10px_rgba(0,242,254,0.4)]">
                    ₹{evt.ticket_price}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-[#e0f2fe] group-hover:text-white transition-colors line-clamp-1">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-[#94b8d6] line-clamp-2 leading-relaxed">
                      {evt.description}
                    </p>
                  </div>

                  <div className="space-y-2 text-xs text-[#94b8d6] pt-3 border-t border-cyan-500/20">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#38bdf8] shrink-0" />
                      <span>{new Date(evt.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {evt.start_time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#94b8d6] shrink-0" />
                      <span className="line-clamp-1">{evt.venue}</span>
                    </div>
                  </div>

                  <Link
                    to={`/events/${evt.id}`}
                    className="block text-center py-2.5 rounded-xl bg-gradient-to-r from-[#00f2fe] to-[#0284c7] hover:from-[#38bdf8] hover:to-[#00f2fe] text-[#020817] font-extrabold text-xs border border-[#38bdf8] transition-all duration-200 shadow-[0_0_15px_rgba(0,242,254,0.35)]"
                  >
                    View Details & Ticket
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-[#041124]/70 border-y border-cyan-500/20 py-16 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[#38bdf8] font-semibold text-xs uppercase tracking-widest">End-To-End Guest Journey</span>
            <h2 className="text-3xl font-extrabold text-[#e0f2fe]">How EventHub Works</h2>
            <p className="text-xs text-[#94b8d6]">Four simple steps from registration to single-use gate entry.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#020817] border border-cyan-500/20 hover:border-cyan-400 rounded-2xl p-6 relative space-y-4 transition-all duration-200 shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00f2fe] to-[#0284c7] text-[#020817] font-black flex items-center justify-center text-base shadow-[0_0_12px_rgba(0,242,254,0.4)]">
                01
              </div>
              <h4 className="text-base font-bold text-[#e0f2fe]">Select Event & Register</h4>
              <p className="text-xs text-[#94b8d6] leading-relaxed">
                Choose your desired tech summit, ITI trade fair, or gala. Fill out basic attendee details.
              </p>
            </div>

            <div className="bg-[#020817] border border-cyan-500/20 hover:border-cyan-400 rounded-2xl p-6 relative space-y-4 transition-all duration-200 shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00f2fe] to-[#0284c7] text-[#020817] font-black flex items-center justify-center text-base shadow-[0_0_12px_rgba(0,242,254,0.4)]">
                02
              </div>
              <h4 className="text-base font-bold text-[#e0f2fe]">Razorpay Secure Checkout</h4>
              <p className="text-xs text-[#94b8d6] leading-relaxed">
                Complete payment instantly using UPI, credit cards, or netbanking. Backend verifies HMAC signature.
              </p>
            </div>

            <div className="bg-[#020817] border border-cyan-500/20 hover:border-cyan-400 rounded-2xl p-6 relative space-y-4 transition-all duration-200 shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00f2fe] to-[#0284c7] text-[#020817] font-black flex items-center justify-center text-base shadow-[0_0_12px_rgba(0,242,254,0.4)]">
                03
              </div>
              <h4 className="text-base font-bold text-[#e0f2fe]">Receive Digital QR Pass</h4>
              <p className="text-xs text-[#94b8d6] leading-relaxed">
                Receive an encrypted QR token pass on registered email, accessible in your dashboard or printable pass.
              </p>
            </div>

            <div className="bg-[#020817] border border-cyan-500/20 hover:border-cyan-400 rounded-2xl p-6 relative space-y-4 transition-all duration-200 shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00f2fe] to-[#0284c7] text-[#020817] font-black flex items-center justify-center text-base shadow-[0_0_12px_rgba(0,242,254,0.4)]">
                04
              </div>
              <h4 className="text-base font-bold text-[#e0f2fe]">Gate Camera Scan & Expiry</h4>
              <p className="text-xs text-[#94b8d6] leading-relaxed">
                Staff scans your QR pass at gate. System verifies identity, grants entry, and automatically marks it expired.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORM FEATURES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-[#38bdf8] font-semibold text-xs uppercase tracking-widest">Built for Speed & Reliability</span>
          <h2 className="text-3xl font-extrabold text-[#e0f2fe]">Enterprise Event Management Capabilities</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#041124]/90 p-6 rounded-2xl border border-cyan-500/20 space-y-3 shadow-xl">
            <QrCode className="w-8 h-8 text-[#38bdf8]" />
            <h3 className="text-lg font-bold text-[#e0f2fe]">Unpredictable Security QR Tokens</h3>
            <p className="text-xs text-[#94b8d6] leading-relaxed">
              No sensitive guest PII is stored inside raw QR text. Secure tokens verify server-side to eliminate forgery.
            </p>
          </div>

          <div className="bg-[#041124]/90 p-6 rounded-2xl border border-cyan-500/20 space-y-3 shadow-xl">
            <CheckCircle2 className="w-8 h-8 text-[#38bdf8]" />
            <h3 className="text-lg font-bold text-[#e0f2fe]">Atomic Check-In & Fraud Prevention</h3>
            <p className="text-xs text-[#94b8d6] leading-relaxed">
              Database-level transaction locks prevent duplicate entry when multiple gate staff scan tickets simultaneously.
            </p>
          </div>

          <div className="bg-[#041124]/90 p-6 rounded-2xl border border-cyan-500/20 space-y-3 shadow-xl">
            <Users className="w-8 h-8 text-[#38bdf8]" />
            <h3 className="text-lg font-bold text-[#e0f2fe]">Role-Based Access Control</h3>
            <p className="text-xs text-[#94b8d6] leading-relaxed">
              Separated roles for Super Admins, Event Organizers, Gate Staff Scanners, and Registered Guests.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
