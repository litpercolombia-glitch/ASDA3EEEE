'use client';

import React, { useState, useEffect } from 'react';
import { Package, Sparkles } from 'lucide-react';

// ============================================
// SPLASH SCREEN - Pantalla de carga animada
// Con logo pulsante, progress bar y textos dinámicos
// ============================================

interface SplashScreenProps {
  onComplete?: () => void;
  duration?: number; // in milliseconds
}

const loadingMessages = [
  'Preparando tu espacio de trabajo...',
  'Cargando tus datos...',
  'Sincronizando información...',
  '¡Casi listo!',
];

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  duration = 3000,
}) => {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Progress animation
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        // Smooth progress with slight randomness
        const increment = Math.random() * 3 + 1;
        return Math.min(prev + increment, 100);
      });
    }, duration / 50);

    return () => clearInterval(progressInterval);
  }, [duration]);

  // Message rotation
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => {
        if (prev >= loadingMessages.length - 1) {
          return prev;
        }
        return prev + 1;
      });
    }, duration / loadingMessages.length);

    return () => clearInterval(messageInterval);
  }, [duration]);

  // Complete callback
  useEffect(() => {
    if (progress >= 100) {
      // Start fade out
      setTimeout(() => {
        setIsFadingOut(true);
      }, 300);

      // Call complete after fade
      setTimeout(() => {
        onComplete?.();
      }, 800);
    }
  }, [progress, onComplete]);

  return (
    <div
      className={`
        fixed inset-0 z-[100]
        bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950
        flex flex-col items-center justify-center
        transition-opacity duration-500
        ${isFadingOut ? 'opacity-0' : 'opacity-100'}
      `}
    >
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated circles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-violet-500/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}

        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo container with animations */}
        <div className="relative mb-8">
          {/* Outer ring */}
          <div className="absolute inset-0 -m-4 border-4 border-violet-500/20 rounded-3xl animate-[spin_8s_linear_infinite]" />
          <div className="absolute inset-0 -m-6 border-2 border-indigo-500/10 rounded-3xl animate-[spin_12s_linear_infinite_reverse]" />

          {/* Logo */}
          <div className="relative w-28 h-28 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-violet-500/40 animate-[pulse_2s_ease-in-out_infinite]">
            <Package className="w-14 h-14 text-white" />

            {/* Sparkle */}
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-amber-500/50">
              <Sparkles className="w-4 h-4 text-amber-900" />
            </div>
          </div>

          {/* Pulse rings */}
          <div className="absolute inset-0 -m-2 bg-violet-500/20 rounded-3xl animate-ping" style={{ animationDuration: '2s' }} />
        </div>

        {/* Brand name */}
        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
          LITPER <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">PRO</span>
        </h1>
        <p className="text-slate-400 text-sm mb-12">Logística Inteligente</p>

        {/* Progress section */}
        <div className="w-80">
          {/* Progress bar container */}
          <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
            {/* Progress fill */}
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
            {/* Shimmer effect */}
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_1.5s_infinite]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Loading message */}
          <div className="text-center">
            <p
              key={messageIndex}
              className="text-slate-300 text-sm animate-[fadeIn_0.5s_ease-out]"
            >
              {loadingMessages[messageIndex]}
            </p>
            <p className="text-slate-500 text-xs mt-2">
              {Math.round(progress)}%
            </p>
          </div>
        </div>

        {/* Loading dots */}
        <div className="flex items-center gap-2 mt-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-violet-500 rounded-full animate-bounce"
              style={{
                animationDelay: `${i * 0.15}s`,
                animationDuration: '0.6s',
              }}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-center">
        <p className="text-slate-600 text-xs">
          Powered by LITPER Technologies
        </p>
      </div>

      {/* Keyframes */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
