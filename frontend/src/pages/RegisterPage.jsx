import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TextInputField, PasswordField, RadioCardsField } from '../components/forms';
import { 
  Ticket, User, Mail, Phone, ArrowRight, ShieldCheck, 
  QrCode, UserCheck, Loader2, Download, CheckCircle2, Copy, Sparkles 
} from 'lucide-react';

export const RegisterPage = () => {
  const { register: registerAuth } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [registeredUser, setRegisteredUser] = useState(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      role: 'guest'
    }
  });

  const selectedRole = watch('role');

  const onSubmit = async (data) => {
    const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim() || 'New User';

    try {
      const res = await registerAuth({
        name: fullName,
        email: data.email.trim(),
        phone: data.phone.trim(),
        password: data.password,
        role: data.role
      });

      if (res.success && res.user) {
        toast.success(`Account and Member QR Pass generated for ${fullName}!`);
        setRegisteredUser(res.user);
      }
    } catch (err) {
      toast.error(err.message || 'Registration failed.');
    }
  };

  const roleOptions = [
    { value: 'guest', label: 'Attendee', icon: UserCheck, badge: 'Passes' },
    { value: 'event_admin', label: 'Organizer', icon: ShieldCheck, badge: 'Admin' },
    { value: 'scanner_staff', label: 'Gate Staff', icon: QrCode, badge: 'Scanner' }
  ];

  const copyUniqueId = (uniqueId) => {
    if (!uniqueId) return;
    navigator.clipboard.writeText(uniqueId);
    setCopied(true);
    toast.success('Unique Member ID copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const downloadQrPass = (qrDataUrl, uniqueId) => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `Member-Pass-${uniqueId || 'QR'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR Pass downloaded successfully!');
  };

  const handleContinue = () => {
    if (!registeredUser) return;
    if (registeredUser.role === 'scanner_staff') {
      navigate('/scanner');
    } else if (['super_admin', 'event_admin'].includes(registeredUser.role)) {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-4 text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-[#E5F4F9] text-[#0B1928] flex items-center justify-center mx-auto shadow-xl transition-transform duration-300 hover:scale-105">
          <Ticket className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-black text-[#E5F4F9] tracking-tight">
          {registeredUser ? 'Your Digital QR Pass' : 'Create Account & Get Member QR'}
        </h1>
        <p className="text-xs text-[#95B8C9] max-w-sm mx-auto">
          {registeredUser 
            ? 'Your unique member ID and admission QR code have been issued.'
            : 'Register yourself to instantly receive an admission QR pass with your details & unique ID.'}
        </p>
      </div>

      {/* SUCCESS MODAL / CARD WHEN REGISTERED */}
      {registeredUser ? (
        <div className="max-w-xl mx-auto w-full bg-[#122538] border-2 border-[#38bdf8]/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#38bdf8]/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-center justify-between border-b border-[#1E394E] pb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#38bdf8]/20 text-[#38bdf8]">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <span className="text-xs font-black text-[#E5F4F9] tracking-wider uppercase block">
                  OFFICIAL EVENTHUB MEMBER PASS
                </span>
                <span className="text-[10px] text-[#95B8C9]">One-Time Entrance Token</span>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-black font-mono uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE
            </span>
          </div>

          {/* QR Container with Unique ID mentioned right on it */}
          <div className="bg-[#0B1928] p-6 rounded-2xl border border-[#1E394E] text-center space-y-4 shadow-inner">
            <div className="inline-block p-4 bg-white rounded-2xl border-4 border-[#38bdf8] shadow-lg">
              {registeredUser.qr_code_data ? (
                <img 
                  src={registeredUser.qr_code_data} 
                  alt="Member QR Pass" 
                  className="w-48 h-48 mx-auto block object-contain"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-zinc-800">
                  <QrCode className="w-24 h-24" />
                </div>
              )}
            </div>

            {/* Unique ID Highlight */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-[#95B8C9] uppercase tracking-wider block">
                Unique Member ID (Mentioned on QR)
              </span>
              <div className="inline-flex items-center gap-2 bg-[#122538] px-4 py-2 rounded-xl border border-[#2B4E66]">
                <span className="font-mono text-base font-black text-[#38bdf8] tracking-widest">
                  {registeredUser.member_id || registeredUser.memberId || 'MEM-2026-ACTIVE'}
                </span>
                <button
                  onClick={() => copyUniqueId(registeredUser.member_id || registeredUser.memberId)}
                  className="p-1 text-[#95B8C9] hover:text-[#E5F4F9] transition-colors cursor-pointer"
                  title="Copy Unique ID"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-[11px] text-[#95B8C9] max-w-xs mx-auto">
              Scan this QR code at the gate entrance. <strong className="text-amber-300">Once scanned by Admin, this QR will expire.</strong>
            </p>
          </div>

          {/* Member Details Grid */}
          <div className="grid grid-cols-2 gap-3 bg-[#0B1928]/60 p-4 rounded-xl border border-[#1E394E] text-xs">
            <div>
              <span className="text-[10px] text-[#95B8C9] uppercase font-bold block">Member Name</span>
              <span className="font-bold text-[#E5F4F9] text-sm">{registeredUser.name}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#95B8C9] uppercase font-bold block">Role / Category</span>
              <span className="font-semibold text-[#38bdf8] uppercase">{registeredUser.role?.replace('_', ' ')}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#95B8C9] uppercase font-bold block">Email Address</span>
              <span className="text-[#E5F4F9] truncate block font-mono text-[11px]">{registeredUser.email}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#95B8C9] uppercase font-bold block">Phone</span>
              <span className="text-[#E5F4F9] font-mono text-[11px]">{registeredUser.phone || 'N/A'}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => downloadQrPass(registeredUser.qr_code_data, registeredUser.member_id || registeredUser.memberId)}
              className="px-4 py-3 rounded-xl bg-[#1E394E] hover:bg-[#2B4E66] text-[#E5F4F9] font-bold text-xs flex items-center justify-center gap-2 border border-[#38bdf8]/30 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#38bdf8]" /> Download QR Pass
            </button>
            <button
              onClick={handleContinue}
              className="px-4 py-3 rounded-xl bg-[#38bdf8] hover:bg-[#7dd3fc] text-[#0B1928] font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* REGISTRATION FORM */
        <div className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left: Registration Form (7 cols) */}
          <div className="lg:col-span-7 bg-[#122538]/90 backdrop-blur-xl p-8 rounded-3xl border border-[#1E394E] space-y-6 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-[#E5F4F9] uppercase tracking-wider">Member Self-Registration</span>
                <span className="text-[11px] font-medium text-[#4A96BA] bg-[#1E394E] px-2.5 py-0.5 rounded-full border border-[#2B4E66]">
                  Instant QR Generation
                </span>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

                {/* Role / Account Type Selection */}
                <RadioCardsField
                  name="role"
                  label="Account Type"
                  options={roleOptions}
                  register={register}
                  setValue={setValue}
                  watch={watch}
                  rules={{ required: 'Please select an account type' }}
                  error={errors.role}
                />

                {/* Role Description Notice */}
                <div className="p-3 rounded-xl bg-[#0B1928] border border-[#1E394E] text-[11px] text-[#95B8C9]">
                  {selectedRole === 'guest' && 'Standard attendee: receive digital QR pass, book events, and check-in at the venue.'}
                  {selectedRole === 'event_admin' && 'Organizer: create events, manage seats, review payments, and monitor gate check-ins.'}
                  {selectedRole === 'scanner_staff' && 'Gate staff: access camera QR scanner to scan and expire passes for admission.'}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#E5F4F9] text-[#0B1928] font-black text-xs hover:bg-[#95B8C9] transition-all duration-200 flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#0B1928]" />
                      Generating Your QR Pass...
                    </>
                  ) : (
                    <>
                      Create Account & Generate QR Pass
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <p className="text-center text-xs text-[#95B8C9] pt-4 border-t border-[#1E394E]">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-[#E5F4F9] hover:underline">
                Sign In
              </Link>
            </p>
          </div>

          {/* Right: Feature Showcase (5 cols) */}
          <div className="lg:col-span-5 hidden lg:flex flex-col justify-between p-7 rounded-3xl border border-[#2B4E66] relative overflow-hidden texture-card shadow-2xl">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#4A96BA]/15 rounded-full blur-3xl pointer-events-none"></div>

            <div className="space-y-4 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0B1928]/80 backdrop-blur-md border border-[#1E394E] text-[#E5F4F9] text-[11px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-[#4A96BA]" />
                Single-Use QR Admission
              </div>

              <h3 className="text-2xl font-black text-[#E5F4F9] leading-snug">
                Every Member Gets an Encrypted QR Pass
              </h3>

              <p className="text-xs text-[#95B8C9] leading-relaxed">
                When you register, the platform generates a unique admission ID and QR code containing your details. Once scanned by Admin at the entrance, the QR pass expires automatically to prevent duplicate reuse.
              </p>
            </div>

            <div className="relative z-10 my-6 space-y-3">
              <div className="p-3.5 rounded-xl bg-[#0B1928]/80 border border-[#1E394E] flex items-center gap-3 backdrop-blur-sm">
                <div className="w-9 h-9 rounded-lg bg-[#4A96BA]/20 text-[#4A96BA] flex items-center justify-center shrink-0">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#E5F4F9]">Unique ID Mentioned on QR</div>
                  <div className="text-[11px] text-[#95B8C9]">e.g. MEM-2026-849102</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0B1928]/80 border border-[#1E394E] flex items-center gap-3 backdrop-blur-sm">
                <div className="w-9 h-9 rounded-lg bg-[#4A96BA]/20 text-[#4A96BA] flex items-center justify-center shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#E5F4F9]">Admin Scan & Expire</div>
                  <div className="text-[11px] text-[#95B8C9]">Atomic check-in and instant pass expiration</div>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-4 border-t border-[#1E394E]/80 text-[11px] text-[#95B8C9] flex items-center justify-between">
              <span>Encrypted with SHA-256</span>
              <span className="font-mono text-[#E5F4F9]">Auto-Expiring</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
