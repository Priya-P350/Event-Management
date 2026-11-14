import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/serviceModules';
import { useToast } from '../../context/ToastContext';
import { Loader2, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

export const AdminAttendance = () => {
  const toast = useToast();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = () => {
    setLoading(true);
    adminService.getAllAttendance()
      .then(res => {
        if (res.success) setAttendance(res.attendance || []);
      })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#e0f2fe]">Live Gate Attendance & Expired Pass Records</h1>
          <p className="text-xs text-[#94b8d6]">Scanned pass timestamps, attendee details, gate scanner logs, and expiration records</p>
        </div>

        <button
          onClick={fetchAttendance}
          className="p-2.5 rounded-xl bg-[#041124] text-[#94b8d6] hover:text-[#e0f2fe] border border-[#0c2c52] hover:border-[#94b8d6] transition-all cursor-pointer self-start sm:self-auto"
          title="Refresh Attendance"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-[#e0f2fe]">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#e0f2fe]" />
          <span className="text-xs font-semibold">Loading Gate Scan Records...</span>
        </div>
      ) : attendance.length === 0 ? (
        <div className="bg-[#041124]/85 rounded-3xl border border-[#0c2c52] p-12 text-center space-y-3">
          <ShieldCheck className="w-12 h-12 text-[#94b8d6]/40 mx-auto" />
          <h3 className="text-base font-bold text-[#e0f2fe]">No Gate Scans Recorded Yet</h3>
          <p className="text-xs text-[#94b8d6]">When Admin scans any attendee or member QR code, the check-in and expiration record will appear here.</p>
        </div>
      ) : (
        <div className="bg-[#041124]/85 rounded-3xl border border-[#0c2c52] overflow-hidden shadow-xl backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#e0f2fe]">
              <thead className="bg-[#020817] text-[#94b8d6] uppercase text-[10px] tracking-wider border-b border-[#0c2c52]">
                <tr>
                  <th className="p-3.5">Scanned & Expired Timestamp</th>
                  <th className="p-3.5">Attendee / Member</th>
                  <th className="p-3.5">Unique ID (On QR)</th>
                  <th className="p-3.5">Pass / Event</th>
                  <th className="p-3.5">Gate Device</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0c2c52] bg-[#041124]/50">
                {attendance.map((a) => {
                  const isExpired = a.status === 'expired' || a.status === 'checked_in';
                  const uniqueId = a.ticket_number || a.ticket?.ticket_number || a.member_id || 'ID-VERIFIED';

                  return (
                    <tr key={a.id} className="hover:bg-[#0c2c52]/50 transition-colors">
                      <td className="p-3.5 font-mono text-[#e0f2fe] font-semibold">
                        {new Date(a.checked_in_at || a.checkedInAt).toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-white">{a.guest_name || a.registration?.guest_name || 'Member'}</div>
                        {a.guest_email && <div className="text-[10px] text-[#94b8d6] font-mono">{a.guest_email}</div>}
                      </td>
                      <td className="p-3.5 font-mono text-[#e0f2fe] font-black">
                        <span className="bg-[#020817] px-2 py-0.5 rounded border border-[#0c2c52]">
                          {uniqueId}
                        </span>
                      </td>
                      <td className="p-3.5 font-medium text-[#94b8d6]">{a.event_title || a.event?.title || 'Member Gate Admission'}</td>
                      <td className="p-3.5 text-[#94b8d6]">{a.device_info || 'Gate Camera'}</td>
                      <td className="p-3.5">
                        {isExpired ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[10px] uppercase border border-rose-500/40 inline-flex items-center gap-1 shadow-sm">
                            <AlertTriangle className="w-3 h-3 text-rose-400" /> EXPIRED
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] uppercase border border-emerald-500/40 inline-flex items-center gap-1 shadow-sm">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {a.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
