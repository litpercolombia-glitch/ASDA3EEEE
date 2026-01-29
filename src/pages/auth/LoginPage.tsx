/**
 * LoginPage - LITPER PRO
 *
 * Página de login premium inspirada en Stripe, Linear y Vercel
 * Con glassmorphism, animaciones y validación en tiempo real
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  AlertCircle,
  LogIn,
} from 'lucide-react';

import { AnimatedBackground } from '../../components/auth/AnimatedBackground';
import { AuthCard, AuthCardHeader, AuthCardFooter, AuthLink } from '../../components/auth/AuthCard';
import { AuthInput } from '../../components/auth/AuthInput';
import { AuthButton, SocialButton, AuthDivider } from '../../components/auth/AuthButton';

interface LoginPageProps {
  onLogin?: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  onSocialLogin?: (provider: 'google' | 'github' | 'microsoft' | 'apple') => Promise<void>;
  onForgotPassword?: () => void;
  onRegister?: () => void;
  onTwoFactor?: (email: string) => void;
  initialEmail?: string;
  error?: string;
}

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  onSocialLogin,
  onForgotPassword,
  onRegister,
  initialEmail = '',
  error: externalError,
}) => {
  // Form state
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Clear error when inputs change
  useEffect(() => {
    if (error) setError(null);
  }, [email, password]);

  // Validate email
  const validateEmail = useCallback((value: string): string => {
    if (!value) return '';
    if (!emailRegex.test(value)) return 'Ingresa un email válido';
    return '';
  }, []);

  // Handle email blur
  const handleEmailBlur = () => {
    setEmailError(validateEmail(email));
  };

  // Handle password blur
  const handlePasswordBlur = () => {
    if (password && password.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
    } else {
      setPasswordError('');
    }
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const emailErr = validateEmail(email);
    if (emailErr) {
      setEmailError(emailErr);
      return;
    }
    if (!password) {
      setPasswordError('Ingresa tu contraseña');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (onLogin) {
        await onLogin(email, password, rememberMe);
        setShowSuccess(true);
      } else {
        // Demo mode - simulate login
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setShowSuccess(true);
        console.log('Login:', { email, password, rememberMe });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle social login
  const handleSocialLogin = async (provider: 'google' | 'github' | 'microsoft' | 'apple') => {
    setSocialLoading(provider);
    try {
      if (onSocialLogin) {
        await onSocialLogin(provider);
      } else {
        // Demo mode
        await new Promise((resolve) => setTimeout(resolve, 1500));
        console.log('Social login:', provider);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Error al conectar con ${provider}`);
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Animated Background */}
      <AnimatedBackground variant="aurora" intensity="medium" />

      {/* Login Card */}
      <AuthCard variant="glass" padding="xl" maxWidth="md" animate>
        {/* Logo & Header */}
        <AuthCardHeader
          logo={
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#030014] flex items-center justify-center">
                <LogIn className="w-3 h-3 text-white" />
              </div>
            </div>
          }
          title="Bienvenido a LITPER"
          subtitle="Inicia sesión para continuar"
        />

        {/* Error message */}
        {(error || externalError) && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-shake">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-400 font-medium">Error de autenticación</p>
              <p className="text-xs text-red-400/70 mt-0.5">{error || externalError}</p>
            </div>
          </div>
        )}

        {/* Success message */}
        {showSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center animate-bounce">
              <ArrowRight className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm text-emerald-400 font-medium">Inicio exitoso</p>
              <p className="text-xs text-emerald-400/70">Redirigiendo...</p>
            </div>
          </div>
        )}

        {/* Social Login Buttons */}
        <div className="space-y-3">
          <SocialButton
            provider="google"
            onClick={() => handleSocialLogin('google')}
            loading={socialLoading === 'google'}
            disabled={!!socialLoading || isLoading}
            fullWidth
          />
          <SocialButton
            provider="github"
            onClick={() => handleSocialLogin('github')}
            loading={socialLoading === 'github'}
            disabled={!!socialLoading || isLoading}
            fullWidth
          />
          <SocialButton
            provider="microsoft"
            onClick={() => handleSocialLogin('microsoft')}
            loading={socialLoading === 'microsoft'}
            disabled={!!socialLoading || isLoading}
            fullWidth
          />
        </div>

        <AuthDivider text="o continúa con email" />

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthInput
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="tu@email.com"
            value={email}
            onChange={setEmail}
            onBlur={handleEmailBlur}
            error={emailError}
            icon={<Mail className="w-5 h-5" />}
            autoComplete="email"
            autoFocus
            required
            disabled={isLoading}
          />

          <AuthInput
            id="password"
            name="password"
            type="password"
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChange={setPassword}
            onBlur={handlePasswordBlur}
            error={passwordError}
            icon={<Lock className="w-5 h-5" />}
            showPasswordToggle
            autoComplete="current-password"
            required
            disabled={isLoading}
          />

          {/* Remember me & Forgot password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only peer"
                  disabled={isLoading}
                />
                <div className="w-5 h-5 rounded-md border border-white/20 bg-white/[0.03] peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all duration-200 group-hover:border-white/30">
                  {rememberMe && (
                    <svg
                      className="w-5 h-5 text-white p-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                Recordarme
              </span>
            </label>

            <AuthLink variant="primary" onClick={onForgotPassword}>
              ¿Olvidaste tu contraseña?
            </AuthLink>
          </div>

          {/* Submit button */}
          <AuthButton
            type="submit"
            variant="primary"
            size="xl"
            fullWidth
            loading={isLoading}
            loadingText="Iniciando sesión..."
            icon={<ArrowRight className="w-5 h-5" />}
            iconPosition="right"
            disabled={!email || !password || !!emailError || !!passwordError}
          >
            Iniciar sesión
          </AuthButton>
        </form>

        {/* Footer */}
        <AuthCardFooter align="center">
          <p className="text-sm text-zinc-500">
            ¿No tienes cuenta?{' '}
            <AuthLink variant="primary" onClick={onRegister}>
              Regístrate gratis
            </AuthLink>
          </p>
        </AuthCardFooter>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-600">
          <Lock className="w-3 h-3" />
          <span>Conexión segura con cifrado de extremo a extremo</span>
        </div>
      </AuthCard>

      {/* Styles */}
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

export default LoginPage;
