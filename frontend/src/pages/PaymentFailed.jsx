import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';

export const PaymentFailed = () => {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center mx-auto border border-zinc-800">
        <XCircle className="w-10 h-10 text-white" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-black text-white">Payment Unsuccessful</h1>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Your Razorpay transaction could not be verified or was cancelled. No ticket pass was generated for this attempt.
        </p>
      </div>

      <div className="bg-black border border-zinc-800 p-4 rounded-2xl text-left text-xs text-zinc-300 space-y-2">
        <div className="flex items-center gap-2 font-bold text-white">
          <AlertTriangle className="w-4 h-4 text-white" /> Common Reasons:
        </div>
        <ul className="list-disc pl-5 space-y-1 text-zinc-400">
          <li>Payment window was closed before completion</li>
          <li>Bank server timeout or invalid UPI PIN</li>
          <li>Insufficient funds or card decline</li>
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          to="/events"
          className="w-full py-3 rounded-xl bg-white text-black font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all duration-200 border border-white"
        >
          <RefreshCw className="w-4 h-4" /> Try Registering Again
        </Link>
        <Link
          to="/events"
          className="w-full py-3 rounded-xl bg-black border border-zinc-800 text-zinc-400 hover:text-white font-semibold text-xs flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Events Catalog
        </Link>
      </div>
    </div>
  );
};
