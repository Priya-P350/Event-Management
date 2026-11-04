import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { ticketService } from '../services/serviceModules';
import { Ticket, Download, ArrowLeft, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const SingleTicketView = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    ticketService.getTicketByToken(id)
      .then(res => {
        if (res.success) setTicket(res.ticket);
        else setError('Ticket not found.');
      })
      .catch(err => setError(err.message || 'Error fetching ticket'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center text-white">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-white" />
        <span className="text-xs font-semibold">Loading Ticket Details...</span>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <Ticket className="w-12 h-12 text-white mx-auto" />
        <h2 className="text-2xl font-bold text-white">Ticket Not Found</h2>
        <p className="text-xs text-zinc-400">{error || 'Unable to locate ticket pass.'}</p>
        <Link to="/dashboard/tickets" className="inline-block px-6 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-semibold text-xs">
          Back to My Tickets
        </Link>
      </div>
    );
  }

  const isExpired = ticket.status === 'expired' || ticket.status === 'checked_in';
  const qrPayload = JSON.stringify({
    type: 'event_ticket',
    uniqueId: ticket.ticket_number,
    ticketNumber: ticket.ticket_number,
    secureToken: ticket.secure_token,
    guestName: ticket.registration?.guest_name || ticket.user?.name || '',
    guestEmail: ticket.registration?.guest_email || ticket.user?.email || '',
    eventTitle: ticket.event?.title || ''
  });

  const event = ticket.event || {};
  const guest = ticket.user || {};

  return (
    <div className="max-w-xl mx-auto px-4 py-10 space-y-6">
      
      <Link to="/dashboard/tickets" className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white print:hidden">
        <ArrowLeft className="w-4 h-4" /> Back to My Tickets
      </Link>

      <div className="glass-panel rounded-3xl border border-zinc-800 p-8 space-y-6 print:border-black print:bg-white print:text-black shadow-2xl">
        
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <span className="text-xs font-extrabold text-white tracking-wider uppercase block">EVENTHUB OFFICIAL ENTRY PASS</span>
            <span className="text-[10px] text-zinc-400 font-mono">NON-TRANSFERABLE DIGITAL PASS</span>
          </div>
          {isExpired ? (
            <span className="px-3.5 py-1 rounded-full text-xs font-black font-mono uppercase bg-rose-500/20 text-rose-400 border border-rose-500/50 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> EXPIRED (SCANNED BY ADMIN)
            </span>
          ) : (
            <span className="px-3.5 py-1 rounded-full text-xs font-black font-mono uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE (UNSCANNED)
            </span>
          )}
        </div>

        {/* QR Code Container with Unique ID prominently mentioned on it */}
        <div className="bg-black p-6 rounded-2xl border border-zinc-800 text-center space-y-4 print:bg-white relative">
          <div className="inline-block p-4 bg-white rounded-2xl border-4 border-zinc-300 relative shadow-xl">
            <div className={isExpired ? 'opacity-40 grayscale' : ''}>
              <QRCodeCanvas value={qrPayload} size={200} level="H" />
            </div>

            {/* Expired Stamp */}
            {isExpired && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="px-4 py-2 rounded-xl bg-rose-600 text-white font-mono font-black text-sm uppercase tracking-widest border-2 border-white rotate-[-15deg] shadow-2xl">
                  EXPIRED
                </span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold block">
              Unique Ticket ID (Mentioned on QR)
            </span>
            <span className="block font-mono text-base text-white font-black tracking-widest">
              {ticket.ticket_number}
            </span>
            <span className="block font-mono text-[11px] text-zinc-400">
              TOKEN: {ticket.secure_token}
            </span>
          </div>

          {isExpired ? (
            <p className="text-xs text-rose-400 font-medium">
              This QR code was scanned by Admin and is expired. Duplicate entry is denied.
            </p>
          ) : (
            <p className="text-xs text-zinc-400">
              Present this QR at the gate entrance. Once scanned by Admin, this ticket expires immediately.
            </p>
          )}
        </div>

        {/* Event Details */}
        <div className="space-y-4 text-xs">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Event Title</span>
            <h2 className="text-xl font-bold text-white">{event.title || 'Event Name'}</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-black p-4 rounded-xl border border-zinc-800">
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Attendee Name</span>
              <span className="font-bold text-white text-sm">{ticket.registration?.guest_name || guest.name || 'Guest'}</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Email</span>
              <span className="font-medium text-zinc-200 truncate block">{ticket.registration?.guest_email || guest.email || ''}</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Date & Time</span>
              <span className="font-semibold text-zinc-200">{event.event_date} ({event.start_time})</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Venue</span>
              <span className="font-semibold text-zinc-200 line-clamp-1">{event.venue}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => window.print()}
          className="w-full py-3.5 rounded-xl bg-white text-black font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all duration-200 border border-white print:hidden cursor-pointer shadow-lg"
        >
          <Download className="w-4 h-4" /> Download / Print Ticket PDF
        </button>

      </div>

    </div>
  );
};
