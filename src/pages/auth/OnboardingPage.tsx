/**
 * OnboardingPage - LITPER PRO
 *
 * Flujo de onboarding post-registro
 * Inspirado en Linear, Notion y Figma
 */

import React, { useState } from 'react';
import {
  Building2,
  Users,
  Target,
  Zap,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Package,
  Truck,
  BarChart3,
  Globe,
  ShoppingCart,
  Boxes,
} from 'lucide-react';

import { AnimatedBackground } from '../../components/auth/AnimatedBackground';
import { AuthCard } from '../../components/auth/AuthCard';
import { AuthButton } from '../../components/auth/AuthButton';

interface OnboardingPageProps {
  userName?: string;
  onComplete?: (data: OnboardingData) => Promise<void>;
  onSkip?: () => void;
}

interface OnboardingData {
  companySize: string;
  industry: string;
  role: string;
  goals: string[];
  integrations: string[];
}

const COMPANY_SIZES = [
  { id: 'solo', label: 'Solo yo', icon: '👤', description: 'Emprendedor individual' },
  { id: 'small', label: '2-10', icon: '👥', description: 'Equipo pequeño' },
  { id: 'medium', label: '11-50', icon: '🏢', description: 'Empresa en crecimiento' },
  { id: 'large', label: '51-200', icon: '🏛️', description: 'Empresa mediana' },
  { id: 'enterprise', label: '200+', icon: '🌐', description: 'Empresa grande' },
];

const INDUSTRIES = [
  { id: 'ecommerce', label: 'E-commerce', icon: ShoppingCart },
  { id: 'retail', label: 'Retail', icon: Boxes },
  { id: 'logistics', label: 'Logística', icon: Truck },
  { id: 'manufacturing', label: 'Manufactura', icon: Package },
  { id: 'wholesale', label: 'Mayorista', icon: Building2 },
  { id: 'other', label: 'Otro', icon: Globe },
];

const ROLES = [
  { id: 'owner', label: 'Dueño/Fundador', description: 'Tomo todas las decisiones' },
  { id: 'manager', label: 'Gerente', description: 'Lidero un equipo' },
  { id: 'operations', label: 'Operaciones', description: 'Gestiono el día a día' },
  { id: 'logistics', label: 'Logística', description: 'Manejo envíos y almacén' },
  { id: 'tech', label: 'Tecnología', description: 'Implemento sistemas' },
  { id: 'other', label: 'Otro', description: 'Otro rol' },
];

const GOALS = [
  { id: 'tracking', label: 'Rastrear envíos', icon: Truck },
  { id: 'inventory', label: 'Gestionar inventario', icon: Boxes },
  { id: 'analytics', label: 'Ver analíticas', icon: BarChart3 },
  { id: 'automation', label: 'Automatizar procesos', icon: Zap },
  { id: 'team', label: 'Colaborar en equipo', icon: Users },
  { id: 'scale', label: 'Escalar operaciones', icon: Target },
];

const INTEGRATIONS = [
  { id: 'shopify', label: 'Shopify', color: 'bg-[#96BF48]' },
  { id: 'woocommerce', label: 'WooCommerce', color: 'bg-[#96588A]' },
  { id: 'mercadolibre', label: 'MercadoLibre', color: 'bg-[#FFE600]' },
  { id: 'amazon', label: 'Amazon', color: 'bg-[#FF9900]' },
  { id: 'excel', label: 'Excel/CSV', color: 'bg-[#217346]' },
  { id: 'api', label: 'API propia', color: 'bg-indigo-500' },
];

export const OnboardingPage: React.FC<OnboardingPageProps> = ({
  userName = 'Usuario',
  onComplete,
  onSkip,
}) => {
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Form data
  const [companySize, setCompanySize] = useState('');
  const [industry, setIndustry] = useState('');
  const [role, setRole] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [integrations, setIntegrations] = useState<string[]>([]);

  const totalSteps = 5;

  const toggleGoal = (goalId: string) => {
    setGoals((prev) =>
      prev.includes(goalId) ? prev.filter((g) => g !== goalId) : [...prev, goalId]
    );
  };

  const toggleIntegration = (integrationId: string) => {
    setIntegrations((prev) =>
      prev.includes(integrationId)
        ? prev.filter((i) => i !== integrationId)
        : [...prev, integrationId]
    );
  };

  const canContinue = () => {
    switch (step) {
      case 0:
        return true; // Welcome screen
      case 1:
        return !!companySize;
      case 2:
        return !!industry;
      case 3:
        return !!role;
      case 4:
        return goals.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const data: OnboardingData = {
        companySize,
        industry,
        role,
        goals,
        integrations,
      };

      if (onComplete) {
        await onComplete(data);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        console.log('Onboarding complete:', data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Progress bar
  const ProgressBar = () => (
    <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
      <div
        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
        style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
      />
    </div>
  );

  // Step content components
  const WelcomeStep = () => (
    <div className="text-center py-8">
      <div className="mx-auto w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-8">
        <Sparkles className="w-12 h-12 text-white" />
      </div>

      <h1 className="text-3xl font-bold text-white mb-4">
        ¡Bienvenido, {userName.split(' ')[0]}!
      </h1>

      <p className="text-zinc-400 text-lg mb-8 max-w-md mx-auto">
        Vamos a personalizar LITPER para ti. Solo tomará un minuto.
      </p>

      <div className="flex justify-center gap-8 text-sm text-zinc-500">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Configuración rápida</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>100% personalizable</span>
        </div>
      </div>
    </div>
  );

  const CompanySizeStep = () => (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/20 mb-4">
          <Building2 className="w-6 h-6 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          ¿Cuántas personas hay en tu equipo?
        </h2>
        <p className="text-zinc-400">
          Esto nos ayuda a adaptar la experiencia
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {COMPANY_SIZES.map((size) => (
          <button
            key={size.id}
            onClick={() => setCompanySize(size.id)}
            className={`
              flex items-center gap-4 p-4 rounded-xl border transition-all duration-200
              ${
                companySize === size.id
                  ? 'bg-indigo-500/20 border-indigo-500 shadow-lg shadow-indigo-500/10'
                  : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-white/20'
              }
            `}
          >
            <span className="text-2xl">{size.icon}</span>
            <div className="text-left flex-1">
              <p className="font-medium text-white">{size.label} personas</p>
              <p className="text-sm text-zinc-500">{size.description}</p>
            </div>
            {companySize === size.id && (
              <Check className="w-5 h-5 text-indigo-400" />
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const IndustryStep = () => (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/20 mb-4">
          <Globe className="w-6 h-6 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          ¿Cuál es tu industria?
        </h2>
        <p className="text-zinc-400">
          Personalizaremos las funciones para tu sector
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {INDUSTRIES.map((ind) => {
          const Icon = ind.icon;
          return (
            <button
              key={ind.id}
              onClick={() => setIndustry(ind.id)}
              className={`
                flex flex-col items-center gap-3 p-5 rounded-xl border transition-all duration-200
                ${
                  industry === ind.id
                    ? 'bg-emerald-500/20 border-emerald-500 shadow-lg shadow-emerald-500/10'
                    : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-white/20'
                }
              `}
            >
              <Icon className={`w-8 h-8 ${industry === ind.id ? 'text-emerald-400' : 'text-zinc-400'}`} />
              <span className="font-medium text-white">{ind.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const RoleStep = () => (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/20 mb-4">
          <Users className="w-6 h-6 text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          ¿Cuál es tu rol?
        </h2>
        <p className="text-zinc-400">
          Para mostrarte las herramientas más relevantes
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {ROLES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRole(r.id)}
            className={`
              flex items-center justify-between p-4 rounded-xl border transition-all duration-200
              ${
                role === r.id
                  ? 'bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/10'
                  : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-white/20'
              }
            `}
          >
            <div className="text-left">
              <p className="font-medium text-white">{r.label}</p>
              <p className="text-sm text-zinc-500">{r.description}</p>
            </div>
            {role === r.id && <Check className="w-5 h-5 text-purple-400" />}
          </button>
        ))}
      </div>
    </div>
  );

  const GoalsStep = () => (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/20 mb-4">
          <Target className="w-6 h-6 text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          ¿Qué quieres lograr con LITPER?
        </h2>
        <p className="text-zinc-400">
          Selecciona todos los que apliquen
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {GOALS.map((goal) => {
          const Icon = goal.icon;
          const isSelected = goals.includes(goal.id);
          return (
            <button
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              className={`
                flex flex-col items-center gap-3 p-5 rounded-xl border transition-all duration-200
                ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500 shadow-lg shadow-amber-500/10'
                    : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-white/20'
                }
              `}
            >
              <div className="relative">
                <Icon className={`w-8 h-8 ${isSelected ? 'text-amber-400' : 'text-zinc-400'}`} />
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
              <span className="font-medium text-white text-sm text-center">{goal.label}</span>
            </button>
          );
        })}
      </div>

      {/* Optional integrations section */}
      <div className="mt-8 pt-6 border-t border-white/10">
        <p className="text-sm text-zinc-400 mb-4 text-center">
          ¿Usas alguna de estas plataformas? (opcional)
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {INTEGRATIONS.map((integration) => {
            const isSelected = integrations.includes(integration.id);
            return (
              <button
                key={integration.id}
                onClick={() => toggleIntegration(integration.id)}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${
                    isSelected
                      ? `${integration.color} text-white shadow-lg`
                      : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                  }
                `}
              >
                {integration.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 0:
        return <WelcomeStep />;
      case 1:
        return <CompanySizeStep />;
      case 2:
        return <IndustryStep />;
      case 3:
        return <RoleStep />;
      case 4:
        return <GoalsStep />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AnimatedBackground variant="aurora" intensity="subtle" />

      <AuthCard variant="glass" padding="lg" maxWidth="lg" animate={false}>
        <ProgressBar />

        <div className="pt-4">
          {renderStep()}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
            <div>
              {step > 0 ? (
                <AuthButton
                  variant="ghost"
                  size="md"
                  onClick={handleBack}
                  icon={<ArrowLeft className="w-4 h-4" />}
                >
                  Atrás
                </AuthButton>
              ) : (
                <AuthButton variant="ghost" size="md" onClick={onSkip}>
                  Omitir
                </AuthButton>
              )}
            </div>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    i === step
                      ? 'bg-indigo-500'
                      : i < step
                      ? 'bg-emerald-500'
                      : 'bg-white/10'
                  }`}
                />
              ))}
            </div>

            <div>
              {step < totalSteps - 1 ? (
                <AuthButton
                  variant="primary"
                  size="md"
                  onClick={handleNext}
                  disabled={!canContinue()}
                  icon={<ArrowRight className="w-4 h-4" />}
                  iconPosition="right"
                >
                  Continuar
                </AuthButton>
              ) : (
                <AuthButton
                  variant="success"
                  size="md"
                  onClick={handleComplete}
                  loading={isLoading}
                  loadingText="Configurando..."
                  disabled={!canContinue()}
                  icon={<Sparkles className="w-4 h-4" />}
                >
                  Comenzar
                </AuthButton>
              )}
            </div>
          </div>
        </div>
      </AuthCard>
    </div>
  );
};

export default OnboardingPage;
