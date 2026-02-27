/**
 * Stripe Endpoint: /api/stripe/create-checkout-session
 *
 * POST - Creates a Stripe Checkout Session for subscription payment
 *
 * Body:
 * - price_id: Stripe Price ID for the subscription
 *
 * Returns:
 * - sessionId: Stripe Session ID
 * - url: Checkout URL to redirect the user
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
    const { price_id } = req.body;

    if (!price_id) {
      return res.status(400).json({ error: 'price_id is required' });
    }

    // Dynamic import to avoid issues when stripe is not installed
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-02-24.acacia' });

    const origin = req.headers.origin || req.headers.referer || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      success_url: `${origin}?billing=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}?billing=canceled`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Stripe checkout session error:', error.message);
    return res.status(500).json({
      error: error.message || 'Failed to create checkout session',
    });
  }
}
