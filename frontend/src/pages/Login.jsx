import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TextInputField, PasswordField } from '../components/forms';
import { Ticket, Mail, ArrowRight, ShieldCheck, UserCheck, QrCode, Sparkles, Loader2 } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    setValue,
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

  // Quick fill preset credentials helper
  const fillPreset = (idVal, passVal) => {
    setValue('identifier', idVal, { shouldValidate: true });
    setValue('password', passVal, { shouldValidate: true });
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center mx-auto shadow-lg shadow-white/10">
          <Ticket className="w-6 h-6" />
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight">Sign In to EventHub</h2>
        <p className="text-xs text-zinc-400 max-w-xs mx-auto">
          Powered by React Hook Form & modular field architecture
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-panel p-8 rounded-3xl border border-zinc-800 space-y-6">
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <TextInputField
              name="identifier"
              label="Email Address or Phone Number"
              placeholder="user@example.com or +91 9876543210"
              icon={Mail}
              register={register}
              rules={{
                required: 'Email or phone number is required'
              }}
              error={errors.identifier}
            />

            <PasswordField
              name="password"
              label="Password"
              placeholder="••••••••"
              register={register}
              rules={{
                required: 'Password is required'
              }}
              error={errors.password}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-white text-black font-extrabold text-xs hover:bg-zinc-200 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 border border-white cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Preset Accounts */}
          <div className="pt-4 border-t border-zinc-800 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400">
              <span className="uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Demo Accounts Helper
              </span>
              <span className="text-zinc-500 font-normal">Click to autofill</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => fillPreset('admin@eventhub.com', 'Admin@123')}
                className="p-2.5 rounded-xl bg-black border border-zinc-800 text-zinc-200 hover:border-white text-left font-medium transition-all flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="block font-bold text-white">Super Admin</span>
                  <span className="block text-[10px] text-zinc-500">admin@eventhub.com</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillPreset('organizer@eventhub.com', 'Admin@123')}
                className="p-2.5 rounded-xl bg-black border border-zinc-800 text-zinc-200 hover:border-white text-left font-medium transition-all flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <div>
                  <span className="block font-bold text-white">Event Admin</span>
                  <span className="block text-[10px] text-zinc-500">organizer@eventhub.com</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillPreset('staff@eventhub.com', 'Staff@123')}
                className="p-2.5 rounded-xl bg-black border border-zinc-800 text-zinc-200 hover:border-white text-left font-medium transition-all flex items-center gap-2"
              >
                <QrCode className="w-4 h-4 text-purple-400" />
                <div>
                  <span className="block font-bold text-white">Scanner Staff</span>
                  <span className="block text-[10px] text-zinc-500">staff@eventhub.com</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillPreset('guest@gmail.com', 'Guest@123')}
                className="p-2.5 rounded-xl bg-black border border-zinc-800 text-zinc-200 hover:border-white text-left font-medium transition-all flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="block font-bold text-white">Guest Attendee</span>
                  <span className="block text-[10px] text-zinc-500">guest@gmail.com</span>
                </div>
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-zinc-400">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-white font-bold hover:underline">
              Create New Account
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};
