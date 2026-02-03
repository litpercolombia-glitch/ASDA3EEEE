import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  X,
  Sparkles,
  ArrowRight,
  Building2,
  Truck,
  Package,
  Bell,
  UserCircle,
  Settings,
  Rocket,
  Check,
} from 'lucide-react';
import { useCompanyStore } from '../../stores/companyStore';

// ============================================
// PROFESSIONAL ONBOARDING CHECKLIST
// Clean, enterprise-style floating widget
// ============================================

interface ChecklistStep {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  action: string;
  completed: boolean;
  onClick?: () => void;
}

export const OnboardingChecklist: React.FC = () => {
  const {
    stepsCompleted,
    isOnboardingComplete,
    setShowEnterpriseOnboarding,
    getCompletionPercentage,
  } = useCompanyStore();

  const [isMinimized, setIsMinimized] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const percentage = getCompletionPercentage();

  // Confetti on 100% completion
  useEffect(() => {
    if (percentage === 100 && !showConfetti) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    }
  }, [percentage, showConfetti]);

  // Steps configuration - connected to companyStore
  const steps: ChecklistStep[] = [
    {
      id: 'profile',
      icon: UserCircle,
      title: 'Configurar perfil',
      description: 'Datos personales y rol',
      action: 'Configurar',
      completed: stepsCompleted.profile,
      onClick: () => setShowEnterpriseOnboarding(true),
    },
    {
      id: 'company',
      icon: Building2,
      title: 'Datos de empresa',
      description: 'Información de tu organización',
      action: 'Configurar',
      completed: stepsCompleted.company,
      onClick: () => setShowEnterpriseOnboarding(true),
    },
    {
      id: 'preferences',
      icon: Settings,
      title: 'Preferencias',
      description: 'Personaliza tu operación',
      action: 'Configurar',
      completed: stepsCompleted.preferences,
      onClick: () => setShowEnterpriseOnboarding(true),
    },
    {
      id: 'finished',
      icon: Rocket,
      title: 'Comenzar',
      description: 'Listo para usar LITPER',
      action: 'Finalizar',
      completed: stepsCompleted.finished,
      onClick: () => setShowEnterpriseOnboarding(true),
    },
  ];

  const completedSteps = steps.filter(s => s.completed).length;
  const nextStep = steps.find(s => !s.completed);

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => setDismissed(true), 300);
  };

  const handleStepClick = (step: ChecklistStep) => {
    if (!step.completed && step.onClick) {
      step.onClick();
    }
  };

  // Don't show if complete or dismissed
  if (dismissed || isOnboardingComplete) {
    return null;
  }

  // Confetti colors
  const confettiColors = ['#6366f1', '#8b5cf6', '#22c55e', '#14b8a6', '#f97316'];

  return (
    <>
      {/* Confetti animation */}
      {showConfetti && (
        <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti-fall"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-20px',
                animationDelay: `${Math.random() * 0.8}s`,
                animationDuration: `${2.5 + Math.random() * 1.5}s`,
              }}
            >
              <div
                className="w-2.5 h-2.5"
                style={{
                  backgroundColor: confettiColors[Math.floor(Math.random() * confettiColors.length)],
                  borderRadius: Math.random() > 0.5 ? '50%' : '2px',
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
          fixed bottom-6 right-6 z-50 transition-all duration-300
          ${isClosing ? 'opacity-0 translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100'}
        `}
      >
        {isMinimized ? (
          /* Minimized floating button */
          <button
            onClick={() => setIsMinimized(false)}
            className="group flex items-center gap-3 px-5 py-3 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl hover:border-indigo-500/50 transition-all"
          >
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              {completedSteps < 4 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {4 - completedSteps}
                </span>
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Configuración</p>
              <p className="text-xs text-slate-400">{percentage}% completado</p>
            </div>
            <div className="ml-2 w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </button>
        ) : (
          /* Expanded checklist */
          <div className="w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Configuración inicial</h3>
                    <p className="text-xs text-slate-400">{completedSteps} de 4 completados</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsMinimized(true)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    title="Minimizar"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    title="Cerrar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            {/* Steps list */}
            <div className="p-2">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isNext = !step.completed && step.id === nextStep?.id;

                return (
                  <button
                    key={step.id}
                    onClick={() => handleStepClick(step)}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-xl transition-all
                      ${step.completed
                        ? 'bg-emerald-500/10'
                        : isNext
                          ? 'bg-indigo-500/10 hover:bg-indigo-500/20'
                          : 'hover:bg-slate-800/50'
                      }
                    `}
                  >
                    {/* Status indicator */}
                    <div
                      className={`
                        w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors
                        ${step.completed
                          ? 'bg-emerald-500'
                          : isNext
                            ? 'bg-indigo-500'
                            : 'bg-slate-800'
                        }
                      `}
                    >
                      {step.completed ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : (
                        <Icon className={`w-4 h-4 ${isNext ? 'text-white' : 'text-slate-400'}`} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 text-left">
                      <p
                        className={`
                          text-sm font-medium transition-colors
                          ${step.completed
                            ? 'text-emerald-400'
                            : isNext
                              ? 'text-white'
                              : 'text-slate-300'
                          }
                        `}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-slate-500">{step.description}</p>
                    </div>

                    {/* Action button */}
                    {!step.completed && (
                      <div
                        className={`
                          flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                          ${isNext
                            ? 'bg-indigo-500 text-white'
                            : 'bg-slate-800 text-slate-400'
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

            {/* Footer CTA */}
            {nextStep && (
              <div className="p-3 border-t border-slate-800">
                <button
                  onClick={() => handleStepClick(nextStep)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-semibold rounded-xl transition-all"
                >
                  Continuar configuración
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Styles */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti-fall {
          animation: confetti-fall 3s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default OnboardingChecklist;
