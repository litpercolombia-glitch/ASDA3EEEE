// components/Billing/FeatureGate.tsx
// Wrapper component para feature gating - soft gate (lock + tooltip)
// Design System: Linear meets Stripe on Dark Logistics (LS V2)
// UX: Soft gates for high retention + gradual conversion (Appcues)

import React from 'react';
import { Lock, ArrowUpRight } from 'lucide-react';
import { useSubscriptionStore, type PlanTier, PLAN_HIERARCHY } from '../../stores/subscriptionStore';

interface FeatureGateProps {
  requiredPlan: PlanTier;
  featureLabel?: string;
  children: React.ReactNode;
  onUpgrade?: () => void;
}

export function FeatureGate({
  requiredPlan,
  featureLabel,
  children,
  onUpgrade,
}: FeatureGateProps) {
  const { currentPlan } = useSubscriptionStore();
  const hasAccess = PLAN_HIERARCHY[currentPlan] >= PLAN_HIERARCHY[requiredPlan];

  if (hasAccess) return <>{children}</>;

  const planLabel = requiredPlan === 'pro' ? 'Pro' : 'Enterprise';

  return (
    <div className="ls-feature-gate locked relative">
      {/* Blurred preview of the gated content */}
      <div className="opacity-30 pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[rgba(10,14,23,0.85)] backdrop-blur-sm rounded-xl z-10">
        <div className="p-3 bg-white/[0.06] rounded-full mb-3">
          <Lock className="w-8 h-8 text-[#94a3b8]" />
        </div>
        <p className="text-[#f1f5f9] font-semibold text-sm mb-1">
          {featureLabel || 'Esta función'} requiere plan {planLabel}
        </p>
        <p className="text-[#64748b] text-xs mb-4 max-w-xs text-center">
          Actualiza tu plan para desbloquear esta y más funcionalidades premium.
        </p>
        <button
          onClick={onUpgrade}
          className="ls-btn-primary text-sm flex items-center gap-1.5 !px-4 !py-2"
        >
          Upgrade a {planLabel}
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default FeatureGate;
