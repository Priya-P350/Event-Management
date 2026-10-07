import React from 'react';
import { useForm } from 'react-hook-form';
import { TextInputField } from './TextInputField';
import { PasswordField } from './PasswordField';
import { SelectField } from './SelectField';
import { RadioCardsField } from './RadioCardsField';
import { ArrowRight, Loader2 } from 'lucide-react';

export const DynamicFormBuilder = ({
  fields = [],
  defaultValues = {},
  onSubmit,
  submitText = 'Submit',
  submittingText = 'Processing...',
  submitIcon: SubmitIcon = ArrowRight,
  className = 'space-y-4',
  extraActions
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues
  });

  const formValues = watch();

  const handleFormSubmit = async (data) => {
    if (onSubmit) {
      await onSubmit(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={className}>
      {fields.map((field) => {
        const { id, type, name, label, rules, placeholder, icon, options, helperText, required, columns } = field;
        const error = errors[name];

        if (type === 'password') {
          return (
            <PasswordField
              key={id || name}
              name={name}
              label={label}
              register={register}
              rules={rules}
              error={error}
              placeholder={placeholder}
              helperText={helperText}
              required={required}
            />
          );
        }

        if (type === 'select') {
          return (
            <SelectField
              key={id || name}
              name={name}
              label={label}
              register={register}
              rules={rules}
              error={error}
              options={options}
              placeholder={placeholder}
              helperText={helperText}
              required={required}
              icon={icon}
            />
          );
        }

        if (type === 'radio-cards') {
          return (
            <RadioCardsField
              key={id || name}
              name={name}
              label={label}
              options={options}
              value={formValues[name]}
              onChange={(val) => setValue(name, val, { shouldValidate: true })}
              register={register}
              rules={rules}
              error={error}
              helperText={helperText}
              required={required}
              columns={columns}
            />
          );
        }

        if (type === 'textarea') {
          return (
            <div key={id || name} className="space-y-1.5">
              {label && (
                <label className="block text-xs font-semibold text-zinc-300">
                  {label} {required && <span className="text-red-400">*</span>}
                </label>
              )}
              <textarea
                placeholder={placeholder}
                rows={4}
                {...register(name, rules)}
                className={`w-full bg-black border rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all ${
                  error ? 'border-red-500' : 'border-zinc-800 focus:border-white'
                }`}
              />
              {error && (
                <p className="text-[11px] text-red-400 font-medium">⚠️ {error.message}</p>
              )}
            </div>
          );
        }

        return (
          <TextInputField
            key={id || name}
            name={name}
            label={label}
            type={type || 'text'}
            register={register}
            rules={rules}
            error={error}
            placeholder={placeholder}
            icon={icon}
            helperText={helperText}
            required={required}
          />
        );
      })}

      {extraActions}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3.5 rounded-xl bg-white text-black font-extrabold text-xs hover:bg-zinc-200 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 border border-white mt-4 cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {submittingText}
          </>
        ) : (
          <>
            {submitText}
            {SubmitIcon && <SubmitIcon className="w-4 h-4" />}
          </>
        )}
      </button>
    </form>
  );
};
