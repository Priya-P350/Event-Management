import React, { useState, useEffect } from 'react';
import { registrationService } from '../services/serviceModules';
import { History, Calendar, MapPin, CheckCircle2, Loader2 } from 'lucide-react';

export const EventHistory = () => {
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

  // Filter completed/past/checked_in registrations
  const historyRegs = registrations.filter(r => r.ticket?.status === 'checked_in' || r.event?.status === 'completed');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Event History & Past Attended Events</h1>
        <p className="text-xs text-zinc-400">Archives of previously attended summits, workshops, and concerts</p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-white">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-white" />
          <span className="text-xs font-semibold">Loading Event History Archives...</span>
        </div>
      ) : historyRegs.length === 0 ? (
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-12 text-center space-y-4">
          <History className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Event History Available Yet</h3>
          <p className="text-xs text-zinc-400">Attended past events and checked-in passes will appear here after event completion.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {historyRegs.map((reg) => {
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
                      {evt.category}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white text-black font-mono text-[11px] font-bold flex items-center gap-1 border border-white">
                      <CheckCircle2 className="w-3.5 h-3.5" /> CHECKED IN AT GATE
                    </span>
                  </div>

                  <div className="flex items-start gap-4">
                    <img src={evt.cover_image_url} alt={evt.title} className="w-20 h-20 rounded-2xl object-cover shrink-0 grayscale" />
                    <div>
                      <h3 className="text-lg font-bold text-white line-clamp-1">{evt.title}</h3>
                      <div className="text-xs text-zinc-400 space-y-1 mt-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-white shrink-0" />
                          <span>{new Date(evt.event_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="line-clamp-1">{evt.venue}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                  <span>Pass #: <strong className="text-white">{reg.registration_number}</strong></span>
                  <span className="font-mono text-white font-semibold">Attended</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
