import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/serviceModules';
import { useToast } from '../../context/ToastContext';
import { Loader2 } from 'lucide-react';

export const AdminAttendance = () => {
  const toast = useToast();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getAllAttendance()
      .then(res => {
        if (res.success) setAttendance(res.attendance);
      })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Live Gate Attendance Records</h1>
        <p className="text-xs text-zinc-400">Scanned ticket timestamps, gate device logs, and check-in statuses</p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-white">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-white" />
          <span className="text-xs font-semibold">Loading Gate Scan Records...</span>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-black text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="p-3.5">Checked-In Timestamp</th>
                  <th className="p-3.5">Guest Name</th>
                  <th className="p-3.5">Ticket #</th>
                  <th className="p-3.5">Event</th>
                  <th className="p-3.5">Device Info</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {attendance.map((a) => (
                  <tr key={a.id} className="hover:bg-zinc-900/60">
                    <td className="p-3.5 font-mono text-white font-semibold">
                      {new Date(a.checked_in_at).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-bold text-white">{a.guest_name || a.registration?.guest_name}</td>
                    <td className="p-3.5 font-mono text-white font-bold">{a.ticket_number || a.ticket?.ticket_number}</td>
                    <td className="p-3.5 font-medium">{a.event_title || a.event?.title}</td>
                    <td className="p-3.5 text-zinc-400">{a.device_info || 'Gate Camera'}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full bg-white text-black font-bold text-[10px] uppercase">
                        {a.status}
                      </span>
                    </td>
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
