import React, { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Ticket, Calendar, MapPin, Download, ArrowRight } from 'lucide-react';

export const PaymentSuccess = () => {
  const location = useLocation();
  const state = location.state || {};
  const { ticket, event, ticketNumber, secureToken } = state;

  useEffect(() => {
    // Fire confetti celebration animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ffffff', '#000000', '#888888']
    });
  }, []);

  const qrPayload = `EVENT-TICKET:${secureToken || ticket?.secure_token || 'EVT-TK-SAMPLE'}`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center mx-auto border border-white">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-white">Payment Verified & Ticket Issued!</h1>
        <p className="text-xs text-zinc-400 max-w-md mx-auto">
          Your registration is confirmed. We've dispatched your digital QR ticket pass to your email.
        </p>
      </div>

      {/* Ticket Pass Preview */}
      <div className="glass-panel rounded-3xl border border-zinc-800 space-y-6 p-8">
        
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2 text-white font-extrabold text-sm tracking-wider">
            <Ticket className="w-5 h-5 text-white" /> EVENTHUB OFFICIAL PASS
          </div>
          <span className="px-3 py-1 rounded-full bg-white text-black font-mono text-xs font-bold border border-white">
            CONFIRMED
          </span>
        </div>

        {/* QR Code Container */}
        <div className="bg-black p-6 rounded-2xl border border-zinc-800 text-center space-y-4">
          <div className="inline-block p-4 bg-white rounded-2xl border border-zinc-700">
            <QRCodeCanvas
              value={qrPayload}
              size={180}
              level="H"
              includeMargin={false}
            />
          </div>
          <div className="space-y-1">
            <span className="block font-mono text-xs text-white font-bold tracking-wider">
              TICKET ID: {ticketNumber || ticket?.ticket_number || 'EVT-2026-000101'}
            </span>
            <span className="block font-mono text-[11px] text-zinc-400">
              TOKEN: {secureToken || ticket?.secure_token}
            </span>
            <p className="text-[11px] text-zinc-400 pt-1">Scan this QR code at gate entrance scanner for check-in</p>
          </div>
        </div>

        {/* Event Details Summary */}
        <div className="space-y-3 text-xs bg-black p-4 rounded-xl border border-zinc-800">
          <h4 className="font-bold text-white text-sm">{event?.title || ticket?.event?.title || 'Global Tech Summit 2026'}</h4>
          
          <div className="grid grid-cols-2 gap-2 text-zinc-300">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-white" />
              <span>{event?.event_date || 'October 15, 2026'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-zinc-400" />
              <span className="line-clamp-1">{event?.venue || 'Grand Convention Center'}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Link
            to="/dashboard/tickets"
            className="w-full py-3 rounded-xl bg-white text-black font-extrabold text-xs text-center hover:bg-zinc-200 transition-all duration-200 border border-white flex items-center justify-center gap-2"
          >
            View in Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={() => window.print()}
            className="w-full py-3 rounded-xl bg-black border border-zinc-800 text-zinc-200 hover:text-white font-semibold text-xs flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-white" /> Print Digital Ticket
          </button>
        </div>

      </div>

    </div>
  );
};
