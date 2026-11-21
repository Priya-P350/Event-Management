import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TextInputField, PasswordField } from '../components/forms';
import { authService, eventService } from '../services/serviceModules';
import { 
  Ticket, User, Mail, Phone, ArrowRight, ShieldCheck, 
  QrCode, UserCheck, Loader2, Download, CheckCircle2, Copy, Sparkles, Check,
  PlusCircle, LayoutDashboard, MailCheck, ShieldAlert, Calendar, MapPin,
  KeyRound, RefreshCw, ArrowLeft, Clock
} from 'lucide-react';

export const RegisterPage = () => {
  const { register: registerAuth } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [pendingData, setPendingData] = useState(null);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [copied, setCopied] = useState(false);

  const [registeredUser, setRegisteredUser] = useState(null);
  const [registeredEvent, setRegisteredEvent] = useState(null);
  const [registeredTicket, setRegisteredTicket] = useState(null);
  const [accountType, setAccountType] = useState('attendee');
  const [accountTypeError, setAccountTypeError] = useState(false);

  // 6 refs for OTP digits input boxes
  const otp0Ref = useRef(null);
  const otp1Ref = useRef(null);
  const otp2Ref = useRef(null);
  const otp3Ref = useRef(null);
  const otp4Ref = useRef(null);
  const otp5Ref = useRef(null);
  const otpRefs = [otp0Ref, otp1Ref, otp2Ref, otp3Ref, otp4Ref, otp5Ref];

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      role: 'attendee'
    }
  });

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval = null;
    if (resendCountdown > 0) {
      interval = setInterval(() => {
        setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendCountdown]);

  // Focus the first OTP box when transitioning to OTP step
  useEffect(() => {
    if (step === 'otp') {
      const timer = setTimeout(() => {
        otpRefs[0]?.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const roleOptions = [
    { value: 'attendee', label: 'Attendee', icon: UserCheck, badge: 'Passes' },
    { value: 'organizer', label: 'Organizer', icon: ShieldCheck, badge: 'Admin' },
    { value: 'gate_staff', label: 'Gate Staff', icon: QrCode, badge: 'Scanner' }
  ];

  const roleDescriptions = {
    attendee: 'Create attendee profile to explore upcoming events, select your preferred event at your convenience, and receive official QR passes.',
    organizer: 'Create and manage events, set ticket pricing, and scan event attendee QR codes.',
    gate_staff: 'Scan attendee QR codes at entrance gates and verify admission.'
  };

  const handleSelectAccountType = (type) => {
    setAccountType(type);
    setValue('role', type, { shouldValidate: true, shouldDirty: true });
    setAccountTypeError(false);
  };

  // Step 1: Form submission -> triggers OTP email
  const onSubmit = async (data) => {
    if (!accountType) {
      setAccountTypeError(true);
      toast.error('Please select an account type');
      return;
    }

    const cleanEmail = data.email.trim().toLowerCase();
    const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim() || 'New User';

    setIsSendingOtp(true);
    try {
      const res = await authService.sendOtp(cleanEmail, fullName, 'registration');
      if (res.success) {
        setPendingData({
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          fullName,
          email: cleanEmail,
          phone: data.phone.trim(),
          password: data.password,
          role: accountType
        });
        setOtpDigits(['', '', '', '', '', '']);
        setStep('otp');
        setResendCountdown(60);
        toast.success(`Verification code sent to ${cleanEmail}. Please check your email inbox!`);
      } else {
        toast.error(res.message || 'Failed to send verification code.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send verification code.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle individual digit input with auto-advance and backspace support
  const handleOtpChange = (index, value) => {
    const clean = value.replace(/\D/g, '');
    if (!clean) {
      const newDigits = [...otpDigits];
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    if (clean.length > 1) {
      // Pasted multiple digits into single input
      const chars = clean.slice(0, 6).split('');
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = chars[i] || '';
      }
      setOtpDigits(newDigits);
      const nextIndex = Math.min(chars.length, 5);
      otpRefs[nextIndex]?.current?.focus();
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = clean;
    setOtpDigits(newDigits);

    if (index < 5 && clean) {
      otpRefs[index + 1]?.current?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs[index - 1]?.current?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const chars = pasted.split('');
    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = chars[i] || '';
    }
    setOtpDigits(newDigits);
    const nextIndex = Math.min(chars.length, 5);
    otpRefs[nextIndex]?.current?.focus();
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || isResending || !pendingData) return;
    setIsResending(true);
    try {
      const res = await authService.resendOtp(pendingData.email, pendingData.fullName, 'registration');
      if (res.success) {
        setResendCountdown(60);
        setOtpDigits(['', '', '', '', '', '']);
        otpRefs[0]?.current?.focus();
        toast.success(`New verification code sent to ${pendingData.email}!`);
      } else {
        toast.error(res.message || 'Failed to resend code.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to resend verification code.');
    } finally {
      setIsResending(false);
    }
  };

  // Step 2: Verify OTP and finalize registration
  const handleVerifyAndRegister = async (e) => {
    if (e) e.preventDefault();
    const code = otpDigits.join('').trim();
    if (code.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP code.');
      return;
    }

    if (!pendingData) {
      toast.error('Registration session expired. Please re-enter your details.');
      setStep('form');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await registerAuth({
        name: pendingData.fullName,
        email: pendingData.email,
        phone: pendingData.phone,
        password: pendingData.password,
        role: pendingData.role,
        otp: code
      });

      if (res.success && res.user) {
        if (pendingData.role === 'attendee') {
          toast.success(`Welcome to EventHub, ${pendingData.fullName}! Account created. Explore events to register for your favorite event!`);
          navigate('/events');
          return;
        } else if (pendingData.role === 'organizer' || ['organizer', 'event_admin'].includes(res.user.role)) {
          toast.success(`Organizer account created! Welcome to EventHub, ${pendingData.fullName}!`);
          setRegisteredUser(res.user);
        } else if (pendingData.role === 'gate_staff' || ['gate_staff', 'scanner_staff'].includes(res.user.role)) {
          toast.success(`Gate scanner staff account activated for ${pendingData.fullName}!`);
          setRegisteredUser(res.user);
        }
      } else {
        toast.error(res.message || 'Registration verification failed.');
      }
    } catch (err) {
      toast.error(err.message || 'Incorrect verification code. Please check your email.');
    } finally {
      setIsVerifying(false);
    }
  };

  const copyUniqueId = (uniqueId) => {
    if (!uniqueId) return;
    navigator.clipboard.writeText(uniqueId);
    setCopied(true);
    toast.success('Ticket ID copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const downloadQrPass = (qrDataUrl, uniqueId) => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `Event-Pass-${uniqueId || 'QR'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Event QR Pass downloaded successfully!');
  };

  const isOrganizer = registeredUser && (['event_admin', 'organizer', 'super_admin'].includes(registeredUser.role) || accountType === 'organizer');
  const isStaff = registeredUser && (['scanner_staff', 'gate_staff'].includes(registeredUser.role) || accountType === 'gate_staff');
  const isAttendee = registeredUser && !isOrganizer && !isStaff;

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
      
      {/* Dynamic Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-4 text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00f2fe] to-[#0284c7] text-[#020817] flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(0,242,254,0.4)] transition-transform duration-300 hover:scale-105">
          {registeredUser ? (
            isOrganizer ? (
              <ShieldCheck className="w-7 h-7" />
            ) : isStaff ? (
              <QrCode className="w-7 h-7" />
            ) : (
              <Ticket className="w-7 h-7" />
            )
          ) : step === 'otp' ? (
            <MailCheck className="w-7 h-7" />
          ) : (
            <UserCheck className="w-7 h-7" />
          )}
        </div>

        <h1 className="text-3xl font-black text-[#e0f2fe] tracking-tight">
          {registeredUser ? (
            isOrganizer ? 'Organizer Portal Activated' :
            isStaff ? 'Gate Staff Console Ready' :
            'Your Digital QR Pass'
          ) : step === 'otp' ? (
            'Verify Your Email'
          ) : (
            'Create Account on EventHub'
          )}
        </h1>

        <p className="text-xs text-[#94b8d6] max-w-sm mx-auto">
          {registeredUser ? (
            isOrganizer ? 'Your event creator account is live. You can now create and manage events without needing an admission pass.' :
            isStaff ? 'Your scanner staff account is ready. Open the gate scanner to verify attendee passes.' :
            'Your unique Member ID and admission QR code have been issued, displayed below, and dispatched to your registered email.'
          ) : step === 'otp' ? (
            'Enter the 6-digit verification code sent to your email to activate your account.'
          ) : (
            'Register yourself to access role-based capabilities, instant event passes, and gate entry services.'
          )}
        </p>
      </div>

      {/* POST-REGISTRATION VIEWS */}
      {registeredUser ? (
        <div className="max-w-xl mx-auto w-full">
          
          {/* ============================================================ */}
          {/* 1. ORGANIZER / EVENT CREATOR SUCCESS SCREEN (NO QR CODE)     */}
          {/* ============================================================ */}
          {isOrganizer && (
            <div className="bg-[#041124]/90 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-300">
              <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-gradient-to-br from-[#00f2fe] to-[#0284c7] text-[#020817] shadow-[0_0_12px_rgba(0,242,254,0.3)]">
                    <ShieldCheck className="w-5 h-5 text-[#020817]" />
                  </span>
                  <div>
                    <span className="text-xs font-black text-[#e0f2fe] tracking-wider uppercase block">
                      EVENT CREATOR & ADMIN CONSOLE
                    </span>
                    <span className="text-[10px] text-[#38bdf8] font-mono">Full Event Management Privileges</span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-black font-mono uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5" /> READY
                </span>
              </div>

              {/* Welcome Banner */}
              <div className="bg-[#020817] p-5 rounded-2xl border border-cyan-500/25 space-y-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#94b8d6] uppercase font-bold tracking-wider">
                    Assigned Admin Identification
                  </span>
                  <span className="text-[11px] font-mono font-black text-[#38bdf8] bg-cyan-950/60 px-2.5 py-0.5 rounded-lg border border-cyan-500/30">
                    {registeredUser.admin_id || registeredUser.adminId || 'ADM-ACTIVE'}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-[#e0f2fe]">
                  Welcome aboard, {registeredUser.name}!
                </h3>
                <p className="text-xs text-[#94b8d6] leading-relaxed">
                  As an <strong>Event Organizer</strong>, you create events, set ticket pricing, monitor attendee bookings, and track check-ins. You do not need a gate admission pass for yourself.
                </p>
              </div>

              {/* Organizer Meta Details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#020817] border border-cyan-500/20">
                  <span className="block text-[#94b8d6] text-[10px] uppercase font-bold">Organizer Name</span>
                  <span className="font-extrabold text-[#e0f2fe] text-sm truncate block">{registeredUser.name}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#020817] border border-cyan-500/20">
                  <span className="block text-[#94b8d6] text-[10px] uppercase font-bold">Account Email</span>
                  <span className="font-semibold text-[#e0f2fe] truncate block">{registeredUser.email}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#020817] border border-cyan-500/20">
                  <span className="block text-[#94b8d6] text-[10px] uppercase font-bold">Admin ID</span>
                  <span className="font-mono font-bold text-[#38bdf8]">{registeredUser.admin_id || registeredUser.adminId || 'ADM-2026'}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#020817] border border-cyan-500/20">
                  <span className="block text-[#94b8d6] text-[10px] uppercase font-bold">Role Privileges</span>
                  <span className="font-mono font-bold text-emerald-400">Event Creator & Admin</span>
                </div>
              </div>

              {/* Direct Organizer Actions */}
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/admin/events/create')}
                    className="px-4 py-3.5 rounded-xl bg-gradient-to-r from-[#00f2fe] to-[#0284c7] hover:from-[#38bdf8] hover:to-[#00f2fe] text-[#020817] font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,242,254,0.35)] transition-all cursor-pointer border border-[#38bdf8]"
                  >
                    <PlusCircle className="w-4 h-4 text-[#020817]" /> Create New Event
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/admin')}
                    className="px-4 py-3.5 rounded-xl bg-[#041124] hover:bg-cyan-950/60 text-[#e0f2fe] font-bold text-xs flex items-center justify-center gap-2 border border-cyan-500/30 transition-all cursor-pointer"
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#38bdf8]" /> Organizer Dashboard
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/login', { 
                    state: { 
                      registeredEmail: registeredUser.email, 
                      message: 'Organizer account created successfully! Sign in with your password.' 
                    } 
                  })}
                  className="w-full py-2.5 rounded-xl bg-transparent hover:bg-cyan-950/40 text-[#94b8d6] hover:text-[#e0f2fe] font-semibold text-xs border border-cyan-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  Sign In with Your New Credentials <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 2. GATE SCANNER STAFF SUCCESS SCREEN (NO QR CODE)            */}
          {/* ============================================================ */}
          {isStaff && (
            <div className="bg-[#041124]/90 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-gradient-to-br from-[#00f2fe] to-[#0284c7] text-[#020817] shadow-[0_0_12px_rgba(0,242,254,0.3)]">
                    <QrCode className="w-5 h-5 text-[#020817]" />
                  </span>
                  <div>
                    <span className="text-xs font-black text-[#e0f2fe] tracking-wider uppercase block">
                      GATE SCANNER CONSOLE
                    </span>
                    <span className="text-[10px] text-[#38bdf8] font-mono">Admission Pass Verification Device</span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-black font-mono uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE
                </span>
              </div>

              <div className="bg-[#020817] p-5 rounded-2xl border border-cyan-500/25 space-y-2 shadow-inner">
                <h3 className="text-base font-extrabold text-[#e0f2fe]">
                  Gate Staff Ready, {registeredUser.name}!
                </h3>
                <p className="text-xs text-[#94b8d6] leading-relaxed">
                  Your gate staff account has been registered. You have camera scanning permissions to verify attendee QR codes, mark passes expired upon entry, and prevent duplicate admissions.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#020817] border border-cyan-500/20">
                  <span className="block text-[#94b8d6] text-[10px] uppercase font-bold">Staff Member</span>
                  <span className="font-extrabold text-[#e0f2fe] text-sm">{registeredUser.name}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#020817] border border-cyan-500/20">
                  <span className="block text-[#94b8d6] text-[10px] uppercase font-bold">Staff Email</span>
                  <span className="font-semibold text-[#e0f2fe] truncate block">{registeredUser.email}</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/scanner')}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00f2fe] to-[#0284c7] hover:from-[#38bdf8] hover:to-[#00f2fe] text-[#020817] font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,242,254,0.35)] transition-all cursor-pointer border border-[#38bdf8]"
                >
                  <QrCode className="w-4 h-4 text-[#020817]" /> Open Gate Scanner Now
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/login', { 
                    state: { 
                      registeredEmail: registeredUser.email, 
                      message: 'Staff account ready! Enter your password to sign in.' 
                    } 
                  })}
                  className="w-full py-2.5 rounded-xl bg-transparent hover:bg-cyan-950/40 text-[#94b8d6] hover:text-[#e0f2fe] font-semibold text-xs border border-cyan-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  Sign In with Your New Credentials <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 3. ATTENDEE SUCCESS SCREEN (EVENT-SPECIFIC QR PASS)         */}
          {/* ============================================================ */}
          {isAttendee && (
            <div className="bg-[#041124]/90 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-300">
              <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none"></div>

              {/* Pass Header */}
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-gradient-to-br from-[#00f2fe] to-[#0284c7] text-[#020817] shadow-[0_0_12px_rgba(0,242,254,0.3)]">
                    <Ticket className="w-5 h-5 text-[#020817]" />
                  </span>
                  <div>
                    <span className="text-xs font-black text-[#e0f2fe] tracking-wider uppercase block">
                      OFFICIAL EVENT QR TICKET
                    </span>
                    <span className="text-[10px] text-[#38bdf8] font-mono">
                      {registeredEvent?.title || 'Event Admission Pass'}
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-black font-mono uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE TICKET
                </span>
              </div>

              {/* Event Details Card */}
              {registeredEvent && (
                <div className="bg-[#020817] p-4 rounded-2xl border border-cyan-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#38bdf8] font-mono uppercase font-bold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/20">
                      {registeredEvent.category || 'General Event'}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {Number(registeredEvent.ticket_price || 0) === 0 ? 'FREE ADMISSION' : `₹${registeredEvent.ticket_price}`}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-[#e0f2fe]">{registeredEvent.title}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#94b8d6] pt-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#38bdf8]" />
                      <span>{registeredEvent.event_date} {registeredEvent.start_time ? `• ${registeredEvent.start_time}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                      <span className="truncate">{registeredEvent.venue}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Email Sent Notification Alert */}
              <div className="p-3.5 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center gap-3 text-xs text-cyan-200 shadow-md">
                <MailCheck className="w-5 h-5 text-[#38bdf8] shrink-0" />
                <div>
                  <span className="font-bold text-[#e0f2fe] block">Dispatched Directly to Your Gmail</span>
                  <span className="text-[11px] text-[#94b8d6]">
                    Your QR admission ticket for <strong>{registeredEvent?.title || 'the event'}</strong> has been sent to <strong className="text-white font-mono">{registeredUser.email}</strong>.
                  </span>
                </div>
              </div>

              {/* QR Container with Unique ID */}
              <div className="bg-[#020817] p-6 rounded-2xl border border-cyan-500/25 text-center space-y-4 shadow-inner">
                <div className="inline-block p-4 bg-white rounded-2xl border-4 border-[#38bdf8] shadow-[0_0_20px_rgba(0,242,254,0.35)]">
                  {(registeredTicket?.qr_code_data || registeredUser.qr_code_data) ? (
                    <img 
                      src={registeredTicket?.qr_code_data || registeredUser.qr_code_data} 
                      alt="Event Admission QR Pass" 
                      className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                    />
                  ) : (
                    <div className="w-48 h-48 bg-zinc-100 flex items-center justify-center text-zinc-500 text-xs">
                      Generating Event QR...
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#041124] border border-cyan-500/30">
                    <span className="text-[11px] text-[#94b8d6] font-semibold">TICKET NUMBER:</span>
                    <span className="font-mono text-sm font-extrabold text-[#38bdf8] tracking-wider">
                      {registeredTicket?.ticket_number || registeredUser.ticket_number || registeredUser.member_id || registeredUser.id}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyUniqueId(registeredTicket?.ticket_number || registeredUser.ticket_number || registeredUser.member_id || registeredUser.id)}
                      className="p-1 text-[#94b8d6] hover:text-[#e0f2fe] transition-colors cursor-pointer"
                      title="Copy Ticket Number"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                    <span className="text-amber-400 font-semibold">⚠️ Single-Use Notice:</span> Once scanned at the event gate, this QR ticket will automatically expire.
                  </div>
                </div>
              </div>

              {/* Pass Meta Details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#020817] border border-cyan-500/20">
                  <span className="block text-[#94b8d6] text-[10px] uppercase font-bold">Attendee Name</span>
                  <span className="font-extrabold text-[#e0f2fe] text-sm truncate block">{registeredUser.name}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#020817] border border-cyan-500/20">
                  <span className="block text-[#94b8d6] text-[10px] uppercase font-bold">Registered Gmail</span>
                  <span className="font-semibold text-[#e0f2fe] truncate block">{registeredUser.email}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#020817] border border-cyan-500/20">
                  <span className="block text-[#94b8d6] text-[10px] uppercase font-bold">Event</span>
                  <span className="font-bold text-[#38bdf8] truncate block">{registeredEvent?.title || 'Registered Event'}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#020817] border border-cyan-500/20">
                  <span className="block text-[#94b8d6] text-[10px] uppercase font-bold">Admission Validity</span>
                  <span className="font-mono font-bold text-emerald-400">1 Gate Entry (Single-Use)</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => downloadQrPass(registeredTicket?.qr_code_data || registeredUser.qr_code_data, registeredTicket?.ticket_number || registeredUser.ticket_number || registeredUser.id)}
                    className="px-4 py-3 rounded-xl bg-[#041124] hover:bg-cyan-950/60 text-[#e0f2fe] font-bold text-xs flex items-center justify-center gap-2 border border-cyan-500/30 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-[#38bdf8]" /> Download QR Pass
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-3 rounded-xl bg-gradient-to-r from-[#00f2fe] to-[#0284c7] hover:from-[#38bdf8] hover:to-[#00f2fe] text-[#020817] font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,242,254,0.35)] transition-all cursor-pointer border border-[#38bdf8]"
                  >
                    View in Dashboard <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/login', { 
                    state: { 
                      registeredEmail: registeredUser.email, 
                      message: 'Account created successfully! Enter your password to sign in.' 
                    } 
                  })}
                  className="w-full py-2.5 rounded-xl bg-transparent hover:bg-cyan-950/40 text-[#94b8d6] hover:text-[#e0f2fe] font-semibold text-xs border border-cyan-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  Sign In with Your New Credentials <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

        </div>
      ) : step === 'otp' ? (
        /* STEP 2: EMAIL OTP VERIFICATION SCREEN */
        <div className="max-w-md mx-auto w-full bg-[#041124]/95 backdrop-blur-2xl p-7 sm:p-9 rounded-3xl border border-cyan-500/30 space-y-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="absolute top-0 right-0 w-44 h-44 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center mx-auto text-[#00f2fe] shadow-[0_0_25px_rgba(0,242,254,0.3)]">
              <MailCheck className="w-8 h-8" />
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#38bdf8] bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-500/20 inline-block">
                Email Authentication
              </span>
              <h2 className="text-2xl font-black text-[#e0f2fe] tracking-tight">Check Your Email</h2>
            </div>
            
            <p className="text-xs text-[#94b8d6] leading-relaxed">
              We have sent a secure 6-digit verification code to
            </p>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#020817] border border-cyan-500/30 font-mono text-xs font-bold text-[#38bdf8]">
              <Mail className="w-3.5 h-3.5 text-[#00f2fe]" />
              <span className="text-white font-semibold">{pendingData?.email}</span>
            </div>
          </div>

          {/* OTP 6-Digit PIN Boxes */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 sm:gap-2.5">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={otpRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  onPaste={handleOtpPaste}
                  className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-mono font-black rounded-xl border transition-all duration-200 outline-none select-none ${
                    digit
                      ? 'bg-cyan-950/80 text-[#38bdf8] border-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.4)] ring-1 ring-[#38bdf8]'
                      : 'bg-[#020817] text-[#e0f2fe] border-cyan-500/25 focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#94b8d6]">
              <Clock className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>Valid for 10 minutes. Check spam folder if not received.</span>
            </div>
          </div>

          {/* Verify & Complete Button */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleVerifyAndRegister}
              disabled={otpDigits.join('').length !== 6 || isVerifying}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#00f2fe] to-[#0284c7] hover:from-[#38bdf8] hover:to-[#00f2fe] text-[#020817] font-black text-xs transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,242,254,0.35)] border border-[#38bdf8] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#020817]" />
                  Verifying OTP & Activating Account...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-[#020817]" />
                  Verify OTP & Complete Registration
                </>
              )}
            </button>

            {/* Resend and Timer */}
            <div className="flex items-center justify-between text-xs pt-1 px-1">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="text-[#94b8d6] hover:text-[#e0f2fe] flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Edit Details
              </button>

              {resendCountdown > 0 ? (
                <span className="text-[#94b8d6] text-xs font-mono flex items-center gap-1">
                  Resend in <span className="text-[#38bdf8] font-bold">{resendCountdown}s</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isResending}
                  className="text-[#38bdf8] hover:text-[#00f2fe] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" /> Resend Code
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* REGISTRATION FORM */
        <div className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left: Registration Form (7 cols) */}
          <div className="lg:col-span-7 bg-[#041124]/90 backdrop-blur-xl p-8 rounded-3xl border border-cyan-500/25 space-y-6 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-[#e0f2fe] uppercase tracking-wider">Account Registration</span>
                <span className="text-[11px] font-medium text-[#38bdf8] bg-[#020817] px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                  {accountType === 'organizer' ? 'Organizer Console' : accountType === 'gate_staff' ? 'Gate Scanner Access' : 'Instant QR Pass on Email'}
                </span>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                {/* First & Last Name Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <TextInputField
                    name="firstName"
                    label="First Name"
                    placeholder="Rahul"
                    icon={User}
                    register={register}
                    rules={{ required: 'First name is required' }}
                    error={errors.firstName}
                  />
                  <TextInputField
                    name="lastName"
                    label="Last Name"
                    placeholder="Sharma"
                    register={register}
                    rules={{ required: 'Last name is required' }}
                    error={errors.lastName}
                  />
                </div>

                {/* Email Address */}
                <TextInputField
                  name="email"
                  label="Email Address"
                  type="email"
                  placeholder="rahul@example.com"
                  icon={Mail}
                  register={register}
                  rules={{
                    required: 'Email address is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  }}
                  error={errors.email}
                />

                {/* Phone Number */}
                <TextInputField
                  name="phone"
                  label="Phone Number"
                  type="tel"
                  placeholder="+91 9876543210"
                  icon={Phone}
                  register={register}
                  rules={{
                    required: 'Phone number is required',
                    pattern: {
                      value: /^\+?[0-9\s-]{10,15}$/,
                      message: 'Valid phone number is required (10-15 digits)'
                    }
                  }}
                  error={errors.phone}
                />

                {/* Password Field */}
                <PasswordField
                  name="password"
                  label="Password"
                  placeholder="••••••••"
                  register={register}
                  rules={{
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  }}
                  error={errors.password}
                />

                {/* Clickable Account Type Selection */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#e0f2fe]">
                      Account Type <span className="text-[#38bdf8]">*</span>
                    </label>
                    {accountTypeError && (
                      <span className="text-xs text-rose-400 font-medium animate-pulse">
                        Please select an account type
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                    {roleOptions.map((opt) => {
                      const isSelected = accountType === opt.value;
                      const Icon = opt.icon;

                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelectAccountType(opt.value)}
                          className={`relative p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer select-none w-full ${
                            isSelected
                              ? 'bg-cyan-950/60 text-[#e0f2fe] border-[#38bdf8] font-bold shadow-[0_0_15px_rgba(56,189,248,0.25)] ring-1 ring-[#38bdf8] scale-[1.02]'
                              : 'bg-[#020817] text-[#94b8d6] border-cyan-500/20 hover:border-[#38bdf8]/60 hover:bg-[#041124] hover:text-[#e0f2fe]'
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#38bdf8] text-[#020817] flex items-center justify-center shadow-sm">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}

                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-[#38bdf8]/20 text-[#38bdf8]' : 'bg-[#041124] text-[#94b8d6]'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-bold leading-tight">{opt.label}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-mono transition-colors ${
                              isSelected
                                ? 'bg-[#38bdf8] text-[#020817] font-black'
                                : 'bg-[#041124] text-[#94b8d6]'
                            }`}
                          >
                            {opt.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dynamic Role Description Notice */}
                {accountType ? (
                  <div className="p-3 rounded-xl bg-[#020817] border border-cyan-500/20 text-[11px] text-[#94b8d6] flex items-center gap-2 animate-in fade-in duration-200">
                    <span className="w-2 h-2 rounded-full bg-[#38bdf8] shrink-0"></span>
                    <span>{roleDescriptions[accountType]}</span>
                  </div>
                ) : accountTypeError ? (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-300">
                    ⚠️ Please select your account type above (Attendee, Organizer, or Gate Staff).
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting || isSendingOtp}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#00f2fe] to-[#0284c7] hover:from-[#38bdf8] hover:to-[#00f2fe] text-[#020817] font-black text-xs transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,242,254,0.35)] border border-[#38bdf8] disabled:opacity-50 cursor-pointer mt-2"
                >
                  {isSubmitting || isSendingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#020817]" />
                      Sending Verification Code to Email...
                    </>
                  ) : (
                    <>
                      <MailCheck className="w-4 h-4 text-[#020817]" />
                      {accountType === 'organizer' 
                        ? 'Verify Email & Create Organizer Account' 
                        : accountType === 'gate_staff'
                        ? 'Verify Email & Create Gate Staff Account'
                        : 'Verify Email & Create Attendee Account'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <p className="text-center text-xs text-[#94b8d6] pt-4 border-t border-cyan-500/20">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-[#38bdf8] hover:underline">
                Sign In
              </Link>
            </p>
          </div>

          {/* Right: Feature Showcase (5 cols) */}
          <div className="lg:col-span-5 hidden lg:flex flex-col justify-between p-7 rounded-3xl border border-cyan-500/25 relative overflow-hidden texture-card shadow-2xl backdrop-blur-2xl">
            <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-400/15 rounded-full blur-3xl pointer-events-none"></div>

            <div className="space-y-4 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#020817]/80 backdrop-blur-md border border-cyan-500/30 text-[#e0f2fe] text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#38bdf8]" />
                Role-Based Registration
              </div>

              <h3 className="text-2xl font-black text-[#e0f2fe] leading-snug">
                Tailored Access for Organizers & Attendees
              </h3>

              <p className="text-xs text-[#94b8d6] leading-relaxed">
                Attendees receive an instant single-use QR admission pass on screen and via email. Organizers receive full administrative control to host, price, and oversee events.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="space-y-2 relative z-10 my-6">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#020817]/80 border border-cyan-500/20 text-xs text-[#e0f2fe]">
                <ShieldCheck className="w-4 h-4 text-[#38bdf8] shrink-0" />
                <span>Organizers create events without admission passes</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#020817]/80 border border-cyan-500/20 text-xs text-[#e0f2fe]">
                <MailCheck className="w-4 h-4 text-[#38bdf8] shrink-0" />
                <span>Attendees receive QR tickets on screen & registered email</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#020817]/80 border border-cyan-500/20 text-xs text-[#e0f2fe]">
                <UserCheck className="w-4 h-4 text-[#38bdf8] shrink-0" />
                <span>Gate staff scan passes with automatic single-use expiration</span>
              </div>
            </div>

            <div className="relative z-10 pt-4 border-t border-cyan-500/20 text-[11px] text-[#94b8d6] flex items-center justify-between">
              <span>Security: 256-Bit Encrypted</span>
              <span className="font-mono text-[#38bdf8]">Active</span>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};
