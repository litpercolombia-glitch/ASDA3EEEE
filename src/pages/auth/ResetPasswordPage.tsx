/**
 * ResetPasswordPage - LITPER PRO
 *
 * Página para establecer nueva contraseña
 * Inspirada en Stripe, Linear y Vercel
 */

import React, { useState, useCallback } from 'react';
import {
  Lock,
  Shield,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  KeyRound,
  Sparkles,
} from 'lucide-react';

import { AnimatedBackground } from '../../components/auth/AnimatedBackground';
import { AuthCard, AuthCardHeader } from '../../components/auth/AuthCard';
import { AuthInput } from '../../components/auth/AuthInput';
import { AuthButton } from '../../components/auth/AuthButton';
import { PasswordStrengthMeter } from '../../components/auth/PasswordStrengthMeter';

interface ResetPasswordPageProps {
  token?: string;
  onSubmit?: (password: string, token: string) => Promise<void>;
  onLogin?: () => void;
  tokenError?: string;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({
  token = '',
  onSubmit,
  onLogin,
  tokenError,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const validatePassword = useCallback((value: string): string => {
    if (!value) return 'Ingresa una contraseña';
    if (value.length < 8) return 'Mínimo 8 caracteres';
    if (!/[A-Z]/.test(value)) return 'Incluye al menos una mayúscula';
    if (!/[0-9]/.test(value)) return 'Incluye al menos un número';
    return '';
  }, []);

  const validateConfirmPassword = useCallback(
    (value: string): string => {
      if (!value) return 'Confirma tu contraseña';
      if (value !== password) return 'Las contraseñas no coinciden';
      return '';
    },
    [password]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const pwError = validatePassword(password);
    const cpError = validateConfirmPassword(confirmPassword);

    setPasswordError(pwError);
    setConfirmPasswordError(cpError);

    if (pwError || cpError) return;

    setIsLoading(true);
    setError(null);

    try {
      if (onSubmit) {
        await onSubmit(password, token);
      } else {
        // Demo mode
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  // Token error state
  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <AnimatedBackground variant="gradient" intensity="subtle" />

        <AuthCard variant="glass" padding="xl" maxWidth="md" animate>
          <div className="text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
              <div className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-white" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">
              Enlace inválido
            </h1>
            <p className="text-zinc-400 mb-6">
              {tokenError}
            </p>

            <AuthButton
              variant="primary"
              size="lg"
              fullWidth
              onClick={onLogin}
            >
              Solicitar nuevo enlace
            </AuthButton>
          </div>
        </AuthCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AnimatedBackground variant="gradient" intensity="subtle" />

      <AuthCard variant="glass" padding="xl" maxWidth="md" animate>
        {!isSuccess ? (
          <>
            <AuthCardHeader
              logo={
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <KeyRound className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#030014] flex items-center justify-center">
                    <Shield className="w-3 h-3 text-white" />
                  </div>
                </div>
              }
              title="Nueva contraseña"
              subtitle="Crea una contraseña segura para tu cuenta"
            />

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <AuthInput
                id="password"
                name="password"
                type="password"
                label="Nueva contraseña"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(v) => {
                  setPassword(v);
                  if (passwordError) setPasswordError('');
                }}
                onBlur={() => setPasswordError(validatePassword(password))}
                error={passwordError}
                icon={<Lock className="w-5 h-5" />}
                showPasswordToggle
                autoComplete="new-password"
                autoFocus
                required
              />

              {password && (
                <PasswordStrengthMeter
                  password={password}
                  showRequirements
                  showScore
                />
              )}

              <AuthInput
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                label="Confirmar contraseña"
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChange={(v) => {
                  setConfirmPassword(v);
                  if (confirmPasswordError) setConfirmPasswordError('');
                }}
                onBlur={() => setConfirmPasswordError(validateConfirmPassword(confirmPassword))}
                error={confirmPasswordError}
                success={confirmPassword && confirmPassword === password ? 'Las contraseñas coinciden' : undefined}
                icon={<Shield className="w-5 h-5" />}
                showPasswordToggle
                autoComplete="new-password"
                required
              />

              <div className="pt-2">
                <AuthButton
                  type="submit"
                  variant="primary"
                  size="xl"
                  fullWidth
                  loading={isLoading}
                  loadingText="Actualizando..."
                  icon={<ArrowRight className="w-5 h-5" />}
                  iconPosition="right"
                  disabled={!password || !confirmPassword || !!passwordError || password !== confirmPassword}
                >
                  Actualizar contraseña
                </AuthButton>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
              <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-white animate-bounce" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">
              ¡Contraseña actualizada!
            </h1>
            <p className="text-zinc-400 mb-6">
              Tu contraseña ha sido cambiada exitosamente
            </p>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-emerald-400" />
                <p className="text-sm text-emerald-400">
                  Tu cuenta ahora está más segura
                </p>
              </div>
            </div>

            <AuthButton
              variant="primary"
              size="lg"
              fullWidth
              onClick={onLogin}
              icon={<Sparkles className="w-5 h-5" />}
            >
              Iniciar sesión
            </AuthButton>
          </div>
        )}
      </AuthCard>
    </div>
  );
};

export default ResetPasswordPage;
