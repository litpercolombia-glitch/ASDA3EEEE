/**
 * LOGIN SELECTOR - LITPER LOGISTICS INTELLIGENCE
 * Premium world-class login experience
 * Inspired by: Vercel, Linear, Stripe, Amazon DSP, Flexport
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Crown,
  Lock,
  LogIn,
  ShieldCheck,
  AlertCircle,
  Truck,
  BarChart3,
  Globe2,
  Zap,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { LoginSelectorProps } from '../../types/analisis-rondas';
import { USUARIOS_OPERADORES, ADMIN_CONFIG } from '../../constants/analisis-rondas';

// Animated floating orb component
const FloatingOrb: React.FC<{ delay: number; size: number; color: string; x: number; y: number }> = ({ delay, size, color, x, y }) => (
  <div
    className="absolute rounded-full opacity-20 blur-3xl"
    style={{
      width: size,
      height: size,
      background: color,
      left: `${x}%`,
      top: `${y}%`,
      animation: `float-orb ${8 + delay}s ease-in-out infinite ${delay}s`,
    }}
  />
);

// Animated stat counter
const AnimatedStat: React.FC<{ end: number; suffix: string; label: string; icon: React.ReactNode }> = ({ end, suffix, label, icon }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let frame: number;
    const duration = 2000;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [end]);

  return (
    <div className="text-center">
      <div className="flex items-center justify-center mb-1 opacity-60">{icon}</div>
      <div className="text-xl font-bold text-white">{count.toLocaleString()}{suffix}</div>
      <div className="text-[10px] uppercase tracking-wider text-white/50 font-medium">{label}</div>
    </div>
  );
};

// Animated grid pattern
const GridPattern: React.FC = () => (
  <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)" />
  </svg>
);

export const LoginSelector: React.FC<LoginSelectorProps> = ({ onLogin }) => {
  const [modoAdmin, setModoAdmin] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<string>('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [intentos, setIntentos] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredUser, setHoveredUser] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLoginOperador = useCallback(() => {
    if (!usuarioSeleccionado) {
      setError('Selecciona un operador');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      onLogin({ usuario: usuarioSeleccionado, esAdmin: false, autenticado: true });
    }, 600);
  }, [usuarioSeleccionado, onLogin]);

  const handleLoginAdmin = useCallback(() => {
    if (password === ADMIN_CONFIG.password) {
      setIsLoading(true);
      setTimeout(() => {
        onLogin({ usuario: ADMIN_CONFIG.username, esAdmin: true, autenticado: true });
      }, 600);
    } else {
      setIntentos(prev => prev + 1);
      setError(`Credenciales incorrectas${intentos >= 2 ? ' (' + (intentos + 1) + ')' : ''}`);
      setPassword('');
    }
  }, [password, intentos, onLogin]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (modoAdmin) handleLoginAdmin();
      else if (usuarioSeleccionado) handleLoginOperador();
    }
  }, [modoAdmin, handleLoginAdmin, handleLoginOperador, usuarioSeleccionado]);

  return (
    <>
      {/* Global keyframe animations */}
      <style>{`
        @keyframes float-orb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -20px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(10px, -30px) scale(1.05); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
          100% { transform: scale(0.95); opacity: 1; }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
          50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.6); }
        }
        .login-card-enter {
          animation: slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.3s; }
        .stagger-4 { animation-delay: 0.4s; }
        .user-card-hover {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .user-card-hover:hover {
          transform: translateY(-4px) scale(1.02);
        }
        .btn-shimmer {
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
        }
        .gradient-border {
          position: relative;
        }
        .gradient-border::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(135deg, #8b5cf6, #06b6d4, #10b981, #f59e0b);
          background-size: 300% 300%;
          animation: gradient-shift 4s ease infinite;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }
      `}</style>

      {/* Full-screen premium background */}
      <div className="min-h-screen w-full relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0a0a1a 0%, #0f172a 25%, #1e1b4b 50%, #0f172a 75%, #0a0a1a 100%)',
        }}
      >
        {/* Animated mesh gradient overlay */}
        <div className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 20% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(6, 182, 212, 0.12) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)',
          }}
        />

        {/* Grid pattern */}
        <GridPattern />

        {/* Floating orbs */}
        <FloatingOrb delay={0} size={300} color="rgba(139, 92, 246, 0.4)" x={10} y={20} />
        <FloatingOrb delay={2} size={200} color="rgba(6, 182, 212, 0.3)" x={70} y={10} />
        <FloatingOrb delay={4} size={250} color="rgba(16, 185, 129, 0.25)" x={50} y={70} />
        <FloatingOrb delay={1} size={180} color="rgba(245, 158, 11, 0.2)" x={85} y={60} />
        <FloatingOrb delay={3} size={150} color="rgba(236, 72, 153, 0.2)" x={20} y={80} />

        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
          }}
        />

        {/* Main layout: Two-column on desktop, stacked on mobile */}
        <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
          {/* Left side: Brand + Stats */}
          <div className="lg:w-1/2 flex flex-col justify-center px-6 py-10 lg:px-16 lg:py-0">
            <div className={`max-w-lg mx-auto lg:mx-0 ${mounted ? 'login-card-enter' : 'opacity-0'}`}>
              {/* Brand badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-6"
                style={{ animation: mounted ? 'slide-in-left 0.5s ease forwards' : 'none' }}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-white/70 tracking-wide uppercase">Plataforma Enterprise Activa</span>
              </div>

              {/* Main title */}
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight mb-4">
                <span className="text-white">LITPER</span>
                <br />
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #8b5cf6, #06b6d4, #10b981)',
                    backgroundSize: '200% 200%',
                    animation: 'gradient-shift 3s ease infinite',
                  }}
                >
                  Logistics Intelligence
                </span>
              </h1>

              <p className="text-base lg:text-lg text-white/50 leading-relaxed mb-8 max-w-md">
                Sistema de control de rondas con inteligencia de datos en tiempo real.
                Analiza, optimiza y escala tu operacion logistica.
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-2 mb-10">
                {[
                  { icon: <TrendingUp className="w-3.5 h-3.5" />, label: 'Analytics en Tiempo Real' },
                  { icon: <Package className="w-3.5 h-3.5" />, label: 'Control de Rondas' },
                  { icon: <MapPin className="w-3.5 h-3.5" />, label: 'Tracking GPS' },
                  { icon: <Zap className="w-3.5 h-3.5" />, label: 'Scorecard DSP' },
                ].map((feat, i) => (
                  <div
                    key={feat.label}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-medium"
                    style={{ animation: mounted ? `slide-in-left 0.5s ease ${0.2 + i * 0.1}s forwards` : 'none', opacity: mounted ? 0 : 1 }}
                  >
                    {feat.icon}
                    {feat.label}
                  </div>
                ))}
              </div>

              {/* Live stats bar */}
              <div className="hidden lg:block">
                <div className="grid grid-cols-4 gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
                  <AnimatedStat end={9} suffix="" label="Operadores" icon={<User className="w-3.5 h-3.5 text-violet-400" />} />
                  <AnimatedStat end={847} suffix="+" label="Rondas / mes" icon={<Truck className="w-3.5 h-3.5 text-cyan-400" />} />
                  <AnimatedStat end={94} suffix="%" label="Tasa Exito" icon={<BarChart3 className="w-3.5 h-3.5 text-emerald-400" />} />
                  <AnimatedStat end={3} suffix=" min" label="Tiempo / Guia" icon={<Clock className="w-3.5 h-3.5 text-amber-400" />} />
                </div>

                {/* Trust badges */}
                <div className="flex items-center gap-3 mt-6">
                  <div className="flex items-center gap-1.5 text-white/30 text-xs">
                    <Globe2 className="w-3.5 h-3.5" />
                    <span>Global Standard</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-white/20" />
                  <div className="flex items-center gap-1.5 text-white/30 text-xs">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Datos Seguros</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-white/20" />
                  <div className="flex items-center gap-1.5 text-white/30 text-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI-Powered</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side: Login Card */}
          <div className="lg:w-1/2 flex items-center justify-center px-6 py-8 lg:py-0">
            <div
              className={`w-full max-w-md ${mounted ? 'login-card-enter stagger-2' : 'opacity-0'}`}
              style={{ opacity: mounted ? undefined : 0 }}
            >
              {/* Card with animated gradient border */}
              <div className="gradient-border rounded-2xl">
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: 'linear-gradient(180deg, rgba(30, 27, 75, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
                    backdropFilter: 'blur(40px)',
                  }}
                >
                  {/* Card header with animated accent */}
                  <div className="relative px-6 pt-6 pb-4">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[2px] rounded-full"
                      style={{
                        background: 'linear-gradient(90deg, transparent, #8b5cf6, #06b6d4, transparent)',
                      }}
                    />
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="text-lg font-semibold text-white tracking-tight">
                        {modoAdmin ? 'Acceso Administrativo' : 'Inicio de Sesion'}
                      </h2>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] text-emerald-400/80 uppercase tracking-wider font-medium">Online</span>
                      </div>
                    </div>
                    <p className="text-sm text-white/40">
                      {modoAdmin ? 'Panel de control completo del equipo' : 'Selecciona tu perfil para continuar'}
                    </p>
                  </div>

                  {/* Mode toggle - sleek pill design */}
                  <div className="px-6 pb-4">
                    <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                      <button
                        onClick={() => { setModoAdmin(false); setError(null); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                          !modoAdmin
                            ? 'bg-gradient-to-r from-violet-600/80 to-cyan-600/80 text-white shadow-lg shadow-violet-500/20'
                            : 'text-white/40 hover:text-white/60'
                        }`}
                      >
                        <User className="w-4 h-4" />
                        Operador
                      </button>
                      <button
                        onClick={() => { setModoAdmin(true); setError(null); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                          modoAdmin
                            ? 'bg-gradient-to-r from-amber-600/80 to-orange-600/80 text-white shadow-lg shadow-amber-500/20'
                            : 'text-white/40 hover:text-white/60'
                        }`}
                      >
                        <Crown className="w-4 h-4" />
                        Admin
                      </button>
                    </div>
                  </div>

                  {/* Content area */}
                  <div className="px-6 pb-6">
                    {/* Error message */}
                    {error && (
                      <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2.5"
                        style={{ animation: 'slide-up 0.3s ease' }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        </div>
                        <span className="text-sm text-red-300">{error}</span>
                      </div>
                    )}

                    {!modoAdmin ? (
                      /* Operator mode */
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-2">
                          {USUARIOS_OPERADORES.map((usuario, index) => {
                            const isSelected = usuarioSeleccionado === usuario.nombre;
                            const isHovered = hoveredUser === usuario.id;
                            return (
                              <button
                                key={usuario.id}
                                onClick={() => { setUsuarioSeleccionado(usuario.nombre); setError(null); }}
                                onMouseEnter={() => setHoveredUser(usuario.id)}
                                onMouseLeave={() => setHoveredUser(null)}
                                className="user-card-hover relative group rounded-xl p-3 text-center border transition-all duration-300 overflow-hidden"
                                style={{
                                  background: isSelected
                                    ? `linear-gradient(135deg, ${usuario.color}20, ${usuario.color}10)`
                                    : 'rgba(255,255,255,0.02)',
                                  borderColor: isSelected ? `${usuario.color}60` : 'rgba(255,255,255,0.06)',
                                  boxShadow: isSelected ? `0 0 20px ${usuario.color}20, 0 4px 12px rgba(0,0,0,0.3)` : 'none',
                                  animation: mounted ? `slide-up 0.4s ease ${0.05 * index}s forwards` : 'none',
                                  opacity: mounted ? 0 : 1,
                                }}
                              >
                                {/* Glow effect on hover */}
                                {(isHovered || isSelected) && (
                                  <div className="absolute inset-0 opacity-20 transition-opacity"
                                    style={{
                                      background: `radial-gradient(circle at center, ${usuario.color}, transparent 70%)`,
                                    }}
                                  />
                                )}

                                {/* Avatar circle */}
                                <div
                                  className="relative mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300"
                                  style={{
                                    background: isSelected
                                      ? `linear-gradient(135deg, ${usuario.color}, ${usuario.color}80)`
                                      : `${usuario.color}15`,
                                    boxShadow: isSelected ? `0 0 15px ${usuario.color}40` : 'none',
                                  }}
                                >
                                  {isSelected ? (
                                    <CheckCircle2 className="w-5 h-5 text-white" />
                                  ) : (
                                    <span className="text-lg">{usuario.icono || '👤'}</span>
                                  )}
                                </div>

                                {/* Name */}
                                <span className={`text-[11px] font-semibold tracking-wide transition-colors ${
                                  isSelected ? 'text-white' : 'text-white/50 group-hover:text-white/70'
                                }`}>
                                  {usuario.nombre}
                                </span>

                                {/* Active indicator */}
                                {isSelected && (
                                  <div className="absolute -bottom-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                                    style={{ background: usuario.color }}
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Login button */}
                        <button
                          onClick={handleLoginOperador}
                          disabled={!usuarioSeleccionado || isLoading}
                          className={`w-full relative group flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 overflow-hidden ${
                            usuarioSeleccionado
                              ? 'text-white shadow-lg'
                              : 'text-white/30 bg-white/[0.04] border border-white/[0.06] cursor-not-allowed'
                          }`}
                          style={usuarioSeleccionado ? {
                            background: `linear-gradient(135deg, ${
                              USUARIOS_OPERADORES.find(u => u.nombre === usuarioSeleccionado)?.color || '#8b5cf6'
                            }, ${
                              USUARIOS_OPERADORES.find(u => u.nombre === usuarioSeleccionado)?.color || '#8b5cf6'
                            }cc)`,
                            boxShadow: `0 4px 20px ${
                              USUARIOS_OPERADORES.find(u => u.nombre === usuarioSeleccionado)?.color || '#8b5cf6'
                            }40`,
                          } : {}}
                        >
                          {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <LogIn className="w-4.5 h-4.5" />
                              <span>{usuarioSeleccionado ? `Continuar como ${usuarioSeleccionado}` : 'Selecciona un operador'}</span>
                              {usuarioSeleccionado && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                            </>
                          )}
                        </button>

                        <p className="text-[11px] text-center text-white/25 flex items-center justify-center gap-1.5">
                          <Lock className="w-3 h-3" />
                          Cada operador accede unicamente a sus propias metricas
                        </p>
                      </div>
                    ) : (
                      /* Admin mode */
                      <div className="space-y-5">
                        {/* Admin shield icon */}
                        <div className="flex justify-center">
                          <div className="relative">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                              style={{
                                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(234, 88, 12, 0.1))',
                                border: '1px solid rgba(245, 158, 11, 0.2)',
                              }}
                            >
                              <ShieldCheck className="w-8 h-8 text-amber-400" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                              <Crown className="w-2.5 h-2.5 text-white" />
                            </div>
                          </div>
                        </div>

                        <p className="text-center text-sm text-white/40">
                          Ingresa las credenciales de administrador
                        </p>

                        {/* Password input */}
                        <div className="space-y-2">
                          <label className="flex items-center gap-1.5 text-xs font-medium text-white/50 uppercase tracking-wider">
                            <Lock className="w-3 h-3" />
                            Contrasena
                          </label>
                          <div className="relative group">
                            <input
                              type="password"
                              value={password}
                              onChange={(e) => { setPassword(e.target.value); setError(null); }}
                              onKeyDown={handleKeyPress}
                              placeholder="Ingresa la contrasena"
                              className="w-full px-4 py-3.5 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all duration-300 focus:ring-2 focus:ring-amber-500/30"
                              style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                              }}
                              autoFocus
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <ShieldCheck className="w-4 h-4 text-white/15" />
                            </div>
                          </div>
                        </div>

                        {/* Admin login button */}
                        <button
                          onClick={handleLoginAdmin}
                          disabled={!password || isLoading}
                          className={`w-full group flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                            password
                              ? 'text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30'
                              : 'text-white/30 bg-white/[0.04] border border-white/[0.06] cursor-not-allowed'
                          }`}
                          style={password ? {
                            background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                          } : {}}
                        >
                          {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <Crown className="w-4.5 h-4.5" />
                              <span>Acceder al Panel Admin</span>
                              {password && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                            </>
                          )}
                        </button>

                        {/* Admin features list */}
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { icon: <BarChart3 className="w-3 h-3" />, text: 'Dashboard completo' },
                            { icon: <TrendingUp className="w-3 h-3" />, text: 'Scorecard semanal' },
                            { icon: <Package className="w-3 h-3" />, text: 'Gestion de rondas' },
                            { icon: <Sparkles className="w-3 h-3" />, text: 'IA y analytics' },
                          ].map((feat) => (
                            <div key={feat.text} className="flex items-center gap-1.5 text-[10px] text-white/25 px-2 py-1.5 rounded-lg bg-white/[0.02]">
                              {feat.icon}
                              {feat.text}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom info */}
              <div className="mt-4 flex items-center justify-between px-2">
                <span className="text-[10px] text-white/20 font-medium tracking-wide">
                  LITPER PRO v2.0
                </span>
                <div className="flex items-center gap-1 text-[10px] text-white/20">
                  <Globe2 className="w-3 h-3" />
                  <span>Colombia</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-only stats (shown below login on small screens) */}
        <div className="lg:hidden relative z-10 px-6 pb-10">
          <div className="grid grid-cols-4 gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
            <AnimatedStat end={9} suffix="" label="Operadores" icon={<User className="w-3 h-3 text-violet-400" />} />
            <AnimatedStat end={847} suffix="" label="Rondas" icon={<Truck className="w-3 h-3 text-cyan-400" />} />
            <AnimatedStat end={94} suffix="%" label="Exito" icon={<BarChart3 className="w-3 h-3 text-emerald-400" />} />
            <AnimatedStat end={3} suffix="m" label="/ Guia" icon={<Clock className="w-3 h-3 text-amber-400" />} />
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginSelector;
