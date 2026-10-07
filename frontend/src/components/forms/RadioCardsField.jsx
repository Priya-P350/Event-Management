import React from 'react';
import { FormField } from './FormField';

export const RadioCardsField = ({
  name,
  label,
  options = [],
  value,
  onChange,
  register,
  rules,
  error,
  helperText,
  required = false,
  className = '',
  columns = 3
}) => {
  const registerProps = register ? register(name, rules) : {};

  return (
    <FormField label={label} required={required} error={error} helperText={helperText} className={className}>
      <div className={`grid grid-cols-1 sm:grid-cols-${columns} gap-2`}>
        {options.map((opt) => {
          const isSelected = value === opt.value;
          const Icon = opt.icon;

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                if (onChange) onChange(opt.value);
                if (registerProps.onChange) {
                  registerProps.onChange({ target: { name, value: opt.value } });
                }
              }}
              className={`p-3 rounded-xl border text-left flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white text-black border-white font-extrabold shadow-lg shadow-white/10 scale-[1.02]'
                  : 'bg-black text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white'
              }`}
            >
              {Icon && <Icon className="w-5 h-5" />}
              <span className="text-xs font-semibold">{opt.label}</span>
              {opt.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  isSelected ? 'bg-black/10 text-black' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {opt.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {/* Hidden input to bind with react-hook-form */}
      {register && (
        <input type="hidden" value={value || ''} {...registerProps} />
      )}
    </FormField>
  );
};
