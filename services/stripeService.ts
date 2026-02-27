// services/stripeService.ts
// Stripe integration service - LITPER PRO
// Design System: Linear meets Stripe on Dark Logistics (LS V2)

import type { Appearance } from '@stripe/stripe-js';

// Stripe Appearance API - Dark theme matching LITPER design system
export const litperStripeAppearance: Appearance = {
  theme: 'night',
  variables: {
    colorPrimary: '#00f5ff',
    colorBackground: '#111827',
    colorText: '#f1f5f9',
    colorDanger: '#f87171',
    fontFamily: 'Inter, system-ui, sans-serif',
    spacingUnit: '4px',
    borderRadius: '10px',
    colorTextPlaceholder: '#64748b',
  },
  rules: {
    '.Tab': {
      border: '1px solid rgba(255, 255, 255, 0.10)',
      backgroundColor: '#111827',
      boxShadow: 'none',
    },
    '.Tab--selected': {
      borderColor: 'rgba(0, 245, 255, 0.4)',
      backgroundColor: 'rgba(0, 245, 255, 0.08)',
      color: '#00f5ff',
    },
    '.Tab:hover': {
      borderColor: 'rgba(255, 255, 255, 0.16)',
      backgroundColor: '#1a1f2e',
    },
    '.Input': {
      backgroundColor: '#111827',
      border: '1px solid rgba(255, 255, 255, 0.10)',
      boxShadow: 'none',
    },
    '.Input:focus': {
      borderColor: 'rgba(0, 245, 255, 0.4)',
      boxShadow: '0 0 0 3px rgba(0, 245, 255, 0.1)',
    },
    '.Label': {
      color: '#94a3b8',
      fontWeight: '500',
    },
  },
};

// Plan configuration with Stripe price IDs
export interface PlanConfig {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
  currency: string;
  features: string[];
  highlighted: boolean;
  cta: string;
  stripePriceIdMonthly: string;
  stripePriceIdAnnual: string;
}

export const STRIPE_PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: 'Starter',
    description: 'Perfecto para empezar con logística básica',
    priceMonthly: 0,
    priceAnnual: 0,
    currency: 'USD',
    features: [
      '50 envíos/mes',
      '1 usuario',
      'Reportes básicos',
      'Tracking manual',
      'Soporte community',
    ],
    highlighted: false,
    cta: 'Empezar Gratis',
    stripePriceIdMonthly: '',
    stripePriceIdAnnual: '',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Para equipos que necesitan automatización e IA',
    priceMonthly: 29,
    priceAnnual: 290,
    currency: 'USD',
    features: [
      '500 envíos/mes',
      '5 usuarios',
      'Reportes avanzados + IA',
      'Tracking automático + Push',
      'Analytics dashboard',
      'Soporte email 24h',
      'Integraciones API',
    ],
    highlighted: true,
    cta: 'Upgrade a Pro',
    stripePriceIdMonthly: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
    stripePriceIdAnnual: import.meta.env.VITE_STRIPE_PRICE_PRO_ANNUAL || 'price_pro_annual',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Solución completa para operaciones a escala',
    priceMonthly: 99,
    priceAnnual: 990,
    currency: 'USD',
    features: [
      'Envíos ilimitados',
      'Usuarios ilimitados',
      'Reportes custom + API',
      'Real-time tracking + Webhooks',
      'White-label dashboard',
      'Soporte dedicado + SLA',
      'Stripe Connect (pagos a drivers)',
      'Onboarding personalizado',
    ],
    highlighted: false,
    cta: 'Contactar Ventas',
    stripePriceIdMonthly: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise_monthly',
    stripePriceIdAnnual: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE_ANNUAL || 'price_enterprise_annual',
  },
];

// API helpers for Stripe integration
export async function createCheckoutSession(priceId: string): Promise<{ sessionId: string; url: string }> {
  const res = await fetch('/api/stripe/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ price_id: priceId }),
  });
  if (!res.ok) throw new Error('Failed to create checkout session');
  return res.json();
}

export async function createCustomerPortalSession(): Promise<{ url: string }> {
  const res = await fetch('/api/stripe/create-customer-portal-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to create portal session');
  return res.json();
}

export async function getSubscriptionStatus(): Promise<{
  plan: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}> {
  const res = await fetch('/api/stripe/subscription-status');
  if (!res.ok) throw new Error('Failed to get subscription status');
  return res.json();
}

// Format price display
export function formatPrice(amount: number, currency: string = 'USD'): string {
  if (amount === 0) return 'Gratis';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Calculate annual savings
export function getAnnualSavings(monthly: number, annual: number): number {
  if (monthly === 0) return 0;
  return Math.round(((monthly * 12 - annual) / (monthly * 12)) * 100);
}
