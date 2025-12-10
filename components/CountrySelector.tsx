import React, { useState } from 'react';
import { Country, CountryConfig, COUNTRY_CONFIGS } from '../types/country';
import { saveSelectedCountry } from '../services/countryService';
import { updateUserCountry } from '../services/gamificationService';
import {
  MapPin,
  Truck,
  Package,
  ArrowRight,
  Check,
  Crown,
  Sparkles,
  Shield,
  Zap,
  Brain,
  Trophy,
  Star,
  Users,
  BarChart3,
  Rocket,
  Activity,
  Target,
} from 'lucide-react';

interface CountrySelectorProps {
  onCountrySelected: (country: Country) => void;
}

// Banderas de países
const COUNTRY_FLAGS: Record<Country, string> = {
  [Country.COLOMBIA]: '🇨🇴',
  [Country.MEXICO]: '🇲🇽',
  [Country.PERU]: '🇵🇪',
};

const CountrySelector: React.FC<CountrySelectorProps> = ({ onCountrySelected }) => {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [showCarriers, setShowCarriers] = useState(false);

  const countries = Object.values(COUNTRY_CONFIGS);

  const handleCountryClick = (country: Country) => {
    setSelectedCountry(country);
    setShowCarriers(true);
  };

  const handleConfirm = () => {
    if (selectedCountry) {
      saveSelectedCountry(selectedCountry);
      updateUserCountry(selectedCountry);
      onCountrySelected(selectedCountry);
    }
  };

  const selectedConfig = selectedCountry ? COUNTRY_CONFIGS[selectedCountry] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-navy-950 to-slate-900 flex flex-col overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-corporate-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-accent-500/5 to-transparent rounded-full" />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      {/* Premium Header Bar */}
      <header className="relative z-10 bg-gradient-to-r from-navy-900/90 to-navy-800/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 p-2.5 rounded-xl shadow-lg shadow-yellow-500/30 animate-pulse">
              <Crown className="w-6 h-6 text-white drop-shadow" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                LITPER
                <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                  {' '}
                  PRO
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">
                Enterprise Logistics Platform
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-2 text-xs px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full font-bold border border-emerald-500/20">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Sistema Activo
            </span>
            <span className="text-xs px-4 py-1.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-full font-bold shadow-lg shadow-amber-500/20">
              v5.0 ENTERPRISE
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="max-w-6xl w-full">
          {/* Hero Section - Más impactante */}
          <div className="text-center mb-16">
            {/* Badge animado */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent-500/10 to-corporate-500/10 rounded-full border border-accent-500/20 mb-8 animate-fade-in">
              <Rocket className="w-4 h-4 text-accent-400 animate-bounce" />
              <span className="text-sm text-white font-semibold">
                Plataforma #1 en Latinoamérica
              </span>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
            </div>

            {/* Título principal con efecto */}
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tight">
              <span className="block text-slate-400 text-2xl md:text-3xl font-normal mb-2">
                Bienvenido a
              </span>
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                  LITPER PRO
                </span>
                <span className="absolute -top-4 -right-8 text-4xl animate-bounce">👑</span>
              </span>
            </h1>

            <p className="text-slate-400 text-xl max-w-3xl mx-auto leading-relaxed mb-8">
              La plataforma enterprise más avanzada para gestión logística con
              <span className="text-accent-400 font-semibold"> inteligencia artificial</span> y
              <span className="text-corporate-400 font-semibold"> análisis predictivo</span>
            </p>

            {/* Stats en línea */}
            <div className="flex flex-wrap items-center justify-center gap-8 mb-8">
              {[
                { value: '10K+', label: 'Empresas activas', icon: Users },
                { value: '50M+', label: 'Guías procesadas', icon: Package },
                { value: '99.9%', label: 'Uptime garantizado', icon: Activity },
                { value: '4.9★', label: 'Satisfacción', icon: Star },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl font-black text-white">{stat.value}</div>
                  <div className="text-xs text-slate-500 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* CTA para selección */}
            <div className="inline-flex items-center gap-2 text-accent-400 font-medium animate-pulse">
              <Target className="w-5 h-5" />
              <span>Selecciona tu país para comenzar</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          {/* Country Cards - Diseño mejorado con banderas */}
          {!showCarriers && (
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {countries.map((config) => (
                <button
                  key={config.code}
                  onClick={() => handleCountryClick(config.code)}
                  className={`relative group overflow-hidden rounded-3xl border-2 transition-all duration-500 transform hover:scale-[1.03] ${
                    selectedCountry === config.code
                      ? 'bg-gradient-to-br from-accent-500/20 to-accent-600/10 border-accent-500 shadow-2xl shadow-accent-500/30'
                      : 'bg-white/[0.03] border-white/10 hover:border-accent-500/50 hover:bg-white/[0.06] hover:shadow-2xl hover:shadow-accent-500/10'
                  }`}
                >
                  {/* Background gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-accent-500/0 via-transparent to-corporate-500/0 group-hover:from-accent-500/10 group-hover:to-corporate-500/10 transition-all duration-500" />

                  {/* Content */}
                  <div className="relative z-10 p-8">
                    {/* Bandera grande con efecto */}
                    <div className="relative inline-block mb-6">
                      <div className="text-8xl filter drop-shadow-2xl transform group-hover:scale-110 transition-transform duration-500">
                        {COUNTRY_FLAGS[config.code]}
                      </div>
                      {/* Glow behind flag */}
                      <div className="absolute inset-0 text-8xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity">
                        {COUNTRY_FLAGS[config.code]}
                      </div>
                      {/* Decorative elements */}
                      <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full opacity-0 group-hover:opacity-100 animate-ping transition-opacity" />
                      <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-accent-400 rounded-full opacity-0 group-hover:opacity-100 animate-pulse transition-opacity delay-150" />
                    </div>

                    {/* Country Name */}
                    <h3 className="text-3xl font-black text-white mb-4 group-hover:text-accent-400 transition-colors">
                      {config.name}
                    </h3>

                    {/* Info Pills */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 group-hover:border-accent-500/20 transition-colors">
                        <div className="p-2 bg-gradient-to-br from-accent-500/20 to-accent-600/10 rounded-lg">
                          <Truck className="w-5 h-5 text-accent-400" />
                        </div>
                        <div className="text-left">
                          <div className="text-white font-bold">{config.carriers.length}</div>
                          <div className="text-xs text-slate-500">Transportadoras</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 group-hover:border-emerald-500/20 transition-colors">
                        <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-lg">
                          <MapPin className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="text-left">
                          <div className="text-white font-bold">{config.phonePrefix}</div>
                          <div className="text-xs text-slate-500">Prefijo telefónico</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 group-hover:border-purple-500/20 transition-colors">
                        <div className="p-2 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-lg">
                          <Package className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="text-left">
                          <div className="text-white font-bold">{config.currency}</div>
                          <div className="text-xs text-slate-500">Moneda local</div>
                        </div>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <div className="mt-6 py-3 px-4 bg-gradient-to-r from-accent-500/20 to-accent-600/10 rounded-xl border border-accent-500/20 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-accent-400 font-bold">Seleccionar país</span>
                      <ArrowRight className="w-5 h-5 text-accent-400" />
                    </div>
                  </div>

                  {/* Selected indicator */}
                  {selectedCountry === config.code && (
                    <div className="absolute top-4 right-4 w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-lg shadow-accent-500/30">
                      <Check className="w-7 h-7 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Carriers Panel */}
          {showCarriers && selectedConfig && (
            <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10 p-8 mb-8 animate-fade-in">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="text-6xl">{COUNTRY_FLAGS[selectedConfig.code]}</div>
                  <div>
                    <h2 className="text-4xl font-black text-white">{selectedConfig.name}</h2>
                    <p className="text-slate-400 text-lg">
                      {selectedConfig.carriers.length} transportadoras disponibles
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCarriers(false)}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-slate-300 hover:text-white transition-all font-medium border border-white/10"
                >
                  ← Cambiar país
                </button>
              </div>

              {/* Carriers Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {selectedConfig.carriers.map((carrier) => (
                  <div
                    key={carrier.id}
                    className="bg-navy-900/50 backdrop-blur rounded-2xl p-5 border border-white/5 hover:border-accent-500/30 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="font-bold text-white text-lg">{carrier.name}</h4>
                      <span className="text-xs bg-accent-500/20 text-accent-400 px-3 py-1 rounded-full font-bold">
                        ⏱️ {carrier.avgDeliveryDays}d prom.
                      </span>
                    </div>

                    {/* Services */}
                    <div className="space-y-2 mb-4">
                      {carrier.services.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center justify-between text-sm bg-white/5 rounded-lg px-3 py-2"
                        >
                          <span className="text-slate-300">{service.name}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              service.type === 'express'
                                ? 'bg-red-500/20 text-red-400'
                                : service.type === 'standard'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {service.avgDays === 0 ? '⚡ Mismo día' : `📦 ${service.avgDays}d`}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Coverage */}
                    <div className="flex flex-wrap gap-1">
                      {carrier.coverage.slice(0, 3).map((cov, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-white/10 text-slate-300 px-2 py-1 rounded-lg"
                        >
                          📍 {cov}
                        </span>
                      ))}
                      {carrier.coverage.length > 3 && (
                        <span className="text-[10px] bg-white/10 text-slate-400 px-2 py-1 rounded-lg">
                          +{carrier.coverage.length - 3} más
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleConfirm}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-bold py-5 px-8 rounded-2xl transition-all transform hover:scale-[1.01] shadow-xl shadow-accent-500/30 text-lg group"
              >
                <Rocket className="w-6 h-6 group-hover:animate-bounce" />
                <span>Comenzar con {selectedConfig.name}</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {/* Features Preview - Más compacto y elegante */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                emoji: '📊',
                title: 'Intel. Logística',
                desc: 'Análisis en tiempo real',
                color: 'from-cyan-500 to-blue-500',
              },
              {
                emoji: '🧠',
                title: 'IA Predictiva',
                desc: 'Anticipa tu demanda',
                color: 'from-purple-500 to-violet-500',
              },
              {
                emoji: '🏆',
                title: 'Gamificación',
                desc: 'Gana XP y recompensas',
                color: 'from-indigo-500 to-purple-500',
              },
              {
                emoji: '🤖',
                title: 'Asistente IA',
                desc: 'Soporte inteligente 24/7',
                color: 'from-pink-500 to-rose-500',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative overflow-hidden bg-white/[0.03] backdrop-blur rounded-2xl p-5 border border-white/5 hover:border-white/20 transition-all hover:transform hover:scale-105"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                />
                <div className="relative z-10">
                  <div className="text-4xl mb-3">{feature.emoji}</div>
                  <h4 className="font-bold text-white text-sm mb-1">{feature.title}</h4>
                  <p className="text-slate-500 text-xs">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-navy-900/50 border-t border-white/5 py-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <p className="text-slate-500 text-xs">© 2025 LITPER PRO Enterprise Logistics</p>
          <div className="flex items-center gap-4">
            <span className="text-slate-600 text-xs">Tecnología de clase mundial</span>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CountrySelector;
