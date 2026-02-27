// components/Billing/SubscriptionManager.tsx
// Panel de gestión de suscripción visible en settings/billing
// Design System: Linear meets Stripe on Dark Logistics (LS V2)
// UX: Overview card + usage meters + billing history + plan change (NNG patterns)

import React, { useState } from 'react';
import {
  CreditCard,
  Calendar,
  ArrowUpRight,
  Settings,
  FileText,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { useSubscriptionStore, PLAN_PRICING, type PlanTier } from '../../stores/subscriptionStore';
import { STRIPE_PLANS, formatPrice, createCustomerPortalSession } from '../../services/stripeService';
import { UsageMeter } from './UsageMeter';

interface SubscriptionManagerProps {
  onOpenPricing: () => void;
  onOpenCheckout?: (planId: string, priceId: string) => void;
}

export function SubscriptionManager({ onOpenPricing, onOpenCheckout }: SubscriptionManagerProps) {
  const {
    currentPlan,
    status,
    billingCycle,
    nextBillingDate,
    usage,
  } = useSubscriptionStore();

  const [loadingPortal, setLoadingPortal] = useState(false);

  const planConfig = STRIPE_PLANS.find(p => p.id === currentPlan);
  const price = billingCycle === 'monthly'
    ? PLAN_PRICING[currentPlan].monthly
    : PLAN_PRICING[currentPlan].annual;

  const handleOpenPortal = async () => {
    setLoadingPortal(true);
    try {
      const { url } = await createCustomerPortalSession();
      window.open(url, '_blank');
    } catch {
      // Portal not available in demo mode
    } finally {
      setLoadingPortal(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-[rgba(0,245,255,0.12)] rounded-xl">
          <CreditCard className="w-7 h-7 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Suscripción y Facturación</h2>
          <p className="text-[#94a3b8] text-sm">Gestiona tu plan y métodos de pago</p>
        </div>
      </div>

      {/* Current Plan Card */}
      <div className="ls-card p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-semibold text-white">
                Plan {planConfig?.name || currentPlan}
              </h3>
              {currentPlan !== 'free' && (
                <span className="ls-badge ls-badge-cyan">
                  {status === 'active' ? 'Activo' : status}
                </span>
              )}
            </div>
            <p className="text-sm text-[#94a3b8]">
              {planConfig?.description}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">{formatPrice(price)}</p>
            <p className="text-xs text-[#64748b]">
              /{billingCycle === 'monthly' ? 'mes' : 'año'}
            </p>
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {nextBillingDate && (
            <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
              <Calendar className="w-4 h-4 text-[#64748b]" />
              Próxima factura: {new Date(nextBillingDate).toLocaleDateString('es-CO')}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
            <CreditCard className="w-4 h-4 text-[#64748b]" />
            {currentPlan === 'free' ? 'Sin método de pago' : '•••• 4242'}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {currentPlan === 'free' ? (
            <button
              onClick={onOpenPricing}
              className="ls-btn-primary flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Upgrade a Pro
            </button>
          ) : (
            <>
              <button
                onClick={onOpenPricing}
                className="ls-btn-secondary flex items-center gap-2"
              >
                <ArrowUpRight className="w-4 h-4" />
                Cambiar Plan
              </button>
              <button
                onClick={handleOpenPortal}
                disabled={loadingPortal}
                className="ls-btn-secondary flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                {loadingPortal ? 'Cargando...' : 'Gestionar Pago'}
              </button>
              <button
                onClick={handleOpenPortal}
                className="ls-btn-secondary flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Facturas
                <ExternalLink className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Usage Meters */}
      <div className="ls-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Uso este mes</h3>
        <div className="space-y-5">
          <UsageMeter
            metric="shipments"
            label="Envíos"
            onUpgrade={onOpenPricing}
          />
          <UsageMeter
            metric="users"
            label="Usuarios"
            onUpgrade={onOpenPricing}
          />
          <UsageMeter
            metric="reports"
            label="Reportes"
            onUpgrade={onOpenPricing}
          />
        </div>
      </div>

      {/* Plan Comparison Quick View */}
      {currentPlan === 'free' && (
        <div className="ls-card-glass p-6">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">¿Listo para más?</h3>
          </div>
          <p className="text-sm text-[#94a3b8] mb-4">
            Con el plan Pro obtienes 500 envíos/mes, reportes con IA, analytics avanzados
            y soporte prioritario por solo {formatPrice(29)}/mes.
          </p>
          <button
            onClick={onOpenPricing}
            className="ls-btn-primary flex items-center gap-2"
          >
            Ver Planes
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default SubscriptionManager;
