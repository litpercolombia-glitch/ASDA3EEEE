// components/Billing/CheckoutModal.tsx
// Modal con Stripe PaymentElement integrado
// Design System: Linear meets Stripe on Dark Logistics (LS V2)
// UX: Max 6-8 campos (Baymard), inline validation, security badges

import React, { useState } from 'react';
import {
  X,
  Shield,
  Lock,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { litperStripeAppearance, formatPrice } from '../../services/stripeService';

// Note: When @stripe/stripe-js and @stripe/react-stripe-js are installed,
// uncomment the Stripe imports and replace the placeholder form:
//
// import { loadStripe } from '@stripe/stripe-js';
// import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
// const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  planPrice: number;
  billingCycle: 'monthly' | 'annual';
  clientSecret?: string;
}

// Placeholder checkout form (replace with Stripe Elements when packages are installed)
function CheckoutForm({
  planName,
  planPrice,
  billingCycle,
  onSuccess,
  onError,
}: {
  planName: string;
  planPrice: number;
  billingCycle: 'monthly' | 'annual';
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulated checkout - replace with actual Stripe integration:
    // const { error: submitError } = await elements.submit();
    // const res = await fetch('/api/stripe/create-checkout-session', { ... });
    // const { error } = await stripe.confirmPayment({ ... });

    setTimeout(() => {
      setLoading(false);
      onSuccess();
    }, 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Order Summary */}
      <div className="ls-card-elevated p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#94a3b8]">Plan seleccionado</p>
            <p className="text-lg font-semibold text-white">{planName}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{formatPrice(planPrice)}</p>
            <p className="text-xs text-[#64748b]">
              /{billingCycle === 'monthly' ? 'mes' : 'año'}
            </p>
          </div>
        </div>
      </div>

      {/* Stripe PaymentElement placeholder */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-[#94a3b8] mb-1.5">
            Número de tarjeta
          </label>
          <div className="ls-input w-full flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#64748b]" />
            <span className="text-[#64748b] text-sm">
              Se procesará con Stripe cuando se instalen los paquetes
            </span>
          </div>
        </div>
        <p className="text-xs text-[#64748b] text-center">
          Instalar: npm install @stripe/stripe-js @stripe/react-stripe-js
        </p>
      </div>

      {/* Security Badges */}
      <div className="flex items-center justify-center gap-4 py-2">
        <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          Encriptado SSL
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
          <Lock className="w-3.5 h-3.5 text-cyan-400" />
          Powered by Stripe
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="ls-btn-primary w-full flex items-center justify-center gap-2 py-3"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            Confirmar Pago - {formatPrice(planPrice)}
          </>
        )}
      </button>
    </form>
  );
}

export function CheckoutModal({
  isOpen,
  onClose,
  planName,
  planPrice,
  billingCycle,
  clientSecret,
}: CheckoutModalProps) {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 ls-modal-overlay flex items-center justify-center z-50 p-4">
      <div className="ls-modal w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[rgba(255,255,255,0.06)]">
          <h3 className="text-lg font-semibold text-white">Completar Pago</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#64748b]" />
          </button>
        </div>

        <div className="p-5">
          {success ? (
            /* Success State */
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <div className="p-4 bg-[rgba(74,222,128,0.15)] rounded-full">
                <CheckCircle className="w-12 h-12 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">¡Pago Exitoso!</h3>
              <p className="text-[#94a3b8] text-center text-sm">
                Tu plan {planName} ha sido activado. Ya puedes disfrutar de todas las funcionalidades.
              </p>
              <button
                onClick={onClose}
                className="ls-btn-primary mt-2"
              >
                Continuar
              </button>
            </div>
          ) : (
            <>
              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 mb-4 bg-[rgba(248,113,113,0.15)] border border-[rgba(248,113,113,0.3)] rounded-xl text-red-300 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Checkout Form */}
              {/* When Stripe packages are installed, wrap with:
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: litperStripeAppearance }}>
              */}
              <CheckoutForm
                planName={planName}
                planPrice={planPrice}
                billingCycle={billingCycle}
                onSuccess={() => setSuccess(true)}
                onError={(msg) => setError(msg)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CheckoutModal;
