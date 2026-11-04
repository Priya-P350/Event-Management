import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { checkinService, eventService } from '../services/serviceModules';
import { useToast } from '../context/ToastContext';
import { 
  Camera, CheckCircle2, AlertTriangle, XCircle, ShieldCheck, QrCode, Sparkles
} from 'lucide-react';

export const ScannerPage = () => {
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('all');
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
          setEvents(res.events || []);
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
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
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

      const config = { fps: 12, qrbox: { width: 260, height: 260 } };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        onQrCodeScanned,
        () => {}
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
          title: '✓ ENTRY APPROVED — QR NOW EXPIRED',
          guestName: res.guestName,
          ticketNumber: res.uniqueId || res.ticketNumber,
          uniqueId: res.uniqueId || res.ticketNumber,
          eventTitle: res.eventTitle || res.passType || 'Event Admission',
          checkinTime: res.checkinTime,
          message: res.message || 'Pass verified successfully. QR is now EXPIRED.'
        });
        toast.success(`Entry Approved for ${res.guestName} — QR expired!`);
      }
    } catch (err) {
      playBeep('error');
      const data = err.response?.data || {};

      if (data.code === 'ALREADY_USED') {
        setScanResult({
          status: 'ALREADY_USED',
          title: '⚠ QR EXPIRED — ALREADY SCANNED',
          guestName: data.guestName || 'Guest / Member',
          ticketNumber: data.uniqueId || data.ticketNumber || '',
          uniqueId: data.uniqueId || data.ticketNumber || '',
          originalCheckinTime: data.originalCheckinTime ? new Date(data.originalCheckinTime).toLocaleString() : 'Earlier Today',
          message: data.message || 'This QR pass was already scanned by Admin and is expired.'
        });
        toast.error('QR code is EXPIRED! Duplicate entry denied.');
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
          title: '✕ INVALID QR PASS',
          message: data.message || err.message || 'Invalid or unverified ticket token.'
        });
        toast.error(data.message || 'Invalid QR Pass');
      }
    } finally {
      setLoadingCheckin(false);
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs uppercase tracking-wider border border-emerald-500/40">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> AUTHORIZED ADMIN & STAFF GATE SCANNER
        </div>
        <h1 className="text-3xl font-black text-white">QR Admission & Expiration Gate</h1>
        <p className="text-xs text-zinc-400">
          Scan guest or member QR codes. <strong className="text-amber-300">Each QR code automatically expires upon first scan.</strong>
        </p>
      </div>

      {/* Event Selection */}
      <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl space-y-2 shadow-lg">
        <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
          Gate Scanning Mode / Target Event
        </label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#38bdf8]"
        >
          <option value="all">⚡ Universal Admission (Scan ANY Member Pass or Event Ticket)</option>
          {events.map((evt) => (
            <option key={evt.id} value={evt.id}>
              {evt.title} ({new Date(evt.event_date).toLocaleDateString()})
            </option>
          ))}
        </select>
      </div>

      {/* CAMERA SCANNER BOX */}
      <div className="glass-panel p-6 rounded-3xl border border-zinc-800 space-y-6 text-center relative shadow-2xl">
        
        <div className="relative mx-auto w-full max-w-sm h-72 bg-black border-2 border-dashed border-zinc-700 rounded-2xl overflow-hidden flex items-center justify-center">
          
          <div id="qr-reader-canvas" className="w-full h-full"></div>

          {!scanning && (
            <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30 flex items-center justify-center shadow-lg animate-pulse">
                <Camera className="w-8 h-8" />
              </div>
              <span className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                Aim the device camera at the attendee's QR code (on mobile screen or printed pass).
              </span>
              <button
                onClick={startCamera}
                className="px-6 py-3 rounded-xl bg-[#38bdf8] hover:bg-[#7dd3fc] text-[#0B1928] font-black text-xs transition-all cursor-pointer shadow-lg"
              >
                Start Camera Scanner
              </button>
            </div>
          )}

          {scanning && (
            <button
              onClick={stopCamera}
              className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/90 border border-zinc-700 text-white font-bold text-[11px] z-10 cursor-pointer"
            >
              Stop Camera
            </button>
          )}

        </div>

        {cameraError && (
          <p className="text-xs text-amber-300 font-semibold">{cameraError}</p>
        )}

      </div>

      {/* ENTRY RESULT DISPLAY CARD */}
      {scanResult && (
        <div className={`p-6 rounded-3xl border-2 transition-all animate-in fade-in zoom-in-95 duration-300 space-y-4 shadow-2xl ${
          scanResult.status === 'APPROVED'
            ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
            : scanResult.status === 'ALREADY_USED'
            ? 'bg-rose-950/40 border-rose-500 text-rose-200'
            : 'bg-zinc-950 border-zinc-700 text-white'
        }`}>
          <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-3">
            {scanResult.status === 'APPROVED' && (
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
            )}
            {scanResult.status === 'ALREADY_USED' && (
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>
            )}
            {scanResult.status !== 'APPROVED' && scanResult.status !== 'ALREADY_USED' && (
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
                <XCircle className="w-6 h-6 text-rose-400" />
              </div>
            )}
            
            <div>
              <h3 className="text-lg font-black tracking-wide">{scanResult.title}</h3>
              <p className="text-xs opacity-90">{scanResult.message}</p>
            </div>
          </div>

          {/* APPROVED RESULT */}
          {scanResult.status === 'APPROVED' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs bg-black/60 p-4 rounded-2xl border border-emerald-500/30">
                <div>
                  <span className="block text-[10px] opacity-70 uppercase font-semibold">Attendee / Member</span>
                  <span className="font-extrabold text-base text-white">{scanResult.guestName}</span>
                </div>
                <div>
                  <span className="block text-[10px] opacity-70 uppercase font-semibold">Unique ID (On QR)</span>
                  <span className="font-mono font-black text-sm text-[#38bdf8]">{scanResult.uniqueId}</span>
                </div>
                <div>
                  <span className="block text-[10px] opacity-70 uppercase font-semibold">Admission Pass / Event</span>
                  <span className="font-semibold text-zinc-200">{scanResult.eventTitle}</span>
                </div>
                <div>
                  <span className="block text-[10px] opacity-70 uppercase font-semibold">Scanned & Expired At</span>
                  <span className="font-mono font-bold text-white">{scanResult.checkinTime}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-bold text-center">
                ✓ PASS NOW CONSUMED & EXPIRED: Any re-scan will be denied entry.
              </div>
            </div>
          )}

          {/* ALREADY USED / EXPIRED RESULT */}
          {scanResult.status === 'ALREADY_USED' && (
            <div className="space-y-3">
              <div className="text-xs bg-black/60 p-4 rounded-2xl border border-rose-500/30 space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[10px] opacity-70 uppercase font-semibold">Pass Holder</span>
                    <span className="font-bold text-white">{scanResult.guestName}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] opacity-70 uppercase font-semibold">Unique ID</span>
                    <span className="font-mono font-bold text-rose-400">{scanResult.uniqueId}</span>
                  </div>
                </div>
                <div>
                  <span className="block text-[10px] opacity-70 uppercase font-semibold">First Scanned & Expired Timestamp</span>
                  <span className="font-mono font-bold text-white text-xs">{scanResult.originalCheckinTime}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-bold text-center">
                ⚠ ENTRY DENIED: This QR code has already expired and cannot be used again.
              </div>
            </div>
          )}

          <div className="pt-2 text-center">
            <button
              onClick={() => {
                setScanResult(null);
                startCamera();
              }}
              className="px-6 py-2.5 rounded-xl bg-white text-black font-black text-xs hover:bg-zinc-200 shadow-md cursor-pointer"
            >
              Ready for Next Person Scan
            </button>
          </div>
        </div>
      )}

      {/* Manual Input Fallback */}
      <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl space-y-3 shadow-lg">
        <span className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
          Manual Pass / Unique ID Entry Override
        </span>
        <p className="text-[11px] text-zinc-500">
          Enter attendee unique ID (e.g. <span className="font-mono text-[#38bdf8]">MEM-2026-849102</span> or <span className="font-mono text-[#38bdf8]">EVT-2026-102938</span>) or secure token:
        </p>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. MEM-2026-849102 or EVT-2026-123456"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-[#38bdf8]"
          />
          <button
            type="submit"
            disabled={loadingCheckin}
            className="px-6 py-2.5 rounded-xl bg-[#38bdf8] text-[#0B1928] hover:bg-[#7dd3fc] font-black text-xs cursor-pointer shadow-md disabled:opacity-50"
          >
            {loadingCheckin ? 'Validating...' : 'Scan & Expire'}
          </button>
        </form>
      </div>

    </div>
  );
};
