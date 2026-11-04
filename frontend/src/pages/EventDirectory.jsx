import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../services/serviceModules';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Search, Ticket, Users, Clock, Award, Building, PlusCircle } from 'lucide-react';

export const EventDirectory = () => {
  const { isAdmin } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    fetchEvents();
  }, [category]);

  const fetchEvents = () => {
    setLoading(true);
    const params = {};
    if (category !== 'All') params.category = category;
    if (search) params.search = search;

    eventService.getEvents(params)
      .then(res => {
        if (res.success) setEvents(res.events);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  const categories = ['All', 'ITI & Vocational', 'Technology', 'Music', 'Business', 'Education'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2 text-center sm:text-left">
          <span className="text-xs font-semibold text-[#8EB69B] uppercase tracking-widest">Public Catalog</span>
          <h1 className="text-3xl sm:text-4xl font-black text-[#DAF1DE] tracking-tight">Explore Upcoming Events & ITI Fairs</h1>
          <p className="text-xs text-[#8EB69B] max-w-2xl leading-relaxed">
            Browse through ITI vocational trade expos, technology summits, music festivals, and hands-on workshops with instant QR admissions.
          </p>
        </div>

        {isAdmin && (
          <Link
            to="/admin/events/create"
            className="px-4 py-2.5 rounded-xl bg-[#DAF1DE] text-[#051F20] font-extrabold text-xs flex items-center gap-1.5 hover:bg-[#8EB69B] border border-[#DAF1DE] transition-all shadow-md shrink-0 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4 text-[#051F20]" /> Create Event as Admin
          </Link>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#0B2B26]/90 border border-[#163832] p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg backdrop-blur-md">
        
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                category === cat
                  ? 'bg-[#DAF1DE] text-[#051F20] border border-[#DAF1DE] font-bold shadow-sm'
                  : 'bg-[#051F20] text-[#8EB69B] hover:text-[#DAF1DE] border border-[#163832] hover:border-[#8EB69B]'
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
            className="w-full bg-[#051F20] border border-[#163832] rounded-xl pl-10 pr-4 py-2 text-xs text-[#DAF1DE] placeholder-[#8EB69B]/60 focus:outline-none focus:border-[#8EB69B] transition-colors"
          />
          <Search className="w-4 h-4 text-[#8EB69B] absolute left-3 top-2.5" />
        </form>
      </div>

      {/* Events Production Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="h-96 rounded-2xl bg-[#0B2B26] animate-pulse border border-[#163832]"></div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-[#0B2B26]/80 border border-[#163832] rounded-2xl p-12 text-center space-y-3">
          <Ticket className="w-12 h-12 text-[#8EB69B]/40 mx-auto" />
          <h3 className="text-lg font-bold text-[#DAF1DE]">No Events Found</h3>
          <p className="text-xs text-[#8EB69B]">Try adjusting your search criteria or category filter.</p>
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
                className="group bg-[#0B2B26]/85 border border-[#163832] hover:border-[#DAF1DE]/60 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col shadow-xl backdrop-blur-sm"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={evt.cover_image_url}
                    alt={evt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#051F20] via-transparent to-transparent"></div>
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[#051F20]/90 text-[#DAF1DE] font-extrabold text-[11px] flex items-center gap-1 border border-[#163832]">
                    {evt.category === 'ITI & Vocational' && <Award className="w-3.5 h-3.5 text-[#DAF1DE]" />}
                    {evt.category}
                  </span>
                  <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-[#DAF1DE] text-[#051F20] font-black text-xs border border-[#DAF1DE] shadow-sm">
                    {Number(evt.ticket_price) === 0 ? 'FREE ENTRY' : `₹${evt.ticket_price}`}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#8EB69B] font-semibold flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#DAF1DE]" /> Registered: <strong className="text-[#DAF1DE] font-mono">{confirmedCount}</strong>
                      </span>
                      <span className={`font-extrabold ${evt.seats_remaining > 0 ? 'text-[#DAF1DE]' : 'text-rose-400'}`}>
                        {evt.seats_remaining > 0 ? `${evt.seats_remaining} seats left` : 'SOLD OUT'}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-[#DAF1DE] group-hover:text-white transition-colors line-clamp-1">
                      {evt.title}
                    </h3>
                    
                    <p className="text-xs text-[#8EB69B] line-clamp-2 font-normal leading-relaxed">
                      {evt.description}
                    </p>

                    {/* ITI Specific Details */}
                    {(evt.iti_institute || evt.iti_trade) && (
                      <div className="py-2 px-3 bg-[#051F20] text-[#DAF1DE] rounded-xl border border-[#163832] text-[11px] space-y-1 shadow-sm">
                        {evt.iti_institute && (
                          <div className="text-[#DAF1DE] font-extrabold flex items-center gap-1 line-clamp-1">
                            <Building className="w-3.5 h-3.5 text-[#8EB69B] shrink-0" />
                            <span>{evt.iti_institute}</span>
                          </div>
                        )}
                        {evt.iti_trade && (
                          <div className="text-[#8EB69B] line-clamp-1 text-[10px]">
                            Trades: <span className="text-[#DAF1DE] font-semibold">{evt.iti_trade}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-xs text-[#8EB69B] pt-3 border-t border-[#163832]">
                    {regOpen && regClose && (
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-[#DAF1DE]">
                        <Clock className="w-3.5 h-3.5 text-[#8EB69B] shrink-0" />
                        <span>Reg Window: {regOpen} - {regClose}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#8EB69B] shrink-0" />
                      <span>Event Date: {new Date(evt.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {evt.start_time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#8EB69B] shrink-0" />
                      <span className="line-clamp-1">{evt.venue}</span>
                    </div>
                  </div>

                  <Link
                    to={`/events/${evt.id}`}
                    className="block text-center py-2.5 rounded-xl bg-[#DAF1DE] hover:bg-[#8EB69B] text-[#051F20] font-extrabold text-xs border border-[#DAF1DE] transition-all duration-200 shadow-sm"
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
