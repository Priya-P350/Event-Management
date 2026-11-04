import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TextInputField, PasswordField } from '../components/forms';
import { Ticket, Mail, ArrowRight, ShieldCheck, Lock, Sparkles, Loader2, KeyRound } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      identifier: '',
      password: ''
    }
  });

  const from = location.state?.from?.pathname || '/dashboard';

  const onSubmit = async (data) => {
    try {
      const res = await login(data.identifier.trim(), data.password);
      if (res.success) {
        toast.success(`Welcome back, ${res.user.name}!`);
        
        // Smart role redirect
        if (res.user.role === 'scanner_staff') {
          navigate('/scanner');
        } else if (['super_admin', 'event_admin'].includes(res.user.role)) {
          navigate('/admin');
        } else {
          navigate(from);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-4 text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-[#E5F4F9] text-[#0B1928] flex items-center justify-center mx-auto shadow-xl transition-transform duration-300 hover:scale-105">
          <Ticket className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-black text-[#E5F4F9] tracking-tight">Sign In to EventHub</h1>
        <p className="text-xs text-[#95B8C9] max-w-xs mx-auto leading-relaxed">
          Production Security Portal • Real-Time Pass & Admission Access
        </p>
      </div>

      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left: Login Form (7 cols) */}
        <div className="lg:col-span-7 bg-[#122538]/90 backdrop-blur-xl p-8 rounded-3xl border border-[#1E394E] space-y-6 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-[#E5F4F9] uppercase tracking-wider">Account Credentials</span>
              <span className="text-[11px] font-medium text-[#4A96BA] bg-[#1E394E] px-2.5 py-0.5 rounded-full border border-[#2B4E66]">
                MongoDB Secured
              </span>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <TextInputField
                id="identifier"
                name="identifier"
                label="Email Address or Mobile Number"
                placeholder="Enter your registered email or phone"
                icon={Mail}
                autoComplete="username"
                spellCheck="false"
                enterKeyHint="next"
                register={register}
                rules={{
                  required: 'Registered email or phone number is required'
                }}
                error={errors.identifier}
              />

              <PasswordField
                id="current-password"
                name="password"
                label="Password"
                placeholder="Enter your account password"
                autoComplete="current-password"
                enterKeyHint="done"
                register={register}
                rules={{
                  required: 'Password is required'
                }}
                error={errors.password}
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-[#E5F4F9] text-[#0B1928] font-extrabold text-xs hover:bg-[#C3E2ED] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 border border-[#E5F4F9] cursor-pointer shadow-md mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#0B1928]" /> Authenticating...
                  </>
                ) : (
                  <>
                    Sign In Securely <ArrowRight className="w-4 h-4 text-[#0B1928]" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="space-y-4 pt-4 border-t border-[#1E394E]">
            <div className="flex items-center justify-between text-[11px] text-[#95B8C9] px-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#4A96BA]" /> 256-Bit SSL Encrypted
              </span>
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#4A96BA]" /> JWT Session Auth
              </span>
            </div>

            <p className="text-center text-xs text-[#95B8C9]">
              Don't have an account yet?{' '}
              <Link to="/register" className="text-[#E5F4F9] font-bold hover:underline transition-colors">
                Create New Account
              </Link>
            </p>
          </div>
        </div>

        {/* Right: Featured Texture Picture Showcase (5 cols) */}
        <div className="lg:col-span-5 hidden lg:flex flex-col justify-between p-7 rounded-3xl border border-[#2B4E66] relative overflow-hidden texture-card shadow-2xl">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#4A96BA]/15 rounded-full blur-3xl pointer-events-none"></div>

          <div className="space-y-4 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0B1928]/80 backdrop-blur-md border border-[#1E394E] text-[#E5F4F9] text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#4A96BA]" />
              Tactile Pass Engine
            </div>

            <h3 className="text-2xl font-black text-[#E5F4F9] leading-snug">
              Instant Gate Admission & Passes
            </h3>

            <p className="text-xs text-[#95B8C9] leading-relaxed">
              Experience the new high-contrast UI with woven tactile pass security. Every ticket generates an unpredictable HMAC-signed QR token verified at entry.
            </p>
          </div>

          {/* Miniature Pass Preview Badge */}
          <div className="relative z-10 my-6 bg-[#0B1928]/85 border border-[#1E394E] rounded-2xl p-4 space-y-3 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#95B8C9]">VIP Admission Pass</span>
              <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse"></span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white p-1 shrink-0 flex items-center justify-center">
                <QrCode className="w-10 h-10 text-[#0B1928]" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-[#E5F4F9]">Global Tech Summit</div>
                <div className="text-[11px] text-[#95B8C9] font-mono">PASS-2026-ACTIVE</div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-[#1E394E]/80 text-[11px] text-[#95B8C9] flex items-center justify-between">
            <span>Server: MongoDB Ready</span>
            <span className="font-mono text-[#E5F4F9]">v1.0 Production</span>
          </div>

        </div>

      </div>
    </div>
  );
};
