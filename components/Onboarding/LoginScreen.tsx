'use client';

import React, { useState, useEffect } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Shield,
  Truck,
  Package,
  CheckCircle,
} from 'lucide-react';
import { useOnboardingStore } from '../../stores/onboardingStore';

// ============================================
// LOGIN SCREEN - Pantalla de login mejorada
// Con loading states, shake animation, y transiciones
// ============================================

export const LoginScreen: React.FC = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const { login, isLoading, loginError, isAuthenticated } = useOnboardingStore();

  // Handle login
  const handleLogin = async () => {
    if (!password.trim() || isLoading) return;

    const result = await login(password);

    if (!result.success) {
      // Trigger shake animation
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    } else {
      // Trigger fade out animation
      setIsFadingOut(true);
    }
  };

  // Handle enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  // Features list
  const features = [
    { icon: Package, text: 'Tracking en tiempo real' },
    { icon: Truck, text: 'Multi-transportadora' },
    { icon: Shield, text: 'Seguridad empresarial' },
    { icon: Sparkles, text: 'IA predictiva' },
  ];

  return (
    <div
      className={`
        min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950
        flex items-center justify-center p-4
        transition-opacity duration-500
        ${isFadingOut ? 'opacity-0' : 'opacity-100'}
      `}
    >
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-violet-500/5 to-indigo-500/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="hidden lg:flex flex-col items-start animate-[fadeInUp_0.8s_ease-out]">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-8">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-violet-500/30 animate-[pulse_3s_ease-in-out_infinite]">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center animate-bounce">
                <Sparkles className="w-3 h-3 text-amber-900" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">
                LITPER <span className="text-violet-400">PRO</span>
              </h1>
              <p className="text-slate-400 text-sm">Logística Inteligente</p>
            </div>
          </div>

          {/* Tagline */}
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Tu operación logística,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
              simplificada
            </span>
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-md">
            Gestiona envíos, trackea en tiempo real y optimiza tu logística con inteligencia artificial.
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 hover:border-violet-500/30 transition-colors"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="p-2 bg-violet-500/20 rounded-lg">
                  <feature.icon className="w-5 h-5 text-violet-400" />
                </div>
                <span className="text-slate-300 text-sm font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right side - Login form */}
        <div
          className={`
            w-full max-w-md mx-auto
            animate-[fadeInUp_0.8s_ease-out]
            ${isShaking ? 'animate-[shake_0.5s_ease-in-out]' : ''}
          `}
          style={{ animationDelay: '0.2s' }}
        >
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl shadow-violet-500/10">
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-violet-500/30">
                <Package className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-black text-white">
                LITPER <span className="text-violet-400">PRO</span>
              </h1>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Bienvenido de vuelta</h2>
              <p className="text-slate-400">Ingresa tus credenciales para continuar</p>
            </div>

            {/* Error message */}
            {loginError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-[fadeIn_0.3s_ease-out]">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-red-400 font-medium text-sm">{loginError}</p>
                  <p className="text-red-400/70 text-xs mt-0.5">Verifica tu contraseña e intenta de nuevo</p>
                </div>
              </div>
            )}

            {/* Form */}
            <div className="space-y-5">
              {/* Email field (disabled/demo) */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Correo electrónico
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value="admin@litper.com"
                    disabled
                    className="w-full px-4 py-3.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-400 cursor-not-allowed"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-400">
                    Demo
                  </div>
                </div>
              </div>

              {/* Password field */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ingresa tu contraseña"
                    disabled={isLoading}
                    className={`
                      w-full px-4 py-3.5 pl-12 pr-12
                      bg-slate-800/50 border rounded-xl
                      text-white placeholder-slate-500
                      focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                      transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${loginError ? 'border-red-500/50' : 'border-slate-700/50'}
                    `}
                  />
                  <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Pista: usa <code className="px-1.5 py-0.5 bg-slate-800 rounded text-violet-400">admin123</code> o <code className="px-1.5 py-0.5 bg-slate-800 rounded text-violet-400">litper2025</code>
                </p>
              </div>

              {/* Remember me */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div
                    onClick={() => setRememberMe(!rememberMe)}
                    className={`
                      w-5 h-5 rounded border-2 flex items-center justify-center
                      transition-all duration-200
                      ${rememberMe
                        ? 'bg-violet-500 border-violet-500'
                        : 'border-slate-600 group-hover:border-slate-500'
                      }
                    `}
                  >
                    {rememberMe && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                    Recordarme
                  </span>
                </label>
                <button className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Submit button */}
              <button
                onClick={handleLogin}
                disabled={isLoading || !password.trim()}
                className={`
                  w-full py-4 rounded-xl font-semibold text-white
                  flex items-center justify-center gap-2
                  transition-all duration-300 transform
                  ${isLoading
                    ? 'bg-violet-600/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 hover:scale-[1.02] hover:shadow-lg hover:shadow-violet-500/25'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                `}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verificando credenciales...</span>
                  </>
                ) : (
                  <>
                    <span>Iniciar Sesión</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
              <p className="text-slate-500 text-sm">
                ¿No tienes cuenta?{' '}
                <button className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                  Solicitar acceso
                </button>
              </p>
            </div>
          </div>

          {/* Security badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-slate-500 text-xs">
            <Shield className="w-4 h-4" />
            <span>Conexión segura con encriptación de extremo a extremo</span>
          </div>
        </div>
      </div>

      {/* Add keyframes for shake animation */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default LoginScreen;
