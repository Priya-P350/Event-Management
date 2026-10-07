import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { checkinService, eventService } from '../services/serviceModules';
import { useToast } from '../context/ToastContext';
import { 
  Camera, CheckCircle2, AlertTriangle, XCircle, ShieldCheck
} from 'lucide-react';

export const ScannerPage = () => {
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [manualToken, setManualToken] = useState('');
  const [loadingCheckin, setLoadingCheckin] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const html5QrcodeRef = useRef(null);

  useEffect(() => {
    // Fetch active events for selection
    eventService.getEvents()
      .then(res => {
        if (res.success) {
          setEvents(res.events);
          if (res.events.length > 0) {
            setSelectedEventId(res.events[0].id);
          }
        }
      })
      .catch(err => toast.error(err.message));

    return () => {
      stopCamera();
    };
  }, []);

  const playBeep = (type = 'success') => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      // AudioContext fallback
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const html5QrCode = new Html5Qrcode('qr-reader-canvas');
      html5QrcodeRef.current = html5QrCode;

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        onQrCodeScanned,
        (errorMessage) => {
          // Ignore frame decode errors
        }
      );

      setScanning(true);
    } catch (err) {
      console.error('Camera Init Error:', err);
      setCameraError('Camera access denied or device camera unavailable. Use manual token input below.');
      setScanning(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      try {
        await html5QrcodeRef.current.stop();
        html5QrcodeRef.current.clear();
      } catch (e) {
        console.error('Error stopping camera:', e);
      }
    }
    setScanning(false);
  };

  const onQrCodeScanned = async (decodedText) => {
    // Pause camera scan to process ticket
    await stopCamera();
    processTicketToken(decodedText);
  };

  const processTicketToken = async (rawToken) => {
    setLoadingCheckin(true);
    setScanResult(null);

    try {
      const res = await checkinService.scanTicket(rawToken, selectedEventId);

      if (res.success && res.code === 'ENTRY_APPROVED') {
        playBeep('success');
        setScanResult({
          status: 'APPROVED',
          title: '✓ ENTRY APPROVED',
          guestName: res.guestName,
          ticketNumber: res.ticketNumber,
          eventTitle: res.eventTitle,
          checkinTime: res.checkinTime,
          message: res.message
        });
        toast.success(`Entry Approved for ${res.guestName}`);
      }
    } catch (err) {
      playBeep('error');
      const data = err.response?.data || {};

      if (data.code === 'ALREADY_USED') {
        setScanResult({
          status: 'ALREADY_USED',
          title: '⚠ TICKET ALREADY USED',
          guestName: data.guestName || 'Guest',
          ticketNumber: data.ticketNumber || '',
          originalCheckinTime: data.originalCheckinTime ? new Date(data.originalCheckinTime).toLocaleTimeString() : 'Earlier',
          message: data.message || 'This ticket was already scanned.'
        });
        toast.warning(data.message || 'Ticket already used!');
      } else if (data.code === 'WRONG_EVENT') {
        setScanResult({
          status: 'WRONG_EVENT',
          title: '✕ INVALID EVENT TICKET',
          message: data.message || 'This ticket belongs to another event.'
        });
        toast.error('Ticket belongs to another event!');
      } else {
        setScanResult({
          status: 'INVALID',
          title: '✕ INVALID TICKET',
          message: data.message || err.message || 'Invalid or unverified ticket token.'
        });
        toast.error(data.message || 'Invalid QR Ticket');
      }
    } finally {
      setLoadingCheckin(false);

      // Auto reset after 4.5 seconds to prepare scanner for next guest
      setTimeout(() => {
        setScanResult(null);
      }, 4500);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    processTicketToken(manualToken.trim());
    setManualToken('');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider border border-white">
          <ShieldCheck className="w-4 h-4 text-black" /> AUTHORIZED GATE STAFF SCANNER
        </div>
        <h1 className="text-3xl font-black text-white">Event Ticket Check-In</h1>
        <p className="text-xs text-zinc-400">Scan guest QR code pass for instant gate entry validation</p>
      </div>

      {/* Event Selection */}
      <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl space-y-2">
        <label className="block text-xs font-semibold text-zinc-300">Select Active Gate Event</label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-white"
        >
          {events.map((evt) => (
            <option key={evt.id} value={evt.id}>
              {evt.title} ({new Date(evt.event_date).toLocaleDateString()})
            </option>
          ))}
        </select>
      </div>

      {/* CAMERA SCANNER BOX */}
      <div className="glass-panel p-6 rounded-3xl border border-zinc-800 space-y-6 text-center relative">
        
        <div className="relative mx-auto w-full max-w-sm h-72 bg-black border-2 border-dashed border-zinc-700 rounded-2xl overflow-hidden flex items-center justify-center">
          
          <div id="qr-reader-canvas" className="w-full h-full"></div>

          {!scanning && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 space-y-4">
              <Camera className="w-12 h-12 text-white animate-pulse" />
              <span className="text-xs text-zinc-400 max-w-xs">
                Click below to turn on the camera stream and scan guest tickets.
              </span>
              <button
                onClick={startCamera}
                className="px-6 py-3 rounded-xl bg-white text-black font-extrabold text-xs border border-white hover:bg-zinc-200 transition-all duration-200"
              >
                Start Camera Scanner
              </button>
            </div>
          )}

          {scanning && (
            <button
              onClick={stopCamera}
              className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/90 border border-zinc-700 text-white font-bold text-[11px] z-10"
            >
              Stop Camera
            </button>
          )}

        </div>

        {cameraError && (
          <p className="text-xs text-white font-semibold">{cameraError}</p>
        )}

      </div>

      {/* ENTRY RESULT DISPLAY MODAL CARD */}
      {scanResult && (
        <div className={`p-6 rounded-3xl border transition-all animate-in fade-in zoom-in duration-300 space-y-4 bg-black ${
          scanResult.status === 'APPROVED'
            ? 'border-white text-white'
            : scanResult.status === 'ALREADY_USED'
            ? 'border-zinc-500 text-zinc-200'
            : 'border-zinc-700 text-white'
        }`}>
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
            {scanResult.status === 'APPROVED' && <CheckCircle2 className="w-8 h-8 text-white shrink-0" />}
            {scanResult.status === 'ALREADY_USED' && <AlertTriangle className="w-8 h-8 text-zinc-400 shrink-0" />}
            {scanResult.status !== 'APPROVED' && scanResult.status !== 'ALREADY_USED' && <XCircle className="w-8 h-8 text-white shrink-0" />}
            
            <div>
              <h3 className="text-xl font-extrabold tracking-wide">{scanResult.title}</h3>
              <p className="text-xs opacity-90">{scanResult.message}</p>
            </div>
          </div>

          {scanResult.status === 'APPROVED' && (
            <div className="grid grid-cols-2 gap-4 text-xs bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
              <div>
                <span className="block text-[10px] opacity-70 uppercase font-semibold">Guest Name</span>
                <span className="font-extrabold text-base text-white">{scanResult.guestName}</span>
              </div>
              <div>
                <span className="block text-[10px] opacity-70 uppercase font-semibold">Ticket #</span>
                <span className="font-mono font-bold text-white">{scanResult.ticketNumber}</span>
              </div>
              <div>
                <span className="block text-[10px] opacity-70 uppercase font-semibold">Event</span>
                <span className="font-semibold text-zinc-200">{scanResult.eventTitle}</span>
              </div>
              <div>
                <span className="block text-[10px] opacity-70 uppercase font-semibold">Check-In Time</span>
                <span className="font-semibold text-white">{scanResult.checkinTime}</span>
              </div>
            </div>
          )}

          {scanResult.status === 'ALREADY_USED' && (
            <div className="text-xs bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2">
              <div>
                <span className="block text-[10px] opacity-70 uppercase font-semibold">Original Check-in Timestamp</span>
                <span className="font-mono font-bold text-white">{scanResult.originalCheckinTime}</span>
              </div>
              <p className="text-[11px] opacity-80">Do NOT allow duplicate entry. This pass was already validated.</p>
            </div>
          )}

          <div className="pt-2 text-center">
            <button
              onClick={() => {
                setScanResult(null);
                startCamera();
              }}
              className="px-6 py-2.5 rounded-xl bg-white text-black font-bold text-xs border border-white hover:bg-zinc-200"
            >
              Ready for Next Guest Scan
            </button>
          </div>
        </div>
      )}

      {/* Manual Input Fallback */}
      <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl space-y-3">
        <span className="block text-xs font-semibold text-zinc-300">Manual Ticket Token Override</span>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. EVT-TK-9a8b7c6d5e4f3a2b1c0d"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-white"
          />
          <button
            type="submit"
            disabled={loadingCheckin}
            className="px-5 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold text-xs border border-white"
          >
            {loadingCheckin ? 'Validating...' : 'Verify'}
          </button>
        </form>
      </div>

    </div>
  );
};
