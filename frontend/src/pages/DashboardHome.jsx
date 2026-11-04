import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { registrationService, qrService } from '../services/serviceModules';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CountdownTimer } from '../components/CountdownTimer';
import { 
  Ticket, Calendar, MapPin, Loader2, CheckCircle2, 
  QrCode, Copy, Download, AlertTriangle, ShieldCheck, RefreshCw 
} from 'lucide-react';

export const DashboardHome = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [memberPass, setMemberPass] = useState(null);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Fetch user registrations
    registrationService.getMyRegistrations()
      .then(res => {
        if (res.success) setRegistrations(res.registrations);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));

    // Fetch live member pass details
    qrService.getMemberPass()
      .then(res => {
        if (res.success && res.memberPass) {
          setMemberPass(res.memberPass);
        }
      })
      .catch(err => console.error('Failed to load member pass', err));
  }, []);

  const copyUniqueId = (id) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopied(true);
    toast.success('Unique ID copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQrPass = (qrDataUrl, uniqueId) => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `Member-Pass-${uniqueId || 'QR'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Member QR downloaded!');
  };

  const handleRefreshPass = async () => {
    setRefreshing(true);
    try {
      const res = await qrService.regenerateMemberPass();
      if (res.success && res.memberPass) {
        setMemberPass(res.memberPass);
        toast.success('Member QR pass refreshed successfully!');
      }
    } catch (err) {
      toast.error('Failed to refresh pass.');
    } finally {
      setRefreshing(false);
    }
  };

  const upcomingRegs = registrations.filter(r => r.registration_status === 'confirmed');
  const activeUser = memberPass || user;
  const isExpired = activeUser?.status === 'expired' || activeUser?.qr_status === 'expired';
  const uniqueMemberId = activeUser?.uniqueId || activeUser?.member_id || activeUser?.memberId || 'MEM-2026-PENDING';
  const qrImage = activeUser?.qrCodeData || activeUser?.qr_code_data;

  return (
    <div className="space-y-10">

      {/* MEMBER OFFICIAL QR PASS HERO CARD */}
      <div className="bg-gradient-to-br from-[#122538] via-[#0E1F30] to-[#081522] border-2 border-[#1E394E] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#38bdf8]/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E394E] pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#38bdf8]/20 border border-[#38bdf8]/30 text-[#38bdf8] flex items-center justify-center shrink-0 shadow-lg">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#38bdf8] uppercase tracking-wider block">
                Official Digital Admission
              </span>
              <h2 className="text-xl font-black text-[#E5F4F9] tracking-tight">
                Your Member Digital QR Pass
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isExpired ? (
              <span className="px-4 py-1.5 rounded-full text-xs font-black font-mono uppercase bg-rose-500/20 text-rose-400 border border-rose-500/50 flex items-center gap-1.5 shadow-sm">
                <AlertTriangle className="w-4 h-4 text-rose-400" /> EXPIRED (SCANNED BY ADMIN)
              </span>
            ) : (
              <span className="px-4 py-1.5 rounded-full text-xs font-black font-mono uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> ACTIVE (UNSCANNED)
              </span>
            )}
          </div>
        </div>

        {/* Card Body: QR + Details */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* QR Canvas / Image (4 cols) */}
          <div className="md:col-span-4 flex flex-col items-center justify-center text-center space-y-3 bg-[#0B1928] p-5 rounded-2xl border border-[#1E394E] shadow-inner relative">
            <div className={`p-4 bg-white rounded-2xl border-4 ${isExpired ? 'border-rose-500/50 opacity-60' : 'border-[#38bdf8]'} shadow-xl relative inline-block transition-all`}>
              {qrImage ? (
                <img 
                  src={qrImage} 
                  alt="Member QR" 
                  className="w-44 h-44 object-contain mx-auto block" 
                />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center text-zinc-700">
                  <QrCode className="w-20 h-20" />
                </div>
              )}

              {/* Expired Watermark Overlay */}
              {isExpired && (
                <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center p-2">
                  <span className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-mono font-black text-xs uppercase tracking-widest border border-white rotate-[-12deg] shadow-2xl">
                    EXPIRED
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] text-[#95B8C9] uppercase font-bold tracking-wider">
                Unique ID (Mentioned on QR)
              </span>
              <div className="flex items-center justify-center gap-1.5">
                <span className="font-mono text-xs font-black text-[#38bdf8] tracking-wider">
                  {uniqueMemberId}
                </span>
                <button
                  onClick={() => copyUniqueId(uniqueMemberId)}
                  className="text-[#95B8C9] hover:text-[#E5F4F9] transition-colors p-0.5 cursor-pointer"
                  title="Copy ID"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Member Pass Details & Status (8 cols) */}
          <div className="md:col-span-8 space-y-5">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E394E] text-[#95B8C9] text-[10px] font-bold uppercase tracking-wider border border-[#2B4E66]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#38bdf8]" /> Verified Personal Identity
              </div>
              <h3 className="text-2xl font-black text-[#E5F4F9]">
                {activeUser?.name || 'Valued Member'}
              </h3>
              <p className="text-xs text-[#95B8C9]">
                Role: <span className="text-[#38bdf8] font-bold uppercase">{activeUser?.role?.replace('_', ' ')}</span>
              </p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0B1928]/70 p-4 rounded-2xl border border-[#1E394E] text-xs">
              <div>
                <span className="text-[10px] text-[#95B8C9] uppercase font-semibold block">Email Address</span>
                <span className="text-[#E5F4F9] font-mono text-[11px] truncate block">{activeUser?.email}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#95B8C9] uppercase font-semibold block">Contact Phone</span>
                <span className="text-[#E5F4F9] font-mono text-[11px]">{activeUser?.phone || 'Not Provided'}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#95B8C9] uppercase font-semibold block">Admission Policy</span>
                <span className="text-[#E5F4F9] font-medium text-[11px]">One-Time Single Admission</span>
              </div>
              <div>
                <span className="text-[10px] text-[#95B8C9] uppercase font-semibold block">Pass Status</span>
                <span className={`font-mono text-[11px] font-bold ${isExpired ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {isExpired ? 'EXPIRED (USED)' : 'ACTIVE (UNSCANNED)'}
                </span>
              </div>
            </div>

            {/* Status Expiration Notice */}
            {isExpired ? (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">This QR code has expired:</strong> It was scanned by Admin at the entrance gate{' '}
                  {activeUser?.scannedAt ? `on ${new Date(activeUser.scannedAt).toLocaleString()}` : ''}. Duplicate admission is denied.
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-[#38bdf8]/10 border border-[#38bdf8]/30 text-[#95B8C9] text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#38bdf8] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#E5F4F9]">Ready for Admission:</strong> Present this QR pass or unique ID to Admin at the entrance gate. <span className="text-[#38bdf8] font-semibold">Once scanned by Admin, this QR will expire automatically.</span>
                </div>
              </div>
            )}

            {/* Button Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={() => downloadQrPass(qrImage, uniqueMemberId)}
                className="px-4 py-2.5 rounded-xl bg-[#38bdf8] hover:bg-[#7dd3fc] text-[#0B1928] font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4" /> Download QR Pass
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl bg-[#1E394E] hover:bg-[#2B4E66] text-[#E5F4F9] font-bold text-xs flex items-center gap-2 border border-[#38bdf8]/20 transition-all cursor-pointer"
              >
                Print Pass
              </button>

              <button
                onClick={handleRefreshPass}
                disabled={refreshing}
                className="px-4 py-2.5 rounded-xl bg-[#0B1928] hover:bg-[#122538] text-[#95B8C9] hover:text-[#E5F4F9] font-bold text-xs flex items-center gap-2 border border-[#1E394E] transition-all cursor-pointer disabled:opacity-50"
                title="Regenerate QR pass"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh QR
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* EVENT PASS SECTION */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black text-white">Your Registered Event Passes</h2>
            <p className="text-xs text-zinc-400">Tickets issued for specific summits, job fairs, and conferences</p>
          </div>
          <Link
            to="/dashboard/tickets"
            className="text-xs font-bold text-[#38bdf8] hover:underline flex items-center gap-1"
          >
            View All Tickets
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-white">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-white" />
            <span className="text-xs font-semibold">Loading your registered passes...</span>
          </div>
        ) : upcomingRegs.length === 0 ? (
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 text-center space-y-3">
            <Ticket className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Event Tickets Registered Yet</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Your Member Pass above grants overall portal admission. You can also register for specific expos or summits.
            </p>
            <Link
              to="/events"
              className="inline-block px-5 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs hover:bg-zinc-200 border border-white"
            >
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingRegs.map((reg) => {
              const evt = reg.event;
              if (!evt) return null;
              const isTicketExpired = reg.ticket?.status === 'expired' || reg.ticket?.status === 'checked_in';

              return (
                <div
                  key={reg.id}
                  className="glass-panel rounded-3xl border border-zinc-800 p-6 space-y-5 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-black border border-zinc-700 text-white font-bold text-[11px]">
                        {evt.category || 'General'}
                      </span>
                      {isTicketExpired ? (
                        <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 font-mono text-[11px] font-bold border border-rose-500/40">
                          EXPIRED
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-white text-black font-mono text-[11px] font-bold flex items-center gap-1 border border-white">
                          <CheckCircle2 className="w-3.5 h-3.5" /> CONFIRMED
                        </span>
                      )}
                    </div>

                    <div className="flex items-start gap-4">
                      <img src={evt.cover_image_url} alt={evt.title} className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-white/20 shadow-md" />
                      <div>
                        <h3 className="text-base font-bold text-white line-clamp-1">{evt.title}</h3>
                        <div className="text-xs text-zinc-400 space-y-0.5 mt-1">
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

                    {/* Countdown */}
                    <div className="p-2.5 bg-black border border-zinc-800 rounded-xl">
                      <CountdownTimer targetDate={evt.event_date} startTime={evt.start_time} />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                    <div className="font-mono text-xs text-zinc-400">
                      TICKET ID: <span className="text-white font-bold">{reg.ticket?.ticket_number || reg.registration_number}</span>
                    </div>
                    {reg.ticket && (
                      <Link
                        to={`/ticket/${reg.ticket.secure_token || reg.ticket.id}`}
                        className="px-3.5 py-2 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-1.5 hover:bg-zinc-200 border border-white transition-all"
                      >
                        <Ticket className="w-3.5 h-3.5" /> View QR Ticket
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
