import { InputHTMLAttributes, forwardRef, ReactNode, useState } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  containerClassName?: string;
  clearable?: boolean;
  onClear?: () => void;
}

export const EnhancedInput = forwardRef<HTMLInputElement, InputProps>(
  ({
    label,
    error,
    hint,
    icon,
    iconPosition = 'left',
    className,
    containerClassName,
    clearable = false,
    onClear,
    type = 'text',
    id,
    required,
    disabled,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    const baseStyles = 'block w-full border-b transition-opacity duration-200 focus:outline-none focus:border-charcoal bg-transparent font-serif text-charcoal';
    const errorStyles = 'border-red-600 text-red-900 placeholder-red-300';
    const disabledStyles = 'opacity-50 text-charcoal/50 cursor-not-allowed';
    const iconPaddingStyles = {
      left: 'pl-8',
      right: 'pr-8',
    };

    const PasswordToggle = () => (
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute inset-y-0 right-0 flex items-center pr-2 text-charcoal/40 hover:text-charcoal/60"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
    );

    const ClearButton = () => (
      <button
        type="button"
        onClick={onClear}
        className="absolute inset-y-0 right-0 flex items-center pr-2 text-charcoal/40 hover:text-charcoal/60"
        aria-label="Clear input"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    );

    return (
      <div className={containerClassName}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-serif text-charcoal mb-1">
            {label}
            {required && <span className="text-red-600 ml-1" aria-label="required">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none text-charcoal/40">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={clsx(
              baseStyles,
              error && errorStyles,
              disabled && disabledStyles,
              icon && iconPaddingStyles[iconPosition],
              isPassword && 'pr-8',
              clearable && !isPassword && 'pr-8',
              'border-charcoal/30',
              className
            )}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            {...props}
          />
          {icon && iconPosition === 'right' && !isPassword && !clearable && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-charcoal/40">
              {icon}
            </div>
          )}
          {isPassword && <PasswordToggle />}
          {clearable && !isPassword && props.value && <ClearButton />}
        </div>
        {hint && !error && (
          <p className="mt-1 text-sm text-charcoal/60" id={`${inputId}-hint`}>
            {hint}
          </p>
        )}
        {error && (
          <p className="mt-1 text-sm text-red-600" id={`${inputId}-error`} role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

EnhancedInput.displayName = 'EnhancedInput';