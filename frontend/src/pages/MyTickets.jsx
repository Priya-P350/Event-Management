import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { ticketService } from '../services/serviceModules';
import { Ticket, Calendar, MapPin, Download, Loader2, ArrowRight } from 'lucide-react';

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
        <p className="text-xs text-zinc-400">Present these QR codes at the gate scanner on event day</p>
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
          <p className="text-xs text-zinc-400">Complete payment for registered events to generate your QR ticket.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {tickets.map((t) => {
            const qrPayload = `EVENT-TICKET:${t.secure_token}`;

            return (
              <div
                key={t.id}
                className="glass-panel rounded-3xl border border-zinc-800 p-6 space-y-6 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2 text-white font-extrabold text-xs tracking-wider">
                    <Ticket className="w-4 h-4 text-white" /> OFFICIAL QR PASS
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase ${
                    t.status === 'checked_in' ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' : 'bg-white text-black border border-white'
                  }`}>
                    {t.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                  
                  {/* QR Canvas Render */}
                  <div className="bg-black p-4 rounded-2xl border border-zinc-800 text-center sm:col-span-1">
                    <div className="inline-block p-2 bg-white rounded-xl border border-zinc-700">
                      <QRCodeCanvas value={qrPayload} size={110} level="H" />
                    </div>
                    <span className="block font-mono text-[10px] text-zinc-400 mt-2 truncate">
                      {t.ticket_number}
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
                      <span className="text-[10px] text-zinc-400 font-mono block">Guest: {t.guest_name}</span>
                      <span className="text-[10px] text-zinc-400 font-mono block truncate">Token: {t.secure_token}</span>
                    </div>
                  </div>

                </div>

                <div className="pt-4 border-t border-zinc-800 flex items-center justify-between gap-3">
                  <Link
                    to={`/ticket/${t.secure_token || t.id}`}
                    className="px-4 py-2 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-1.5 hover:bg-zinc-200 border border-white transition-all duration-200"
                  >
                    Full Screen Ticket Pass <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => window.print()}
                    className="p-2 rounded-xl bg-black text-zinc-300 hover:text-white border border-zinc-800"
                    title="Print Pass"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
