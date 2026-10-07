import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/serviceModules';
import { 
  Calendar, Users, CheckSquare, Sparkles, DollarSign, Loader2, TrendingUp, PlusCircle, Award 
} from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getDashboardStats()
      .then(res => {
        if (res.success) setStats(res.stats);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-white">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-white" />
        <span className="text-xs font-semibold">Loading Admin Dashboard Analytics...</span>
      </div>
    );
  }

  if (!stats) return null;

  const attendanceRate = stats.totalRegistrations > 0 
    ? Math.round((stats.checkedInCount / stats.totalRegistrations) * 100) 
    : 0;

  return (
    <div className="space-y-8">
      
      {/* Header with Create Event Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            Admin Overview & Management
          </h1>
          <p className="text-xs text-zinc-400">Monitor event performance, revenue, guest registrations, and entry scans</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/events/create"
            className="px-4 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-2 hover:bg-zinc-200 border border-white transition-all shadow-lg hover:scale-105"
          >
            <PlusCircle className="w-4 h-4 text-black" /> Create Event
          </Link>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="glass-panel p-6 rounded-3xl border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>Total Revenue</span>
            <div className="p-2 rounded-xl bg-white text-black"><DollarSign className="w-4 h-4" /></div>
          </div>
          <div className="text-3xl font-black text-white">₹{stats.totalRevenue?.toLocaleString()}</div>
          <div className="text-[11px] text-zinc-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-white" /> Razorpay Confirmed Payments
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>Total Registrations</span>
            <div className="p-2 rounded-xl bg-white text-black"><Users className="w-4 h-4" /></div>
          </div>
          <div className="text-3xl font-black text-white">{stats.totalRegistrations}</div>
          <div className="text-[11px] text-zinc-400 font-semibold">
            {stats.confirmedPayments} Confirmed Passes
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>Checked-In Guests</span>
            <div className="p-2 rounded-xl bg-white text-black"><CheckSquare className="w-4 h-4" /></div>
          </div>
          <div className="text-3xl font-black text-white">{stats.checkedInCount}</div>
          <div className="text-[11px] text-zinc-400 font-semibold">
            Attendance Rate: {attendanceRate}%
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>Total Events</span>
            <div className="p-2 rounded-xl bg-white text-black"><Calendar className="w-4 h-4" /></div>
          </div>
          <div className="text-3xl font-black text-white">{stats.totalEvents}</div>
          <div className="text-[11px] text-zinc-400 font-semibold">
            {stats.upcomingEvents} Active / Open
          </div>
        </div>

      </div>

      {/* Visual Analytics Progress Bar */}
      <div className="glass-panel p-6 rounded-3xl border border-zinc-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-white" /> Attendance Utilization Rate
        </h3>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-300 font-semibold">
            <span>Checked In: {stats.checkedInCount} / Registered: {stats.totalRegistrations}</span>
            <span>{attendanceRate}%</span>
          </div>
          <div className="w-full bg-black h-3 rounded-full overflow-hidden p-0.5 border border-zinc-800">
            <div
              className="bg-white h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, attendanceRate)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Recent Registrations Table */}
      <div className="glass-panel rounded-3xl border border-zinc-800 p-6 space-y-4">
        <h3 className="text-base font-bold text-white">Recent Guest Registrations</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-black text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
              <tr>
                <th className="p-3">Registration #</th>
                <th className="p-3">Guest Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Event</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {stats.recentRegistrations?.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-900/60">
                  <td className="p-3 font-mono text-white font-bold">{r.registration_number}</td>
                  <td className="p-3 font-medium text-white">{r.guest_name}</td>
                  <td className="p-3 text-zinc-400">{r.guest_email}</td>
                  <td className="p-3">{r.event_title}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                      r.registration_status === 'confirmed' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {r.registration_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
