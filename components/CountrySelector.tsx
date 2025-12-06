import React, { useState } from 'react';
import { Country, CountryConfig, COUNTRY_CONFIGS } from '../types/country';
import { saveSelectedCountry } from '../services/countryService';
import { updateUserCountry } from '../services/gamificationService';
import { MapPin, Truck, Package, ArrowRight, Check, Globe, Crown, Sparkles, Shield, Zap, Brain, Trophy, Star, Users, TrendingUp, BarChart3 } from 'lucide-react';

interface CountrySelectorProps {
  onCountrySelected: (country: Country) => void;
}

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
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-corporate-950 flex flex-col">
      {/* Premium Header Bar */}
      <header className="bg-gradient-to-r from-navy-900/80 to-navy-800/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-accent-500 to-accent-600 p-2 rounded-xl shadow-lg">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                LITPER<span className="text-accent-400">.io</span>
              </h1>
              <p className="text-[9px] text-slate-400 font-medium tracking-widest uppercase -mt-0.5">
                Logistics Platform
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-3 py-1 bg-emerald-600/20 text-emerald-400 rounded-full font-bold border border-emerald-600/30">
              🔒 Conexión Segura
            </span>
            <span className="text-xs px-3 py-1 bg-accent-600 text-white rounded-full font-bold">
              PREMIUM
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="max-w-5xl w-full">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 mb-6">
              <Sparkles className="w-4 h-4 text-accent-400" />
              <span className="text-sm text-slate-300 font-medium">Plataforma de Clase Mundial</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
              Bienvenido a{' '}
              <span className="bg-gradient-to-r from-accent-400 to-accent-600 bg-clip-text text-transparent">
                LITPER
              </span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
              La plataforma más avanzada de gestión logística con inteligencia artificial.
              Selecciona tu país para comenzar.
            </p>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-6 mt-6">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span>4.9/5 Rating</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Users className="w-4 h-4 text-corporate-400" />
                <span>10K+ Usuarios</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>100% Seguro</span>
              </div>
            </div>
          </div>

          {/* Country Cards */}
          {!showCarriers && (
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {countries.map((config) => (
                <button
                  key={config.code}
                  onClick={() => handleCountryClick(config.code)}
                  className={`relative group p-8 rounded-3xl border-2 transition-all duration-500 transform hover:scale-[1.02] ${
                    selectedCountry === config.code
                      ? 'bg-gradient-to-br from-accent-500/20 to-accent-600/10 border-accent-500 shadow-2xl shadow-accent-500/20'
                      : 'bg-white/5 border-white/10 hover:border-accent-500/50 hover:bg-white/10 hover:shadow-xl'
                  }`}
                >
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-accent-500/0 to-accent-600/0 group-hover:from-accent-500/5 group-hover:to-accent-600/10 rounded-3xl transition-all duration-500" />

                  <div className="relative z-10">
                    {/* Flag with animation */}
                    <div className="text-7xl mb-5 transform group-hover:scale-110 transition-transform duration-300">
                      {config.flag}
                    </div>

                    {/* Country Name */}
                    <h3 className="text-2xl font-bold text-white mb-3">{config.name}</h3>

                    {/* Info Cards */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                        <div className="p-1.5 bg-accent-500/20 rounded-lg">
                          <Truck className="w-4 h-4 text-accent-400" />
                        </div>
                        <span className="text-sm text-slate-300">{config.carriers.length} transportadoras</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                        <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                          <MapPin className="w-4 h-4 text-emerald-400" />
                        </div>
                        <span className="text-sm text-slate-300">Prefijo: {config.phonePrefix}</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                        <div className="p-1.5 bg-purple-500/20 rounded-lg">
                          <Package className="w-4 h-4 text-purple-400" />
                        </div>
                        <span className="text-sm text-slate-300">Moneda: {config.currency}</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-4 flex items-center justify-center gap-2 text-accent-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Seleccionar</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Selected indicator */}
                  {selectedCountry === config.code && (
                    <div className="absolute top-4 right-4 w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Carriers Panel */}
          {showCarriers && selectedConfig && (
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 mb-8 animate-fade-in">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{selectedConfig.flag}</div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">{selectedConfig.name}</h2>
                    <p className="text-slate-400">🚚 {selectedConfig.carriers.length} transportadoras disponibles</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCarriers(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-slate-300 hover:text-white transition-all text-sm font-medium"
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
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-bold py-5 px-8 rounded-2xl transition-all transform hover:scale-[1.01] shadow-xl shadow-accent-500/30 text-lg"
              >
                <span>🚀 Comenzar con {selectedConfig.name}</span>
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          )}

          {/* Features Preview */}
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { icon: Zap, emoji: '⚡', title: 'Litper Flash', desc: 'Cotizaciones en 8 segundos', color: 'from-orange-500 to-red-500' },
              { icon: Brain, emoji: '🧠', title: 'IA Predictiva', desc: 'Anticipa tu demanda', color: 'from-purple-500 to-violet-500' },
              { icon: Trophy, emoji: '🏆', title: 'Gamificación', desc: 'Gana XP y recompensas', color: 'from-indigo-500 to-purple-500' },
              { icon: BarChart3, emoji: '📊', title: 'Analytics Pro', desc: 'Insights inteligentes', color: 'from-emerald-500 to-teal-500' },
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative overflow-hidden bg-white/5 backdrop-blur rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                <div className="relative z-10">
                  <div className="text-3xl mb-3">{feature.emoji}</div>
                  <h4 className="font-bold text-white text-sm mb-1">{feature.title}</h4>
                  <p className="text-slate-500 text-xs">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom info */}
          <div className="text-center mt-8">
            <p className="text-slate-500 text-sm">
              💎 Sistema Premium v4.0 • Tecnología de clase mundial
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-navy-900/50 border-t border-white/5 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-xs">
            © 2025 LITPER Logistics Platform. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default CountrySelector;
