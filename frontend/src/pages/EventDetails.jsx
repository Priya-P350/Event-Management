import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { eventService } from '../services/serviceModules';
import { CountdownTimer } from '../components/CountdownTimer';
import { 
  Calendar, MapPin, ExternalLink, Ticket, Users, 
  ShieldCheck, AlertCircle, ArrowLeft, CheckCircle2, Image as ImageIcon,
  Award, Building, Clock, Check
} from 'lucide-react';

export const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    eventService.getEventById(id)
      .then(res => {
        if (res.success) setEvent(res.event);
        else setError('Event not found');
      })
      .catch(err => setError(err.message || 'Failed to load event details'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm font-semibold text-zinc-400">Loading Event Details...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-white mx-auto" />
        <h2 className="text-2xl font-bold text-white">Event Not Found</h2>
        <p className="text-xs text-zinc-400">{error || 'The requested event could not be found.'}</p>
        <Link to="/events" className="inline-block px-6 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-semibold text-xs">
          Back to Events Catalog
        </Link>
      </div>
    );
  }

  const isSoldOut = event.seats_remaining <= 0;
  const isClosed = event.status === 'registration_closed' || event.status === 'completed' || event.status === 'cancelled';
  const canRegister = !isSoldOut && !isClosed;

  const confirmedCount = event.confirmed_registrations || 0;
  const totalCap = event.capacity || 100;
  const regPercentage = Math.min(100, Math.round((confirmedCount / totalCap) * 100));

  const hasItiDetails = event.category === 'ITI & Vocational' || event.iti_institute || event.iti_trade || event.iti_eligibility;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Back Button */}
      <Link to="/events" className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to All Events
      </Link>

      {/* Main Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left 2 Cols: Poster & Event Info */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Banner Image */}
          <div className="relative rounded-3xl overflow-hidden border border-zinc-800 h-80 sm:h-96">
            <img
              src={event.cover_image_url}
              alt={event.title}
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"></div>
            
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-zinc-700 text-white font-bold text-xs flex items-center gap-1">
                {event.category === 'ITI & Vocational' && <Award className="w-4 h-4 text-amber-400" />}
                {event.category}
              </span>
              <span className={`px-3 py-1 rounded-full text-black font-bold text-xs uppercase tracking-wider ${
                event.status === 'registration_open' ? 'bg-white' : 'bg-zinc-800 text-white'
              }`}>
                {event.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* ITI Specific Details Banner Card */}
          {hasItiDetails && (
            <div className="glass-panel p-6 rounded-2xl border border-zinc-800 space-y-4 bg-zinc-950/90">
              <div className="flex items-center gap-2 text-white font-black text-sm uppercase tracking-wider">
                <Award className="w-5 h-5 text-amber-400" /> ITI & Vocational Training Program Details
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {event.iti_institute && (
                  <div className="p-3.5 rounded-xl bg-black border border-zinc-800 space-y-1">
                    <span className="text-[10px] text-zinc-400 font-semibold uppercase block flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-amber-400" /> Institute / College
                    </span>
                    <span className="text-white font-bold block">{event.iti_institute}</span>
                  </div>
                )}

                {event.iti_eligibility && (
                  <div className="p-3.5 rounded-xl bg-black border border-zinc-800 space-y-1">
                    <span className="text-[10px] text-zinc-400 font-semibold uppercase block flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Eligibility / Qualification
                    </span>
                    <span className="text-white font-bold block">{event.iti_eligibility}</span>
                  </div>
                )}
              </div>

              {event.iti_trade && (
                <div className="p-3.5 rounded-xl bg-black border border-zinc-800 space-y-2 text-xs">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase block">
                    🛠️ Eligible ITI Trades & Specializations
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {event.iti_trade.split(',').map((t, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-semibold text-[11px]">
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Title & Description */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              {event.title}
            </h1>
            <p className="text-zinc-300 text-base leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Rules & Guidelines */}
          <div className="glass-panel p-6 rounded-2xl border border-zinc-800 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-white" /> Event Rules & Entry Guidelines
            </h3>
            <ul className="space-y-2 text-xs text-zinc-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
                <span>Present your digital QR pass from email or guest dashboard at the entrance scanner.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
                <span>Each QR ticket is valid for one-time check-in only. Re-entry requires staff authorization.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
                <span>Please arrive at least 30 minutes before the scheduled start time ({event.start_time}).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
                <span>Valid government-issued photo ID is required alongside your QR ticket.</span>
              </li>
            </ul>
          </div>

          {/* Gallery Section */}
          {event.gallery && event.gallery.length > 0 && (
            <div className="space-y-4 pt-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-white" /> Event Photo Highlights
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {event.gallery.map((img) => (
                  <div key={img.id} className="relative h-48 rounded-xl overflow-hidden border border-zinc-800 group">
                    <img src={img.image_url} alt={img.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform grayscale group-hover:grayscale-0" />
                    {img.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-black/80 backdrop-blur-sm p-2 text-[11px] text-zinc-300">
                        {img.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right 1 Col: Registration & Countdown Sidebar */}
        <div className="space-y-6">
          
          <div className="glass-panel p-6 rounded-3xl border border-zinc-800 space-y-6 sticky top-28">
            
            {/* Live Countdown */}
            <div className="p-4 bg-black border border-zinc-800 rounded-2xl">
              <CountdownTimer targetDate={event.event_date} startTime={event.start_time} />
            </div>

            {/* Registration Progress & Live Count */}
            <div className="p-4 rounded-2xl bg-black border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1 font-semibold text-white">
                  <Users className="w-4 h-4 text-white" /> Registration Count
                </span>
                <span className="font-mono font-bold text-white">{confirmedCount} / {totalCap}</span>
              </div>
              <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                <div
                  className="bg-white h-full rounded-full transition-all duration-500"
                  style={{ width: `${regPercentage}%` }}
                ></div>
              </div>
              <div className="text-[10px] text-zinc-400 text-right font-mono">
                {event.seats_remaining} seats remaining ({regPercentage}% capacity filled)
              </div>
            </div>

            {/* Price & Seats */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Ticket Price</span>
                <span className="text-3xl font-extrabold text-white">
                  {Number(event.ticket_price) === 0 ? 'FREE' : `₹${event.ticket_price}`}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Availability</span>
                <span className={`text-sm font-bold ${isSoldOut ? 'text-zinc-500' : 'text-white'}`}>
                  {isSoldOut ? 'SOLD OUT' : `${event.seats_remaining} / ${event.capacity} left`}
                </span>
              </div>
            </div>

            {/* Registration Dates Window */}
            {(event.registration_open_at || event.registration_close_at) && (
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1 text-xs">
                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-white" /> Registration Window
                </span>
                <div className="text-white font-semibold flex items-center justify-between text-[11px] pt-1">
                  <span>Start: {event.registration_open_at ? new Date(event.registration_open_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Open'}</span>
                  <span>Ends: {event.registration_close_at ? new Date(event.registration_close_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Open'}</span>
                </div>
              </div>
            )}

            {/* Event Key Meta */}
            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-white shrink-0 mt-0.5" />
                <div>
                  <span className="block font-semibold text-white">Date & Time</span>
                  <span className="text-zinc-400">
                    {new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="block text-zinc-400 font-mono mt-0.5">{event.start_time} - {event.end_time}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block font-semibold text-white">Venue Location</span>
                  <span className="text-zinc-300 font-medium">{event.venue}</span>
                  <span className="block text-zinc-400 mt-0.5">{event.address}</span>
                  {event.google_maps_url && (
                    <a
                      href={event.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-white hover:underline mt-1 font-semibold"
                    >
                      View on Google Maps <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* CTA Button */}
            {canRegister ? (
              <Link
                to={`/register/${event.id}`}
                className="block w-full py-4 rounded-xl bg-white text-black font-extrabold text-center text-sm hover:bg-zinc-200 border border-white hover:scale-[1.02] transition-all duration-200"
              >
                {Number(event.ticket_price) === 0 ? 'Register Now — Free Entry' : `Register Now — ₹${event.ticket_price}`}
              </Link>
            ) : isSoldOut ? (
              <button disabled className="w-full py-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 font-bold text-center text-sm cursor-not-allowed">
                SOLD OUT
              </button>
            ) : (
              <button disabled className="w-full py-4 rounded-xl bg-zinc-900 text-zinc-500 font-bold text-center text-sm cursor-not-allowed">
                REGISTRATION CLOSED
              </button>
            )}

            <div className="text-[11px] text-zinc-400 text-center flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
              100% Guaranteed Entry with Verified QR Token
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
