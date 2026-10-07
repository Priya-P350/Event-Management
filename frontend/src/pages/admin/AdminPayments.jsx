import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/serviceModules';
import { useToast } from '../../context/ToastContext';
import { Download, Loader2 } from 'lucide-react';

export const AdminPayments = () => {
  const toast = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = () => {
    adminService.getAllPayments()
      .then(res => {
        if (res.success) setPayments(res.payments);
      })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  const handleRefund = async (paymentId) => {
    if (!window.confirm('Are you sure you want to initiate a Razorpay refund for this payment?')) return;
    try {
      const res = await adminService.initiateRefund(paymentId, 'Admin initiated refund');
      if (res.success) {
        toast.success('Refund processed successfully!');
        fetchPayments();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleExportCSV = () => {
    window.open(adminService.exportPaymentsCSV(), '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Razorpay Payment Transactions</h1>
          <p className="text-xs text-zinc-400">Order IDs, payment IDs, signature verification, and refunds</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-xl bg-white text-black font-bold text-xs flex items-center gap-2 hover:bg-zinc-200 border border-white"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-white">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-white" />
          <span className="text-xs font-semibold">Loading Razorpay Records...</span>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-black text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="p-3.5">Order ID</th>
                  <th className="p-3.5">Payment ID</th>
                  <th className="p-3.5">Guest</th>
                  <th className="p-3.5">Event</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-900/60">
                    <td className="p-3.5 font-mono text-white font-bold">{p.razorpay_order_id}</td>
                    <td className="p-3.5 font-mono text-zinc-400">{p.razorpay_payment_id || 'Pending'}</td>
                    <td className="p-3.5 font-semibold text-white">{p.guest_name || p.registration?.guest_name}</td>
                    <td className="p-3.5">{p.event_title || p.registration?.event?.title}</td>
                    <td className="p-3.5 font-bold text-white">₹{p.amount}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        p.status === 'paid' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {p.status === 'paid' && (
                        <button
                          onClick={() => handleRefund(p.id)}
                          className="px-3 py-1 rounded-lg bg-black hover:bg-zinc-800 border border-zinc-700 text-white text-[11px] font-bold"
                        >
                          Refund
                        </button>
                      )}
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
