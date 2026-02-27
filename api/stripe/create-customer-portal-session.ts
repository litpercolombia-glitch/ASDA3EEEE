/**
 * Stripe Endpoint: /api/stripe/create-customer-portal-session
 *
 * POST - Creates a Stripe Customer Portal session
 * Allows customers to manage their subscription, update payment methods, view invoices
 *
 * Returns:
 * - url: Portal URL to redirect the user
 *
 * Requires STRIPE_SECRET_KEY env variable.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return res.status(500).json({ error: 'Stripe not configured. Set STRIPE_SECRET_KEY.' });
  }

  try {
    const { customer_id } = req.body;

    if (!customer_id) {
      return res.status(400).json({ error: 'customer_id is required' });
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-02-24.acacia' });

    const origin = req.headers.origin || req.headers.referer || 'http://localhost:5173';

    const session = await stripe.billingPortal.sessions.create({
      customer: customer_id,
      return_url: `${origin}?billing=portal-return`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe portal session error:', error.message);
    return res.status(500).json({
      error: error.message || 'Failed to create portal session',
    });
  }
}
