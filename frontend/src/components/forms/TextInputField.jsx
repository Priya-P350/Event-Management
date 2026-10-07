import React from 'react';
import { FormField } from './FormField';

export const TextInputField = ({
  name,
  label,
  register,
  rules,
  error,
  type = 'text',
  placeholder = '',
  icon: Icon,
  helperText,
  required = false,
  className = '',
  disabled = false,
  ...rest
}) => {
  const registerProps = register ? register(name, rules) : {};

  return (
    <FormField label={label} required={required} error={error} helperText={helperText} className={className}>
      <div className="relative">
        <input
          type={type}
          disabled={disabled}
          placeholder={placeholder}
          {...registerProps}
          {...rest}
          className={`w-full bg-black border rounded-xl py-3 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all duration-200 ${
            Icon ? 'pl-10 pr-4' : 'px-4'
          } ${
            error
              ? 'border-red-500 focus:border-red-400 focus:ring-1 focus:ring-red-400'
              : 'border-zinc-800 focus:border-white focus:ring-1 focus:ring-white'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-zinc-950' : ''}`}
        />
        {Icon && (
          <Icon className={`w-4 h-4 absolute left-3 top-3.5 ${error ? 'text-red-400' : 'text-zinc-500'}`} />
        )}
      </div>
    </FormField>
  );
};
