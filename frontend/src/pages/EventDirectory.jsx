import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../services/serviceModules';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, MapPin, Search, Ticket, 
  PlusCircle, Award, Users, Building, Clock, Waves 
} from 'lucide-react';

export const EventDirectory = () => {
  const { isAdmin } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const fetchEvents = () => {
    setLoading(true);
    const params = { status: 'registration_open' };
    if (category !== 'All') params.category = category;
    if (search.trim()) params.search = search.trim();

    eventService.getEvents(params)
      .then(res => {
        if (res.success) setEvents(res.events);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, [category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  const categories = ['All', 'ITI & Vocational', 'Technology', 'Music', 'Business', 'Education'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 relative z-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[#38bdf8] text-xs font-semibold uppercase tracking-widest">
            <Waves className="w-3.5 h-3.5 text-[#38bdf8]" /> Oceanic Catalog
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#e0f2fe] tracking-tight">Explore Upcoming Events & ITI Fairs</h1>
          <p className="text-xs text-[#94b8d6] max-w-2xl leading-relaxed">
            Browse through ITI vocational trade expos, technology summits, music festivals, and hands-on workshops with instant QR admissions.
          </p>
        </div>

        {isAdmin && (
          <Link
            to="/admin/events/create"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00f2fe] to-[#0284c7] text-[#020817] font-extrabold text-xs flex items-center gap-1.5 hover:from-[#38bdf8] hover:to-[#00f2fe] border border-[#38bdf8] transition-all shadow-[0_0_15px_rgba(0,242,254,0.35)] shrink-0 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4 text-[#020817]" /> Create Event as Admin
          </Link>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#041124]/90 border border-cyan-500/25 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl backdrop-blur-md">
        
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                category === cat
                  ? 'bg-gradient-to-r from-[#00f2fe] to-[#0284c7] text-[#020817] font-extrabold shadow-[0_0_15px_rgba(0,242,254,0.35)]'
                  : 'bg-[#020817] text-[#94b8d6] hover:text-[#e0f2fe] border border-cyan-500/20 hover:border-cyan-400/50'
              }`}
            >
              {cat === 'ITI & Vocational' ? '🛠️ ITI & Vocational' : cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search ITI trades, events, venues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#020817] border border-cyan-500/25 rounded-xl pl-10 pr-4 py-2 text-xs text-[#e0f2fe] placeholder-[#94b8d6]/60 focus:outline-none focus:border-cyan-400 transition-colors"
          />
          <Search className="w-4 h-4 text-[#38bdf8] absolute left-3 top-2.5" />
        </form>
      </div>

      {/* Events Production Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="h-96 rounded-2xl bg-[#041124] animate-pulse border border-cyan-500/20"></div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-[#041124]/80 border border-cyan-500/20 rounded-2xl p-12 text-center space-y-3">
          <Ticket className="w-12 h-12 text-cyan-400/40 mx-auto" />
          <h3 className="text-lg font-bold text-[#e0f2fe]">No Events Found</h3>
          <p className="text-xs text-[#94b8d6]">Try adjusting your search criteria or category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((evt) => {
            const confirmedCount = evt.confirmed_registrations || 0;
            const regOpen = evt.registration_open_at ? new Date(evt.registration_open_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;
            const regClose = evt.registration_close_at ? new Date(evt.registration_close_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;

            return (
              <div
                key={evt.id}
                className="group bg-[#041124]/85 border border-cyan-500/20 hover:border-cyan-400/60 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col shadow-xl hover:shadow-[0_10px_30px_rgba(0,242,254,0.15)] backdrop-blur-sm"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={evt.cover_image_url}
                    alt={evt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-transparent to-transparent"></div>
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[#020817]/90 text-[#e0f2fe] font-extrabold text-[11px] flex items-center gap-1 border border-cyan-500/30">
                    {evt.category === 'ITI & Vocational' && <Award className="w-3.5 h-3.5 text-[#38bdf8]" />}
                    {evt.category}
                  </span>
                  <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#00f2fe] to-[#0284c7] text-[#020817] font-black text-xs border border-[#38bdf8] shadow-[0_0_12px_rgba(0,242,254,0.4)]">
                    {Number(evt.ticket_price) === 0 ? 'FREE ENTRY' : `₹${evt.ticket_price}`}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#94b8d6] font-semibold flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#38bdf8]" /> Registered: <strong className="text-[#e0f2fe] font-mono">{confirmedCount}</strong>
                      </span>
                      <span className={`font-extrabold ${evt.seats_remaining > 0 ? 'text-[#38bdf8]' : 'text-rose-400'}`}>
                        {evt.seats_remaining > 0 ? `${evt.seats_remaining} seats left` : 'SOLD OUT'}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-[#e0f2fe] group-hover:text-white transition-colors line-clamp-1">
                      {evt.title}
                    </h3>
                    
                    <p className="text-xs text-[#94b8d6] line-clamp-2 font-normal leading-relaxed">
                      {evt.description}
                    </p>

                    {/* ITI Specific Details */}
                    {(evt.iti_institute || evt.iti_trade) && (
                      <div className="py-2 px-3 bg-[#020817] text-[#e0f2fe] rounded-xl border border-cyan-500/20 text-[11px] space-y-1 shadow-sm">
                        {evt.iti_institute && (
                          <div className="text-[#e0f2fe] font-extrabold flex items-center gap-1 line-clamp-1">
                            <Building className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                            <span>{evt.iti_institute}</span>
                          </div>
                        )}
                        {evt.iti_trade && (
                          <div className="text-[#94b8d6] line-clamp-1 text-[10px]">
                            Trades: <span className="text-[#38bdf8] font-semibold">{evt.iti_trade}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-xs text-[#94b8d6] pt-3 border-t border-cyan-500/20">
                    {regOpen && regClose && (
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-[#e0f2fe]">
                        <Clock className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                        <span>Reg Window: {regOpen} - {regClose}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#38bdf8] shrink-0" />
                      <span>Event Date: {new Date(evt.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {evt.start_time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#38bdf8] shrink-0" />
                      <span className="line-clamp-1">{evt.venue}</span>
                    </div>
                  </div>

                  <Link
                    to={`/events/${evt.id}`}
                    className="block text-center py-2.5 rounded-xl bg-gradient-to-r from-[#00f2fe] to-[#0284c7] hover:from-[#38bdf8] hover:to-[#00f2fe] text-[#020817] font-extrabold text-xs border border-[#38bdf8] transition-all duration-200 shadow-[0_0_15px_rgba(0,242,254,0.35)]"
                  >
                    View Details & Register
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
