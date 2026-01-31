// components/auth/LoginPage.tsx
// LITPER OFICIAL - Login Premium con Animaciones Logísticas Globales
import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Package,
  TrendingUp,
  Shield,
  Zap,
  AlertCircle,
  Loader2,
  ArrowRight,
  Check,
  Fingerprint,
  Smartphone,
  Truck,
  Plane,
  Globe,
  MapPin,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

// Logo LITPER con Corona - SVG Premium
const LitperLogo = ({ className = "w-20 h-20" }: { className?: string }) => (
  <svg viewBox="0 0 120 140" className={className}>
    <defs>
      {/* Gradiente dorado premium */}
      <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F5D061" />
        <stop offset="25%" stopColor="#D4A843" />
        <stop offset="50%" stopColor="#C9983A" />
        <stop offset="75%" stopColor="#D4A843" />
        <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
      {/* Gradiente corona roja */}
      <linearGradient id="crownRed" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#DC2626" />
        <stop offset="100%" stopColor="#991B1B" />
      </linearGradient>
      {/* Brillo */}
      <linearGradient id="goldShine" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFE55C" />
        <stop offset="50%" stopColor="#F5D061" />
        <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
      {/* Glow effect */}
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    {/* Corona */}
    <g filter="url(#glow)">
      {/* Base de la corona */}
      <path
        d="M30 45 L40 20 L50 35 L60 10 L70 35 L80 20 L90 45 L85 50 L35 50 Z"
        fill="url(#crownRed)"
        stroke="url(#goldGradient)"
        strokeWidth="2"
      />
      {/* Joyas de la corona */}
      <circle cx="60" cy="18" r="4" fill="#3B82F6" stroke="url(#goldGradient)" strokeWidth="1"/>
      <circle cx="40" cy="28" r="3" fill="#3B82F6" stroke="url(#goldGradient)" strokeWidth="1"/>
      <circle cx="80" cy="28" r="3" fill="#3B82F6" stroke="url(#goldGradient)" strokeWidth="1"/>
      {/* Banda dorada de la corona */}
      <rect x="35" y="42" width="50" height="8" fill="url(#goldGradient)" rx="2"/>
      <circle cx="45" cy="46" r="2" fill="#3B82F6"/>
      <circle cx="60" cy="46" r="2" fill="#3B82F6"/>
      <circle cx="75" cy="46" r="2" fill="#3B82F6"/>
    </g>

    {/* Letras LP */}
    <g filter="url(#glow)">
      {/* L */}
      <path
        d="M25 60 L25 120 L55 120 L55 110 L38 110 L38 60 Z"
        fill="url(#goldGradient)"
        stroke="url(#goldShine)"
        strokeWidth="1"
      />
      {/* P */}
      <path
        d="M50 60 L50 120 L63 120 L63 95 L80 95 Q95 95 95 77.5 Q95 60 80 60 Z M63 72 L63 83 L77 83 Q82 83 82 77.5 Q82 72 77 72 Z"
        fill="url(#goldGradient)"
        stroke="url(#goldShine)"
        strokeWidth="1"
      />
    </g>
  </svg>
);

// Animación de Red Global Logística
const GlobalLogisticsNetwork = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Mapa mundial estilizado con puntos */}
      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D4A843" stopOpacity="0"/>
            <stop offset="50%" stopColor="#D4A843" stopOpacity="1"/>
            <stop offset="100%" stopColor="#D4A843" stopOpacity="0"/>
          </linearGradient>
        </defs>

        {/* Puntos de ciudades/hubs logísticos */}
        {[
          { x: 150, y: 200, name: 'NYC' },
          { x: 250, y: 280, name: 'MIA' },
          { x: 180, y: 350, name: 'BOG' },
          { x: 220, y: 420, name: 'SAO' },
          { x: 480, y: 180, name: 'LON' },
          { x: 520, y: 220, name: 'MAD' },
          { x: 580, y: 280, name: 'DXB' },
          { x: 750, y: 200, name: 'HKG' },
          { x: 820, y: 250, name: 'SIN' },
          { x: 880, y: 350, name: 'SYD' },
        ].map((city, i) => (
          <g key={i}>
            {/* Pulso del punto */}
            <circle cx={city.x} cy={city.y} r="8" fill="#D4A843" opacity="0.3">
              <animate attributeName="r" values="8;20;8" dur={`${2 + i * 0.3}s`} repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.3;0;0.3" dur={`${2 + i * 0.3}s`} repeatCount="indefinite"/>
            </circle>
            {/* Punto central */}
            <circle cx={city.x} cy={city.y} r="4" fill="#D4A843">
              <animate attributeName="fill" values="#D4A843;#FFE55C;#D4A843" dur="2s" repeatCount="indefinite"/>
            </circle>
          </g>
        ))}

        {/* Rutas de envío animadas */}
        {[
          { x1: 150, y1: 200, x2: 480, y2: 180 },
          { x1: 180, y1: 350, x2: 250, y2: 280 },
          { x1: 520, y1: 220, x2: 750, y2: 200 },
          { x1: 580, y1: 280, x2: 820, y2: 250 },
          { x1: 250, y1: 280, x2: 520, y2: 220 },
        ].map((route, i) => (
          <g key={`route-${i}`}>
            <path
              d={`M${route.x1},${route.y1} Q${(route.x1 + route.x2) / 2},${Math.min(route.y1, route.y2) - 50} ${route.x2},${route.y2}`}
              fill="none"
              stroke="url(#routeGradient)"
              strokeWidth="2"
              strokeDasharray="10,10"
              opacity="0.5"
            >
              <animate attributeName="stroke-dashoffset" values="20;0" dur="1s" repeatCount="indefinite"/>
            </path>
            {/* Paquete moviéndose por la ruta */}
            <circle r="5" fill="#D4A843">
              <animateMotion
                dur={`${3 + i}s`}
                repeatCount="indefinite"
                path={`M${route.x1},${route.y1} Q${(route.x1 + route.x2) / 2},${Math.min(route.y1, route.y2) - 50} ${route.x2},${route.y2}`}
              />
            </circle>
          </g>
        ))}
      </svg>

      {/* Avión animado */}
      <div className="absolute top-1/4 animate-fly-across">
        <Plane className="w-8 h-8 text-amber-500/40 rotate-45" />
      </div>

      {/* Camión animado */}
      <div className="absolute bottom-1/3 animate-truck-move">
        <Truck className="w-6 h-6 text-amber-500/30" />
      </div>
    </div>
  );
};

// Partículas doradas flotantes
const GoldenParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 4 + 2 + 'px',
            height: Math.random() * 4 + 2 + 'px',
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            background: `linear-gradient(135deg, #D4A843, #FFE55C)`,
            animation: `floatGold ${Math.random() * 15 + 10}s linear infinite`,
            animationDelay: `-${Math.random() * 15}s`,
            opacity: Math.random() * 0.5 + 0.2,
          }}
        />
      ))}
    </div>
  );
};

// Fondo premium oscuro con destellos dorados
const PremiumBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Gradiente base oscuro premium */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a12] via-[#0d0d1a] to-[#0a0a12]" />

      {/* Resplandor dorado superior */}
      <div
        className="absolute -top-1/2 left-1/4 w-[80%] h-[80%] opacity-15"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(212, 168, 67, 0.4) 0%, transparent 50%)',
          animation: 'pulseGold 8s ease-in-out infinite',
        }}
      />

      {/* Resplandor rojo (corona) */}
      <div
        className="absolute top-1/4 right-1/4 w-[40%] h-[40%] opacity-10"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(220, 38, 38, 0.5) 0%, transparent 50%)',
          animation: 'pulseRed 10s ease-in-out infinite',
        }}
      />

      {/* Resplandor dorado inferior */}
      <div
        className="absolute -bottom-1/4 right-1/4 w-[60%] h-[60%] opacity-10"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(184, 134, 11, 0.4) 0%, transparent 50%)',
          animation: 'pulseGold 12s ease-in-out infinite reverse',
        }}
      />

      {/* Grid sutil */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(212, 168, 67, 0.3) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(212, 168, 67, 0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
};

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister }) => {
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await login({ email: email.trim(), password: password.trim() });
  };

  // OAuth Login handlers
  const handleOAuthLogin = async (provider: 'google' | 'microsoft' | 'apple') => {
    clearError();

    const clientIds = {
      google: import.meta.env.VITE_GOOGLE_CLIENT_ID || '487273250854-k66mjbe1s178kkfnibd7cl247s5kkqjj.apps.googleusercontent.com',
      microsoft: import.meta.env.VITE_MICROSOFT_CLIENT_ID || '',
      apple: import.meta.env.VITE_APPLE_CLIENT_ID || '',
    };

    const clientId = clientIds[provider];

    if (!clientId) {
      return;
    }

    const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback');

    const oauthUrls = {
      google: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=email%20profile&state=google&access_type=offline&prompt=consent`,
      microsoft: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile&state=microsoft`,
      apple: `https://appleid.apple.com/auth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=email%20name&state=apple&response_mode=form_post`,
    };

    window.location.href = oauthUrls[provider];
  };

  const features = [
    { icon: Globe, label: 'Cobertura Global', desc: 'Envíos a todo el mundo', color: 'amber' },
    { icon: TrendingUp, label: 'IA Predictiva', desc: 'Machine Learning avanzado', color: 'amber' },
    { icon: Zap, label: 'Tiempo Real', desc: 'Tracking instantáneo', color: 'amber' },
    { icon: Shield, label: 'Garantizado', desc: 'Calidad en cada detalle', color: 'red' },
  ];

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Fondos */}
      <PremiumBackground />
      <GlobalLogisticsNetwork />
      <GoldenParticles />

      {/* Contenido principal */}
      <div
        className={`relative w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-16 items-center transition-all duration-1000 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Panel izquierdo - Branding LITPER */}
        <div className="hidden lg:block text-white p-8 z-10">
          {/* Logo LITPER Premium */}
          <div className="flex items-center gap-6 mb-12">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 to-amber-700/20 rounded-3xl blur-2xl animate-pulse" />
              <LitperLogo className="w-24 h-28 relative z-10 drop-shadow-2xl" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
                LITPER
              </h1>
              <p className="text-red-500 font-semibold tracking-widest text-sm">OFICIAL</p>
              <p className="text-amber-500/60 text-xs mt-1 tracking-wider">Calidad en cada detalle</p>
            </div>
          </div>

          {/* Título principal */}
          <h2 className="text-5xl font-bold mb-6 leading-[1.1] tracking-tight">
            <span className="text-white">Tu socio en</span>
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
              logística premium
            </span>
          </h2>

          <p className="text-white/60 text-lg mb-12 leading-relaxed max-w-md">
            Más de <span className="text-amber-400 font-bold">500,000 envíos</span> gestionados con inteligencia artificial y precisión empresarial.
          </p>

          {/* Features con iconos de logística */}
          <div className="space-y-4">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-amber-500/10 backdrop-blur-sm
                  hover:bg-amber-500/5 hover:border-amber-500/20 transition-all duration-300 cursor-default"
                style={{
                  animation: mounted ? `slideInLeft 0.6s ease-out ${idx * 0.1}s both` : 'none'
                }}
              >
                <div className={`p-3 rounded-xl ${feature.color === 'red' ? 'bg-red-500/20' : 'bg-amber-500/20'}
                  group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-6 h-6 ${feature.color === 'red' ? 'text-red-400' : 'text-amber-400'}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{feature.label}</h3>
                  <p className="text-sm text-white/40">{feature.desc}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-amber-500/30 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>

          {/* Stats con estilo premium */}
          <div className="mt-12 pt-8 border-t border-amber-500/10 grid grid-cols-3 gap-6">
            {[
              { value: '99.9%', label: 'Entregas exitosas' },
              { value: '500K+', label: 'Envíos/mes' },
              { value: '24/7', label: 'Soporte premium' },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-xs text-white/40">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel derecho - Login Form */}
        <div className="relative z-10">
          {/* Card con borde dorado */}
          <div
            className="relative bg-black/40 backdrop-blur-2xl rounded-3xl border border-amber-500/20 shadow-2xl overflow-hidden"
            style={{
              boxShadow: '0 0 60px rgba(212, 168, 67, 0.1), 0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Línea dorada superior */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

            <div className="p-8 lg:p-10">
              {/* Logo móvil */}
              <div className="lg:hidden flex items-center justify-center gap-4 mb-8">
                <LitperLogo className="w-16 h-20" />
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">LITPER</h1>
                  <p className="text-red-500 text-xs font-semibold tracking-widest">OFICIAL</p>
                </div>
              </div>

              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Accede a tu cuenta
                </h2>
                <p className="text-amber-500/60">
                  Gestiona tus envíos con tecnología premium
                </p>
              </div>

              {/* Social Login */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {/* Google */}
                <button
                  type="button"
                  onClick={() => handleOAuthLogin('google')}
                  className="p-3 rounded-xl border border-amber-500/20 bg-white/[0.02] hover:bg-amber-500/10 hover:border-amber-500/40
                    transition-all duration-300 group flex items-center justify-center"
                  title="Continuar con Google"
                >
                  <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </button>

                {/* Microsoft */}
                <button
                  type="button"
                  onClick={() => handleOAuthLogin('microsoft')}
                  className="p-3 rounded-xl border border-amber-500/20 bg-white/[0.02] hover:bg-amber-500/10 hover:border-amber-500/40
                    transition-all duration-300 group flex items-center justify-center"
                  title="Continuar con Microsoft"
                >
                  <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path fill="#F25022" d="M1 1h10v10H1z"/>
                    <path fill="#00A4EF" d="M1 13h10v10H1z"/>
                    <path fill="#7FBA00" d="M13 1h10v10H13z"/>
                    <path fill="#FFB900" d="M13 13h10v10H13z"/>
                  </svg>
                </button>

                {/* Apple */}
                <button
                  type="button"
                  onClick={() => handleOAuthLogin('apple')}
                  className="p-3 rounded-xl border border-amber-500/20 bg-white/[0.02] hover:bg-amber-500/10 hover:border-amber-500/40
                    transition-all duration-300 group flex items-center justify-center"
                  title="Continuar con Apple"
                >
                  <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                <span className="text-xs text-amber-500/50 uppercase tracking-wider">o usa tu correo</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
              </div>

              {/* Error */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 animate-shake">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div className="relative">
                  <label className="block text-sm font-medium text-amber-500/70 mb-2">
                    Correo electrónico
                  </label>
                  <div className={`relative rounded-xl transition-all duration-300 ${
                    focusedField === 'email' ? 'ring-2 ring-amber-500/50' : ''
                  }`}>
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                      focusedField === 'email' ? 'text-amber-400' : 'text-amber-500/30'
                    }`} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value.trim())}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pastedText = e.clipboardData.getData('text').trim();
                        setEmail(pastedText);
                      }}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="tu@empresa.com"
                      autoComplete="email"
                      spellCheck={false}
                      className="w-full pl-12 pr-4 py-4 bg-black/30 border border-amber-500/20 rounded-xl
                        text-white placeholder-white/30
                        focus:outline-none focus:bg-black/40 focus:border-amber-500/50
                        transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="relative">
                  <label className="block text-sm font-medium text-amber-500/70 mb-2">
                    Contraseña
                  </label>
                  <div className={`relative rounded-xl transition-all duration-300 ${
                    focusedField === 'password' ? 'ring-2 ring-amber-500/50' : ''
                  }`}>
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                      focusedField === 'password' ? 'text-amber-400' : 'text-amber-500/30'
                    }`} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value.trim())}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pastedText = e.clipboardData.getData('text').trim();
                        setPassword(pastedText);
                      }}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••••"
                      autoComplete="current-password"
                      spellCheck={false}
                      className="w-full pl-12 pr-12 py-4 bg-black/30 border border-amber-500/20 rounded-xl
                        text-white placeholder-white/30
                        focus:outline-none focus:bg-black/40 focus:border-amber-500/50
                        transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500/30 hover:text-amber-400 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Options row */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      rememberMe
                        ? 'bg-amber-500 border-amber-500'
                        : 'border-amber-500/30 group-hover:border-amber-500/50'
                    }`}>
                      {rememberMe && <Check className="w-3 h-3 text-black" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only"
                    />
                    <span className="text-sm text-white/50 group-hover:text-white/70 transition-colors">
                      Recordar sesión
                    </span>
                  </label>
                  <button type="button" className="text-sm text-amber-400 hover:text-amber-300 font-medium transition-colors">
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                {/* Submit button - Botón dorado premium */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="relative w-full py-4 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-black font-bold rounded-xl
                    hover:from-amber-500 hover:via-amber-400 hover:to-amber-500 transition-all duration-300
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2
                    shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-[1.02]
                    active:scale-[0.98] overflow-hidden group"
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent
                    translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      <span>Iniciar Sesión</span>
                    </>
                  )}
                </button>

                {/* Biometric hint */}
                <div className="flex items-center justify-center gap-2 text-amber-500/30 text-sm">
                  <Fingerprint className="w-4 h-4" />
                  <span>Face ID / Touch ID disponible</span>
                </div>
              </form>

              {/* Register CTA */}
              <div className="mt-8 pt-6 border-t border-amber-500/10 text-center">
                <p className="text-white/40 mb-4">
                  ¿Nuevo en LITPER?
                </p>
                <button
                  onClick={onSwitchToRegister}
                  className="w-full py-3.5 border border-amber-500/30 text-amber-400 font-medium rounded-xl
                    hover:bg-amber-500/10 hover:border-amber-500/50 transition-all
                    flex items-center justify-center gap-2 group"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Crear cuenta empresarial</span>
                  <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </button>
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-6 flex items-center justify-center gap-6 text-amber-500/30 text-xs">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" />
              <span>2FA Premium</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>ISO 27001</span>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos de animación */}
      <style>{`
        @keyframes pulseGold {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.15; }
          50% { transform: translate(-5%, 5%) scale(1.1); opacity: 0.2; }
        }

        @keyframes pulseRed {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.1; }
          50% { transform: translate(5%, -5%) scale(1.05); opacity: 0.15; }
        }

        @keyframes floatGold {
          0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10% { opacity: 0.5; }
          90% { opacity: 0.5; }
          100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; }
        }

        @keyframes fly-across {
          0% { transform: translateX(-100px) translateY(0); opacity: 0; }
          10% { opacity: 0.4; }
          90% { opacity: 0.4; }
          100% { transform: translateX(calc(100vw + 100px)) translateY(-50px); opacity: 0; }
        }

        .animate-fly-across {
          animation: fly-across 15s linear infinite;
        }

        @keyframes truck-move {
          0% { transform: translateX(-50px); opacity: 0; }
          10% { opacity: 0.3; }
          90% { opacity: 0.3; }
          100% { transform: translateX(calc(100vw + 50px)); opacity: 0; }
        }

        .animate-truck-move {
          animation: truck-move 20s linear infinite;
          animation-delay: 5s;
        }

        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

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
