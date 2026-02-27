// stores/subscriptionStore.ts
// Estado global de suscripción con Zustand - LITPER PRO Billing
// Design System: Linear meets Stripe on Dark Logistics (LS V2)

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Plan hierarchy for feature gating comparisons
export const PLAN_HIERARCHY: Record<PlanTier, number> = {
  free: 0,
  pro: 1,
  enterprise: 2,
};

export type PlanTier = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | 'none';
export type BillingCycle = 'monthly' | 'annual';

export interface PlanLimits {
  shipments: number;
  users: number;
  reports: number;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: { shipments: 50, users: 1, reports: 10 },
  pro: { shipments: 500, users: 5, reports: 100 },
  enterprise: { shipments: Infinity, users: Infinity, reports: Infinity },
};

export interface PlanPricing {
  monthly: number;
  annual: number;
  currency: string;
}

export const PLAN_PRICING: Record<PlanTier, PlanPricing> = {
  free: { monthly: 0, annual: 0, currency: 'USD' },
  pro: { monthly: 29, annual: 290, currency: 'USD' },
  enterprise: { monthly: 99, annual: 990, currency: 'USD' },
};

export interface UsageMetric {
  used: number;
  limit: number;
}

export interface SubscriptionState {
  currentPlan: PlanTier;
  status: SubscriptionStatus;
  usage: {
    shipments: UsageMetric;
    users: UsageMetric;
    reports: UsageMetric;
  };
  billingCycle: BillingCycle;
  nextBillingDate: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;

  // Actions
  setPlan: (plan: PlanTier) => void;
  setStatus: (status: SubscriptionStatus) => void;
  setBillingCycle: (cycle: BillingCycle) => void;
  setStripeIds: (customerId: string, subscriptionId: string) => void;
  updateUsage: (metric: keyof SubscriptionState['usage'], used: number) => void;
  incrementUsage: (metric: keyof SubscriptionState['usage']) => void;
  setNextBillingDate: (date: string | null) => void;
  hasFeatureAccess: (requiredPlan: PlanTier) => boolean;
  isUsageNearLimit: (metric: keyof SubscriptionState['usage'], threshold?: number) => boolean;
  getUsagePercentage: (metric: keyof SubscriptionState['usage']) => number;
  reset: () => void;
}

const initialState = {
  currentPlan: 'free' as PlanTier,
  status: 'none' as SubscriptionStatus,
  usage: {
    shipments: { used: 0, limit: PLAN_LIMITS.free.shipments },
    users: { used: 1, limit: PLAN_LIMITS.free.users },
    reports: { used: 0, limit: PLAN_LIMITS.free.reports },
  },
  billingCycle: 'monthly' as BillingCycle,
  nextBillingDate: null as string | null,
  stripeCustomerId: null as string | null,
  stripeSubscriptionId: null as string | null,
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPlan: (plan) => set({
        currentPlan: plan,
        usage: {
          shipments: { used: get().usage.shipments.used, limit: PLAN_LIMITS[plan].shipments },
          users: { used: get().usage.users.used, limit: PLAN_LIMITS[plan].users },
          reports: { used: get().usage.reports.used, limit: PLAN_LIMITS[plan].reports },
        },
      }),

      setStatus: (status) => set({ status }),

      setBillingCycle: (cycle) => set({ billingCycle: cycle }),

      setStripeIds: (customerId, subscriptionId) => set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
      }),

      updateUsage: (metric, used) => set((state) => ({
        usage: {
          ...state.usage,
          [metric]: { ...state.usage[metric], used },
        },
      })),

      incrementUsage: (metric) => set((state) => ({
        usage: {
          ...state.usage,
          [metric]: { ...state.usage[metric], used: state.usage[metric].used + 1 },
        },
      })),

      setNextBillingDate: (date) => set({ nextBillingDate: date }),

      hasFeatureAccess: (requiredPlan) => {
        const state = get();
        return PLAN_HIERARCHY[state.currentPlan] >= PLAN_HIERARCHY[requiredPlan];
      },

      isUsageNearLimit: (metric, threshold = 0.8) => {
        const state = get();
        const usage = state.usage[metric];
        if (usage.limit === Infinity) return false;
        return usage.used / usage.limit >= threshold;
      },

      getUsagePercentage: (metric) => {
        const state = get();
        const usage = state.usage[metric];
        if (usage.limit === Infinity) return 0;
        return Math.min(100, Math.round((usage.used / usage.limit) * 100));
      },

      reset: () => set(initialState),
    }),
    {
      name: 'litper_subscription',
    }
  )
);
