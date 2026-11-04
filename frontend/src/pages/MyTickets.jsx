import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { ticketService } from '../services/serviceModules';
import { Ticket, Calendar, MapPin, Download, Loader2, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ticketService.getMyTickets()
      .then(res => {
        if (res.success) setTickets(res.tickets);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">My Digital QR Passes</h1>
        <p className="text-xs text-zinc-400">Present these QR codes at the gate scanner on event day. Passes expire once scanned by Admin.</p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-white">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-white" />
          <span className="text-xs font-semibold">Loading QR Pass Tickets...</span>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-12 text-center space-y-4">
          <Ticket className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Tickets Issued Yet</h3>
          <p className="text-xs text-zinc-400">Complete payment or register for events to generate your digital QR pass.</p>
          <Link
            to="/events"
            className="inline-block px-5 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs hover:bg-zinc-200 border border-white"
          >
            Explore Events
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {tickets.map((t) => {
            const isExpired = t.status === 'expired' || t.status === 'checked_in';
            const qrPayload = JSON.stringify({
              type: 'event_ticket',
              uniqueId: t.ticket_number,
              ticketNumber: t.ticket_number,
              secureToken: t.secure_token,
              guestName: t.guest_name || '',
              guestEmail: t.guest_email || '',
              eventTitle: t.event?.title || ''
            });

            return (
              <div
                key={t.id}
                className="glass-panel rounded-3xl border border-zinc-800 p-6 space-y-6 flex flex-col justify-between shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2 text-white font-extrabold text-xs tracking-wider">
                    <Ticket className="w-4 h-4 text-white" /> OFFICIAL EVENT PASS
                  </div>
                  {isExpired ? (
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-black font-mono uppercase bg-rose-500/20 text-rose-400 border border-rose-500/50 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> EXPIRED (SCANNED)
                    </span>
                  ) : (
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-black font-mono uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> ACTIVE
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                  
                  {/* QR Canvas Render with Unique ID */}
                  <div className="bg-black p-4 rounded-2xl border border-zinc-800 text-center sm:col-span-1 relative">
                    <div className="inline-block p-2 bg-white rounded-xl border border-zinc-700 relative shadow-md">
                      <div className={isExpired ? 'opacity-40 grayscale' : ''}>
                        <QRCodeCanvas value={qrPayload} size={110} level="H" />
                      </div>
                      {isExpired && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="px-2 py-1 rounded bg-rose-600 text-white font-mono font-black text-[9px] uppercase tracking-wider rotate-[-12deg] shadow-lg">
                            EXPIRED
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="block font-mono text-[9px] text-[#38bdf8] font-bold mt-2 truncate">
                      ID: {t.ticket_number}
                    </span>
                  </div>

                  {/* Pass Meta */}
                  <div className="sm:col-span-2 space-y-2 text-xs">
                    <h3 className="text-base font-bold text-white line-clamp-2">
                      {t.event?.title || 'Event Pass'}
                    </h3>
                    
                    <div className="space-y-1 text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-white shrink-0" />
                        <span>{t.event?.event_date ? new Date(t.event.event_date).toLocaleDateString() : 'Upcoming'} ({t.event?.start_time || ''})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="line-clamp-1">{t.event?.venue || 'Venue'}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <span className="text-[10px] text-zinc-300 font-bold block">Attendee: {t.guest_name}</span>
                      <span className="text-[10px] text-zinc-400 font-mono block truncate">Unique ID: {t.ticket_number}</span>
                      {isExpired && (
                        <span className="text-[10px] text-rose-400 font-bold block mt-1">
                          Pass expired after gate scan.
                        </span>
                      )}
                    </div>
                  </div>

                </div>

                <div className="pt-4 border-t border-zinc-800 flex items-center justify-between gap-3">
                  <Link
                    to={`/ticket/${t.secure_token || t.id}`}
                    className="px-4 py-2 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-1.5 hover:bg-zinc-200 border border-white transition-all duration-200"
                  >
                    View Ticket Pass <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <span className="font-mono text-[10px] text-zinc-500 truncate max-w-[140px]">
                    {t.secure_token}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
