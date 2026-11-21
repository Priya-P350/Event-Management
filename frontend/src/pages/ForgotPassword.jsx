import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TextInputField, PasswordField } from '../components/forms';
import { authService } from '../services/serviceModules';
import { 
  KeyRound, Mail, ArrowRight, ArrowLeft, ShieldCheck, Lock, 
  Loader2, CheckCircle2, RefreshCw, Clock, Send, Sparkles, Check
} from 'lucide-react';

export const ForgotPassword = () => {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Mode: 'otp_reset' | 'direct_credentials'
  const [activeTab, setActiveTab] = useState('otp_reset');
  
  // OTP Reset Flow Step: 'email' | 'verify_and_set' | 'success'
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isSending, setIsSending] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Direct Credentials Flow State
  const [directCredsSent, setDirectCredsSent] = useState(false);
  const [directCredsEmail, setDirectCredsEmail] = useState('');
  const [isSendingDirect, setIsSendingDirect] = useState(false);

  // 6 refs for OTP inputs
  const otp0Ref = useRef(null);
  const otp1Ref = useRef(null);
  const otp2Ref = useRef(null);
  const otp3Ref = useRef(null);
  const otp4Ref = useRef(null);
  const otp5Ref = useRef(null);
  const otpRefs = [otp0Ref, otp1Ref, otp2Ref, otp3Ref, otp4Ref, otp5Ref];

  // React Hook Form for Step 1 (Email)
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: errorsEmail }
  } = useForm({
    defaultValues: { email: '' }
  });

  // React Hook Form for Step 2 (New Password)
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    watch: watchPassword,
    formState: { errors: errorsPassword }
  } = useForm({
    defaultValues: { newPassword: '', confirmPassword: '' }
  });

  // React Hook Form for Direct Credentials Tab
  const {
    register: registerDirect,
    handleSubmit: handleSubmitDirect,
    formState: { errors: errorsDirect }
  } = useForm({
    defaultValues: { email: '' }
  });

  // Resend Countdown Timer
  useEffect(() => {
    let timer = null;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCountdown]);

  // Auto-focus first OTP box on step transition
  useEffect(() => {
    if (step === 'verify_and_set') {
      const timeout = setTimeout(() => {
        otpRefs[0]?.current?.focus();
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [step]);

  // Handle digit change with auto-advance and paste support
  const handleOtpChange = (index, value) => {
    const clean = value.replace(/\D/g, '');
    if (!clean) {
      const newDigits = [...otpDigits];
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    if (clean.length > 1) {
      const chars = clean.slice(0, 6).split('');
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = chars[i] || '';
      }
      setOtpDigits(newDigits);
      const nextIdx = Math.min(chars.length, 5);
      otpRefs[nextIdx]?.current?.focus();
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
    const nextIdx = Math.min(chars.length, 5);
    otpRefs[nextIdx]?.current?.focus();
  };

  // Step 1: Submit email to request OTP
  const onEmailSubmit = async (data) => {
    const cleanEmail = data.email.trim().toLowerCase();
    setIsSending(true);
    try {
      const res = await authService.forgotPassword(cleanEmail);
      if (res.success) {
        setEmail(cleanEmail);
        setStep('verify_and_set');
        setResendCountdown(60);
        setOtpDigits(['', '', '', '', '', '']);
        toast.success(`Verification code sent to ${cleanEmail}. Check your inbox!`);
      } else {
        toast.error(res.message || 'Failed to send recovery code.');
      }
    } catch (err) {
      toast.error(err.message || 'No registered account found with this email.');
    } finally {
      setIsSending(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || isResending || !email) return;
    setIsResending(true);
    try {
      const res = await authService.forgotPassword(email);
      if (res.success) {
        setResendCountdown(60);
        setOtpDigits(['', '', '', '', '', '']);
        otpRefs[0]?.current?.focus();
        toast.success(`New 6-digit recovery code sent to ${email}!`);
      } else {
        toast.error(res.message || 'Failed to resend recovery code.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to resend code.');
    } finally {
      setIsResending(false);
    }
  };

  // Step 2: Submit OTP and New Password
  const onPasswordSubmit = async (data) => {
    const fullOtp = otpDigits.join('').trim();
    if (fullOtp.length !== 6) {
      toast.error('Please enter the full 6-digit recovery code.');
      return;
    }

    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match. Please verify both fields.');
      return;
    }

    setIsResetting(true);
    try {
      const res = await authService.resetPassword(email, fullOtp, data.newPassword);
      if (res.success) {
        toast.success('Password successfully reset! Signing in...');
        if (res.token) {
          localStorage.setItem('eventhub_token', res.token);
        }
        setStep('success');
      } else {
        toast.error(res.message || 'Password reset failed.');
      }
    } catch (err) {
      toast.error(err.message || 'Incorrect or expired recovery code.');
    } finally {
      setIsResetting(false);
    }
  };

  // Direct Credentials: Email a temporary password directly
  const onDirectSubmit = async (data) => {
    const cleanEmail = data.email.trim().toLowerCase();
    setIsSendingDirect(true);
    try {
      const res = await authService.sendTemporaryCredentials(cleanEmail);
      if (res.success) {
        setDirectCredsEmail(cleanEmail);
        setDirectCredsSent(true);
        toast.success(`Temporary login credentials dispatched to ${cleanEmail}!`);
      } else {
        toast.error(res.message || 'Failed to send credentials.');
      }
    } catch (err) {
      toast.error(err.message || 'No registered account found with this email.');
    } finally {
      setIsSendingDirect(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
      
      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-4 text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00f2fe] to-[#0284c7] text-[#020817] flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(0,242,254,0.4)] transition-transform duration-300 hover:scale-105">
          <KeyRound className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-black text-[#E5F4F9] tracking-tight">Account Recovery</h1>
        <p className="text-xs text-[#95B8C9] max-w-sm mx-auto leading-relaxed">
          Recover your EventHub login credentials or set a new password via secure email verification.
        </p>
      </div>

      <div className="max-w-xl mx-auto w-full">
        <div className="bg-[#122538]/90 backdrop-blur-xl p-7 sm:p-9 rounded-3xl border border-[#1E394E] space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-44 bg-[#00f2fe]/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 p-1 bg-[#0B1928] rounded-2xl border border-[#1E394E]">
            <button
              type="button"
              onClick={() => { setActiveTab('otp_reset'); setStep('email'); }}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'otp_reset'
                  ? 'bg-gradient-to-r from-[#00f2fe] to-[#0284c7] text-[#020817] shadow-md'
                  : 'text-[#95B8C9] hover:text-[#E5F4F9]'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" /> Reset with OTP
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('direct_credentials'); setDirectCredsSent(false); }}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'direct_credentials'
                  ? 'bg-gradient-to-r from-[#00f2fe] to-[#0284c7] text-[#020817] shadow-md'
                  : 'text-[#95B8C9] hover:text-[#E5F4F9]'
              }`}
            >
              <Send className="w-3.5 h-3.5" /> Email Credentials
            </button>
          </div>

          {/* ============================================================ */}
          {/* TAB 1: OTP PASSWORD RESET FLOW                               */}
          {/* ============================================================ */}
          {activeTab === 'otp_reset' && (
            <>
              {/* STEP 1: ENTER EMAIL */}
              {step === 'email' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#38bdf8] bg-[#0B1928] px-2.5 py-0.5 rounded-full border border-[#1E394E] inline-block">
                      Step 1 of 2
                    </span>
                    <h2 className="text-xl font-black text-[#E5F4F9]">Verify Your Account Email</h2>
                    <p className="text-xs text-[#95B8C9]">
                      Enter your registered email address. We will dispatch a 6-digit recovery code to your inbox.
                    </p>
                  </div>

                  <form onSubmit={handleSubmitEmail(onEmailSubmit)} className="space-y-4" noValidate>
                    <TextInputField
                      name="email"
                      label="Registered Email Address"
                      type="email"
                      placeholder="e.g. rahul@example.com"
                      icon={Mail}
                      register={registerEmail}
                      rules={{
                        required: 'Registered email address is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Please enter a valid email address'
                        }
                      }}
                      error={errorsEmail.email}
                    />

                    <button
                      type="submit"
                      disabled={isSending}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#00f2fe] to-[#0284c7] hover:from-[#38bdf8] hover:to-[#00f2fe] text-[#020817] font-black text-xs transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,242,254,0.35)] border border-[#38bdf8] disabled:opacity-50 cursor-pointer mt-2"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#020817]" />
                          Sending Recovery Code...
                        </>
                      ) : (
                        <>
                          Send 6-Digit Recovery Code <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* STEP 2: ENTER OTP & NEW PASSWORD */}
              {step === 'verify_and_set' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#38bdf8] bg-[#0B1928] px-2.5 py-0.5 rounded-full border border-[#1E394E] inline-block">
                      Step 2 of 2
                    </span>
                    <h2 className="text-xl font-black text-[#E5F4F9]">Set Your New Password</h2>
                    <p className="text-xs text-[#95B8C9]">
                      Enter the 6-digit code sent to <strong className="text-white font-mono">{email}</strong> and choose your new password.
                    </p>
                  </div>

                  {/* 6 OTP Boxes */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-[#E5F4F9] block">
                      6-Digit Recovery Code <span className="text-[#38bdf8]">*</span>
                    </label>

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
                          className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-mono font-black rounded-xl border transition-all duration-200 outline-none select-none ${
                            digit
                              ? 'bg-cyan-950/80 text-[#38bdf8] border-[#38bdf8] shadow-[0_0_12px_rgba(56,189,248,0.35)] ring-1 ring-[#38bdf8]'
                              : 'bg-[#0B1928] text-[#E5F4F9] border-[#1E394E] focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 px-1">
                      <button
                        type="button"
                        onClick={() => setStep('email')}
                        className="text-[#95B8C9] hover:text-[#E5F4F9] text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Change Email
                      </button>

                      {resendCountdown > 0 ? (
                        <span className="text-[#95B8C9] text-[11px] font-mono flex items-center gap-1">
                          Resend in <span className="text-[#38bdf8] font-bold">{resendCountdown}s</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={isResending}
                          className="text-[#38bdf8] hover:text-[#00f2fe] font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isResending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                          Resend Code
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Password Form */}
                  <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4 pt-2" noValidate>
                    <PasswordField
                      name="newPassword"
                      label="New Password"
                      placeholder="Minimum 6 characters"
                      register={registerPassword}
                      rules={{
                        required: 'New password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters'
                        }
                      }}
                      error={errorsPassword.newPassword}
                    />

                    <PasswordField
                      name="confirmPassword"
                      label="Confirm New Password"
                      placeholder="Re-enter your new password"
                      register={registerPassword}
                      rules={{
                        required: 'Please confirm your new password',
                        validate: (val) => val === watchPassword('newPassword') || 'Passwords do not match'
                      }}
                      error={errorsPassword.confirmPassword}
                    />

                    <button
                      type="submit"
                      disabled={isResetting || otpDigits.join('').length !== 6}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#00f2fe] to-[#0284c7] hover:from-[#38bdf8] hover:to-[#00f2fe] text-[#020817] font-black text-xs transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,242,254,0.35)] border border-[#38bdf8] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
                    >
                      {isResetting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#020817]" />
                          Updating Password & Signing In...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4 text-[#020817]" />
                          Save New Password & Continue
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* SUCCESS VIEW */}
              {step === 'success' && (
                <div className="text-center space-y-4 py-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <h2 className="text-2xl font-black text-[#E5F4F9]">Password Reset Successfully!</h2>
                  <p className="text-xs text-[#95B8C9] max-w-sm mx-auto leading-relaxed">
                    Your password has been securely updated. A confirmation has been sent to <strong className="text-white font-mono">{email}</strong>.
                  </p>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => navigate('/login', { state: { registeredEmail: email, message: 'Password reset successful! Sign in with your new password.' } })}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00f2fe] to-[#0284c7] hover:from-[#38bdf8] hover:to-[#00f2fe] text-[#020817] font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,242,254,0.35)] cursor-pointer"
                    >
                      Proceed to Sign In <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ============================================================ */}
          {/* TAB 2: INSTANT EMAIL CREDENTIALS RECOVERY                     */}
          {/* ============================================================ */}
          {activeTab === 'direct_credentials' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {!directCredsSent ? (
                <>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#38bdf8] bg-[#0B1928] px-2.5 py-0.5 rounded-full border border-[#1E394E] inline-block">
                      Instant Credentials Dispatch
                    </span>
                    <h2 className="text-xl font-black text-[#E5F4F9]">Email My Login Credentials</h2>
                    <p className="text-xs text-[#95B8C9] leading-relaxed">
                      Forgot your credentials? Enter your registered email below. We will generate a fresh temporary password and deliver your full account details directly to your inbox.
                    </p>
                  </div>

                  <form onSubmit={handleSubmitDirect(onDirectSubmit)} className="space-y-4" noValidate>
                    <TextInputField
                      name="email"
                      label="Registered Account Email"
                      type="email"
                      placeholder="e.g. rahul@example.com"
                      icon={Mail}
                      register={registerDirect}
                      rules={{
                        required: 'Registered email address is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Please enter a valid email address'
                        }
                      }}
                      error={errorsDirect.email}
                    />

                    <button
                      type="submit"
                      disabled={isSendingDirect}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#00f2fe] to-[#0284c7] hover:from-[#38bdf8] hover:to-[#00f2fe] text-[#020817] font-black text-xs transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,242,254,0.35)] border border-[#38bdf8] disabled:opacity-50 cursor-pointer mt-2"
                    >
                      {isSendingDirect ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#020817]" />
                          Generating & Dispatching Credentials...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 text-[#020817]" />
                          Email My Credentials & Temp Password
                        </>
                      )}
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center space-y-4 py-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <h2 className="text-2xl font-black text-[#E5F4F9]">Credentials Sent to Email!</h2>
                  <p className="text-xs text-[#95B8C9] max-w-sm mx-auto leading-relaxed">
                    A secure temporary password and your login details have been emailed to <strong className="text-white font-mono">{directCredsEmail}</strong>.
                  </p>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => navigate('/login', { state: { registeredEmail: directCredsEmail, message: 'Check your email for your temporary password to sign in!' } })}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00f2fe] to-[#0284c7] hover:from-[#38bdf8] hover:to-[#00f2fe] text-[#020817] font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,242,254,0.35)] cursor-pointer"
                    >
                      Sign In with Temporary Password <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Back Link */}
          <div className="pt-4 border-t border-[#1E394E] flex items-center justify-between text-xs text-[#95B8C9]">
            <Link
              to="/login"
              className="text-[#38bdf8] hover:text-[#00f2fe] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>

            <Link
              to="/register"
              className="text-[#95B8C9] hover:text-[#E5F4F9] transition-colors"
            >
              Create New Account
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};
