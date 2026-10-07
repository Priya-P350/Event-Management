import React, { useState } from 'react';
import { FormField } from './FormField';
import { Lock, Eye, EyeOff } from 'lucide-react';

export const PasswordField = ({
  name,
  label = 'Password',
  register,
  rules,
  error,
  placeholder = '••••••••',
  helperText,
  required = false,
  className = '',
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const registerProps = register ? register(name, rules) : {};

  return (
    <FormField label={label} required={required} error={error} helperText={helperText} className={className}>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          {...registerProps}
          {...rest}
          className={`w-full bg-black border rounded-xl pl-10 pr-10 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all duration-200 ${
            error
              ? 'border-red-500 focus:border-red-400 focus:ring-1 focus:ring-red-400'
              : 'border-zinc-800 focus:border-white focus:ring-1 focus:ring-white'
          }`}
        />
        <Lock className={`w-4 h-4 absolute left-3 top-3.5 ${error ? 'text-red-400' : 'text-zinc-500'}`} />
        
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-3.5 text-zinc-500 hover:text-white transition-colors focus:outline-none"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </FormField>
  );
};
