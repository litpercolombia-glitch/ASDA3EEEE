/**
 * TwoFactorInput - LITPER PRO
 *
 * Input de código 2FA con auto-avance y soporte para paste
 * Inspirado en Stripe, Linear y GitHub
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Shield, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface TwoFactorInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: string;
  autoFocus?: boolean;
  type?: 'numeric' | 'alphanumeric';
  className?: string;
  loading?: boolean;
  success?: boolean;
}

export const TwoFactorInput: React.FC<TwoFactorInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error,
  autoFocus = true,
  type = 'numeric',
  className = '',
  loading = false,
  success = false,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // Split value into individual characters
  const values = value.split('').concat(Array(length).fill('')).slice(0, length);

  // Focus first input on mount
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  // Handle complete callback
  useEffect(() => {
    if (value.length === length && onComplete) {
      onComplete(value);
    }
  }, [value, length, onComplete]);

  const focusInput = useCallback((index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, length - 1));
    inputRefs.current[clampedIndex]?.focus();
    setActiveIndex(clampedIndex);
  }, [length]);

  const handleChange = (index: number, inputValue: string) => {
    const char = type === 'numeric'
      ? inputValue.replace(/[^0-9]/g, '')
      : inputValue.replace(/[^a-zA-Z0-9]/g, '');

    if (!char) return;

    // Take only the last character (for mobile keyboards that might send multiple)
    const newChar = char.slice(-1);
    const newValues = [...values];
    newValues[index] = newChar;
    const newValue = newValues.join('').slice(0, length);

    onChange(newValue);

    // Move to next input if not at the end
    if (index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Backspace':
        e.preventDefault();
        if (values[index]) {
          // Clear current input
          const newValues = [...values];
          newValues[index] = '';
          onChange(newValues.join(''));
        } else if (index > 0) {
          // Move to previous and clear
          const newValues = [...values];
          newValues[index - 1] = '';
          onChange(newValues.join(''));
          focusInput(index - 1);
        }
        break;

      case 'ArrowLeft':
        e.preventDefault();
        if (index > 0) focusInput(index - 1);
        break;

      case 'ArrowRight':
        e.preventDefault();
        if (index < length - 1) focusInput(index + 1);
        break;

      case 'Delete':
        e.preventDefault();
        const newValues = [...values];
        newValues[index] = '';
        onChange(newValues.join(''));
        break;

      default:
        break;
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const sanitized = type === 'numeric'
      ? pastedData.replace(/[^0-9]/g, '')
      : pastedData.replace(/[^a-zA-Z0-9]/g, '');

    const newValue = sanitized.slice(0, length);
    onChange(newValue);

    // Focus last filled input or last input
    const focusIndex = Math.min(newValue.length, length - 1);
    focusInput(focusIndex);
  };

  const handleFocus = (index: number) => {
    setActiveIndex(index);
    // Select input content
    inputRefs.current[index]?.select();
  };

  // Determine border color based on state
  const getBorderColor = (index: number) => {
    if (error) return 'border-red-500';
    if (success) return 'border-emerald-500';
    if (loading) return 'border-indigo-500/50';
    if (activeIndex === index) return 'border-indigo-500';
    if (values[index]) return 'border-white/20';
    return 'border-white/10';
  };

  const getGlowColor = (index: number) => {
    if (error) return 'shadow-[0_0_0_3px_rgba(239,68,68,0.15)]';
    if (success) return 'shadow-[0_0_0_3px_rgba(16,185,129,0.15)]';
    if (activeIndex === index) return 'shadow-[0_0_0_3px_rgba(99,102,241,0.15)]';
    return '';
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-indigo-400" />
        <span className="text-sm text-zinc-400">
          Ingresa el código de {length} dígitos
        </span>
      </div>

      {/* Input boxes */}
      <div className="flex justify-center gap-2 sm:gap-3">
        {values.map((val, index) => (
          <React.Fragment key={index}>
            <input
              ref={(el) => { inputRefs.current[index] = el; }}
              type={type === 'numeric' ? 'tel' : 'text'}
              inputMode={type === 'numeric' ? 'numeric' : 'text'}
              autoComplete="one-time-code"
              maxLength={1}
              value={val}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={() => handleFocus(index)}
              disabled={disabled || loading}
              className={`
                w-11 h-14 sm:w-12 sm:h-16
                text-center text-xl sm:text-2xl font-bold
                bg-white/[0.03] backdrop-blur-sm
                border rounded-xl
                text-white
                transition-all duration-200
                outline-none
                disabled:opacity-50 disabled:cursor-not-allowed
                ${getBorderColor(index)}
                ${getGlowColor(index)}
                ${loading ? 'animate-pulse' : ''}
                ${success ? 'bg-emerald-500/10' : ''}
                ${error ? 'bg-red-500/10' : ''}
              `}
            />
            {/* Separator after 3rd digit for 6-digit codes */}
            {length === 6 && index === 2 && (
              <div className="flex items-center px-1">
                <div className="w-2 h-0.5 bg-zinc-700 rounded-full" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Status indicators */}
      <div className="mt-4 flex justify-center">
        {loading && (
          <div className="flex items-center gap-2 text-indigo-400 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Verificando...</span>
          </div>
        )}
        {success && !loading && (
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Código válido</span>
          </div>
        )}
        {error && !loading && (
          <div className="flex items-center gap-2 text-red-400">
            <XCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>

      {/* Resend option */}
      {!loading && !success && (
        <div className="mt-6 text-center">
          <button
            type="button"
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            disabled={disabled}
          >
            ¿No recibiste el código?{' '}
            <span className="text-indigo-400 hover:text-indigo-300">
              Reenviar
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

// Backup codes input (for recovery)
interface BackupCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  error?: string;
  loading?: boolean;
  disabled?: boolean;
}

export const BackupCodeInput: React.FC<BackupCodeInputProps> = ({
  value,
  onChange,
  onSubmit,
  error,
  loading = false,
  disabled = false,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.length > 0) {
      onSubmit();
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <p className="text-sm text-zinc-400">
          Ingresa uno de tus códigos de respaldo
        </p>
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        onKeyDown={handleKeyDown}
        placeholder="XXXX-XXXX-XXXX"
        disabled={disabled || loading}
        className={`
          w-full h-14 px-4
          text-center text-lg font-mono tracking-widest
          bg-white/[0.03] backdrop-blur-sm
          border rounded-xl
          text-white
          placeholder:text-zinc-600
          transition-all duration-200
          outline-none
          ${error ? 'border-red-500' : 'border-white/10 focus:border-indigo-500'}
          ${error ? 'shadow-[0_0_0_3px_rgba(239,68,68,0.15)]' : 'focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)]'}
        `}
      />

      {error && (
        <p className="text-sm text-red-400 text-center">{error}</p>
      )}
    </div>
  );
};

export default TwoFactorInput;
