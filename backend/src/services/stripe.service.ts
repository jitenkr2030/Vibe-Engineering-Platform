import Stripe from 'stripe';
import { logger } from '../utils/logger';

// Initialize Stripe with API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil',
  typescript: true,
});

// Price IDs for different plans (from Stripe Dashboard)
export const STRIPE_PRICES = {
  free: {
    monthly: process.env.STRIPE_PRICE_FREE_MONTHLY,
    yearly: process.env.STRIPE_PRICE_FREE_YEARLY,
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY || 'price_pro_yearly',
  },
  team: {
    monthly: process.env.STRIPE_PRICE_TEAM_MONTHLY || 'price_team_monthly',
    yearly: process.env.STRIPE_PRICE_TEAM_YEARLY || 'price_team_yearly',
  },
  enterprise: {
    monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise_monthly',
    yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || 'price_enterprise_yearly',
  },
};

// Usage-based prices (per token overage)
export const USAGE_PRICES = {
  tokens: process.env.STRIPE_PRICE_TOKENS || 'price_tokens_overage',
  storage: process.env.STRIPE_PRICE_STORAGE || 'price_storage_overage',
};

export interface StripeCustomer {
  id: string;
  email: string;
  name: string;
  metadata: Record<string, string>;
}

export interface CheckoutSession {
  id: string;
  url: string;
  customerId?: string;
}

export interface Subscription {
  id: string;
  status: Stripe.Subscription.Status;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  planId: string;
  priceId: string;
}

export interface UsageRecord {
  id: string;
  quantity: number;
  timestamp: Date;
}

/**
 * Create or retrieve a Stripe customer
 */
export async function getOrCreateCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<StripeCustomer> {
  try {
    // First, check if customer already exists
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
      expand: ['data'],
    });

    if (existingCustomers.data.length > 0) {
      const customer = existingCustomers.data[0] as Stripe.Customer;
      
      // Update metadata if needed
      if (customer.metadata?.userId !== userId) {
        await stripe.customers.update(customer.id, {
          metadata: { userId },
        });
      }

      return {
        id: customer.id,
        email: customer.email || email,
        name: customer.name || '',
        metadata: customer.metadata || {},
      };
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name: name || undefined,
      metadata: { userId },
    });

    logger.info(`Created Stripe customer: ${customer.id} for user: ${userId}`);

    return {
      id: customer.id,
      email: customer.email || email,
      name: customer.name || '',
      metadata: customer.metadata || {},
    };
  } catch (error) {
    logger.error('Error creating Stripe customer:', error);
    throw error;
  }
}

/**
 * Create a checkout session for subscription
 */
export async function createCheckoutSession(
  customerId: string,
  plan: string,
  billingCycle: 'monthly' | 'yearly',
  successUrl: string,
  cancelUrl: string
): Promise<CheckoutSession> {
  try {
    const priceId = STRIPE_PRICES[plan as keyof typeof STRIPE_PRICES]?.[billingCycle];

    if (!priceId) {
      throw new Error(`Invalid price for plan: ${plan}, cycle: ${billingCycle}`);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      subscription_data: {
        metadata: {
          plan,
          billingCycle,
        },
      },
      metadata: {
        plan,
        billingCycle,
        userId: customerId,
      },
    });

    logger.info(`Created checkout session: ${session.id} for customer: ${customerId}`);

    return {
      id: session.id,
      url: session.url || '',
      customerId,
    };
  } catch (error) {
    logger.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Create a customer portal session
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<{ url: string }> {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    logger.info(`Created portal session for customer: ${customerId}`);

    return { url: session.url };
  } catch (error) {
    logger.error('Error creating portal session:', error);
    throw error;
  }
}

/**
 * Get customer's subscription
 */
export async function getSubscription(
  customerId: string
): Promise<Subscription | null> {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 1,
      expand: ['data.default_payment_method'],
    });

    if (subscriptions.data.length === 0) {
      return null;
    }

    const sub = subscriptions.data[0] as Stripe.Subscription;
    const price = sub.items.data[0]?.price;

    return {
      id: sub.id,
      status: sub.status,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      planId: price?.metadata?.plan || 'unknown',
      priceId: price?.id || '',
    };
  } catch (error) {
    logger.error('Error getting subscription:', error);
    throw error;
  }
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<Subscription> {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    logger.info(`Cancelled subscription: ${subscriptionId} at period end`);

    const price = subscription.items.data[0]?.price;

    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      planId: price?.metadata?.plan || 'unknown',
      priceId: price?.id || '',
    };
  } catch (error) {
    logger.error('Error cancelling subscription:', error);
    throw error;
  }
}

/**
 * Resume a cancelled subscription
 */
export async function resumeSubscription(
  subscriptionId: string
): Promise<Subscription> {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    logger.info(`Resumed subscription: ${subscriptionId}`);

    const price = subscription.items.data[0]?.price;

    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      planId: price?.metadata?.plan || 'unknown',
      priceId: price?.id || '',
    };
  } catch (error) {
    logger.error('Error resuming subscription:', error);
    throw error;
  }
}

/**
 * Get customer invoices
 */
export async function getInvoices(
  customerId: string,
  limit: number = 10
): Promise<Array<{
  id: string;
  amount: number;
  status: string;
  date: Date;
  pdfUrl: string;
}>> {
  try {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit,
      expand: ['data.invoice_pdf'],
    });

    return invoices.data.map((invoice) => ({
      id: invoice.id,
      amount: invoice.amount_paid / 100, // Convert from cents
      status: invoice.status || 'unknown',
      date: new Date(invoice.created * 1000),
      pdfUrl: invoice.invoice_pdf?.url || '',
    }));
  } catch (error) {
    logger.error('Error getting invoices:', error);
    throw error;
  }
}

/**
 * Create setup intent for updating payment method
 */
export async function createSetupIntent(
  customerId: string
): Promise<{ clientSecret: string }> {
  try {
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });

    return { clientSecret: setupIntent.client_secret || '' };
  } catch (error) {
    logger.error('Error creating setup intent:', error);
    throw error;
  }
}

/**
 * Report usage for metered subscription
 */
export async function reportUsage(
  subscriptionItemId: string,
  quantity: number,
  timestamp?: number
): Promise<UsageRecord> {
  try {
    const usageRecord = await stripe.subscriptionItems.createUsageRecord(
      subscriptionItemId,
      {
        quantity,
        timestamp: timestamp || Math.floor(Date.now() / 1000),
        action: 'increment',
      }
    );

    logger.info(`Reported usage: ${quantity} for subscription item: ${subscriptionItemId}`);

    return {
      id: usageRecord.id,
      quantity: usageRecord.quantity,
      timestamp: new Date(usageRecord.timestamp * 1000),
    };
  } catch (error) {
    logger.error('Error reporting usage:', error);
    throw error;
  }
}

/**
 * Get usage summary for a subscription item
 */
export async function getUsageSummary(
  subscriptionItemId: string
): Promise<{
  totalUsage: number;
  periodStart: Date;
  periodEnd: Date;
}> {
  try {
    const usageRecords = await stripe.subscriptionItems.listUsageRecordSummaries(
      subscriptionItemId,
      { limit: 1 }
    );

    const latestSummary = usageRecords.data[0];

    if (!latestSummary) {
      return { totalUsage: 0, periodStart: new Date(), periodEnd: new Date() };
    }

    return {
      totalUsage: latestSummary.total_usage,
      periodStart: new Date(latestSummary.billing_period_start * 1000),
      periodEnd: new Date(latestSummary.billing_period_end * 1000),
    };
  } catch (error) {
    logger.error('Error getting usage summary:', error);
    throw error;
  }
}

/**
 * Validate promo code
 */
export async function validatePromoCode(
  code: string,
  customerId?: string
): Promise<{
  valid: boolean;
  discount: number;
  type: 'percent' | 'fixed';
  message: string;
}> {
  try {
    // Try to retrieve the promotion code
    const promoCodes = await stripe.promotionCodes.list({
      code,
      active: true,
      limit: 1,
    });

    if (promoCodes.data.length === 0) {
      return {
        valid: false,
        discount: 0,
        type: 'percent',
        message: 'Invalid or expired promo code',
      };
    }

    const promoCode = promoCodes.data[0];
    const coupon = promoCode.coupon;

    if (coupon.percent_off) {
      return {
        valid: true,
        discount: coupon.percent_off,
        type: 'percent',
        message: `${coupon.percent_off}% discount applied`,
      };
    } else if (coupon.amount_off) {
      return {
        valid: true,
        discount: coupon.amount_off / 100,
        type: 'fixed',
        message: `$${(coupon.amount_off / 100).toFixed(2)} discount applied`,
      };
    }

    return {
      valid: false,
      discount: 0,
      type: 'percent',
      message: 'Invalid promo code type',
    };
  } catch (error) {
    logger.error('Error validating promo code:', error);
    return {
      valid: false,
      discount: 0,
      type: 'percent',
      message: 'Error validating promo code',
    };
  }
}

/**
 * Handle Stripe webhook events
 */
export async function handleWebhookEvent(
  event: Stripe.Event
): Promise<{ received: boolean; type: string }> {
  logger.info(`Received Stripe webhook: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      logger.info(`Checkout completed: ${session.id}`);
      // Handle successful checkout
      // Update user subscription in database
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      logger.info(`Subscription ${event.type}: ${subscription.id}`);
      // Sync subscription to database
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      logger.info(`Subscription cancelled: ${subscription.id}`);
      // Mark subscription as cancelled in database
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      logger.info(`Invoice paid: ${invoice.id}`);
      // Record payment success
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      logger.warn(`Invoice payment failed: ${invoice.id}`);
      // Handle failed payment - send notification
      break;
    }

    case 'customer.updated': {
      const customer = event.data.object as Stripe.Customer;
      logger.info(`Customer updated: ${customer.id}`);
      // Sync customer data
      break;
    }

    default:
      logger.info(`Unhandled event type: ${event.type}`);
  }

  return { received: true, type: event.type };
}

/**
 * Construct webhook event from request
 */
export function constructWebhookEvent(
  payload: Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Get revenue metrics
 */
export async function getRevenueMetrics(
  startDate: Date,
  endDate: Date
): Promise<{
  totalRevenue: number;
  subscriptionRevenue: number;
  usageRevenue: number;
  transactionCount: number;
}> {
  try {
    // Get all charges in the period
    const charges = await stripe.charges.list({
      created: {
        gte: Math.floor(startDate.getTime() / 1000),
        lte: Math.floor(endDate.getTime() / 1000),
      },
      limit: 100,
    });

    let totalRevenue = 0;
    let subscriptionRevenue = 0;
    let usageRevenue = 0;

    for (const charge of charges.data) {
      if (charge.paid && !charge.refunded) {
        totalRevenue += charge.amount / 100;
        // Determine if subscription or usage-based
        if (charge.metadata?.type === 'usage') {
          usageRevenue += charge.amount / 100;
        } else {
          subscriptionRevenue += charge.amount / 100;
        }
      }
    }

    return {
      totalRevenue,
      subscriptionRevenue,
      usageRevenue,
      transactionCount: charges.data.length,
    };
  } catch (error) {
    logger.error('Error getting revenue metrics:', error);
    throw error;
  }
}

/**
 * Create payout for connected account (marketplace)
 */
export async function createPayout(
  amount: number,
  currency: string = 'usd',
  connectedAccountId: string
): Promise<Stripe.Payout> {
  try {
    const payout = await stripe.payouts.create(
      {
        amount,
        currency,
      },
      {
        stripeAccount: connectedAccountId,
      }
    );

    logger.info(`Created payout: ${payout.id} for account: ${connectedAccountId}`);

    return payout;
  } catch (error) {
    logger.error('Error creating payout:', error);
    throw error;
  }
}

export { stripe };
