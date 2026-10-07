import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { ticketService } from '../services/serviceModules';
import { Ticket, Download, ArrowLeft, Loader2 } from 'lucide-react';

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

  const qrPayload = `EVENT-TICKET:${ticket.secure_token}`;
  const event = ticket.event || {};
  const guest = ticket.user || {};

  return (
    <div className="max-w-xl mx-auto px-4 py-10 space-y-6">
      
      <Link to="/dashboard/tickets" className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white print:hidden">
        <ArrowLeft className="w-4 h-4" /> Back to My Tickets
      </Link>

      <div className="glass-panel rounded-3xl border border-zinc-800 p-8 space-y-6 print:border-black print:bg-white print:text-black">
        
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <span className="text-xs font-extrabold text-white tracking-wider uppercase block">EVENTHUB OFFICIAL ENTRY PASS</span>
            <span className="text-[10px] text-zinc-400 font-mono">NON-TRANSFERABLE DIGITAL TICKET</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono uppercase ${
            ticket.status === 'checked_in' ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' : 'bg-white text-black border border-white'
          }`}>
            {ticket.status.replace('_', ' ')}
          </span>
        </div>

        {/* QR Code */}
        <div className="bg-black p-6 rounded-2xl border border-zinc-800 text-center space-y-4 print:bg-white">
          <div className="inline-block p-4 bg-white rounded-2xl border border-zinc-700">
            <QRCodeCanvas value={qrPayload} size={200} level="H" />
          </div>
          <div className="space-y-1">
            <span className="block font-mono text-sm text-white font-extrabold tracking-wider">
              {ticket.ticket_number}
            </span>
            <span className="block font-mono text-xs text-zinc-400">
              TOKEN: {ticket.secure_token}
            </span>
          </div>
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
              <span className="font-bold text-white text-sm">{guest.name || ticket.registration?.guest_name || 'Guest'}</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Email</span>
              <span className="font-medium text-zinc-200 truncate block">{guest.email || ticket.registration?.guest_email || ''}</span>
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
          className="w-full py-3.5 rounded-xl bg-white text-black font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all duration-200 border border-white print:hidden"
        >
          <Download className="w-4 h-4" /> Download / Print Ticket PDF
        </button>

      </div>

    </div>
  );
};
