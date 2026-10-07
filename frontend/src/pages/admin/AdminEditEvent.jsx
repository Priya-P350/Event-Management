import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { eventService } from '../../services/serviceModules';
import { useToast } from '../../context/ToastContext';
import { TextInputField, SelectField } from '../../components/forms';
import { Edit3, ArrowLeft, Loader2, Ticket, MapPin } from 'lucide-react';

export const AdminEditEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [eventTitle, setEventTitle] = useState('');
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      category: 'General',
      cover_image_url: '',
      event_date: '',
      start_time: '',
      end_time: '',
      venue: '',
      address: '',
      ticket_price: 0,
      capacity: 100,
      status: 'published'
    }
  });

  useEffect(() => {
    eventService.getEventById(id)
      .then(res => {
        if (res.success && res.event) {
          setEventTitle(res.event.title);
          reset(res.event);
        }
      })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [id, reset]);

  const onSubmit = async (data) => {
    try {
      const formattedData = {
        ...data,
        ticket_price: parseFloat(data.ticket_price || 0),
        capacity: parseInt(data.capacity || 100, 10)
      };

      const res = await eventService.updateEvent(id, formattedData);
      if (res.success) {
        toast.success('Event updated successfully!');
        navigate('/admin/events');
      }
    } catch (err) {
      toast.error(err.message || 'Update failed');
    }
  };

  const statusOptions = [
    { value: 'registration_open', label: 'Registration Open' },
    { value: 'draft', label: 'Draft Mode' },
    { value: 'published', label: 'Published' },
    { value: 'registration_closed', label: 'Registration Closed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  if (loading) {
    return (
      <div className="py-20 text-center text-white">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-white" />
        <span className="text-xs font-semibold">Loading Event Data...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Link to="/admin/events" className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Events List
      </Link>

      <div className="glass-panel p-8 rounded-3xl border border-zinc-800 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Edit3 className="w-6 h-6 text-white" /> Edit Event
          </h1>
          <p className="text-xs text-zinc-400">Update parameters for {eventTitle}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
          
          <TextInputField
            name="title"
            label="Event Title"
            placeholder="Event Title"
            register={register}
            rules={{ required: 'Title is required' }}
            error={errors.title}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <SelectField
              name="status"
              label="Event Status"
              options={statusOptions}
              register={register}
              error={errors.status}
            />

            <TextInputField
              name="ticket_price"
              label="Price (₹)"
              type="number"
              icon={Ticket}
              register={register}
              rules={{ min: { value: 0, message: 'Price cannot be negative' } }}
              error={errors.ticket_price}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-zinc-300">Description</label>
            <textarea
              rows={3}
              {...register('description')}
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white transition-all"
            ></textarea>
          </div>

          <TextInputField
            name="cover_image_url"
            label="Cover Image Poster URL"
            type="url"
            register={register}
            error={errors.cover_image_url}
          />

          <div className="grid grid-cols-2 gap-4">
            <TextInputField
              name="venue"
              label="Venue Name"
              icon={MapPin}
              register={register}
              rules={{ required: 'Venue is required' }}
              error={errors.venue}
              required
            />

            <TextInputField
              name="capacity"
              label="Total Capacity"
              type="number"
              register={register}
              error={errors.capacity}
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-white text-black font-extrabold text-xs hover:bg-zinc-200 border border-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
