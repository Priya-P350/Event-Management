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
          className={`w-full bg-[#0B1928] border rounded-xl pl-10 pr-10 py-3 text-xs text-[#E5F4F9] placeholder-[#95B8C9]/60 focus:outline-none transition-all duration-200 ${
            error
              ? 'border-red-500 focus:border-red-400 focus:ring-1 focus:ring-red-400'
              : 'border-[#1E394E] focus:border-[#4A96BA] focus:ring-1 focus:ring-[#4A96BA]'
          }`}
        />
        <Lock className={`w-4 h-4 absolute left-3 top-3.5 ${error ? 'text-red-400' : 'text-[#95B8C9]'}`} />
        
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-3.5 text-[#95B8C9] hover:text-[#E5F4F9] transition-colors focus:outline-none"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </FormField>
  );
};
