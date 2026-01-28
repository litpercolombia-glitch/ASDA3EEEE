/**
 * ForgotPasswordPage - LITPER PRO
 *
 * Página para recuperación de contraseña
 * Inspirada en Stripe, Linear y Vercel
 */

import React, { useState } from 'react';
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Send,
  KeyRound,
} from 'lucide-react';

import { AnimatedBackground } from '../../components/auth/AnimatedBackground';
import { AuthCard, AuthCardHeader, AuthCardFooter, AuthLink } from '../../components/auth/AuthCard';
import { AuthInput } from '../../components/auth/AuthInput';
import { AuthButton } from '../../components/auth/AuthButton';

interface ForgotPasswordPageProps {
  onSubmit?: (email: string) => Promise<void>;
  onBack?: () => void;
  onLogin?: () => void;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  onSubmit,
  onBack,
  onLogin,
}) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = (value: string): string => {
    if (!value) return 'Ingresa tu email';
    if (!emailRegex.test(value)) return 'Ingresa un email válido';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const err = validateEmail(email);
    setEmailError(err);
    if (err) return;

    setIsLoading(true);
    setError(null);

    try {
      if (onSubmit) {
        await onSubmit(email);
      } else {
        // Demo mode
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AnimatedBackground variant="gradient" intensity="subtle" />

      <AuthCard variant="glass" padding="xl" maxWidth="md" animate>
        {!isSuccess ? (
          <>
            <AuthCardHeader
              logo={
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <KeyRound className="w-8 h-8 text-white" />
                  </div>
                </div>
              }
              title="¿Olvidaste tu contraseña?"
              subtitle="Te enviaremos un enlace para recuperarla"
            />

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <AuthInput
                id="email"
                name="email"
                type="email"
                label="Email"
                placeholder="tu@email.com"
                value={email}
                onChange={(v) => {
                  setEmail(v);
                  if (emailError) setEmailError('');
                }}
                onBlur={() => setEmailError(validateEmail(email))}
                error={emailError}
                icon={<Mail className="w-5 h-5" />}
                autoComplete="email"
                autoFocus
                required
              />

              <AuthButton
                type="submit"
                variant="primary"
                size="xl"
                fullWidth
                loading={isLoading}
                loadingText="Enviando..."
                icon={<Send className="w-5 h-5" />}
                iconPosition="right"
                disabled={!email || !!emailError}
              >
                Enviar enlace de recuperación
              </AuthButton>
            </form>

            <AuthCardFooter align="center">
              <AuthLink variant="muted" onClick={onBack || onLogin}>
                <span className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Volver al inicio de sesión
                </span>
              </AuthLink>
            </AuthCardFooter>
          </>
        ) : (
          <>
            <div className="text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
                <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center animate-bounce">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
              </div>

              <h1 className="text-2xl font-bold text-white mb-2">
                ¡Email enviado!
              </h1>
              <p className="text-zinc-400 mb-6">
                Revisa tu bandeja de entrada en <span className="text-white font-medium">{email}</span>
              </p>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-left mb-6">
                <h3 className="text-sm font-medium text-white mb-2">Próximos pasos:</h3>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" />
                    Abre el email que te enviamos
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" />
                    Haz clic en el enlace de recuperación
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" />
                    Crea tu nueva contraseña
                  </li>
                </ul>
              </div>

              <p className="text-xs text-zinc-500 mb-4">
                ¿No recibiste el email? Revisa tu carpeta de spam o{' '}
                <button
                  onClick={() => setIsSuccess(false)}
                  className="text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  intenta de nuevo
                </button>
              </p>

              <AuthButton
                variant="secondary"
                size="lg"
                fullWidth
                onClick={onLogin}
                icon={<ArrowLeft className="w-5 h-5" />}
              >
                Volver al inicio de sesión
              </AuthButton>
            </div>
          </>
        )}
      </AuthCard>
    </div>
  );
};

export default ForgotPasswordPage;
