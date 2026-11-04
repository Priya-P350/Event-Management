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
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#122538] border border-[#1E394E] text-[#E5F4F9] text-xs font-semibold uppercase tracking-widest shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-[#4A96BA]" />
                Next-Gen Event & QR Ticketing Engine
              </div>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[#E5F4F9] leading-none">
                Experience Events. <br />
                <span className="text-[#4A96BA] bg-gradient-to-r from-[#4A96BA] via-[#95B8C9] to-[#E5F4F9] bg-clip-text text-transparent">
                  Connect. Celebrate.
                </span>
              </h1>

              <p className="text-[#95B8C9] text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Discover world-class tech summits, ITI fairs, and gala workshops. Register seamlessly, pay securely via Razorpay, and receive your digital QR pass instantly.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/events"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#E5F4F9] text-[#0B1928] font-extrabold text-base hover:bg-[#C3E2ED] hover:scale-[1.02] transition-all duration-200 border border-[#E5F4F9] flex items-center justify-center gap-2 shadow-lg"
                >
                  Explore Events <ArrowRight className="w-5 h-5 text-[#0B1928]" />
                </Link>

                <Link
                  to="/scanner"
                  className="w-full sm:w-auto px-6 py-4 rounded-xl bg-[#122538] border border-[#1E394E] text-[#E5F4F9] hover:border-[#4A96BA] hover:bg-[#1E394E] font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
                >
                  <QrCode className="w-5 h-5 text-[#4A96BA]" /> Gate Scanner
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 flex items-center justify-center lg:justify-start gap-8 border-t border-[#1E394E] text-[#95B8C9] text-xs font-medium">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#4A96BA]" />
                  <span>Razorpay Verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#4A96BA]" />
                  <span>Instant QR Tickets</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#4A96BA]" />
                  <span>Atomic Check-in</span>
                </div>
              </div>
            </div>

            {/* Hero Graphic / Featured Showcase with Woven Texture Canvas */}
            <div className="relative">
              <div className="relative texture-card rounded-3xl p-6 border border-[#2B4E66] space-y-6 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#4A96BA]/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="relative h-64 rounded-2xl overflow-hidden group border border-[#1E394E]">
                  <img
                    src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80"
                    alt="Featured Tech Summit"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B1928] via-[#0B1928]/40 to-transparent"></div>
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#E5F4F9] text-[#0B1928] font-bold text-xs uppercase tracking-wider shadow-md">
                    Featured Event
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#95B8C9] font-semibold uppercase tracking-wider">
                    <span>Technology • Grand Convention Center</span>
                    <span className="text-[#E5F4F9] font-mono font-bold">₹1,499.00</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#E5F4F9]">Global Tech Summit 2026</h3>
                  <p className="text-xs text-[#95B8C9] line-clamp-2 leading-relaxed">
                    Bringing together global visionaries in AI, Cloud Computing, Cybersecurity, and Web3 technologies.
                  </p>
                </div>

                {/* Live Countdown Component */}
                <CountdownTimer targetDate="2026-10-15" startTime="09:00:00" />

                <Link
                  to="/events/a1111111-1111-1111-1111-111111111111"
                  className="block w-full text-center py-3.5 rounded-xl bg-[#E5F4F9] hover:bg-[#C3E2ED] text-[#0B1928] font-extrabold text-sm border border-[#E5F4F9] transition-all duration-200 shadow-md"
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
            <div className="text-[#95B8C9] font-semibold text-xs uppercase tracking-widest mb-1">Live Events Catalog</div>
            <h2 className="text-3xl font-extrabold text-[#E5F4F9]">Upcoming Events</h2>
          </div>
          <Link
            to="/events"
            className="text-sm font-semibold text-[#95B8C9] hover:text-[#E5F4F9] flex items-center gap-1.5 transition-colors"
          >
            View All Events <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-96 rounded-2xl bg-[#122538] animate-pulse border border-[#1E394E]"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {events.slice(0, 3).map((evt) => (
              <div
                key={evt.id}
                className="group bg-[#122538]/90 border border-[#1E394E] hover:border-[#E5F4F9]/60 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col shadow-xl"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={evt.cover_image_url}
                    alt={evt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B1928] via-transparent to-transparent"></div>
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[#0B1928]/90 backdrop-blur-md border border-[#1E394E] text-[#E5F4F9] font-bold text-[11px]">
                    {evt.category}
                  </span>
                  <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-[#E5F4F9] text-[#0B1928] font-extrabold text-xs shadow-sm">
                    ₹{evt.ticket_price}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-[#E5F4F9] group-hover:text-white transition-colors line-clamp-1">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-[#95B8C9] line-clamp-2 leading-relaxed">
                      {evt.description}
                    </p>
                  </div>

                  <div className="space-y-2 text-xs text-[#95B8C9] pt-3 border-t border-[#1E394E]">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#4A96BA] shrink-0" />
                      <span>{new Date(evt.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {evt.start_time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#95B8C9] shrink-0" />
                      <span className="line-clamp-1">{evt.venue}</span>
                    </div>
                  </div>

                  <Link
                    to={`/events/${evt.id}`}
                    className="block text-center py-2.5 rounded-xl bg-[#E5F4F9] hover:bg-[#C3E2ED] text-[#0B1928] font-extrabold text-xs border border-[#E5F4F9] transition-all duration-200 shadow-sm"
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
      <section className="bg-[#122538]/70 border-y border-[#1E394E] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[#95B8C9] font-semibold text-xs uppercase tracking-widest">End-To-End Guest Journey</span>
            <h2 className="text-3xl font-extrabold text-[#E5F4F9]">How EventHub Works</h2>
            <p className="text-xs text-[#95B8C9]">Four simple steps from registration to gate entry.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#0B1928] border border-[#1E394E] hover:border-[#4A96BA] rounded-2xl p-6 relative space-y-4 transition-all duration-200 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-[#E5F4F9] text-[#0B1928] font-bold flex items-center justify-center text-base shadow-sm">
                01
              </div>
              <h4 className="text-base font-bold text-[#E5F4F9]">Select Event & Register</h4>
              <p className="text-xs text-[#95B8C9] leading-relaxed">
                Choose your desired tech summit, ITI trade fair, or gala. Fill out basic attendee details.
              </p>
            </div>

            <div className="bg-[#0B1928] border border-[#1E394E] hover:border-[#4A96BA] rounded-2xl p-6 relative space-y-4 transition-all duration-200 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-[#E5F4F9] text-[#0B1928] font-bold flex items-center justify-center text-base shadow-sm">
                02
              </div>
              <h4 className="text-base font-bold text-[#E5F4F9]">Razorpay Secure Checkout</h4>
              <p className="text-xs text-[#95B8C9] leading-relaxed">
                Complete payment instantly using UPI, credit cards, or netbanking. Backend verifies HMAC signature.
              </p>
            </div>

            <div className="bg-[#0B1928] border border-[#1E394E] hover:border-[#4A96BA] rounded-2xl p-6 relative space-y-4 transition-all duration-200 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-[#E5F4F9] text-[#0B1928] font-bold flex items-center justify-center text-base shadow-sm">
                03
              </div>
              <h4 className="text-base font-bold text-[#E5F4F9]">Receive Digital QR Ticket</h4>
              <p className="text-xs text-[#95B8C9] leading-relaxed">
                Receive an encrypted QR token pass, accessible directly in your guest dashboard or printable voucher.
              </p>
            </div>

            <div className="bg-[#0B1928] border border-[#1E394E] hover:border-[#4A96BA] rounded-2xl p-6 relative space-y-4 transition-all duration-200 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-[#E5F4F9] text-[#0B1928] font-bold flex items-center justify-center text-base shadow-sm">
                04
              </div>
              <h4 className="text-base font-bold text-[#E5F4F9]">Gate Camera Scan</h4>
              <p className="text-xs text-[#95B8C9] leading-relaxed">
                Authorized staff scans your QR pass at event entrance. System atomically checks payment & grants entry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORM FEATURES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-[#95B8C9] font-semibold text-xs uppercase tracking-widest">Built for Speed & Reliability</span>
          <h2 className="text-3xl font-extrabold text-[#E5F4F9]">Enterprise Event Management Capabilities</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#122538]/90 p-6 rounded-2xl border border-[#1E394E] space-y-3 shadow-lg">
            <QrCode className="w-8 h-8 text-[#4A96BA]" />
            <h3 className="text-lg font-bold text-[#E5F4F9]">Unpredictable Security QR Tokens</h3>
            <p className="text-xs text-[#95B8C9] leading-relaxed">
              No sensitive guest PII is stored inside raw QR text. Secure tokens verify server-side to eliminate forgery.
            </p>
          </div>

          <div className="bg-[#122538]/90 p-6 rounded-2xl border border-[#1E394E] space-y-3 shadow-lg">
            <CheckCircle2 className="w-8 h-8 text-[#4A96BA]" />
            <h3 className="text-lg font-bold text-[#E5F4F9]">Atomic Check-In & Fraud Prevention</h3>
            <p className="text-xs text-[#95B8C9] leading-relaxed">
              Database-level transaction locks prevent duplicate entry when multiple gate staff scan tickets simultaneously.
            </p>
          </div>

          <div className="bg-[#122538]/90 p-6 rounded-2xl border border-[#1E394E] space-y-3 shadow-lg">
            <Users className="w-8 h-8 text-[#4A96BA]" />
            <h3 className="text-lg font-bold text-[#E5F4F9]">Role-Based Access Control</h3>
            <p className="text-xs text-[#95B8C9] leading-relaxed">
              Separated roles for Super Admins, Event Organizers, Gate Staff Scanners, and Registered Guests.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
