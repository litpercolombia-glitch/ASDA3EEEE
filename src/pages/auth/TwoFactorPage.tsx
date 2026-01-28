/**
 * TwoFactorPage - LITPER PRO
 *
 * Página de verificación 2FA
 * Inspirada en GitHub, Stripe y Linear
 */

import React, { useState, useCallback } from 'react';
import {
  Shield,
  Smartphone,
  ArrowLeft,
  AlertCircle,
  KeyRound,
  MessageSquare,
  Mail,
} from 'lucide-react';

import { AnimatedBackground } from '../../components/auth/AnimatedBackground';
import { AuthCard, AuthCardHeader, AuthCardFooter, AuthLink } from '../../components/auth/AuthCard';
import { AuthButton } from '../../components/auth/AuthButton';
import { TwoFactorInput, BackupCodeInput } from '../../components/auth/TwoFactorInput';

interface TwoFactorPageProps {
  email?: string;
  method?: '2fa' | 'sms' | 'email';
  onVerify?: (code: string, trustDevice: boolean) => Promise<void>;
  onResend?: () => Promise<void>;
  onBack?: () => void;
  onUseBackupCode?: (code: string) => Promise<void>;
  error?: string;
}

type VerificationMethod = 'authenticator' | 'sms' | 'email' | 'backup';

export const TwoFactorPage: React.FC<TwoFactorPageProps> = ({
  email = 'tu@email.com',
  method: defaultMethod = '2fa',
  onVerify,
  onResend,
  onBack,
  onUseBackupCode,
  error: externalError,
}) => {
  const [code, setCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [trustDevice, setTrustDevice] = useState(false);
  const [method, setMethod] = useState<VerificationMethod>('authenticator');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleVerify = useCallback(async (verificationCode: string) => {
    if (verificationCode.length < 6) return;

    setIsLoading(true);
    setError(null);

    try {
      if (onVerify) {
        await onVerify(verificationCode, trustDevice);
      } else {
        // Demo mode - simulate verification
        await new Promise((resolve) => setTimeout(resolve, 1500));
        if (verificationCode === '123456') {
          setSuccess(true);
        } else {
          throw new Error('Código incorrecto');
        }
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código inválido');
      setCode('');
    } finally {
      setIsLoading(false);
    }
  }, [onVerify, trustDevice]);

  const handleBackupVerify = useCallback(async () => {
    if (!backupCode) return;

    setIsLoading(true);
    setError(null);

    try {
      if (onUseBackupCode) {
        await onUseBackupCode(backupCode);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código de respaldo inválido');
    } finally {
      setIsLoading(false);
    }
  }, [backupCode, onUseBackupCode]);

  const handleResend = async () => {
    setIsResending(true);
    try {
      if (onResend) {
        await onResend();
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } finally {
      setIsResending(false);
    }
  };

  const getMethodIcon = () => {
    switch (method) {
      case 'authenticator':
        return <Smartphone className="w-8 h-8 text-white" />;
      case 'sms':
        return <MessageSquare className="w-8 h-8 text-white" />;
      case 'email':
        return <Mail className="w-8 h-8 text-white" />;
      case 'backup':
        return <KeyRound className="w-8 h-8 text-white" />;
      default:
        return <Shield className="w-8 h-8 text-white" />;
    }
  };

  const getMethodTitle = () => {
    switch (method) {
      case 'authenticator':
        return 'Verificación en dos pasos';
      case 'sms':
        return 'Código por SMS';
      case 'email':
        return 'Código por email';
      case 'backup':
        return 'Código de respaldo';
      default:
        return 'Verificación';
    }
  };

  const getMethodSubtitle = () => {
    switch (method) {
      case 'authenticator':
        return 'Ingresa el código de tu aplicación de autenticación';
      case 'sms':
        return `Enviamos un código a tu número registrado`;
      case 'email':
        return `Enviamos un código a ${email}`;
      case 'backup':
        return 'Usa uno de tus códigos de respaldo de 8 caracteres';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AnimatedBackground variant="orbs" intensity="subtle" />

      <AuthCard variant="glass" padding="xl" maxWidth="md" animate>
        <AuthCardHeader
          logo={
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                {getMethodIcon()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-indigo-500 border-2 border-[#030014] flex items-center justify-center">
                <Shield className="w-3 h-3 text-white" />
              </div>
            </div>
          }
          title={getMethodTitle()}
          subtitle={getMethodSubtitle()}
        />

        {/* Error message */}
        {(error || externalError) && !success && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-shake">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error || externalError}</p>
          </div>
        )}

        {/* Main content based on method */}
        {method !== 'backup' ? (
          <TwoFactorInput
            length={6}
            value={code}
            onChange={setCode}
            onComplete={handleVerify}
            loading={isLoading}
            success={success}
            error={error && !isLoading ? error : undefined}
            autoFocus
          />
        ) : (
          <div className="space-y-6">
            <BackupCodeInput
              value={backupCode}
              onChange={setBackupCode}
              onSubmit={handleBackupVerify}
              error={error || undefined}
              loading={isLoading}
            />
            <AuthButton
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleBackupVerify}
              loading={isLoading}
              loadingText="Verificando..."
              disabled={!backupCode || backupCode.length < 8}
            >
              Verificar código de respaldo
            </AuthButton>
          </div>
        )}

        {/* Trust device checkbox */}
        {!success && method !== 'backup' && (
          <div className="mt-6">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={trustDevice}
                  onChange={(e) => setTrustDevice(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 rounded-md border border-white/20 bg-white/[0.03] peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all duration-200 group-hover:border-white/30">
                  {trustDevice && (
                    <svg
                      className="w-5 h-5 text-white p-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                Confiar en este dispositivo por 30 días
              </span>
            </label>
          </div>
        )}

        {/* Alternative methods */}
        {!success && (
          <div className="mt-8 pt-6 border-t border-white/5">
            <p className="text-xs text-zinc-500 text-center mb-4">
              ¿Problemas con la verificación?
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {method !== 'authenticator' && (
                <button
                  onClick={() => { setMethod('authenticator'); setCode(''); setError(null); }}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  App
                </button>
              )}
              {method !== 'sms' && (
                <button
                  onClick={() => { setMethod('sms'); setCode(''); setError(null); handleResend(); }}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  SMS
                </button>
              )}
              {method !== 'email' && (
                <button
                  onClick={() => { setMethod('email'); setCode(''); setError(null); handleResend(); }}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Email
                </button>
              )}
              {method !== 'backup' && (
                <button
                  onClick={() => { setMethod('backup'); setCode(''); setError(null); }}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Código respaldo
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <AuthCardFooter align="center">
          <AuthLink variant="muted" onClick={onBack}>
            <span className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver
            </span>
          </AuthLink>
        </AuthCardFooter>
      </AuthCard>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default TwoFactorPage;
