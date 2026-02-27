// components/Billing/PricingPage.tsx
// Página de precios con 3 tiers - Starter/Pro/Enterprise
// Design System: Linear meets Stripe on Dark Logistics (LS V2)
// UX: 3 tiers optimal, "Most Popular" badge +16-30% conversion (CXL Institute)

import React, { useState } from 'react';
import {
  Check,
  Zap,
  Building2,
  Rocket,
  ArrowRight,
  Shield,
  Users,
} from 'lucide-react';
import { useSubscriptionStore, type PlanTier } from '../../stores/subscriptionStore';
import { STRIPE_PLANS, formatPrice, getAnnualSavings } from '../../services/stripeService';

interface PricingPageProps {
  onSelectPlan: (planId: string, priceId: string) => void;
}

export function PricingPage({ onSelectPlan }: PricingPageProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const { currentPlan } = useSubscriptionStore();

  const annualSavings = getAnnualSavings(
    STRIPE_PLANS[1].priceMonthly,
    STRIPE_PLANS[1].priceAnnual
  );

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free': return <Rocket className="w-6 h-6" />;
      case 'pro': return <Zap className="w-6 h-6" />;
      case 'enterprise': return <Building2 className="w-6 h-6" />;
      default: return <Rocket className="w-6 h-6" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          Elige tu plan <span className="text-cyan-400">LITPER PRO</span>
        </h1>
        <p className="text-lg text-[#94a3b8] max-w-2xl mx-auto">
          Escala tu operación logística con las herramientas que necesitas.
          Cambia de plan en cualquier momento.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <span className={`text-sm ${billingCycle === 'monthly' ? 'text-white' : 'text-[#64748b]'}`}>
            Mensual
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              billingCycle === 'annual'
                ? 'bg-cyan-500/30 border border-cyan-500/50'
                : 'bg-white/10 border border-white/10'
            }`}
          >
            <div className={`absolute top-0.5 w-6 h-6 rounded-full transition-all ${
              billingCycle === 'annual'
                ? 'left-7 bg-cyan-400'
                : 'left-0.5 bg-white/60'
            }`} />
          </button>
          <span className={`text-sm ${billingCycle === 'annual' ? 'text-white' : 'text-[#64748b]'}`}>
            Anual
          </span>
          {annualSavings > 0 && (
            <span className="ls-badge ls-badge-cyan">
              Ahorra {annualSavings}%
            </span>
          )}
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {STRIPE_PLANS.map((plan) => {
          const price = billingCycle === 'monthly' ? plan.priceMonthly : Math.round(plan.priceAnnual / 12);
          const isCurrentPlan = currentPlan === plan.id;
          const priceId = billingCycle === 'monthly' ? plan.stripePriceIdMonthly : plan.stripePriceIdAnnual;

          return (
            <div
              key={plan.id}
              className={`ls-pricing-card ${plan.highlighted ? 'recommended' : ''} flex flex-col`}
            >
              {/* Plan Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-xl ${
                  plan.highlighted
                    ? 'bg-[rgba(0,245,255,0.12)] text-cyan-400'
                    : 'bg-white/[0.06] text-[#94a3b8]'
                }`}>
                  {getPlanIcon(plan.id)}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                  <p className="text-sm text-[#64748b]">{plan.description}</p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold text-white">
                    {formatPrice(price)}
                  </span>
                  {price > 0 && (
                    <span className="text-[#64748b] text-sm">/mes</span>
                  )}
                </div>
                {billingCycle === 'annual' && plan.priceAnnual > 0 && (
                  <p className="text-xs text-[#64748b] mt-1">
                    {formatPrice(plan.priceAnnual)} facturado anualmente
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      plan.highlighted ? 'text-cyan-400' : 'text-green-400'
                    }`} />
                    <span className="text-sm text-[#f1f5f9]">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => {
                  if (plan.id === 'enterprise') {
                    window.open('mailto:ventas@litper.co?subject=Plan Enterprise LITPER PRO', '_blank');
                  } else if (!isCurrentPlan && plan.id !== 'free') {
                    onSelectPlan(plan.id, priceId);
                  }
                }}
                disabled={isCurrentPlan}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                  isCurrentPlan
                    ? 'bg-white/[0.06] text-[#64748b] cursor-default border border-[rgba(255,255,255,0.06)]'
                    : plan.highlighted
                    ? 'ls-btn-primary'
                    : 'ls-btn-secondary'
                }`}
              >
                {isCurrentPlan ? (
                  'Plan Actual'
                ) : (
                  <>
                    {plan.cta}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Social Proof */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-6 mb-4">
          <div className="flex items-center gap-2 text-[#94a3b8]">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="text-sm">Pagos seguros con Stripe</span>
          </div>
          <div className="flex items-center gap-2 text-[#94a3b8]">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="text-sm">200+ empresas de logística en LATAM</span>
          </div>
        </div>
        <p className="text-xs text-[#64748b]">
          Cancela en cualquier momento. Sin cargos ocultos. Soporte en Colombia.
        </p>
      </div>
    </div>
  );
}

export default PricingPage;
