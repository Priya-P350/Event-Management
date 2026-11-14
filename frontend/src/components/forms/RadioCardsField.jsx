import React from 'react';
import { FormField } from './FormField';
import { Check } from 'lucide-react';

export const RadioCardsField = ({
  name,
  label,
  options = [],
  value,
  onChange,
  setValue,
  register,
  rules,
  error,
  helperText,
  required = false,
  className = '',
  columns = 3
}) => {
  const registerProps = register ? register(name, rules) : {};

  const handleSelect = (val) => {
    if (onChange) onChange(val);
    if (setValue && name) {
      setValue(name, val, { shouldValidate: true, shouldDirty: true });
    }
    if (registerProps.onChange) {
      registerProps.onChange({ target: { name, value: val } });
    }
  };

  const gridClass = columns === 2 
    ? 'grid-cols-1 sm:grid-cols-2' 
    : columns === 4 
    ? 'grid-cols-2 sm:grid-cols-4' 
    : 'grid-cols-1 sm:grid-cols-3';

  return (
    <FormField label={label} required={required} error={error} helperText={helperText} className={className}>
      <div className={`grid ${gridClass} gap-3 w-full`}>
        {options.map((opt) => {
          const isSelected = value === opt.value;
          const Icon = opt.icon;

          return (
            <button
              key={opt.value}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelect(opt.value);
              }}
              className={`relative p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer select-none w-full ${
                isSelected
                  ? 'bg-[#1E394E] text-[#E5F4F9] border-[#38bdf8] font-bold shadow-[0_0_15px_rgba(56,189,248,0.25)] ring-1 ring-[#38bdf8] scale-[1.02]'
                  : 'bg-[#0B1928] text-[#95B8C9] border-[#1E394E] hover:border-[#38bdf8]/60 hover:bg-[#122538] hover:text-[#E5F4F9]'
              }`}
            >
              {/* Selected Checkmark Indicator */}
              {isSelected && (
                <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#38bdf8] text-[#0B1928] flex items-center justify-center shadow-sm">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              )}

              {Icon && (
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-[#38bdf8]/20 text-[#38bdf8]' : 'bg-[#1E394E]/60 text-[#95B8C9]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              )}
              <span className="text-xs font-bold leading-tight">{opt.label}</span>
              {opt.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono transition-colors ${
                    isSelected
                      ? 'bg-[#38bdf8] text-[#0B1928] font-black'
                      : 'bg-[#1E394E] text-[#95B8C9]'
                  }`}
                >
                  {opt.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {/* Hidden input to ensure React Hook Form registration */}
      {register && (
        <input type="hidden" name={name} value={value || ''} />
      )}
    </FormField>
  );
};
