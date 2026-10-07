import React from 'react';
import { FormField } from './FormField';

export const SelectField = ({
  name,
  label,
  register,
  rules,
  error,
  options = [],
  placeholder = 'Select an option',
  helperText,
  required = false,
  className = '',
  icon: Icon,
  ...rest
}) => {
  const registerProps = register ? register(name, rules) : {};

  return (
    <FormField label={label} required={required} error={error} helperText={helperText} className={className}>
      <div className="relative">
        <select
          {...registerProps}
          {...rest}
          className={`w-full bg-black border rounded-xl py-3 text-xs text-white focus:outline-none transition-all duration-200 cursor-pointer appearance-none ${
            Icon ? 'pl-10 pr-8' : 'px-4 pr-8'
          } ${
            error
              ? 'border-red-500 focus:border-red-400 focus:ring-1 focus:ring-red-400'
              : 'border-zinc-800 focus:border-white focus:ring-1 focus:ring-white'
          }`}
        >
          {placeholder && (
            <option value="" disabled className="bg-zinc-950 text-zinc-500">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option
              key={typeof opt === 'object' ? opt.value : opt}
              value={typeof opt === 'object' ? opt.value : opt}
              className="bg-zinc-950 text-white py-1"
            >
              {typeof opt === 'object' ? opt.label : opt}
            </option>
          ))}
        </select>

        {Icon && (
          <Icon className={`w-4 h-4 absolute left-3 top-3.5 ${error ? 'text-red-400' : 'text-zinc-500'}`} />
        )}

        {/* Custom Chevron Arrow */}
        <div className="absolute right-3 top-3.5 pointer-events-none text-zinc-500">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
    </FormField>
  );
};
