import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../services/serviceModules';
import { CountdownTimer } from '../components/CountdownTimer';
import { 
  Ticket, Calendar, MapPin, QrCode, ShieldCheck, ArrowRight, 
  Sparkles, Zap, CheckCircle2, Users
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
    <div className="space-y-24 pb-20">
      
      {/* HERO SECTION */}
      <section className="relative pt-12 lg:pt-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-semibold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-white" />
                Next-Gen Event & QR Ticketing Engine
              </div>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-none">
                Experience Events. <br />
                <span className="text-zinc-400">
                  Connect. Celebrate.
                </span>
              </h1>

              <p className="text-zinc-400 text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Discover world-class tech summits, music festivals, and gala workshops. Register seamlessly, pay securely via Razorpay, and receive your digital QR pass instantly.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/events"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-black font-extrabold text-base hover:bg-zinc-200 hover:scale-[1.02] transition-all duration-200 border border-white flex items-center justify-center gap-2"
                >
                  Explore Events <ArrowRight className="w-5 h-5" />
                </Link>

                <Link
                  to="/scanner"
                  className="w-full sm:w-auto px-6 py-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white hover:border-white font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <QrCode className="w-5 h-5 text-white" /> Gate Scanner
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 flex items-center justify-center lg:justify-start gap-8 border-t border-zinc-800 text-zinc-400 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span>Razorpay Verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-white" />
                  <span>Instant QR Tickets</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Atomic Check-in</span>
                </div>
              </div>
            </div>

            {/* Hero Graphic / Featured Showcase */}
            <div className="relative">
              <div className="relative bg-zinc-950 rounded-3xl p-6 border border-zinc-800 space-y-6">
                <div className="relative h-64 rounded-2xl overflow-hidden group">
                  <img
                    src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80"
                    alt="Featured Tech Summit"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 grayscale group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider">
                    Featured Event
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                    <span>Technology • Grand Convention Center</span>
                    <span className="text-white font-mono font-bold">₹1,499.00</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">Global Tech Summit 2026</h3>
                  <p className="text-xs text-zinc-400 line-clamp-2">
                    Bringing together global visionaries in AI, Cloud Computing, Cybersecurity, and Web3 technologies.
                  </p>
                </div>

                {/* Live Countdown Component */}
                <CountdownTimer targetDate="2026-10-15" startTime="09:00:00" />

                <Link
                  to="/events/a1111111-1111-1111-1111-111111111111"
                  className="block w-full text-center py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-sm border border-white transition-all duration-200"
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
            <div className="text-zinc-400 font-semibold text-xs uppercase tracking-widest mb-1">Live Events Catalog</div>
            <h2 className="text-3xl font-extrabold text-white">Upcoming Events</h2>
          </div>
          <Link
            to="/events"
            className="text-sm font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            View All Events <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-96 rounded-2xl bg-zinc-900 animate-pulse border border-zinc-800"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {events.slice(0, 3).map((evt) => (
              <div
                key={evt.id}
                className="group bg-zinc-950 border border-zinc-800 hover:border-white rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={evt.cover_image_url}
                    alt={evt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 grayscale group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-zinc-700 text-white font-bold text-[11px]">
                    {evt.category}
                  </span>
                  <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-white text-black font-extrabold text-xs">
                    ₹{evt.ticket_price}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-zinc-300 transition-colors line-clamp-1">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2">
                      {evt.description}
                    </p>
                  </div>

                  <div className="space-y-2 text-xs text-zinc-400 pt-3 border-t border-zinc-800">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-white shrink-0" />
                      <span>{new Date(evt.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {evt.start_time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span className="line-clamp-1">{evt.venue}</span>
                    </div>
                  </div>

                  <Link
                    to={`/events/${evt.id}`}
                    className="block text-center py-2.5 rounded-xl bg-zinc-900 hover:bg-white hover:text-black text-white font-semibold text-xs border border-zinc-800 hover:border-white transition-all duration-200"
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
      <section className="bg-zinc-950 border-y border-zinc-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-zinc-400 font-semibold text-xs uppercase tracking-widest">End-To-End Guest Journey</span>
            <h2 className="text-3xl font-extrabold text-white">How EventHub Works</h2>
            <p className="text-xs text-zinc-400">Four simple steps from registration to gate entry.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-black border border-zinc-800 hover:border-zinc-500 rounded-2xl p-6 relative space-y-4 transition-all duration-200">
              <div className="w-10 h-10 rounded-xl bg-white text-black font-bold flex items-center justify-center text-base">
                01
              </div>
              <h4 className="text-base font-bold text-white">Select Event & Register</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Choose your desired tech summit, music festival, or business gala. Fill out basic attendee details.
              </p>
            </div>

            <div className="bg-black border border-zinc-800 hover:border-zinc-500 rounded-2xl p-6 relative space-y-4 transition-all duration-200">
              <div className="w-10 h-10 rounded-xl bg-white text-black font-bold flex items-center justify-center text-base">
                02
              </div>
              <h4 className="text-base font-bold text-white">Razorpay Secure Checkout</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Complete payment instantly using UPI, credit cards, or netbanking. Backend verifies HMAC signature.
              </p>
            </div>

            <div className="bg-black border border-zinc-800 hover:border-zinc-500 rounded-2xl p-6 relative space-y-4 transition-all duration-200">
              <div className="w-10 h-10 rounded-xl bg-white text-black font-bold flex items-center justify-center text-base">
                03
              </div>
              <h4 className="text-base font-bold text-white">Receive Digital QR Ticket</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Receive an official HTML email with an encrypted QR token pass, accessible directly in your guest dashboard.
              </p>
            </div>

            <div className="bg-black border border-zinc-800 hover:border-zinc-500 rounded-2xl p-6 relative space-y-4 transition-all duration-200">
              <div className="w-10 h-10 rounded-xl bg-white text-black font-bold flex items-center justify-center text-base">
                04
              </div>
              <h4 className="text-base font-bold text-white">Gate Camera Scan</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Authorized staff scans your QR pass at event entrance. System atomically checks payment & grants entry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORM FEATURES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-zinc-400 font-semibold text-xs uppercase tracking-widest">Built for Speed & Reliability</span>
          <h2 className="text-3xl font-extrabold text-white">Enterprise Event Management Capabilities</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-6 rounded-2xl border border-zinc-800 space-y-3">
            <QrCode className="w-8 h-8 text-white" />
            <h3 className="text-lg font-bold text-white">Unpredictable Security QR Tokens</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              No sensitive guest PII is stored inside raw QR text. Secure tokens verify server-side to eliminate forgery.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-zinc-800 space-y-3">
            <CheckCircle2 className="w-8 h-8 text-white" />
            <h3 className="text-lg font-bold text-white">Atomic Check-In & Fraud Prevention</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Database-level transaction locks prevent duplicate entry when multiple gate staff scan tickets simultaneously.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-zinc-800 space-y-3">
            <Users className="w-8 h-8 text-white" />
            <h3 className="text-lg font-bold text-white">Role-Based Access Control</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Separated roles for Super Admins, Event Organizers, Gate Staff Scanners, and Registered Guests.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
