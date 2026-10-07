import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { eventService, registrationService, paymentService } from '../services/serviceModules';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TextInputField } from '../components/forms';
import { 
  Ticket, Calendar, MapPin, User, Mail, Phone, 
  CreditCard, ArrowLeft, Loader2, Lock, Building, Briefcase
} from 'lucide-react';

export const GuestRegistration = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      company: '',
      designation: ''
    }
  });

  useEffect(() => {
    eventService.getEventById(eventId)
      .then(res => {
        if (res.success) setEvent(res.event);
      })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        company: '',
        designation: ''
      });
    }
  }, [user, reset]);

  const onSubmit = async (data) => {
    try {
      // 1. Create Pending Registration on Backend
      const regRes = await registrationService.createRegistration({
        eventId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        customAnswers: {
          company: data.company,
          designation: data.designation
        }
      });

      if (!regRes.success) {
        toast.error(regRes.message || 'Registration failed.');
        return;
      }

      // Handle Free Event Direct Confirmation
      if (regRes.isFree || Number(event.ticket_price) === 0) {
        toast.success('Registration Complete! Free QR Entry Pass Issued.');
        navigate('/payment/success', {
          state: {
            ticket: regRes.ticket,
            event,
            registrationId: regRes.registrationId,
            ticketNumber: regRes.ticketNumber || regRes.ticket?.ticket_number,
            secureToken: regRes.secureToken || regRes.ticket?.secure_token
          }
        });
        return;
      }

      const { registrationId, razorpayOrder } = regRes;

      // 2. Razorpay Checkout Handler
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_mock_12345';

      const options = {
        key: razorpayKey,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || 'INR',
        name: 'EventHub Ticketing',
        description: `Pass Registration for ${event.title}`,
        order_id: razorpayOrder.id,
        prefill: {
          name: data.name,
          email: data.email,
          contact: data.phone
        },
        theme: {
          color: '#000000'
        },
        handler: async function (response) {
          try {
            toast.info('Verifying Razorpay payment signature...');

            // 3. Backend Payment Verification & QR Generation
            const verifyRes = await paymentService.verifyPayment({
              registrationId,
              razorpay_order_id: response.razorpay_order_id || razorpayOrder.id,
              razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
              razorpay_signature: response.razorpay_signature || 'mock_sig_hash'
            });

            if (verifyRes.success) {
              toast.success('Payment Verified! Ticket Issued.');
              navigate('/payment/success', {
                state: {
                  ticket: verifyRes.ticket,
                  event,
                  registrationId,
                  ticketNumber: verifyRes.ticketNumber,
                  secureToken: verifyRes.secureToken
                }
              });
            } else {
              toast.error(verifyRes.message || 'Payment verification failed.');
              navigate('/payment/failed');
            }
          } catch (err) {
            toast.error(err.message || 'Error completing payment verification.');
            navigate('/payment/failed');
          }
        },
        modal: {
          ondismiss: function () {
            toast.warning('Payment window closed. Registration remains pending.');
          }
        }
      };

      // Handle Sandbox Fallback if Razorpay SDK script isn't loaded
      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Fallback simulated payment trigger for non-browser script environments
        toast.info('[Sandbox Mode] Executing simulated Razorpay checkout...');
        setTimeout(async () => {
          const verifyRes = await paymentService.verifyPayment({
            registrationId,
            razorpay_order_id: razorpayOrder.id,
            razorpay_payment_id: `pay_simulated_${Date.now()}`,
            razorpay_signature: 'mock_sandbox_signature'
          });

          if (verifyRes.success) {
            toast.success('Simulated Payment Verified! Ticket Issued.');
            navigate('/payment/success', {
              state: {
                ticket: verifyRes.ticket,
                event,
                registrationId,
                ticketNumber: verifyRes.ticketNumber,
                secureToken: verifyRes.secureToken
              }
            });
          } else {
            navigate('/payment/failed');
          }
        }, 1500);
      }

    } catch (err) {
      toast.error(err.message || 'Failed to initialize registration order.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center text-white">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
        <span className="text-xs font-semibold">Loading Event Info...</span>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <Link to={`/events/${eventId}`} className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Cancel & Back to Event Details
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left 1 Col: Event Summary Card */}
        <div className="space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-zinc-800 space-y-4">
            <div className="h-36 rounded-xl overflow-hidden border border-zinc-800">
              <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover grayscale" />
            </div>

            <div>
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">{event.category}</span>
              <h3 className="text-base font-bold text-white leading-snug">{event.title}</h3>
            </div>

            <div className="space-y-2 text-xs text-zinc-400 border-t border-zinc-800 pt-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-white shrink-0" />
                <span>{new Date(event.event_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className="line-clamp-1">{event.venue}</span>
              </div>
            </div>

            <div className="p-3 bg-black border border-zinc-800 rounded-xl flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-medium">Total Amount Due</span>
              <span className="text-lg font-extrabold text-white">
                {Number(event.ticket_price) === 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs tracking-wider uppercase font-bold">FREE ENTRY</span>
                ) : (
                  `₹${event.ticket_price}`
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Right 2 Cols: Guest Registration Form */}
        <div className="md:col-span-2">
          <div className="glass-panel p-8 rounded-3xl border border-zinc-800 space-y-6">
            
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Ticket className="w-5 h-5 text-white" /> Guest Registration Form
              </h2>
              <p className="text-xs text-zinc-400">
                {Number(event.ticket_price) === 0 
                  ? 'Free event registration. An instant QR access pass will be emailed to you.' 
                  : 'Powered by React Hook Form & Razorpay Payment Gateway'}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              
              <TextInputField
                name="name"
                label="Full Name"
                placeholder="Rahul Sharma"
                icon={User}
                register={register}
                rules={{ required: 'Full name is required' }}
                error={errors.name}
                required
              />

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
                required
              />

              <TextInputField
                name="phone"
                label="Phone Number"
                type="tel"
                placeholder="+91 9876543210"
                icon={Phone}
                register={register}
                rules={{ required: 'Phone number is required' }}
                error={errors.phone}
                required
              />

              <div className="grid grid-cols-2 gap-3 pt-2">
                <TextInputField
                  name="company"
                  label="Company (Optional)"
                  placeholder="Tech Corp"
                  icon={Building}
                  register={register}
                  error={errors.company}
                />

                <TextInputField
                  name="designation"
                  label="Designation (Optional)"
                  placeholder="Software Engineer"
                  icon={Briefcase}
                  register={register}
                  error={errors.designation}
                />
              </div>

              <div className="pt-4 border-t border-zinc-800">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl bg-white text-black font-extrabold text-sm hover:bg-zinc-200 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 border border-white cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-black" /> {Number(event.ticket_price) === 0 ? 'Generating Free Pass...' : 'Processing Payment Order...'}
                    </>
                  ) : Number(event.ticket_price) === 0 ? (
                    <>
                      <Ticket className="w-5 h-5 text-black" /> Complete Free Registration — Instant QR Pass
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 text-black" /> Proceed to Razorpay Payment — ₹{event.ticket_price}
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-400 pt-2">
                <Lock className="w-3.5 h-3.5 text-white" />
                {Number(event.ticket_price) === 0 
                  ? 'No credit card or payment details required for free entry'
                  : 'Payments processed securely via Razorpay Checkout HMAC SHA256 API'}
              </div>

            </form>

          </div>
        </div>

      </div>

    </div>
  );
};
