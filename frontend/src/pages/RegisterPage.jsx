import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TextInputField, PasswordField, RadioCardsField } from '../components/forms';
import { Ticket, User, Mail, Phone, ArrowRight, ShieldCheck, QrCode, UserCheck, Loader2 } from 'lucide-react';

export const RegisterPage = () => {
  const { register: registerAuth } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

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

      if (res.success) {
        toast.success(`Account created as ${data.role.replace('_', ' ')}!`);
        if (data.role === 'scanner_staff') {
          navigate('/scanner');
        } else if (['super_admin', 'event_admin'].includes(data.role)) {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
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

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center mx-auto shadow-lg shadow-white/10">
          <Ticket className="w-6 h-6" />
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight">Create Account</h2>
        <p className="text-xs text-zinc-400 max-w-xs mx-auto">
          Powered by React Hook Form & modular field architecture
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-panel p-8 rounded-3xl border border-zinc-800 space-y-6">
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
                icon={User}
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
              placeholder="name@company.com"
              icon={Mail}
              register={register}
              rules={{
                required: 'Email address is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address format'
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
                required: 'Phone number is required'
              }}
              error={errors.phone}
            />

            {/* Password */}
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

            {/* Role Selection */}
            <div>
              <RadioCardsField
                name="role"
                label="Account Type & System Role"
                options={roleOptions}
                value={selectedRole}
                onChange={(val) => setValue('role', val, { shouldValidate: true })}
                register={register}
                columns={3}
              />
              <p className="text-[11px] text-zinc-500 mt-2 italic text-center">
                {selectedRole === 'guest' && '🎟️ Standard attendee: browse events, buy tickets, download QR passes'}
                {selectedRole === 'event_admin' && '🛡️ Admin portal: create events, manage registrations, view revenues & users'}
                {selectedRole === 'scanner_staff' && '📷 Scanner staff: access mobile QR scanner for live venue entry'}
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-white text-black font-extrabold text-xs hover:bg-zinc-200 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 border border-white mt-4 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating Account...
                </>
              ) : (
                <>
                  Register Account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-zinc-400">
            Already have an account?{' '}
            <Link to="/login" className="text-white font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
