import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe lazily to avoid build-time errors
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

// Credit packs mapping (priceId -> credits)
const getCreditPacks = (): Record<string, number> => ({
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER || 'starter']: 5,
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_POPULAR || 'popular']: 15,
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || 'pro']: 50,
});

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const body = await request.json();
    const { priceId, userId, userEmail } = body;

    if (!priceId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the credits amount for this price
    const creditPacks = getCreditPacks();
    const credits = creditPacks[priceId] || 0;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://nexra-jet.vercel.app'}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://nexra-jet.vercel.app'}/pricing`,
      customer_email: userEmail,
      metadata: {
        userId,
        credits: credits.toString(),
        priceId,
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
