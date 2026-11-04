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
                  ? 'bg-[#E5F4F9] text-[#0B1928] border-[#E5F4F9] font-extrabold shadow-md scale-[1.02]'
                  : 'bg-[#0B1928] text-[#95B8C9] border-[#1E394E] hover:border-[#4A96BA] hover:text-[#E5F4F9]'
              }`}
            >
              {Icon && <Icon className="w-5 h-5" />}
              <span className="text-xs font-semibold">{opt.label}</span>
              {opt.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  isSelected ? 'bg-[#0B1928]/15 text-[#0B1928]' : 'bg-[#1E394E] text-[#95B8C9]'
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
