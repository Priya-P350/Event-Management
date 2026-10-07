import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { eventService } from '../../services/serviceModules';
import { useToast } from '../../context/ToastContext';
import { TextInputField, SelectField } from '../../components/forms';
import { PlusCircle, ArrowLeft, Loader2, Calendar, MapPin, Ticket, Tag, Sparkles, Building, Award } from 'lucide-react';

export const AdminCreateEvent = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      category: 'ITI & Vocational',
      cover_image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
      event_date: '2026-11-15',
      start_time: '09:30',
      end_time: '17:00',
      venue: 'Govt ITI Main Campus Auditorium',
      address: 'Plot 12, Industrial Training Zone, Technical Campus',
      google_maps_url: 'https://maps.google.com',
      ticket_price: 0,
      capacity: 500,
      registration_open_at: '2026-10-01',
      registration_close_at: '2026-11-10',
      status: 'registration_open',
      iti_institute: 'Government Industrial Training Institute (Govt ITI)',
      iti_trade: 'Electrician, Fitter, Welder, COPA, Machinist, Motor Mechanic',
      iti_eligibility: '10th / 12th Pass + ITI NCVT/SCVT Certificate'
    }
  });

  const selectedCategory = watch('category');

  const handleFillItiPreset = () => {
    setValue('title', 'Govt ITI All-India Trade Skill Exhibition & Job Fair 2026');
    setValue('category', 'ITI & Vocational');
    setValue('description', 'Official Annual ITI Skill Expo and Campus Hiring Drive. Top manufacturing and core tech companies participating. Live trade demonstrations, tool exhibitions, and instant spot registrations.');
    setValue('cover_image_url', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80');
    setValue('event_date', '2026-11-20');
    setValue('start_time', '09:00');
    setValue('end_time', '17:30');
    setValue('venue', 'Central Workshops & Auditorium, Govt ITI Campus');
    setValue('address', 'National Highway 44, Industrial Training Area');
    setValue('ticket_price', 0);
    setValue('capacity', 750);
    setValue('registration_open_at', '2026-10-01');
    setValue('registration_close_at', '2026-11-18');
    setValue('status', 'registration_open');
    setValue('iti_institute', 'Government Industrial Training Institute (Govt ITI Main Campus)');
    setValue('iti_trade', 'Electrician, Fitter, Welder, COPA, Machinist, Turner, Draughtsman (Mechanical), Electronics');
    setValue('iti_eligibility', '10th / 12th Pass + NCVT / SCVT ITI Diploma');
    toast.success('Auto-filled ITI Event Template!');
  };

  const onSubmit = async (data) => {
    try {
      const formattedData = {
        ...data,
        ticket_price: parseFloat(data.ticket_price || 0),
        capacity: parseInt(data.capacity || 100, 10)
      };

      const res = await eventService.createEvent(formattedData);
      if (res.success) {
        toast.success('Event published successfully!');
        navigate('/admin/events');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create event');
    }
  };

  const categoryOptions = [
    { value: 'ITI & Vocational', label: '🛠️ ITI & Vocational Training' },
    { value: 'Technology', label: '💻 Technology & AI' },
    { value: 'Music', label: '🎵 Music & Entertainment' },
    { value: 'Business', label: '💼 Business & Pitch Gala' },
    { value: 'Education', label: '🎓 Education & Masterclass' }
  ];

  const statusOptions = [
    { value: 'registration_open', label: 'Registration Open' },
    { value: 'draft', label: 'Draft Mode' },
    { value: 'published', label: 'Published' },
    { value: 'registration_closed', label: 'Registration Closed' }
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      
      <div className="flex items-center justify-between">
        <Link to="/admin/events" className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Events Directory
        </Link>
        <button
          type="button"
          onClick={handleFillItiPreset}
          className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white hover:bg-white hover:text-black font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Auto-Fill ITI Event Template
        </button>
      </div>

      <div className="glass-panel p-8 rounded-3xl border border-zinc-800 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-white" /> Create & Publish Event
          </h1>
          <p className="text-xs text-zinc-400">Fill in event details, ITI institute/trades, registration dates, capacity, and ticket pricing</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
          
          <TextInputField
            name="title"
            label="Event Title"
            placeholder="e.g. Govt ITI Skill Expo & Trade Fair 2026"
            register={register}
            rules={{ required: 'Event title is required' }}
            error={errors.title}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <SelectField
              name="category"
              label="Category"
              options={categoryOptions}
              register={register}
              icon={Tag}
              error={errors.category}
            />

            <SelectField
              name="status"
              label="Initial Status"
              options={statusOptions}
              register={register}
              error={errors.status}
            />
          </div>

          {/* ITI Specific Details */}
          <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
              <Award className="w-4 h-4 text-amber-400" /> ITI / Vocational Trade Details
            </div>
            
            <TextInputField
              name="iti_institute"
              label="ITI Institute / College Name"
              placeholder="e.g. Government ITI Campus, Sector 14"
              icon={Building}
              register={register}
              error={errors.iti_institute}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextInputField
                name="iti_trade"
                label="Eligible ITI Trades"
                placeholder="e.g. Electrician, Fitter, Welder, COPA"
                register={register}
                error={errors.iti_trade}
              />

              <TextInputField
                name="iti_eligibility"
                label="Eligibility / Qualification"
                placeholder="e.g. 10th Pass + ITI NCVT/SCVT"
                register={register}
                error={errors.iti_eligibility}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300">Description</label>
            <textarea
              rows={3}
              placeholder="Describe key highlights, trade workshops, keynotes, and schedule..."
              {...register('description')}
              className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-all"
            ></textarea>
          </div>

          <TextInputField
            name="cover_image_url"
            label="Cover Image / Poster URL"
            type="url"
            placeholder="https://images.unsplash.com/photo-..."
            register={register}
            error={errors.cover_image_url}
          />

          {/* Registration Window Dates */}
          <div className="grid grid-cols-2 gap-4 bg-black/60 p-3 rounded-2xl border border-zinc-800/80">
            <TextInputField
              name="registration_open_at"
              label="Registration Start Date"
              type="date"
              register={register}
              error={errors.registration_open_at}
            />

            <TextInputField
              name="registration_close_at"
              label="Registration End Date (Deadline)"
              type="date"
              register={register}
              error={errors.registration_close_at}
            />
          </div>

          {/* Event Execution Schedule */}
          <div className="grid grid-cols-3 gap-4">
            <TextInputField
              name="event_date"
              label="Event Main Date"
              type="date"
              register={register}
              rules={{ required: 'Event date is required' }}
              error={errors.event_date}
              required
            />

            <TextInputField
              name="start_time"
              label="Start Time"
              type="time"
              register={register}
              error={errors.start_time}
            />

            <TextInputField
              name="end_time"
              label="End Time"
              type="time"
              register={register}
              error={errors.end_time}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextInputField
              name="venue"
              label="Venue Name"
              placeholder="Govt ITI Auditorium"
              icon={MapPin}
              register={register}
              rules={{ required: 'Venue name is required' }}
              error={errors.venue}
              required
            />

            <TextInputField
              name="address"
              label="Venue Address"
              placeholder="Campus Road, Tech City"
              register={register}
              rules={{ required: 'Address is required' }}
              error={errors.address}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextInputField
              name="ticket_price"
              label="Ticket Price (₹)"
              type="number"
              placeholder="0 for free ITI entry"
              icon={Ticket}
              register={register}
              rules={{ min: { value: 0, message: 'Price cannot be negative' } }}
              error={errors.ticket_price}
            />

            <TextInputField
              name="capacity"
              label="Total Capacity (Seats/Passes)"
              type="number"
              placeholder="500"
              register={register}
              rules={{ min: { value: 1, message: 'Capacity must be at least 1' } }}
              error={errors.capacity}
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-white text-black font-extrabold text-xs hover:bg-zinc-200 border border-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Publishing Event...
                </>
              ) : (
                'Publish Event'
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};
