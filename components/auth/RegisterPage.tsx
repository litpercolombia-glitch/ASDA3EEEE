// components/auth/RegisterPage.tsx
// Página de registro de usuarios
import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  UserPlus,
  ArrowLeft,
  Sparkles,
  Package,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin }) => {
  const { register, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (formData.password !== formData.confirmPassword) {
      return;
    }

    if (!acceptTerms) {
      return;
    }

    await register({
      nombre: formData.nombre,
      email: formData.email,
      password: formData.password,
    });
  };

  // Validaciones
  const passwordsMatch = formData.password === formData.confirmPassword;
  const passwordValid = formData.password.length >= 6;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const canSubmit = formData.nombre && emailValid && passwordValid && passwordsMatch && acceptTerms;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Efectos de fondo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative w-full max-w-xl">
        <div className="bg-white dark:bg-navy-900 rounded-3xl shadow-2xl p-8 lg:p-10 border border-slate-200 dark:border-navy-700">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={onSwitchToLogin}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Volver</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-slate-800 dark:text-white">LITPER PRO</span>
            </div>
          </div>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              Crear cuenta nueva
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Únete a LITPER PRO y optimiza tu logística
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Nombre completo
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Tu nombre"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-xl
                    text-slate-800 dark:text-white placeholder-slate-400
                    focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500
                    transition-all"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  className={`w-full pl-12 pr-12 py-3.5 bg-slate-50 dark:bg-navy-800 border rounded-xl
                    text-slate-800 dark:text-white placeholder-slate-400
                    focus:outline-none focus:ring-2 transition-all
                    ${formData.email && !emailValid
                      ? 'border-red-300 focus:ring-red-500/50 focus:border-red-500'
                      : formData.email && emailValid
                      ? 'border-emerald-300 focus:ring-emerald-500/50 focus:border-emerald-500'
                      : 'border-slate-200 dark:border-navy-600 focus:ring-emerald-500/50 focus:border-emerald-500'
                    }`}
                  required
                />
                {formData.email && emailValid && (
                  <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                )}
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  className={`w-full pl-12 pr-12 py-3.5 bg-slate-50 dark:bg-navy-800 border rounded-xl
                    text-slate-800 dark:text-white placeholder-slate-400
                    focus:outline-none focus:ring-2 transition-all
                    ${formData.password && !passwordValid
                      ? 'border-red-300 focus:ring-red-500/50 focus:border-red-500'
                      : formData.password && passwordValid
                      ? 'border-emerald-300 focus:ring-emerald-500/50 focus:border-emerald-500'
                      : 'border-slate-200 dark:border-navy-600 focus:ring-emerald-500/50 focus:border-emerald-500'
                    }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formData.password && !passwordValid && (
                <p className="text-red-500 text-xs mt-1">La contraseña debe tener al menos 6 caracteres</p>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Confirmar contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repite tu contraseña"
                  className={`w-full pl-12 pr-12 py-3.5 bg-slate-50 dark:bg-navy-800 border rounded-xl
                    text-slate-800 dark:text-white placeholder-slate-400
                    focus:outline-none focus:ring-2 transition-all
                    ${formData.confirmPassword && !passwordsMatch
                      ? 'border-red-300 focus:ring-red-500/50 focus:border-red-500'
                      : formData.confirmPassword && passwordsMatch
                      ? 'border-emerald-300 focus:ring-emerald-500/50 focus:border-emerald-500'
                      : 'border-slate-200 dark:border-navy-600 focus:ring-emerald-500/50 focus:border-emerald-500'
                    }`}
                  required
                />
                {formData.confirmPassword && passwordsMatch && (
                  <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                )}
              </div>
              {formData.confirmPassword && !passwordsMatch && (
                <p className="text-red-500 text-xs mt-1">Las contraseñas no coinciden</p>
              )}
            </div>

            {/* Términos */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
              />
              <label htmlFor="terms" className="text-sm text-slate-600 dark:text-slate-400">
                Acepto los{' '}
                <button type="button" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  términos y condiciones
                </button>{' '}
                y la{' '}
                <button type="button" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  política de privacidad
                </button>
              </label>
            </div>

            {/* Botón de registro */}
            <button
              type="submit"
              disabled={!canSubmit || isLoading}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl
                hover:from-emerald-600 hover:to-teal-600 transition-all
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
                shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Crear cuenta
                </>
              )}
            </button>
          </form>

          {/* Beneficios */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-navy-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-4">
              Al registrarte obtienes:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Sparkles, label: 'IA Predictiva' },
                { icon: Shield, label: 'Datos seguros' },
              ].map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <benefit.icon className="w-4 h-4 text-emerald-500" />
                  <span>{benefit.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
