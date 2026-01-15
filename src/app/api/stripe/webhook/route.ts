import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe lazily
let stripeInstance: Stripe | null = null;

const getStripe = () => {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
};

const NEXRA_API_URL = process.env.NEXT_PUBLIC_NEXRA_API_URL || 'https://nexra-api.nexra-api.workers.dev';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    const userId = session.metadata?.userId;
    const credits = parseInt(session.metadata?.credits || '0', 10);

    if (userId && credits > 0) {
      try {
        // Add credits to user via nexra-api
        const response = await fetch(`${NEXRA_API_URL}/users/${userId}/add-credits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            credits,
            source: 'stripe',
            paymentId: session.payment_intent as string,
            amount: session.amount_total,
          }),
        });

        if (!response.ok) {
          console.error('Failed to add credits:', await response.text());
        } else {
          console.log(`Added ${credits} credits to user ${userId}`);
        }
      } catch (error) {
        console.error('Error adding credits:', error);
      }
    }
  }

  return NextResponse.json({ received: true });
}
