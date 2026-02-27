// components/Billing/CheckoutModal.tsx
// Modal con Stripe PaymentElement integrado
// Design System: Linear meets Stripe on Dark Logistics (LS V2)
// UX: Max 6-8 campos (Baymard), inline validation, security badges

import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Lock,
  Loader2,
  CheckCircle,
  AlertTriangle,
  CreditCard,
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { litperStripeAppearance, formatPrice, createCheckoutSession } from '../../services/stripeService';
import { useSubscriptionStore, type PlanTier } from '../../stores/subscriptionStore';

// Initialize Stripe - only when key is configured
const stripeKey = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY) || '';
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  planPrice: number;
  billingCycle: 'monthly' | 'annual';
  clientSecret?: string;
}

// Stripe PaymentElement form (used when Stripe is properly configured)
function StripeCheckoutForm({
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
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const { setPlan, setStatus } = useSubscriptionStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      onError(submitError.message || 'Error al validar el formulario');
      setLoading(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}?billing=success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      onError(error.message || 'Error al procesar el pago');
      setLoading(false);
    } else {
      const planTier = planName.toLowerCase() as PlanTier;
      setPlan(planTier === 'pro' ? 'pro' : 'enterprise');
      setStatus('active');
      setLoading(false);
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="ls-card-elevated p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#94a3b8]">Plan seleccionado</p>
            <p className="text-lg font-semibold text-white">{planName}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{formatPrice(planPrice)}</p>
            <p className="text-xs text-[#64748b]">/{billingCycle === 'monthly' ? 'mes' : 'año'}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>

      <div className="flex items-center justify-center gap-4 py-2">
        <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          Encriptado SSL 256-bit
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
          <Lock className="w-3.5 h-3.5 text-cyan-400" />
          Powered by Stripe
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !stripe || !elements}
        className="ls-btn-primary w-full flex items-center justify-center gap-2 py-3"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Procesando pago...</>
        ) : (
          <><Lock className="w-4 h-4" /> Confirmar Pago - {formatPrice(planPrice)}</>
        )}
      </button>
    </form>
  );
}

// Demo checkout form (used when Stripe is not configured yet)
function DemoCheckoutForm({
  planName,
  planPrice,
  billingCycle,
  onSuccess,
}: {
  planName: string;
  planPrice: number;
  billingCycle: 'monthly' | 'annual';
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const { setPlan, setStatus } = useSubscriptionStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const planTier = planName.toLowerCase() === 'enterprise' ? 'enterprise' : 'pro';
      setPlan(planTier as PlanTier);
      setStatus('active');
      setLoading(false);
      onSuccess();
    }, 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="ls-card-elevated p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#94a3b8]">Plan seleccionado</p>
            <p className="text-lg font-semibold text-white">{planName}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{formatPrice(planPrice)}</p>
            <p className="text-xs text-[#64748b]">/{billingCycle === 'monthly' ? 'mes' : 'año'}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-[#94a3b8] mb-1.5">Número de tarjeta</label>
          <div className="ls-input w-full flex items-center gap-3">
            <CreditCard className="w-4 h-4 text-[#64748b] flex-shrink-0" />
            <input
              type="text"
              placeholder="4242 4242 4242 4242"
              className="bg-transparent border-none outline-none text-white placeholder-[#64748b] flex-1 text-sm"
              defaultValue="4242 4242 4242 4242"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-1.5">Vencimiento</label>
            <input type="text" placeholder="MM/AA" className="ls-input w-full text-sm" defaultValue="12/28" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-1.5">CVC</label>
            <input type="text" placeholder="123" className="ls-input w-full text-sm" defaultValue="123" />
          </div>
        </div>
        <p className="text-xs text-[#64748b] text-center bg-white/[0.03] rounded-lg p-2 border border-[rgba(255,255,255,0.06)]">
          Modo demo - Configura VITE_STRIPE_PUBLISHABLE_KEY para pagos reales con Stripe
        </p>
      </div>

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

      <button
        type="submit"
        disabled={loading}
        className="ls-btn-primary w-full flex items-center justify-center gap-2 py-3"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</>
        ) : (
          <><Lock className="w-4 h-4" /> Confirmar Pago - {formatPrice(planPrice)}</>
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
  const [secret, setSecret] = useState<string | undefined>(clientSecret);

  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setError(null);
    }
  }, [isOpen]);

  // Create checkout session when opening with Stripe configured
  useEffect(() => {
    if (isOpen && stripePromise && !clientSecret) {
      createCheckoutSession(planName.toLowerCase())
        .then(data => setSecret(data.sessionId))
        .catch(() => { /* Backend not available - demo mode */ });
    }
  }, [isOpen, planName, clientSecret]);

  if (!isOpen) return null;

  const useStripeElements = stripePromise && secret;

  return (
    <div className="fixed inset-0 ls-modal-overlay flex items-center justify-center z-50 p-4">
      <div className="ls-modal w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[rgba(255,255,255,0.06)]">
          <h3 className="text-lg font-semibold text-white">Completar Pago</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-colors">
            <X className="w-5 h-5 text-[#64748b]" />
          </button>
        </div>

        <div className="p-5">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <div className="p-4 bg-[rgba(74,222,128,0.15)] rounded-full">
                <CheckCircle className="w-12 h-12 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">¡Pago Exitoso!</h3>
              <p className="text-[#94a3b8] text-center text-sm">
                Tu plan {planName} ha sido activado. Ya puedes disfrutar de todas las funcionalidades.
              </p>
              <button onClick={onClose} className="ls-btn-primary mt-2">Continuar</button>
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-center gap-2 p-3 mb-4 bg-[rgba(248,113,113,0.15)] border border-[rgba(248,113,113,0.3)] rounded-xl text-red-300 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {useStripeElements ? (
                <Elements stripe={stripePromise} options={{ clientSecret: secret, appearance: litperStripeAppearance }}>
                  <StripeCheckoutForm
                    planName={planName}
                    planPrice={planPrice}
                    billingCycle={billingCycle}
                    onSuccess={() => setSuccess(true)}
                    onError={(msg) => setError(msg)}
                  />
                </Elements>
              ) : (
                <DemoCheckoutForm
                  planName={planName}
                  planPrice={planPrice}
                  billingCycle={billingCycle}
                  onSuccess={() => setSuccess(true)}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CheckoutModal;
