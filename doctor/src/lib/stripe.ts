import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';
import {addTokensToFirebase} from './firebase';

const stripe = new Stripe(import.meta.env.VITE_STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

let stripePromise: Promise<any> | null = null;

export const getStripeInstance = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

// Card brand images from Stripe's CDN
export const CARD_BRAND_IMAGES: { [key: string]: string } = {
  visa: 'https://js.stripe.com/v3/fingerprinted/img/visa-729c05c240c4bdb47b03ac81d9945bfe.svg',
  mastercard: 'https://js.stripe.com/v3/fingerprinted/img/mastercard-4d8844094130711885b5e41b28c9848f.svg',
  amex: 'https://js.stripe.com/v3/fingerprinted/img/amex-a49b82f46c5cd6a96a6e418a6ca1717c.svg',
  discover: 'https://js.stripe.com/v3/fingerprinted/img/discover-ac52cd46f89fa40a29a0bfb954e33173.svg',
  jcb: 'https://js.stripe.com/v3/fingerprinted/img/jcb-271fd06e6e7a2c52692ffa91a95fb64f.svg',
  diners: 'https://js.stripe.com/v3/fingerprinted/img/diners-fbcbd3360f8e3f629cdaa80e93abdb8b.svg',
  unionpay: 'https://js.stripe.com/v3/fingerprinted/img/unionpay-8a10aefc7295216c338ba4e1224627a1.svg'
};

export const TOKEN_PLAN = {
  price: import.meta.env.VITE_STRIPE_PRICE_BASIC,
  name: 'Token Package',
  priceDisplay: '$100',
  tokenAmount: 100,
  features: [
    '100 AI conversation tokens',
    '1 token per second of conversation',
    'No expiration',
    'Pay as you go',
    'Flexible usage'
  ]
};

export async function createTokenCheckoutSession(email: string, existingCustomerId?: string) {
  try {
    if (!email) throw new Error('Email is required');

    let customer;

    // Handle existing customer
    if (existingCustomerId) {
      try {
        customer = await stripe.customers.retrieve(existingCustomerId);
        if ((customer as any).deleted) {
          customer = null;
        }
      } catch (error) {
        console.error('Error retrieving existing customer:', error);
        customer = null;
      }
    }

    // Create new customer if needed
    if (!customer) {
      customer = await stripe.customers.create({
        email,
        metadata: { tokenAmount: TOKEN_PLAN.tokenAmount.toString() }
      });
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer: customer.id,
      line_items: [{
        price: TOKEN_PLAN.price,
        quantity: 1,
      }],
      payment_intent_data: {
        setup_future_usage: 'off_session',
      },
      success_url: `${window.location.origin}/payments?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${window.location.origin}/payments`,
      metadata: {
        userEmail: email,
        tokenAmount: TOKEN_PLAN.tokenAmount.toString(),
        customerId: customer.id,
      }
    });

    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export async function retrieveCheckoutSession(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'payment_intent', 'payment_intent.payment_method']
    });
    return session;
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    throw new Error(`Failed to retrieve checkout session: ${error.message}`);
  }
}

export async function handleTokenPurchaseComplete(
  session: Stripe.Checkout.Session,
  userId: string
) {
  try {
    if (!session?.id) {
      throw new Error('Invalid session');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get customer ID from metadata
    const customerId = session.metadata?.customerId;
    if (!customerId) {
      throw new Error('Customer ID not found in session metadata');
    }

    // Add tokens to Firebase with session ID for idempotency
    const tokensAdded = await addTokensToFirebase(userId, customerId, session.id);

    // Handle payment method
    if (session.payment_intent && typeof session.payment_intent === 'string') {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent, {
          expand: ['payment_method']
        });

        if (paymentIntent.payment_method && typeof paymentIntent.payment_method !== 'string') {
          // Set this payment method as default
          await stripe.customers.update(customerId, {
            invoice_settings: { default_payment_method: paymentIntent.payment_method.id }
          });
        }
      } catch (error) {
        console.error('Error setting default payment method:', error);
        // Continue even if setting default payment method fails
      }
    }

    return {
      customerId,
      amountTotal: session.amount_total,
      tokenAmount: tokensAdded,
      success: true
    };
  } catch (error) {
    console.error('Error handling token purchase:', error);
    throw error;
  }
}

export async function updateCustomerDefaultPaymentMethod(customerId: string, paymentMethodId: string) {
  try {
    if (!customerId || typeof customerId !== 'string') {
      throw new Error('Valid customer ID string is required');
    }
    if (!paymentMethodId || typeof paymentMethodId !== 'string') {
      throw new Error('Valid payment method ID string is required');
    }

    try {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId.toString()
      });
    } catch (error: any) {
      if (error.code !== 'payment_method_already_attached') {
        throw error;
      }
    }

    await stripe.customers.update(customerId.toString(), {
      invoice_settings: { default_payment_method: paymentMethodId }
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating payment method:', error);
    throw new Error('Failed to update payment method: ${error.message}');
  }
}

export async function getCustomerInvoices(customerId: string) {
  try {
    if (!customerId || typeof customerId !== 'string') {
      throw new Error('Valid customer ID string is required');
    }

    const paymentIntents = await stripe.paymentIntents.list({
      customer: customerId.toString(),
      limit: 24,
      expand: ['data.payment_method', 'data.latest_charge']
    });

    return paymentIntents.data.map(pi => {
      const charge = pi.latest_charge && typeof pi.latest_charge === 'object' ? pi.latest_charge : null;
      const paymentMethod = pi.payment_method && typeof pi.payment_method === 'object' ? pi.payment_method : null;

      return {
        id: pi.id,
        amount_paid: pi.amount,
        status: pi.status,
        created: pi.created,
        receipt_url: charge?.receipt_url || null,
        payment_method: paymentMethod,
        description: '${TOKEN_PLAN.tokenAmount} Tokens Purchase'
      };
    }).filter(invoice => invoice.status === 'succeeded' || invoice.status === 'processing');
  } catch (error) {
    console.error('Error getting payment history:', error);
    throw new Error('Failed to get customer invoices: ${error.message}');
  }
}

export async function getCustomerPaymentMethods(customerId: string) {
  try {
    if (!customerId || typeof customerId !== 'string') {
      throw new Error('Valid customer ID string is required');
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId.toString(),
      type: 'card'
    });

    const customer = await stripe.customers.retrieve(customerId.toString());
    if (typeof customer === 'string' || !customer || customer.deleted) {
      throw new Error('Customer not found or deleted');
    }

    const defaultPaymentMethodId = customer.invoice_settings?.default_payment_method;

    return paymentMethods.data.map(method => ({
      id: method.id,
      card: {
        brand: method.card?.brand || '',
        last4: method.card?.last4 || '',
        exp_month: method.card?.exp_month || 0,
        exp_year: method.card?.exp_year || 0
      },
      isDefault: method.id === defaultPaymentMethodId
    }));
  } catch (error) {
    console.error('Error getting payment methods:', error);
    throw new Error('Failed to get payment methods: ${error.message}');
  }
}

export async function getLatestPaymentAndTokens(customerId: string) {
  try {
    if (!customerId || typeof customerId !== 'string') {
      throw new Error('Valid customer ID string is required');
    }

    const paymentIntents = await stripe.paymentIntents.list({
      customer: customerId.toString(),
      limit: 1
    });

    const latestPayment = paymentIntents.data[0];

    return {
      latestPaymentDate: latestPayment ? new Date(latestPayment.created * 1000) : null,
      latestChargeAmount: latestPayment?.amount || 0,
      paymentStatus: latestPayment?.status || null
    };
  } catch (error) {
    console.error('Error getting payment details:', error);
    throw new Error('Failed to retrieve latest payment details: ${error.message}');
  }
}