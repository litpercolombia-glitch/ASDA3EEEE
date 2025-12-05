import React, { useState } from 'react';
import { Country, CountryConfig, COUNTRY_CONFIGS } from '../types/country';
import { saveSelectedCountry } from '../services/countryService';
import { updateUserCountry } from '../services/gamificationService';
import { MapPin, Truck, Package, ArrowRight, Check, Globe } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gold-500 to-gold-700 rounded-2xl shadow-2xl mb-6">
            <Globe className="w-10 h-10 text-navy-900" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Bienvenido a <span className="text-gold-500">LITPER</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Selecciona tu país para configurar las transportadoras y servicios disponibles en tu región
          </p>
        </div>

        {/* Country Cards */}
        {!showCarriers && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {countries.map((config) => (
              <button
                key={config.code}
                onClick={() => handleCountryClick(config.code)}
                className={`relative group p-8 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                  selectedCountry === config.code
                    ? 'bg-gold-500/20 border-gold-500 shadow-2xl shadow-gold-500/20'
                    : 'bg-navy-800/50 border-navy-700 hover:border-gold-500/50 hover:bg-navy-800'
                }`}
              >
                {/* Flag */}
                <div className="text-6xl mb-4">{config.flag}</div>

                {/* Country Name */}
                <h3 className="text-2xl font-bold text-white mb-2">{config.name}</h3>

                {/* Info */}
                <div className="space-y-2 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gold-500" />
                    <span>{config.carriers.length} transportadoras</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gold-500" />
                    <span>Prefijo: {config.phonePrefix}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gold-500" />
                    <span>Moneda: {config.currency}</span>
                  </div>
                </div>

                {/* Selected indicator */}
                {selectedCountry === config.code && (
                  <div className="absolute top-4 right-4 w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-navy-900" />
                  </div>
                )}

                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-gold-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
              </button>
            ))}
          </div>
        )}

        {/* Carriers Panel */}
        {showCarriers && selectedConfig && (
          <div className="bg-navy-800/50 rounded-2xl border border-navy-700 p-8 mb-8 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{selectedConfig.flag}</span>
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedConfig.name}</h2>
                  <p className="text-slate-400">Transportadoras disponibles</p>
                </div>
              </div>
              <button
                onClick={() => setShowCarriers(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                Cambiar país
              </button>
            </div>

            {/* Carriers Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {selectedConfig.carriers.map((carrier) => (
                <div
                  key={carrier.id}
                  className="bg-navy-900/50 rounded-xl p-4 border border-navy-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-bold text-white">{carrier.name}</h4>
                    <span className="text-xs bg-gold-500/20 text-gold-400 px-2 py-1 rounded-full">
                      {carrier.avgDeliveryDays}d prom.
                    </span>
                  </div>

                  {/* Services */}
                  <div className="space-y-1 mb-3">
                    {carrier.services.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-slate-400">{service.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded ${
                            service.type === 'express'
                              ? 'bg-red-500/20 text-red-400'
                              : service.type === 'standard'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {service.avgDays === 0 ? 'Mismo día' : `${service.avgDays}d`}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Coverage */}
                  <div className="flex flex-wrap gap-1">
                    {carrier.coverage.slice(0, 3).map((cov, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded"
                      >
                        {cov}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleConfirm}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-navy-900 font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg shadow-gold-500/30"
            >
              <span>Continuar con {selectedConfig.name}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Features Preview */}
        <div className="grid md:grid-cols-4 gap-4 text-center">
          {[
            { icon: '⚡', title: 'Litper Flash', desc: 'Envíos en 8 segundos' },
            { icon: '🔮', title: 'Predicción ML', desc: 'Anticipa tu demanda' },
            { icon: '🎮', title: 'Gamificación', desc: 'Gana recompensas' },
            { icon: '📊', title: 'Analytics', desc: 'Insights inteligentes' },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-navy-800/30 rounded-xl p-4 border border-navy-800"
            >
              <div className="text-3xl mb-2">{feature.icon}</div>
              <h4 className="font-bold text-white text-sm">{feature.title}</h4>
              <p className="text-slate-500 text-xs">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CountrySelector;
