import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/serviceModules';
import { useToast } from '../../context/ToastContext';
import { Download, Search, Loader2 } from 'lucide-react';

export const AdminRegistrations = () => {
  const toast = useToast();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminService.getAllRegistrations()
      .then(res => {
        if (res.success) setRegistrations(res.registrations);
      })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleExportCSV = () => {
    window.open(adminService.exportRegistrationsCSV(), '_blank');
  };

  const filtered = registrations.filter(r => 
    r.guest_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.guest_email?.toLowerCase().includes(search.toLowerCase()) ||
    r.registration_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">All Guest Registrations</h1>
          <p className="text-xs text-zinc-400">Complete attendee records & pass status</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-xl bg-white text-black font-bold text-xs flex items-center gap-2 hover:bg-zinc-200 border border-white"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl">
        <div className="relative max-w-sm">
          <input
            type="text"
            placeholder="Search by name, email, registration #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
          />
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-white">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-white" />
          <span className="text-xs font-semibold">Loading Registrations...</span>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-black text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="p-3.5">Registration #</th>
                  <th className="p-3.5">Guest Name</th>
                  <th className="p-3.5">Email / Phone</th>
                  <th className="p-3.5">Event</th>
                  <th className="p-3.5">Payment</th>
                  <th className="p-3.5">Ticket #</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-900/60">
                    <td className="p-3.5 font-mono text-white font-bold">{r.registration_number}</td>
                    <td className="p-3.5 font-semibold text-white">{r.guest_name}</td>
                    <td className="p-3.5 text-zinc-400">
                      <div>{r.guest_email}</div>
                      <div className="text-[10px]">{r.guest_phone}</div>
                    </td>
                    <td className="p-3.5 font-medium">{r.event_title || r.event?.title}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        (r.payment_status || r.payment?.status) === 'paid' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {r.payment_status || r.payment?.status || r.registration_status}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-zinc-400">{r.ticket_number || r.ticket?.ticket_number || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
