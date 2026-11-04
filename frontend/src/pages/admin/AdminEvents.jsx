import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../../services/serviceModules';
import { useToast } from '../../context/ToastContext';
import { PlusCircle, Edit3, Trash2, Calendar, MapPin, Loader2, Users, Clock, Award, Building } from 'lucide-react';

export const AdminEvents = () => {
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = () => {
    eventService.getEvents()
      .then(res => {
        if (res.success) setEvents(res.events);
      })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  const handleCancelEvent = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this event?')) return;
    try {
      const res = await eventService.deleteEvent(id);
      if (res.success) {
        toast.success('Event status set to cancelled.');
        fetchEvents();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Event Management Portal</h1>
          <p className="text-xs text-zinc-400">Create, publish, monitor ITI events, registration counts & dates</p>
        </div>
        <Link
          to="/admin/events/create"
          className="px-4 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-1.5 hover:bg-zinc-200 border border-white transition-all shadow-md hover:scale-105"
        >
          <PlusCircle className="w-4 h-4" /> Create New Event
        </Link>
      </div>

      {loading ? (
        <div className="py-16 text-center text-white">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-white" />
          <span className="text-xs font-semibold">Loading Events...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((evt) => {
            const confirmedCount = evt.confirmed_registrations || 0;
            const cap = evt.capacity || 100;
            const regPercent = Math.min(100, Math.round((confirmedCount / cap) * 100));

            return (
              <div key={evt.id} className="glass-panel p-6 rounded-3xl border border-white/20 space-y-4 flex flex-col justify-between shadow-xl">
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-black/80 text-white border border-white/20 font-extrabold text-[11px] flex items-center gap-1">
                      {evt.category === 'ITI & Vocational' && <Award className="w-3.5 h-3.5 text-amber-400" />}
                      {evt.category}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-black/80 text-white border border-white/20 font-mono text-[11px] font-extrabold capitalize">
                      {evt.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-start gap-4">
                    <img src={evt.cover_image_url} alt={evt.title} className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-white/30 shadow-md" />
                    <div className="space-y-1">
                      <h3 className="text-base font-black text-white line-clamp-1">{evt.title}</h3>
                      
                      <div className="text-xs text-stone-200 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-white shrink-0" />
                          <span>Main Date: {evt.event_date} ({evt.start_time})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                          <span className="line-clamp-1">{evt.venue}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ITI Specific Details Banner in Black Box */}
                  {(evt.iti_institute || evt.iti_trade) && (
                    <div className="p-3 rounded-2xl bg-black/80 text-white border border-white/20 text-[11px] space-y-1 shadow-sm">
                      {evt.iti_institute && (
                        <div className="text-white font-bold flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="line-clamp-1">{evt.iti_institute}</span>
                        </div>
                      )}
                      {evt.iti_trade && (
                        <div className="text-stone-300 line-clamp-1">
                          Trades: <strong className="text-white font-semibold">{evt.iti_trade}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Registration Window Dates in Black Box */}
                  <div className="p-3 rounded-2xl bg-black/80 text-white border border-white/20 flex items-center justify-between text-[11px] font-bold shadow-sm">
                    <span className="flex items-center gap-1 font-mono text-white">
                      <Clock className="w-3.5 h-3.5 text-white" /> Reg Period:
                    </span>
                    <span className="font-extrabold text-white">
                      {evt.registration_open_at ? new Date(evt.registration_open_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Open'}
                      {' - '}
                      {evt.registration_close_at ? new Date(evt.registration_close_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Open'}
                    </span>
                  </div>

                  {/* Registration Count Bar */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between text-stone-100 text-[11px] font-semibold">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-white" /> Registration Count:
                      </span>
                      <span className="font-extrabold text-white font-mono">
                        {confirmedCount} / {cap} ({regPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-black/80 h-2.5 rounded-full overflow-hidden p-0.5 border border-white/20">
                      <div
                        className="bg-white h-full rounded-full transition-all duration-300"
                        style={{ width: `${regPercent}%` }}
                      ></div>
                    </div>
                  </div>

                </div>

                <div className="pt-3 border-t border-white/20 flex items-center justify-between text-xs">
                  <span className="text-stone-200">Price: <strong className="text-white font-bold">{Number(evt.ticket_price) === 0 ? 'FREE' : `₹${evt.ticket_price}`}</strong></span>
                  <span className="text-stone-200">Seats Left: <strong className="text-white font-bold">{evt.seats_remaining}</strong></span>
                  
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin/events/${evt.id}`}
                      className="p-2 rounded-xl bg-black/80 hover:bg-white text-white hover:text-black border border-white/20 font-bold transition-all"
                      title="Edit Event"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleCancelEvent(evt.id)}
                      className="p-2 rounded-xl bg-black/80 hover:bg-white text-white hover:text-black border border-white/20 font-bold transition-all"
                      title="Cancel Event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
