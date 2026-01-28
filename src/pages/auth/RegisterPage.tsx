/**
 * RegisterPage - LITPER PRO
 *
 * Página de registro premium con validación en tiempo real
 * Inspirada en Stripe, Linear y Vercel
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Mail,
  Lock,
  User,
  Building2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Shield,
} from 'lucide-react';

import { AnimatedBackground } from '../../components/auth/AnimatedBackground';
import { AuthCard, AuthCardHeader, AuthCardFooter, AuthLink } from '../../components/auth/AuthCard';
import { AuthInput } from '../../components/auth/AuthInput';
import { AuthButton, SocialButton, AuthDivider } from '../../components/auth/AuthButton';
import { PasswordStrengthMeter } from '../../components/auth/PasswordStrengthMeter';

interface RegisterPageProps {
  onRegister?: (data: RegisterFormData) => Promise<void>;
  onSocialLogin?: (provider: 'google' | 'github' | 'microsoft' | 'apple') => Promise<void>;
  onLogin?: () => void;
  error?: string;
}

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  companyName?: string;
  acceptTerms: boolean;
  acceptMarketing: boolean;
}

// Validation helpers
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onRegister,
  onSocialLogin,
  onLogin,
  error: externalError,
}) => {
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptMarketing, setAcceptMarketing] = useState(false);

  // UI state
  const [step, setStep] = useState(1); // 1: Account, 2: Password, 3: Company (optional)
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Validation errors
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Clear error when inputs change
  useEffect(() => {
    if (error) setError(null);
  }, [firstName, lastName, email, password, confirmPassword]);

  // Validators
  const validateFirstName = (value: string): string => {
    if (!value.trim()) return 'Ingresa tu nombre';
    if (value.trim().length < 2) return 'El nombre es muy corto';
    return '';
  };

  const validateLastName = (value: string): string => {
    if (!value.trim()) return 'Ingresa tu apellido';
    if (value.trim().length < 2) return 'El apellido es muy corto';
    return '';
  };

  const validateEmail = (value: string): string => {
    if (!value) return 'Ingresa tu email';
    if (!emailRegex.test(value)) return 'Ingresa un email válido';
    return '';
  };

  const validatePassword = useCallback((value: string): string => {
    if (!value) return 'Ingresa una contraseña';
    if (value.length < 8) return 'Mínimo 8 caracteres';
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

  // Step validation
  const isStep1Valid = () => {
    return (
      firstName.trim().length >= 2 &&
      lastName.trim().length >= 2 &&
      emailRegex.test(email)
    );
  };

  const isStep2Valid = () => {
    return (
      password.length >= 8 &&
      confirmPassword === password &&
      acceptTerms
    );
  };

  // Handle step 1 continue
  const handleStep1Continue = () => {
    const fnError = validateFirstName(firstName);
    const lnError = validateLastName(lastName);
    const emError = validateEmail(email);

    setFirstNameError(fnError);
    setLastNameError(lnError);
    setEmailError(emError);

    if (!fnError && !lnError && !emError) {
      setStep(2);
    }
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Final validation
    const pwError = validatePassword(password);
    const cpError = validateConfirmPassword(confirmPassword);

    setPasswordError(pwError);
    setConfirmPasswordError(cpError);

    if (pwError || cpError || !acceptTerms) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data: RegisterFormData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        companyName: companyName.trim() || undefined,
        acceptTerms,
        acceptMarketing,
      };

      if (onRegister) {
        await onRegister(data);
        setShowSuccess(true);
      } else {
        // Demo mode
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setShowSuccess(true);
        console.log('Register:', data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la cuenta');
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
        await new Promise((resolve) => setTimeout(resolve, 1500));
        console.log('Social register:', provider);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Error al conectar con ${provider}`);
    } finally {
      setSocialLoading(null);
    }
  };

  // Step indicator
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2].map((s) => (
        <React.Fragment key={s}>
          <button
            type="button"
            onClick={() => s < step && setStep(s)}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              transition-all duration-300
              ${
                step === s
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                  : step > s
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white/5 text-zinc-500'
              }
            `}
            disabled={s > step}
          >
            {step > s ? <CheckCircle className="w-4 h-4" /> : s}
          </button>
          {s < 2 && (
            <div
              className={`w-12 h-0.5 rounded-full transition-colors duration-300 ${
                step > s ? 'bg-emerald-500' : 'bg-white/10'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Animated Background */}
      <AnimatedBackground variant="mesh" intensity="medium" />

      {/* Register Card */}
      <AuthCard variant="glass" padding="xl" maxWidth="md" animate>
        {/* Logo & Header */}
        <AuthCardHeader
          logo={
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-indigo-500 border-2 border-[#030014] flex items-center justify-center">
                <User className="w-3 h-3 text-white" />
              </div>
            </div>
          }
          title={step === 1 ? 'Crea tu cuenta' : 'Asegura tu cuenta'}
          subtitle={
            step === 1
              ? 'Únete a miles de empresas que confían en LITPER'
              : 'Elige una contraseña segura'
          }
        />

        {/* Step Indicator */}
        <StepIndicator />

        {/* Error message */}
        {(error || externalError) && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-shake">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-400 font-medium">Error al registrar</p>
              <p className="text-xs text-red-400/70 mt-0.5">{error || externalError}</p>
            </div>
          </div>
        )}

        {/* Success message */}
        {showSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-emerald-400 font-medium">¡Cuenta creada!</p>
                <p className="text-xs text-emerald-400/70">Revisa tu email para verificar</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Social Login + Basic Info */}
        {step === 1 && !showSuccess && (
          <>
            {/* Social Login Buttons */}
            <div className="space-y-3">
              <SocialButton
                provider="google"
                onClick={() => handleSocialLogin('google')}
                loading={socialLoading === 'google'}
                disabled={!!socialLoading}
                fullWidth
              />
              <div className="grid grid-cols-2 gap-3">
                <SocialButton
                  provider="github"
                  onClick={() => handleSocialLogin('github')}
                  loading={socialLoading === 'github'}
                  disabled={!!socialLoading}
                  showLabel={false}
                />
                <SocialButton
                  provider="microsoft"
                  onClick={() => handleSocialLogin('microsoft')}
                  loading={socialLoading === 'microsoft'}
                  disabled={!!socialLoading}
                  showLabel={false}
                />
              </div>
            </div>

            <AuthDivider text="o regístrate con email" />

            {/* Form Step 1 */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <AuthInput
                  id="firstName"
                  name="firstName"
                  type="text"
                  label="Nombre"
                  placeholder="Juan"
                  value={firstName}
                  onChange={setFirstName}
                  onBlur={() => setFirstNameError(validateFirstName(firstName))}
                  error={firstNameError}
                  icon={<User className="w-5 h-5" />}
                  autoComplete="given-name"
                  autoFocus
                  required
                />
                <AuthInput
                  id="lastName"
                  name="lastName"
                  type="text"
                  label="Apellido"
                  placeholder="Pérez"
                  value={lastName}
                  onChange={setLastName}
                  onBlur={() => setLastNameError(validateLastName(lastName))}
                  error={lastNameError}
                  autoComplete="family-name"
                  required
                />
              </div>

              <AuthInput
                id="email"
                name="email"
                type="email"
                label="Email corporativo"
                placeholder="tu@empresa.com"
                value={email}
                onChange={setEmail}
                onBlur={() => setEmailError(validateEmail(email))}
                error={emailError}
                icon={<Mail className="w-5 h-5" />}
                autoComplete="email"
                required
              />

              <AuthInput
                id="companyName"
                name="companyName"
                type="text"
                label="Empresa (opcional)"
                placeholder="Mi Empresa S.A.S"
                value={companyName}
                onChange={setCompanyName}
                icon={<Building2 className="w-5 h-5" />}
                autoComplete="organization"
              />

              <AuthButton
                type="button"
                variant="primary"
                size="xl"
                fullWidth
                onClick={handleStep1Continue}
                icon={<ArrowRight className="w-5 h-5" />}
                iconPosition="right"
                disabled={!isStep1Valid()}
              >
                Continuar
              </AuthButton>
            </div>
          </>
        )}

        {/* Step 2: Password */}
        {step === 2 && !showSuccess && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthInput
              id="password"
              name="password"
              type="password"
              label="Contraseña"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={setPassword}
              onBlur={() => setPasswordError(validatePassword(password))}
              error={passwordError}
              icon={<Lock className="w-5 h-5" />}
              showPasswordToggle
              autoComplete="new-password"
              autoFocus
              required
            />

            {/* Password strength meter */}
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
              onChange={setConfirmPassword}
              onBlur={() => setConfirmPasswordError(validateConfirmPassword(confirmPassword))}
              error={confirmPasswordError}
              success={confirmPassword && confirmPassword === password ? 'Las contraseñas coinciden' : undefined}
              icon={<Shield className="w-5 h-5" />}
              showPasswordToggle
              autoComplete="new-password"
              required
            />

            {/* Terms checkbox */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 rounded-md border border-white/20 bg-white/[0.03] peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all duration-200 group-hover:border-white/30">
                    {acceptTerms && (
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
                <span className="text-sm text-zinc-400 leading-relaxed">
                  Acepto los{' '}
                  <a href="#" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                    Términos de Servicio
                  </a>{' '}
                  y la{' '}
                  <a href="#" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                    Política de Privacidad
                  </a>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={acceptMarketing}
                    onChange={(e) => setAcceptMarketing(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 rounded-md border border-white/20 bg-white/[0.03] peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all duration-200 group-hover:border-white/30">
                    {acceptMarketing && (
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
                <span className="text-sm text-zinc-500">
                  Quiero recibir actualizaciones y novedades por email (opcional)
                </span>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <AuthButton
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => setStep(1)}
                icon={<ArrowLeft className="w-5 h-5" />}
              >
                Atrás
              </AuthButton>
              <AuthButton
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoading}
                loadingText="Creando cuenta..."
                icon={<CheckCircle className="w-5 h-5" />}
                iconPosition="right"
                disabled={!isStep2Valid()}
              >
                Crear cuenta
              </AuthButton>
            </div>
          </form>
        )}

        {/* Footer */}
        <AuthCardFooter align="center">
          <p className="text-sm text-zinc-500">
            ¿Ya tienes cuenta?{' '}
            <AuthLink variant="primary" onClick={onLogin}>
              Inicia sesión
            </AuthLink>
          </p>
        </AuthCardFooter>
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

export default RegisterPage;
