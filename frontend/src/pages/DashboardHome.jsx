import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { registrationService } from '../services/serviceModules';
import { CountdownTimer } from '../components/CountdownTimer';
import { Ticket, Calendar, MapPin, Loader2, CheckCircle2 } from 'lucide-react';

export const DashboardHome = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    registrationService.getMyRegistrations()
      .then(res => {
        if (res.success) setRegistrations(res.registrations);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const upcomingRegs = registrations.filter(r => r.registration_status === 'confirmed');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Registered Upcoming Events</h1>
        <p className="text-xs text-zinc-400">View your active event passes and live countdown timers</p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-white">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-white" />
          <span className="text-xs font-semibold">Loading your registered passes...</span>
        </div>
      ) : upcomingRegs.length === 0 ? (
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-12 text-center space-y-4">
          <Ticket className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Upcoming Registered Events</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            You haven't registered for any upcoming tech summits or music festivals yet.
          </p>
          <Link
            to="/events"
            className="inline-block px-6 py-3 rounded-xl bg-white text-black font-extrabold text-xs hover:bg-zinc-200 border border-white"
          >
            Explore Events & Book Pass
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {upcomingRegs.map((reg) => {
            const evt = reg.event;
            if (!evt) return null;

            return (
              <div
                key={reg.id}
                className="glass-panel rounded-3xl border border-zinc-800 p-6 space-y-6 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-black border border-zinc-700 text-white font-bold text-[11px]">
                      {evt.category || 'General'}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white text-black font-mono text-[11px] font-bold flex items-center gap-1 border border-white">
                      <CheckCircle2 className="w-3.5 h-3.5" /> CONFIRMED
                    </span>
                  </div>

                  <div className="flex items-start gap-4">
                    <img src={evt.cover_image_url} alt={evt.title} className="w-20 h-20 rounded-2xl object-cover shrink-0 grayscale" />
                    <div>
                      <h3 className="text-lg font-bold text-white line-clamp-1">{evt.title}</h3>
                      <div className="text-xs text-zinc-400 space-y-1 mt-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-white shrink-0" />
                          <span>{new Date(evt.event_date).toLocaleDateString()} ({evt.start_time})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="line-clamp-1">{evt.venue}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Live Countdown Timer */}
                  <div className="p-3 bg-black border border-zinc-800 rounded-2xl">
                    <CountdownTimer targetDate={evt.event_date} startTime={evt.start_time} />
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                  <div className="font-mono text-xs text-zinc-400">
                    REG #: <span className="text-white font-bold">{reg.registration_number}</span>
                  </div>
                  {reg.ticket ? (
                    <Link
                      to={`/ticket/${reg.ticket.secure_token || reg.ticket.id}`}
                      className="px-4 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-1.5 hover:bg-zinc-200 border border-white transition-all duration-200"
                    >
                      <Ticket className="w-4 h-4" /> View Digital QR Ticket
                    </Link>
                  ) : (
                    <span className="text-xs text-zinc-400 font-semibold">Generating Ticket...</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
