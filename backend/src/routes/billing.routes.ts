import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';

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
router.get('/subscription', authenticateToken, (req: Request, res: Response) => {
  // Stub implementation - would integrate with Stripe in production
  const userId = (req as any).user?.id;

  res.json({
    success: true,
    data: {
      id: 'sub_stub_123',
      userId,
      plan: 'pro',
      status: 'active',
      currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
    },
    meta: { timestamp: new Date() },
  });
});

/**
 * GET /billing/usage
 * Get current user's usage metrics
 */
router.get('/usage', authenticateToken, (_req: Request, res: Response) => {
  // Stub implementation - would fetch from usage tracking system in production
  res.json({
    success: true,
    data: {
      tokensUsed: 12500,
      tokensLimit: 50000,
      projectsUsed: 8,
      projectsLimit: -1, // -1 means unlimited
      storageUsed: 2.5 * 1024 * 1024 * 1024, // 2.5 GB in bytes
      storageLimit: 10 * 1024 * 1024 * 1024, // 10 GB in bytes
    },
    meta: { timestamp: new Date() },
  });
});

/**
 * POST /billing/create-checkout
 * Create a checkout session for subscription
 * Body: { plan: string, billingCycle: 'monthly' | 'yearly' }
 */
router.post('/create-checkout', authenticateToken, (req: Request, res: Response) => {
  const { plan, billingCycle } = req.body;

  // Validate plan
  const validPlans = PRICING_PLANS.map((p) => p.tier);
  if (!validPlans.includes(plan)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_PLAN', message: 'Invalid pricing plan specified' },
      meta: { timestamp: new Date() },
    });
  }

  // Stub implementation - would create Stripe Checkout Session in production
  // In production:
  // 1. Create or retrieve Stripe customer
  // 2. Create Checkout Session with price ID for plan
  // 3. Return session URL for redirect

  res.json({
    success: true,
    data: {
      url: `https://checkout.stripe.com/pay/cs_test_stub_${Date.now()}?plan=${plan}&cycle=${billingCycle}`,
      sessionId: `cs_test_${Date.now()}`,
    },
    meta: { timestamp: new Date() },
  });
});

/**
 * POST /billing/create-portal
 * Create a customer portal session for managing subscription
 */
router.post('/create-portal', authenticateToken, (_req: Request, res: Response) => {
  // Stub implementation - would create Stripe Customer Portal session in production
  // In production:
  // 1. Retrieve Stripe customer ID from database
  // 2. Create Portal Session
  // 3. Return portal URL for redirect

  res.json({
    success: true,
    data: {
      url: `https://billing.stripe.com/p/session/stub_${Date.now()}`,
    },
    meta: { timestamp: new Date() },
  });
});

/**
 * POST /billing/cancel
 * Cancel current subscription
 */
router.post('/cancel', authenticateToken, (_req: Request, res: Response) => {
  // Stub implementation - would cancel subscription in Stripe in production
  // In production:
  // 1. Update subscription to cancel at period end
  // 2. Update database status
  // 3. Send cancellation confirmation email

  res.json({
    success: true,
    data: {
      message: 'Subscription will be cancelled at the end of the current billing period',
      effectiveDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    meta: { timestamp: new Date() },
  });
});

/**
 * POST /billing/resume
 * Resume a cancelled subscription
 */
router.post('/resume', authenticateToken, (_req: Request, res: Response) => {
  // Stub implementation - would resume subscription in Stripe in production
  // In production:
  // 1. Reactivate subscription
  // 2. Update database status
  // 3. Send resumption confirmation email

  res.json({
    success: true,
    data: {
      message: 'Subscription resumed successfully',
      status: 'active',
    },
    meta: { timestamp: new Date() },
  });
});

/**
 * POST /billing/update-payment
 * Get URL to update payment method
 */
router.post('/update-payment', authenticateToken, (_req: Request, res: Response) => {
  // Stub implementation - would create Stripe setup session in production
  // In production:
  // 1. Create Setup Session for updating payment method
  // 2. Return setup URL

  res.json({
    success: true,
    data: {
      url: `https://billing.stripe.com/setup/su_stub_${Date.now()}`,
    },
    meta: { timestamp: new Date() },
  });
});

/**
 * GET /billing/invoices
 * Get list of invoices
 */
router.get('/invoices', authenticateToken, (_req: Request, res: Response) => {
  // Stub implementation - would fetch from Stripe in production
  res.json({
    success: true,
    data: [
      {
        id: 'inv_stub_001',
        amount: 2900,
        status: 'paid',
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        pdfUrl: 'https://billing.stripe.com/pdf/inv_001.pdf',
      },
      {
        id: 'inv_stub_002',
        amount: 2900,
        status: 'paid',
        date: new Date().toISOString(),
        pdfUrl: 'https://billing.stripe.com/pdf/inv_002.pdf',
      },
    ],
    meta: { timestamp: new Date() },
  });
});

/**
 * POST /billing/apply-promo
 * Apply a promotional code
 * Body: { code: string }
 */
router.post('/apply-promo', authenticateToken, (req: Request, res: Response) => {
  const { code } = req.body;

  // Stub implementation - would validate promo code in database in production
  const promoCodes: Record<string, { discount: number; type: 'percent' | 'fixed' }> = {
    WELCOME20: { discount: 20, type: 'percent' },
    FIRST50: { discount: 50, type: 'fixed' },
  };

  const promo = promoCodes[code.toUpperCase()];

  if (!promo) {
    return res.json({
      success: true,
      data: { discount: 0, valid: false, message: 'Invalid or expired promo code' },
      meta: { timestamp: new Date() },
    });
  }

  res.json({
    success: true,
    data: {
      discount: promo.discount,
      type: promo.type,
      valid: true,
      message: promo.type === 'percent' ? `${promo.discount}% discount applied` : `$${promo.discount} discount applied`,
    },
    meta: { timestamp: new Date() },
  });
});

/**
 * GET /billing/stats
 * Get revenue statistics (for monetization dashboard)
 * Query: { period: 'day' | 'week' | 'month' | 'year' }
 */
router.get('/stats', authenticateToken, (req: Request, res: Response) => {
  const { period } = req.query;

  // Stub implementation - would aggregate from database in production
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
      mrr: 12500, // Monthly Recurring Revenue
      arr: 150000, // Annual Recurring Revenue
      churnRate: 2.5,
      lifetimeValue: 2400,
    },
    meta: { timestamp: new Date() },
  });
});

/**
 * GET /billing/creator-earnings
 * Get creator earnings (for marketplace)
 */
router.get('/creator-earnings', authenticateToken, (_req: Request, res: Response) => {
  // Stub implementation - would calculate from marketplace sales in production
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
});

/**
 * POST /billing/request-payout
 * Request a payout for creator earnings
 * Body: { amount: number }
 */
router.post('/request-payout', authenticateToken, (req: Request, res: Response) => {
  const { amount } = req.body;

  // Stub implementation - would process payout request in production
  // In production:
  // 1. Validate amount <= available balance
  // 2. Create payout record
  // 3. Update balance
  // 4. Send notification

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
});

/**
 * GET /billing/marketplace-sales
 * Get marketplace sales (for creators)
 * Query: { productId?: string }
 */
router.get('/marketplace-sales', authenticateToken, (req: Request, res: Response) => {
  const { productId } = req.query;

  // Stub implementation - would query marketplace sales from database in production
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
});

export { router as billingRoutes };
