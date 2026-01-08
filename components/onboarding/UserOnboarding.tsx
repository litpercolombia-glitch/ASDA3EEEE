// components/onboarding/UserOnboarding.tsx
// Flujo de onboarding para nuevos usuarios

import React, { useState } from 'react';
import {
  User,
  Crown,
  Sparkles,
  ArrowRight,
  Check,
  ChevronRight,
} from 'lucide-react';
import { useUserProfileStore, Gender, AVATAR_COLORS } from '../../services/userProfileService';

interface UserOnboardingProps {
  onComplete: () => void;
  country: string;
}

export const UserOnboarding: React.FC<UserOnboardingProps> = ({ onComplete, country }) => {
  const [step, setStep] = useState(1);
  const [nombre, setNombre] = useState('');
  const [genero, setGenero] = useState<Gender>('prefer_not_say');
  const [avatarColor, setAvatarColor] = useState('amber');
  const [isAnimating, setIsAnimating] = useState(false);

  const { completeOnboarding, updateProfile } = useUserProfileStore();

  const handleNext = () => {
    if (step === 1 && nombre.trim()) {
      setIsAnimating(true);
      setTimeout(() => {
        setStep(2);
        setIsAnimating(false);
      }, 300);
    } else if (step === 2) {
      setIsAnimating(true);
      setTimeout(() => {
        setStep(3);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleComplete = () => {
    completeOnboarding({ nombre: nombre.trim(), genero });
    updateProfile({ avatarColor, pais: country });
    onComplete();
  };

  const getInitials = () => {
    if (!nombre.trim()) return 'U';
    const parts = nombre.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  };

  const selectedColor = AVATAR_COLORS.find(c => c.id === avatarColor) || AVATAR_COLORS[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className={`relative max-w-lg w-full transition-all duration-500 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-500 ${
                s === step
                  ? 'w-8 bg-gradient-to-r from-amber-500 to-orange-500'
                  : s < step
                    ? 'w-8 bg-emerald-500'
                    : 'w-2 bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="relative p-8 pb-4 text-center">
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-amber-500/20 to-transparent" />

            <div className="relative">
              {/* Logo */}
              <div className="w-20 h-20 mx-auto mb-4 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-600 rounded-2xl animate-pulse" />
                <div className="absolute inset-1 bg-gray-800 rounded-xl flex items-center justify-center">
                  <Crown className="w-8 h-8 text-amber-500" />
                </div>
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-400 animate-bounce" />
              </div>

              <h1 className="text-2xl font-bold text-white mb-2">
                ¡Bienvenido a LITPER PRO!
              </h1>
              <p className="text-gray-400 text-sm">
                {step === 1 && 'Cuéntanos cómo te llamas'}
                {step === 2 && 'Personaliza tu experiencia'}
                {step === 3 && 'Elige tu avatar'}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 pt-4">
            {/* Step 1: Name */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tu nombre
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="¿Cómo te llamas?"
                      className="w-full pl-12 pr-4 py-4 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-lg"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  onClick={handleNext}
                  disabled={!nombre.trim()}
                  className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] ${
                    nombre.trim()
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Continuar
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Step 2: Gender */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-4 text-center">
                    Selecciona tu género (opcional)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'male' as Gender, label: 'Masculino', icon: '👨' },
                      { value: 'female' as Gender, label: 'Femenino', icon: '👩' },
                      { value: 'other' as Gender, label: 'Otro', icon: '🧑' },
                      { value: 'prefer_not_say' as Gender, label: 'Prefiero no decir', icon: '👤' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setGenero(option.value)}
                        className={`p-4 rounded-xl border-2 transition-all transform hover:scale-[1.02] ${
                          genero === option.value
                            ? 'border-amber-500 bg-amber-500/10'
                            : 'border-gray-700 bg-gray-900/30 hover:border-gray-600'
                        }`}
                      >
                        <span className="text-3xl mb-2 block">{option.icon}</span>
                        <span className={`text-sm font-medium ${genero === option.value ? 'text-amber-400' : 'text-gray-300'}`}>
                          {option.label}
                        </span>
                        {genero === option.value && (
                          <Check className="w-5 h-5 text-amber-500 mx-auto mt-2" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleNext}
                  className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all transform hover:scale-[1.02]"
                >
                  Continuar
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Step 3: Avatar Color */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                {/* Preview */}
                <div className="text-center mb-6">
                  <div className={`w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br ${selectedColor.bg} flex items-center justify-center shadow-xl transform transition-all duration-300 hover:scale-110`}>
                    <span className="text-3xl font-bold text-white">{getInitials()}</span>
                  </div>
                  <p className="mt-3 text-lg font-medium text-white">{nombre}</p>
                  <p className="text-sm text-gray-400">Así te verán los demás</p>
                </div>

                {/* Color picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3 text-center">
                    Elige un color para tu avatar
                  </label>
                  <div className="flex flex-wrap justify-center gap-3">
                    {AVATAR_COLORS.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setAvatarColor(color.id)}
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color.bg} transition-all transform hover:scale-110 ${
                          avatarColor === color.id
                            ? 'ring-4 ring-white ring-offset-2 ring-offset-gray-800 scale-110'
                            : ''
                        }`}
                      >
                        {avatarColor === color.id && (
                          <Check className="w-6 h-6 text-white mx-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleComplete}
                  className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all transform hover:scale-[1.02]"
                >
                  <Sparkles className="w-5 h-5" />
                  ¡Comenzar a usar LITPER!
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-6">
          Plataforma Enterprise de Logística con IA • {country}
        </p>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default UserOnboarding;
