'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  Circle,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  ArrowRight,
  Building,
  Truck,
  Package,
  Bell,
  User,
  Gift,
  PartyPopper,
} from 'lucide-react';
import { useOnboardingStore } from '../../stores/onboardingStore';

// ============================================
// ONBOARDING CHECKLIST - Widget flotante
// Guía de primeros pasos con progress y confetti
// ============================================

interface ChecklistStep {
  id: keyof OnboardingProgress;
  icon: React.ElementType;
  title: string;
  description: string;
  action: string;
  completed: boolean;
}

interface OnboardingProgress {
  createAccount: boolean;
  configureCompany: boolean;
  connectCarrier: boolean;
  firstShipment: boolean;
  setupNotifications: boolean;
}

export const OnboardingChecklist: React.FC = () => {
  const {
    onboardingProgress,
    showOnboarding,
    onboardingDismissed,
    setShowOnboarding,
    setOnboardingDismissed,
    updateOnboardingStep,
    getOnboardingPercentage,
    getNextIncompleteStep,
  } = useOnboardingStore();

  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const percentage = getOnboardingPercentage();
  const nextStep = getNextIncompleteStep();

  // Check for completion
  useEffect(() => {
    if (percentage === 100 && !showConfetti) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [percentage]);

  // Steps configuration
  const steps: ChecklistStep[] = [
    {
      id: 'createAccount',
      icon: User,
      title: 'Crear cuenta',
      description: 'Registro completado',
      action: 'Ver perfil',
      completed: onboardingProgress.createAccount,
    },
    {
      id: 'configureCompany',
      icon: Building,
      title: 'Configurar empresa',
      description: 'Datos de tu compañía',
      action: 'Configurar',
      completed: onboardingProgress.configureCompany,
    },
    {
      id: 'connectCarrier',
      icon: Truck,
      title: 'Conectar transportadora',
      description: 'Vincula tu operador logístico',
      action: 'Conectar',
      completed: onboardingProgress.connectCarrier,
    },
    {
      id: 'firstShipment',
      icon: Package,
      title: 'Primer envío',
      description: 'Carga tu primera guía',
      action: 'Cargar guía',
      completed: onboardingProgress.firstShipment,
    },
    {
      id: 'setupNotifications',
      icon: Bell,
      title: 'Configurar notificaciones',
      description: 'Personaliza tus alertas',
      action: 'Configurar',
      completed: onboardingProgress.setupNotifications,
    },
  ];

  const handleStepClick = (stepId: keyof OnboardingProgress) => {
    // Simulate completing a step (in real app, this would navigate or open modal)
    if (!onboardingProgress[stepId]) {
      updateOnboardingStep(stepId, true);
    }
  };

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      setOnboardingDismissed(true);
      setShowOnboarding(false);
    }, 300);
  };

  if (!showOnboarding || onboardingDismissed || percentage === 100) {
    return null;
  }

  return (
    <>
      {/* Confetti animation */}
      {showConfetti && (
        <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-[confetti_3s_ease-out_forwards]"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-20px',
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            >
              <div
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: ['#8B5CF6', '#F59E0B', '#10B981', '#3B82F6', '#EC4899'][Math.floor(Math.random() * 5)],
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Checklist widget */}
      <div
        className={`
          fixed bottom-6 right-6 z-50
          transition-all duration-300
          ${isClosing ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}
          ${isMinimized ? 'w-auto' : 'w-80'}
        `}
      >
        {isMinimized ? (
          // Minimized state - just a floating button
          <button
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 transition-all hover:scale-105"
          >
            <div className="relative">
              <Sparkles className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-amber-900 text-[10px] font-bold rounded-full flex items-center justify-center">
                {5 - Object.values(onboardingProgress).filter(Boolean).length}
              </span>
            </div>
            <span className="font-medium">Setup</span>
            <div className="w-8 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </button>
        ) : (
          // Expanded state - full checklist
          <div className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl shadow-violet-500/10 overflow-hidden animate-[scaleIn_0.3s_ease-out]">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border-b border-slate-700/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">Primeros pasos</h3>
                    <p className="text-slate-400 text-xs">{percentage}% completado</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsMinimized(true)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            {/* Steps list */}
            <div className="p-2">
              {steps.map((step, index) => {
                const isNext = step.id === nextStep;
                const Icon = step.icon;

                return (
                  <button
                    key={step.id}
                    onClick={() => handleStepClick(step.id)}
                    disabled={step.completed}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-xl transition-all
                      ${step.completed
                        ? 'bg-emerald-500/10 cursor-default'
                        : isNext
                          ? 'bg-violet-500/10 hover:bg-violet-500/20'
                          : 'hover:bg-slate-800/50'
                      }
                    `}
                  >
                    {/* Status icon */}
                    <div
                      className={`
                        w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                        ${step.completed
                          ? 'bg-emerald-500'
                          : isNext
                            ? 'bg-violet-500'
                            : 'bg-slate-700'
                        }
                      `}
                    >
                      {step.completed ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <Icon className="w-4 h-4 text-white" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 text-left">
                      <p
                        className={`
                          text-sm font-medium
                          ${step.completed ? 'text-emerald-400 line-through' : 'text-white'}
                        `}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-slate-500">{step.description}</p>
                    </div>

                    {/* Action */}
                    {!step.completed && (
                      <div
                        className={`
                          flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium
                          ${isNext
                            ? 'bg-violet-500 text-white'
                            : 'bg-slate-700 text-slate-300'
                          }
                        `}
                      >
                        {step.action}
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-700/50">
              <button
                onClick={() => nextStep && handleStepClick(nextStep)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all"
              >
                <span>Completar siguiente paso</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Keyframes */}
      <style jsx global>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
};

export default OnboardingChecklist;
