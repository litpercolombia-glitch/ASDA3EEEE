/**
 * Stripe Endpoint: /api/stripe/subscription-status
 *
 * GET - Returns the current subscription status for a customer
 *
 * Query params:
 * - customer_id: Stripe Customer ID
 *
 * Returns:
 * - plan: Current plan name
 * - status: Subscription status (active, past_due, canceled, etc.)
 * - currentPeriodEnd: End of current billing period
 * - cancelAtPeriodEnd: Whether subscription will cancel at period end
 *
 * Requires STRIPE_SECRET_KEY env variable.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    const customerId = req.query.customer_id as string;

    if (!customerId) {
      return res.status(400).json({ error: 'customer_id query param is required' });
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-02-24.acacia' });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return res.status(200).json({
        plan: 'free',
        status: 'none',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      });
    }

    const sub = subscriptions.data[0];
    const priceId = sub.items.data[0]?.price.id || '';

    // Map price ID to plan name
    let plan = 'free';
    if (priceId.includes('pro') || priceId === process.env.STRIPE_PRICE_PRO_MONTHLY || priceId === process.env.STRIPE_PRICE_PRO_ANNUAL) {
      plan = 'pro';
    } else if (priceId.includes('enterprise') || priceId === process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || priceId === process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL) {
      plan = 'enterprise';
    }

    return res.status(200).json({
      plan,
      status: sub.status,
      currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    });
  } catch (error: any) {
    console.error('Subscription status error:', error.message);
    return res.status(500).json({
      error: error.message || 'Failed to get subscription status',
    });
  }
}
