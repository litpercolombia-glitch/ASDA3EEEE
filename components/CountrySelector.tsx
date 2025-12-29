import React, { useState } from 'react';
import { Country, COUNTRY_CONFIGS } from '../types/country';
import { saveSelectedCountry } from '../services/countryService';
import { updateUserCountry } from '../services/gamificationService';
import {
  ArrowRight,
  Check,
  Sparkles,
  Zap,
  Shield,
  Globe,
  TrendingUp,
  Package,
  Truck,
} from 'lucide-react';

interface CountrySelectorProps {
  onCountrySelected: (country: Country) => void;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({ onCountrySelected }) => {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [isHovering, setIsHovering] = useState<Country | null>(null);

  const countryData = [
    {
      code: 'COLOMBIA' as Country,
      name: 'Colombia',
      flag: '🇨🇴',
      abbr: 'CO',
      gradient: 'from-yellow-500 via-blue-500 to-red-500',
      bgGlow: 'bg-yellow-500/20',
      carriers: 5,
    },
    {
      code: 'ECUADOR' as Country,
      name: 'Ecuador',
      flag: '🇪🇨',
      abbr: 'EC',
      gradient: 'from-yellow-400 via-blue-600 to-red-600',
      bgGlow: 'bg-blue-500/20',
      carriers: 4,
    },
    {
      code: 'CHILE' as Country,
      name: 'Chile',
      flag: '🇨🇱',
      abbr: 'CL',
      gradient: 'from-blue-600 via-white to-red-600',
      bgGlow: 'bg-red-500/20',
      carriers: 4,
    },
  ];

  const handleSelect = (country: Country) => {
    setSelectedCountry(country);
  };

  const handleConfirm = () => {
    if (selectedCountry) {
      saveSelectedCountry(selectedCountry);
      updateUserCountry(selectedCountry);
      onCountrySelected(selectedCountry);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden flex items-center justify-center">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/10 rounded-full blur-[150px]" />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px]" />

        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6">
        {/* Logo & Title */}
        <div className="text-center mb-16">
          {/* Logo */}
          <div className="inline-flex items-center justify-center mb-8">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-amber-500/30 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-[#0a0a0f]">
                <Check className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>

          {/* Brand */}
          <h1 className="text-6xl md:text-7xl font-black tracking-tight mb-4">
            <span className="text-white">LITPER</span>
            <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 bg-clip-text text-transparent"> PRO</span>
          </h1>

          <p className="text-xl text-slate-400 mb-4">
            Plataforma Enterprise de Logística Inteligente
          </p>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              Seguro
            </span>
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Rápido
            </span>
            <span className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Inteligente
            </span>
          </div>
        </div>

        {/* Country Selection */}
        <div className="mb-8">
          <p className="text-center text-slate-400 mb-8 flex items-center justify-center gap-2">
            <Globe className="w-5 h-5 text-amber-500" />
            <span>Selecciona tu país para comenzar</span>
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {countryData.map((country) => {
              const isSelected = selectedCountry === country.code;
              const isHovered = isHovering === country.code;

              return (
                <button
                  key={country.code}
                  onClick={() => handleSelect(country.code)}
                  onMouseEnter={() => setIsHovering(country.code)}
                  onMouseLeave={() => setIsHovering(null)}
                  className={`relative group p-8 rounded-3xl border-2 transition-all duration-500 transform ${
                    isSelected
                      ? 'bg-white/10 border-amber-500 scale-[1.02] shadow-2xl shadow-amber-500/20'
                      : 'bg-white/[0.02] border-white/10 hover:border-white/30 hover:bg-white/[0.05] hover:scale-[1.02]'
                  }`}
                >
                  {/* Glow effect */}
                  <div className={`absolute inset-0 rounded-3xl ${country.bgGlow} opacity-0 blur-xl transition-opacity duration-500 ${isSelected || isHovered ? 'opacity-100' : ''}`} />

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Flag */}
                    <div className="text-8xl mb-6 transform transition-transform duration-500 group-hover:scale-110">
                      {country.flag}
                    </div>

                    {/* Country code badge */}
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 transition-colors ${
                      isSelected
                        ? 'bg-amber-500/20 border border-amber-500/30'
                        : 'bg-white/5 border border-white/10'
                    }`}>
                      <span className={`text-2xl font-black ${isSelected ? 'text-amber-400' : 'text-white'}`}>
                        {country.abbr}
                      </span>
                    </div>

                    {/* Country name */}
                    <h3 className="text-2xl font-bold text-white mb-4">
                      {country.name}
                    </h3>

                    {/* Stats */}
                    <div className="flex items-center justify-center gap-4 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Truck className="w-4 h-4" />
                        {country.carriers} transportadoras
                      </span>
                    </div>

                    {/* Selection indicator */}
                    <div className={`mt-6 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-white'
                        : 'bg-white/5 text-slate-400 group-hover:bg-white/10'
                    }`}>
                      {isSelected ? (
                        <>
                          <Check className="w-5 h-5" />
                          <span className="font-semibold">Seleccionado</span>
                        </>
                      ) : (
                        <span>Click para seleccionar</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Confirm Button */}
        <div className={`transition-all duration-500 ${selectedCountry ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <button
            onClick={handleConfirm}
            className="w-full max-w-md mx-auto flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-600 hover:via-orange-600 hover:to-amber-600 text-white font-bold py-5 px-8 rounded-2xl transition-all transform hover:scale-[1.02] shadow-2xl shadow-amber-500/30 text-lg group"
          >
            <Package className="w-6 h-6" />
            <span>Comenzar ahora</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="text-center text-slate-500 text-sm mt-4">
            Puedes cambiar tu país más tarde en configuración
          </p>
        </div>

        {/* Features Preview */}
        <div className="mt-16 grid grid-cols-4 gap-4">
          {[
            { icon: '🤖', label: 'IA Integrada' },
            { icon: '📊', label: 'Analytics' },
            { icon: '🚀', label: 'Tiempo Real' },
            { icon: '🔒', label: 'Seguro' },
          ].map((feature, i) => (
            <div key={i} className="text-center p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-3xl mb-2">{feature.icon}</div>
              <div className="text-xs text-slate-500">{feature.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CountrySelector;
