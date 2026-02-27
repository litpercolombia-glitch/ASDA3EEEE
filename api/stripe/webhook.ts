/**
 * Stripe Endpoint: /api/stripe/webhook
 *
 * POST - Handles Stripe webhook events
 * Processes subscription lifecycle events (created, updated, deleted, payment failures)
 *
 * Events handled:
 * - checkout.session.completed: New subscription created
 * - customer.subscription.updated: Plan change, renewal
 * - customer.subscription.deleted: Cancellation
 * - invoice.payment_succeeded: Successful payment
 * - invoice.payment_failed: Failed payment
 *
 * Requires STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET env variables.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Stripe webhook requires raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    return res.status(500).json({ error: 'Stripe webhook not configured' });
  }

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-02-24.acacia' });

    const rawBody = await getRawBody(req);
    const sig = req.headers['stripe-signature'] as string;

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        console.log('Checkout completed:', {
          customerId: session.customer,
          subscriptionId: session.subscription,
          email: session.customer_email,
        });
        // TODO: Update user's plan in database
        // await db.users.update({ stripeCustomerId: session.customer, plan: 'pro', status: 'active' })
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        console.log('Subscription updated:', {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        });
        // TODO: Update subscription status in database
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        console.log('Subscription canceled:', subscription.id);
        // TODO: Downgrade user to free plan
        // await db.users.update({ stripeSubscriptionId: subscription.id, plan: 'free', status: 'canceled' })
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        console.log('Payment succeeded:', {
          customerId: invoice.customer,
          amountPaid: invoice.amount_paid / 100,
          currency: invoice.currency,
        });
        // TODO: Record payment in billing history
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        console.log('Payment failed:', {
          customerId: invoice.customer,
          attemptCount: invoice.attempt_count,
        });
        // TODO: Notify user of failed payment, update status to 'past_due'
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error.message);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}
