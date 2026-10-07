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
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Public Catalog</span>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Explore Upcoming Events & ITI Fairs</h1>
          <p className="text-xs text-zinc-400 max-w-2xl">
            Browse through ITI vocational trade expos, technology summits, music festivals, and workshops.
          </p>
        </div>

        {isAdmin && (
          <Link
            to="/admin/events/create"
            className="px-4 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-1.5 hover:bg-zinc-200 border border-white transition-all shadow-md shrink-0 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" /> Create Event as Admin
          </Link>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                category === cat
                  ? 'bg-white text-black border border-white'
                  : 'bg-black text-zinc-400 hover:text-white border border-zinc-800'
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
            className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-colors"
          />
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
        </form>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="h-96 rounded-2xl bg-zinc-900 animate-pulse border border-zinc-800"></div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-12 text-center space-y-3">
          <Ticket className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Events Found</h3>
          <p className="text-xs text-zinc-400">Try adjusting your search criteria or category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {events.map((evt) => {
            const confirmedCount = evt.confirmed_registrations || 0;
            const regOpen = evt.registration_open_at ? new Date(evt.registration_open_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;
            const regClose = evt.registration_close_at ? new Date(evt.registration_close_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;

            return (
              <div
                key={evt.id}
                className="group bg-zinc-950 border border-zinc-800 hover:border-white rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={evt.cover_image_url}
                    alt={evt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 grayscale group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-zinc-700 text-white font-bold text-[11px] flex items-center gap-1">
                    {evt.category === 'ITI & Vocational' && <Award className="w-3.5 h-3.5 text-amber-400" />}
                    {evt.category}
                  </span>
                  <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-white text-black font-extrabold text-xs">
                    {Number(evt.ticket_price) === 0 ? 'FREE ENTRY' : `₹${evt.ticket_price}`}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-300 font-medium flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-white" /> Registered: <strong className="text-white font-mono">{confirmedCount}</strong>
                      </span>
                      <span className={`font-semibold ${evt.seats_remaining > 0 ? 'text-white' : 'text-zinc-500'}`}>
                        {evt.seats_remaining > 0 ? `${evt.seats_remaining} seats left` : 'SOLD OUT'}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-zinc-300 transition-colors line-clamp-1">
                      {evt.title}
                    </h3>
                    
                    <p className="text-xs text-zinc-400 line-clamp-2">
                      {evt.description}
                    </p>

                    {/* ITI Specific Details if present */}
                    {(evt.iti_institute || evt.iti_trade) && (
                      <div className="pt-1.5 pb-1 px-2.5 bg-black/60 rounded-xl border border-zinc-800 text-[11px] space-y-1">
                        {evt.iti_institute && (
                          <div className="text-zinc-300 font-medium flex items-center gap-1 line-clamp-1">
                            <Building className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{evt.iti_institute}</span>
                          </div>
                        )}
                        {evt.iti_trade && (
                          <div className="text-zinc-400 line-clamp-1 text-[10px]">
                            Trades: <span className="text-zinc-200">{evt.iti_trade}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-xs text-zinc-400 pt-3 border-t border-zinc-800">
                    {regOpen && regClose && (
                      <div className="flex items-center gap-2 text-[11px] text-zinc-300">
                        <Clock className="w-3.5 h-3.5 text-white shrink-0" />
                        <span>Reg Window: {regOpen} - {regClose}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-white shrink-0" />
                      <span>Event Date: {new Date(evt.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {evt.start_time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span className="line-clamp-1">{evt.venue}</span>
                    </div>
                  </div>

                  <Link
                    to={`/events/${evt.id}`}
                    className="block text-center py-2.5 rounded-xl bg-zinc-900 hover:bg-white hover:text-black text-white font-semibold text-xs border border-zinc-800 hover:border-white transition-all duration-200"
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
