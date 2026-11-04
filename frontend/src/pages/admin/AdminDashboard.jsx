import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/serviceModules';
import { 
  Calendar, Users, CheckSquare, Sparkles, DollarSign, Loader2, TrendingUp, PlusCircle 
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
      <div className="py-20 text-center text-[#DAF1DE]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#DAF1DE]" />
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1E394E]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#E5F4F9] flex items-center gap-2">
            Admin Overview & Management
          </h1>
          <p className="text-xs text-[#95B8C9]">Monitor event performance, revenue, guest registrations, and entry scans</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/events/create"
            className="px-4 py-2.5 rounded-xl bg-[#E5F4F9] text-[#0B1928] font-extrabold text-xs flex items-center gap-2 hover:bg-[#C3E2ED] border border-[#E5F4F9] transition-all shadow-md hover:scale-105"
          >
            <PlusCircle className="w-4 h-4 text-[#0B1928]" /> Create Event
          </Link>
        </div>
      </div>

      {/* Top Stat Cards Production Grid with Woven Canvas Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="texture-card p-6 rounded-3xl border border-[#2B4E66] space-y-2 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between text-[#95B8C9] text-xs font-semibold">
            <span>Total Revenue</span>
            <div className="p-2 rounded-xl bg-[#E5F4F9] text-[#0B1928] shadow-sm"><DollarSign className="w-4 h-4" /></div>
          </div>
          <div className="text-3xl font-black text-[#E5F4F9]">₹{stats.totalRevenue?.toLocaleString()}</div>
          <div className="text-[11px] text-[#95B8C9] font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-[#4A96BA]" /> Razorpay Confirmed Payments
          </div>
        </div>

        <div className="bg-[#122538]/85 p-6 rounded-3xl border border-[#1E394E] space-y-2 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between text-[#95B8C9] text-xs font-semibold">
            <span>Total Registrations</span>
            <div className="p-2 rounded-xl bg-[#E5F4F9] text-[#0B1928] shadow-sm"><Users className="w-4 h-4" /></div>
          </div>
          <div className="text-3xl font-black text-[#E5F4F9]">{stats.totalRegistrations}</div>
          <div className="text-[11px] text-[#95B8C9] font-semibold">
            {stats.confirmedPayments} Confirmed Passes
          </div>
        </div>

        <div className="bg-[#122538]/85 p-6 rounded-3xl border border-[#1E394E] space-y-2 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between text-[#95B8C9] text-xs font-semibold">
            <span>Checked-In Guests</span>
            <div className="p-2 rounded-xl bg-[#E5F4F9] text-[#0B1928] shadow-sm"><CheckSquare className="w-4 h-4" /></div>
          </div>
          <div className="text-3xl font-black text-[#E5F4F9]">{stats.checkedInCount}</div>
          <div className="text-[11px] text-[#95B8C9] font-semibold">
            Attendance Rate: {attendanceRate}%
          </div>
        </div>

        <div className="bg-[#122538]/85 p-6 rounded-3xl border border-[#1E394E] space-y-2 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between text-[#95B8C9] text-xs font-semibold">
            <span>Total Events</span>
            <div className="p-2 rounded-xl bg-[#E5F4F9] text-[#0B1928] shadow-sm"><Calendar className="w-4 h-4" /></div>
          </div>
          <div className="text-3xl font-black text-[#E5F4F9]">{stats.totalEvents}</div>
          <div className="text-[11px] text-[#95B8C9] font-semibold">
            {stats.upcomingEvents} Active / Open
          </div>
        </div>

      </div>

      {/* Visual Analytics Progress Bar */}
      <div className="bg-[#122538]/85 p-6 rounded-3xl border border-[#1E394E] space-y-4 shadow-xl backdrop-blur-sm">
        <h3 className="text-base font-bold text-[#E5F4F9] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#4A96BA]" /> Attendance Utilization Rate
        </h3>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-[#95B8C9] font-semibold">
            <span>Checked In: <strong className="text-[#E5F4F9]">{stats.checkedInCount}</strong> / Registered: <strong className="text-[#E5F4F9]">{stats.totalRegistrations}</strong></span>
            <span className="text-[#E5F4F9] font-bold">{attendanceRate}%</span>
          </div>
          <div className="w-full bg-[#0B1928] h-3.5 rounded-full overflow-hidden p-0.5 border border-[#1E394E]">
            <div
              className="bg-[#4A96BA] h-full rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${Math.min(100, attendanceRate)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Recent Registrations Grid / Table */}
      <div className="bg-[#122538]/85 rounded-3xl border border-[#1E394E] p-6 space-y-4 shadow-xl backdrop-blur-sm">
        <h3 className="text-base font-bold text-[#E5F4F9]">Recent Guest Registrations</h3>
        
        <div className="overflow-x-auto rounded-xl border border-[#1E394E]">
          <table className="w-full text-left text-xs text-[#E5F4F9]">
            <thead className="bg-[#0B1928] text-[#95B8C9] uppercase text-[10px] tracking-wider border-b border-[#1E394E]">
              <tr>
                <th className="p-3">Registration #</th>
                <th className="p-3">Guest Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Event</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E394E] bg-[#122538]/50">
              {stats.recentRegistrations?.map((r) => (
                <tr key={r.id} className="hover:bg-[#1E394E]/50 transition-colors">
                  <td className="p-3 font-mono text-[#E5F4F9] font-bold">{r.registration_number}</td>
                  <td className="p-3 font-medium text-white">{r.guest_name}</td>
                  <td className="p-3 text-[#95B8C9]">{r.guest_email}</td>
                  <td className="p-3 text-[#95B8C9]">{r.event_title}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                      r.registration_status === 'confirmed' ? 'bg-[#E5F4F9] text-[#0B1928]' : 'bg-[#1E394E] text-[#95B8C9]'
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
