import React from 'react';

export const FormField = ({ label, required, error, helperText, children, className = '' }) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-zinc-300">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-[11px] text-red-400 font-medium flex items-center gap-1 animate-in fade-in duration-150">
          <span>⚠️</span> {error.message || error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-[11px] text-zinc-500">{helperText}</p>
      )}
    </div>
  );
};
