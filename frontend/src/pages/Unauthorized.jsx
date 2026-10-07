import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const Unauthorized = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-white">403 - Access Denied</h1>
      <p className="text-xs text-slate-400 max-w-sm">
        You do not have administrative or staff permission to access this portal page.
      </p>
      <Link
        to="/"
        className="px-6 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sky-400 font-bold text-xs inline-flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home Page
      </Link>
    </div>
  );
};
