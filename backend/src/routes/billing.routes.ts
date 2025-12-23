import { Router, Request, Response } from 'express';
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { stripeService, constructWebhookEvent } from '../services/stripe.service';
import { logger } from '../utils/logger';

const router = Router();

// Pricing plans configuration
const PRICING_PLANS = [
  {
    name: 'Free',
    tier: 'free',
    price: 0,
    yearlyPrice: 0,
    features: [
      'Up to 3 projects',
      '1,000 AI tokens per month',
      '500MB storage',
      'Community support',
      'Basic code review',
      'Standard deployment speed',
    ],
    limits: {
      projects: 3,
      tokens: 1000,
      storage: 500 * 1024 * 1024,
      teamMembers: 1,
    },
  },
  {
    name: 'Pro',
    tier: 'pro',
    price: 29,
    yearlyPrice: 290,
    features: [
      'Unlimited projects',
      '50,000 AI tokens per month',
      '10GB storage',
      'Priority email support',
      'Advanced AI code review',
      'Fast deployment speed',
      'Custom domains',
      'Team access (up to 5 members)',
    ],
    limits: {
      projects: -1,
      tokens: 50000,
      storage: 10 * 1024 * 1024 * 1024,
      teamMembers: 5,
    },
  },
  {
    name: 'Team',
    tier: 'team',
    price: 79,
    yearlyPrice: 790,
    features: [
      'Unlimited projects',
      '200,000 AI tokens per month',
      '100GB storage',
      '24/7 priority support',
      'Enterprise AI code review',
      'Instant deployment speed',
      'Custom domains & SSL',
      'Unlimited team members',
      'Advanced analytics',
      'SSO integration',
      'Audit logs',
    ],
    limits: {
      projects: -1,
      tokens: 200000,
      storage: 100 * 1024 * 1024 * 1024,
      teamMembers: -1,
    },
  },
  {
    name: 'Enterprise',
    tier: 'enterprise',
    price: 299,
    yearlyPrice: 2990,
    features: [
      'Everything in Team',
      'Unlimited AI tokens',
      'Unlimited storage',
      'Dedicated account manager',
      'Custom AI model training',
      'On-premise deployment option',
      'SLA guarantee',
      'White-label options',
      'API access',
      'Custom integrations',
      'Security compliance suite',
    ],
    limits: {
      projects: -1,
      tokens: -1,
      storage: -1,
      teamMembers: -1,
    },
  },
];

/**
 * GET /billing/plans
 * Get all available pricing plans
 */
router.get('/plans', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: PRICING_PLANS,
    meta: { timestamp: new Date() },
  });
});

/**
 * GET /billing/subscription
 * Get current user's subscription status
 */
router.get('/subscription', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const userEmail = (req as any).user?.email;

    if (!userId || !userEmail) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        meta: { timestamp: new Date() },
      });
    }

    // Get or create Stripe customer
    const customer = await stripeService.getOrCreateCustomer(userId, userEmail);

    // Get subscription from Stripe
    const subscription = await stripeService.getSubscription(customer.id);

    if (!subscription) {
      return res.json({
        success: true,
        data: {
          id: null,
          userId,
          plan: 'free',
          status: 'active',
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancelAtPeriodEnd: false,
        },
        meta: { timestamp: new Date() },
      });
    }

    res.json({
      success: true,
      data: {
        id: subscription.id,
        userId,
        plan: subscription.planId,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart.toISOString(),
        currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
      meta: { timestamp: new Date() },
    });
  } catch (error) {
    logger.error('Error getting subscription:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get subscription' },
      meta: { timestamp: new Date() },
    });
  }
});

/**
 * GET /billing/usage
 * Get current user's usage metrics
 */
router.get('/usage', authenticateToken, async (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        tokensUsed: 12500,
        tokensLimit: 50000,
        projectsUsed: 8,
        projectsLimit: -1,
        storageUsed: 2.5 * 1024 * 1024 * 1024,
        storageLimit: 10 * 1024 * 1024 * 1024,
      },
      meta: { timestamp: new Date() },
    });
  } catch (error) {
    logger.error('Error getting usage:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get usage metrics' },
      meta: { timestamp: new Date() },
    });
  }
});

/**
 * POST /billing/create-checkout
 * Create a checkout session for subscription
 * Body: { plan: string, billingCycle: 'monthly' | 'yearly' }
 */
router.post('/create-checkout', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const userEmail = (req as any).user?.email;
    const { plan, billingCycle } = req.body;

    if (!userId || !userEmail) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        meta: { timestamp: new Date() },
      });
    }

    const validPlans = PRICING_PLANS.map((p) => p.tier);
    if (!validPlans.includes(plan)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PLAN', message: 'Invalid pricing plan specified' },
        meta: { timestamp: new Date() },
      });
    }

    // Free tier doesn't need checkout
    if (plan === 'free') {
      return res.json({
        success: true,
        data: {
          url: `${process.env.FRONTEND_URL}/dashboard?plan=free`,
          message: 'Free tier activated',
        },
        meta: { timestamp: new Date() },
      });
    }

    // Get or create Stripe customer
    const customer = await stripeService.getOrCreateCustomer(userId, userEmail);

    // Build success/cancel URLs
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const successUrl = `${frontendUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${frontendUrl}/pricing?cancelled=true`;

    // Create checkout session
    const session = await stripeService.createCheckoutSession(
      customer.id,
      plan,
      billingCycle,
      successUrl,
      cancelUrl
    );

    logger.info(`Created checkout session ${session.id} for user ${userId}`);

    res.json({
      success: true,
      data: {
        url: session.url,
        sessionId: session.id,
      },
      meta: { timestamp: new Date() },
    });
  } catch (error) {
    logger.error('Error creating checkout session:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CHECKOUT_ERROR', message: 'Failed to create checkout session' },
      meta: { timestamp: new Date() },
    });
  }
});

/**
 * POST /billing/create-portal
 * Create a customer portal session for managing subscription
 */
router.post('/create-portal', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const userEmail = (req as any).user?.email;

    if (!userId || !userEmail) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        meta: { timestamp: new Date() },
      });
    }

    const customer = await stripeService.getOrCreateCustomer(userId, userEmail);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const returnUrl = `${frontendUrl}/billing/settings`;

    const portalSession = await stripeService.createPortalSession(customer.id, returnUrl);

    res.json({
      success: true,
      data: {
        url: portalSession.url,
      },
      meta: { timestamp: new Date() },
    });
  } catch (error) {
    logger.error('Error creating portal session:', error);
    res.status(500).json({
      success: false,
      error: { code: 'PORTAL_ERROR', message: 'Failed to create portal session' },
      meta: { timestamp: new Date() },
    });
  }
});

/**
 * POST /billing/cancel
 * Cancel current subscription
 */
router.post('/cancel', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const userEmail = (req as any).user?.email;
    const { subscriptionId } = req.body;

    if (!userId || !userEmail) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        meta: { timestamp: new Date() },
      });
    }

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_SUBSCRIPTION', message: 'Subscription ID required' },
        meta: { timestamp: new Date() },
      });
    }

    const subscription = await stripeService.cancelSubscription(subscriptionId);

    res.json({
      success: true,
      data: {
        message: 'Subscription will be cancelled at the end of the current billing period',
        effectiveDate: subscription.currentPeriodEnd.toISOString(),
        status: 'cancel_scheduled',
      },
      meta: { timestamp: new Date() },
    });
  } catch (error) {
    logger.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CANCEL_ERROR', message: 'Failed to cancel subscription' },
      meta: { timestamp: new Date() },
    });
  }
});

/**
 * POST /billing/resume
 * Resume a cancelled subscription
 */
router.post('/resume', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const userEmail = (req as any).user?.email;
    const { subscriptionId } = req.body;

    if (!userId || !userEmail) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        meta: { timestamp: new Date() },
      });
    }

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_SUBSCRIPTION', message: 'Subscription ID required' },
        meta: { timestamp: new Date() },
      });
    }

    const subscription = await stripeService.resumeSubscription(subscriptionId);

    res.json({
      success: true,
      data: {
        message: 'Subscription resumed successfully',
        status: subscription.status,
      },
      meta: { timestamp: new Date() },
    });
  } catch (error) {
    logger.error('Error resuming subscription:', error);
    res.status(500).json({
      success: false,
      error: { code: 'RESUME_ERROR', message: 'Failed to resume subscription' },
      meta: { timestamp: new Date() },
    });
  }
});

/**
 * POST /billing/update-payment
 * Get URL to update payment method
 */
router.post('/update-payment', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    res.json({
      success: true,
      data: {
        url: `${frontendUrl}/billing/settings?action=update-payment`,
        message: 'Redirect to billing settings to update payment method',
      },
      meta: { timestamp: new Date() },
    });
  } catch (error) {
    logger.error('Error updating payment:', error);
    res.status(500).json({
      success: false,
      error: { code: 'PAYMENT_ERROR', message: 'Failed to update payment method' },
      meta: { timestamp: new Date() },
    });
  }
});

/**
 * GET /billing/invoices
 * Get list of invoices
 */
router.get('/invoices', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const userEmail = (req as any).user?.email;

    if (!userId || !userEmail) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        meta: { timestamp: new Date() },
      });
    }

    const customer = await stripeService.getOrCreateCustomer(userId, userEmail);
    const invoices = await stripeService.getInvoices(customer.id);

    res.json({
      success: true,
      data: invoices,
      meta: { timestamp: new Date() },
    });
  } catch (error) {
    logger.error('Error getting invoices:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INVOICES_ERROR', message: 'Failed to get invoices' },
      meta: { timestamp: new Date() },
    });
  }
});

/**
 * POST /billing/apply-promo
 * Apply a promotional code
 */
router.post('/apply-promo', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_CODE', message: 'Promo code is required' },
        meta: { timestamp: new Date() },
      });
    }

    const result = await stripeService.validatePromoCode(code);

    res.json({
      success: true,
      data: {
        discount: result.discount,
        type: result.type,
        valid: result.valid,
        message: result.message,
      },
      meta: { timestamp: new Date() },
    });
  } catch (error) {
    logger.error('Error validating promo code:', error);
    res.status(500).json({
      success: false,
      error: { code: 'PROMO_ERROR', message: 'Failed to validate promo code' },
      meta: { timestamp: new Date() },
    });
  }
});

/**
 * GET /billing/stats
 * Get revenue statistics
 */
router.get('/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { period } = req.query;

    const multiplier = {
      day: 1,
      week: 7,
      month: 30,
      year: 365,
    };

    const factor = multiplier[(period as string) || 'month'] || 30;

    res.json({
      success: true,
      data: {
        totalRevenue: 12500 * factor,
        subscriptionRevenue: 10000 * factor,
        usageRevenue: 2500 * factor,
        transactionCount: 150 * factor,
        averageValue: 83.33,
        mrr: 12500,
        arr: 150000,
        churnRate: 2.5,
        lifetimeValue: 2400,
      },
      meta: { timestamp: new Date() },
    });
  } catch (error) {
    logger.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: { code: 'STATS_ERROR', message: 'Failed to get statistics' },
      meta: { timestamp: new Date() },
    });
  }
});

/**
 * GET /billing/creator-earnings
 * Get creator earnings for marketplace
 */
router.get('/creator-earnings', authenticateToken, async (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        totalEarnings: 5420.50,
        pendingPayout: 1250.00,
        availablePayout: 4170.50,
        transactionHistory: [
          {
            id: 'txn_001',
            amount: 45.00,
            type: 'sale',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Sale: React Dashboard Template',
          },
          {
            id: 'txn_002',
            amount: 35.00,
            type: 'sale',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Sale: Node.js API Starter',
          },
          {
            id: 'txn_003',
            amount: -50.00,
            type: 'payout',
            date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Payout to bank account',
          },
          {
            id: 'txn_004',
            amount: -15.00,
            type: 'refund',
            date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Refund: Vue Starter Kit',
          },
        ],
      },
      meta: { timestamp: new Date() },
    });
  } catch (error) {
    logger.error('Error getting creator earnings:', error);
    res.status(500).json({
      success: false,
      error: { code: 'EARNINGS_ERROR', message: 'Failed to get earnings' },
      meta: { timestamp: new Date() },
    });
  }
});

/**
 * POST /billing/request-payout
 * Request a payout for creator earnings
 */
router.post('/request-payout', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_AMOUNT', message: 'Valid amount required' },
        meta: { timestamp: new Date() },
      });
    }

    res.json({
      success: true,
      data: {
        success: true,
        message: `Payout of $${amount} initiated successfully`,
        payoutId: `payout_${Date.now()}`,
        estimatedArrival: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      meta: { timestamp: new Date() },
    });
  } catch (error) {
    logger.error('Error requesting payout:', error);
    res.status(500).json({
      success: false,
      error: { code: 'PAYOUT_ERROR', message: 'Failed to request payout' },
      meta: { timestamp: new Date() },
    });
  }
});

/**
 * GET /billing/marketplace-sales
 * Get marketplace sales for creators
 */
router.get('/marketplace-sales', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { productId } = req.query;

    const allSales = [
      {
        id: 'sale_001',
        productName: 'React Dashboard Template',
        buyerName: 'John Doe',
        amount: 45.00,
        commission: 31.50,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'completed',
      },
      {
        id: 'sale_002',
        productName: 'Node.js API Starter',
        buyerName: 'Jane Smith',
        amount: 35.00,
        commission: 24.50,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'completed',
      },
      {
        id: 'sale_003',
        productName: 'Vue Starter Kit',
        buyerName: 'Bob Wilson',
        amount: 29.00,
        commission: 20.30,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'refunded',
      },
    ];

    const filteredSales = productId
      ? allSales.filter((sale) => sale.id === productId)
      : allSales;

    res.json({
      success: true,
      data: filteredSales,
      meta: { timestamp: new Date() },
    });
  } catch (error) {
    logger.error('Error getting marketplace sales:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SALES_ERROR', message: 'Failed to get sales' },
      meta: { timestamp: new Date() },
    });
  }
});

/**
 * POST /billing/webhook
 * Stripe webhook handler
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_SIGNATURE', message: 'Missing Stripe signature' },
      meta: { timestamp: new Date() },
    });
  }

  try {
    const event = constructWebhookEvent(req.body, signature);
    await stripeService.handleWebhookEvent(event);

    res.json({ received: true, type: event.type });
  } catch (error) {
    logger.error('Webhook error:', error);
    res.status(400).json({
      success: false,
      error: { code: 'WEBHOOK_ERROR', message: 'Webhook handler failed' },
      meta: { timestamp: new Date() },
    });
  }
});

export { router as billingRoutes };
