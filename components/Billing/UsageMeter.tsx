// components/Billing/UsageMeter.tsx
// Barra de uso con alerta al 80% - usage gate trigger
// Design System: Linear meets Stripe on Dark Logistics (LS V2)
// UX: Usage gate at 80% triggers upgrade prompt (Zapier pattern)

import React from 'react';
import { AlertTriangle, ArrowUpRight } from 'lucide-react';
import { useSubscriptionStore } from '../../stores/subscriptionStore';

interface UsageMeterProps {
  metric: 'shipments' | 'users' | 'reports';
  label: string;
  showUpgradeAt?: number;
  onUpgrade?: () => void;
}

export function UsageMeter({
  metric,
  label,
  showUpgradeAt = 80,
  onUpgrade,
}: UsageMeterProps) {
  const { usage, getUsagePercentage, isUsageNearLimit } = useSubscriptionStore();
  const { used, limit } = usage[metric];
  const percentage = getUsagePercentage(metric);
  const isNearLimit = isUsageNearLimit(metric, showUpgradeAt / 100);
  const isAtLimit = used >= limit && limit !== Infinity;

  const getBarColor = () => {
    if (isAtLimit) return 'bg-gradient-to-r from-red-500 to-rose-400';
    if (isNearLimit) return 'bg-gradient-to-r from-amber-500 to-yellow-400';
    return 'bg-gradient-to-r from-cyan-500 to-blue-400';
  };

  const limitDisplay = limit === Infinity ? '∞' : limit.toLocaleString();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#94a3b8]">{label}</span>
        <span className="text-sm font-medium text-white">
          {used.toLocaleString()} / {limitDisplay}
        </span>
      </div>

      <div className="ls-progress-track">
        <div
          className={`ls-progress-fill ${getBarColor()}`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>

      {isNearLimit && !isAtLimit && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-amber-400">
            <AlertTriangle className="w-3 h-3" />
            {percentage}% usado - Considera hacer upgrade
          </div>
          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Upgrade
              <ArrowUpRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {isAtLimit && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-red-400">
            <AlertTriangle className="w-3 h-3" />
            Límite alcanzado
          </div>
          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className="ls-btn-primary !text-xs !px-3 !py-1 flex items-center gap-1"
            >
              Upgrade ahora
              <ArrowUpRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default UsageMeter;
