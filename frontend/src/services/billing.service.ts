import { api } from './api';

export interface PricingPlan {
  name: string;
  tier: string;
  price: number;
  yearlyPrice: number;
  features: string[];
  limits?: {
    projects: number;
    tokens: number;
    storage: number;
    teamMembers: number;
  };
}

export interface Subscription {
  id: string | null;
  userId: string;
  plan: string;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing' | 'incomplete';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface UsageMetrics {
  tokensUsed: number;
  tokensLimit: number;
  projectsUsed: number;
  projectsLimit: number;
  storageUsed: number;
  storageLimit: number;
}

export interface CheckoutSession {
  url: string;
  sessionId?: string;
  message?: string;
}

export interface PortalSession {
  url: string;
}

export interface Invoice {
  id: string;
  amount: number;
  status: string;
  date: string;
  pdfUrl: string;
}

export interface PromoCodeResult {
  discount: number;
  type: 'percent' | 'fixed';
  valid: boolean;
  message: string;
}

export interface RevenueStats {
  totalRevenue: number;
  subscriptionRevenue: number;
  usageRevenue: number;
  transactionCount: number;
  averageValue: number;
  mrr?: number;
  arr?: number;
  churnRate?: number;
  lifetimeValue?: number;
}

export interface CreatorEarnings {
  totalEarnings: number;
  pendingPayout: number;
  availablePayout: number;
  transactionHistory: Array<{
    id: string;
    amount: number;
    type: 'sale' | 'payout' | 'refund';
    date: string;
    description: string;
  }>;
}

export interface PayoutRequest {
  success: boolean;
  message: string;
  payoutId: string;
  estimatedArrival: string;
}

export interface MarketplaceSale {
  id: string;
  productName: string;
  buyerName: string;
  amount: number;
  commission: number;
  date: string;
  status: string;
}

export interface CancelSubscriptionResult {
  message: string;
  effectiveDate: string;
  status: string;
}

export const billingService = {
  /**
   * Get all available pricing plans
   */
  async getPlans(): Promise<PricingPlan[]> {
    const response = await api.get('/billing/plans');
    return response.data.data;
  },

  /**
   * Get current subscription status
   * Returns null if user is on free tier or no subscription exists
   */
  async getSubscription(): Promise<Subscription | null> {
    try {
      const response = await api.get('/billing/subscription');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  },

  /**
   * Get usage metrics for current billing period
   */
  async getUsage(): Promise<UsageMetrics> {
    const response = await api.get('/billing/usage');
    return response.data.data;
  },

  /**
   * Create checkout session and return Stripe URL
   * @param plan - The pricing tier to subscribe to
   * @param billingCycle - Monthly or yearly billing
   * @returns Object containing checkout URL and session ID
   */
  async createCheckout(plan: string, billingCycle: 'monthly' | 'yearly'): Promise<CheckoutSession> {
    const response = await api.post('/billing/create-checkout', {
      plan,
      billingCycle,
    });
    return response.data.data;
  },

  /**
   * Create customer portal session for managing subscription
   * @returns Object containing portal URL
   */
  async createPortalSession(): Promise<PortalSession> {
    const response = await api.post('/billing/create-portal');
    return response.data.data;
  },

  /**
   * Cancel current subscription
   * Subscription will remain active until end of billing period
   * @param subscriptionId - The Stripe subscription ID to cancel
   */
  async cancelSubscription(subscriptionId: string): Promise<CancelSubscriptionResult> {
    const response = await api.post('/billing/cancel', { subscriptionId });
    return response.data.data;
  },

  /**
   * Resume a cancelled subscription
   * Only works if subscription hasn't reached end of period
   * @param subscriptionId - The Stripe subscription ID to resume
   */
  async resumeSubscription(subscriptionId: string): Promise<{ message: string; status: string }> {
    const response = await api.post('/billing/resume', { subscriptionId });
    return response.data.data;
  },

  /**
   * Get URL to update payment method
   */
  async updatePaymentMethod(): Promise<{ url: string }> {
    const response = await api.post('/billing/update-payment');
    return response.data.data;
  },

  /**
   * Get list of invoices
   */
  async getInvoices(): Promise<Invoice[]> {
    const response = await api.get('/billing/invoices');
    return response.data.data;
  },

  /**
   * Apply promotional code to checkout
   * @param code - The promo code to validate
   * @returns Object containing discount information
   */
  async applyPromoCode(code: string): Promise<PromoCodeResult> {
    const response = await api.post('/billing/apply-promo', { code });
    return response.data.data;
  },

  /**
   * Get revenue statistics for monetization dashboard
   * @param period - Time period for stats (day, week, month, year)
   */
  async getRevenueStats(period: 'day' | 'week' | 'month' | 'year'): Promise<RevenueStats> {
    const response = await api.get(`/billing/stats?period=${period}`);
    return response.data.data;
  },

  /**
   * Get creator earnings for marketplace
   */
  async getCreatorEarnings(): Promise<CreatorEarnings> {
    const response = await api.get('/billing/creator-earnings');
    return response.data.data;
  },

  /**
   * Request payout for available earnings
   * @param amount - Amount to payout in dollars
   */
  async requestPayout(amount: number): Promise<PayoutRequest> {
    const response = await api.post('/billing/request-payout', { amount });
    return response.data.data;
  },

  /**
   * Get marketplace sales history
   * @param productId - Optional filter by specific product
   */
  async getMarketplaceSales(productId?: string): Promise<MarketplaceSale[]> {
    const url = productId
      ? `/billing/marketplace-sales?productId=${productId}`
      : '/billing/marketplace-sales';
    const response = await api.get(url);
    return response.data.data;
  },

  /**
   * Check if user has active paid subscription
   */
  async hasActiveSubscription(): Promise<boolean> {
    const subscription = await this.getSubscription();
    if (!subscription) return false;
    
    const activeStatuses = ['active', 'trialing'];
    return activeStatuses.includes(subscription.status);
  },

  /**
   * Get plan limits for current subscription
   */
  async getCurrentPlanLimits(): Promise<PricingPlan['limits'] | null> {
    const plans = await this.getPlans();
    const subscription = await this.getSubscription();
    
    if (!subscription) {
      // Free tier limits
      return {
        projects: 3,
        tokens: 1000,
        storage: 500 * 1024 * 1024,
        teamMembers: 1,
      };
    }

    const currentPlan = plans.find(p => p.tier === subscription.plan);
    return currentPlan?.limits || null;
  },

  /**
   * Calculate usage percentage for UI progress bars
   */
  async getUsagePercentage(): Promise<{
    tokens: number;
    projects: number;
    storage: number;
  }> {
    const usage = await this.getUsage();
    
    return {
      tokens: usage.tokensLimit > 0 
        ? Math.round((usage.tokensUsed / usage.tokensLimit) * 100) 
        : 0,
      projects: usage.projectsLimit > 0 
        ? Math.round((usage.projectsUsed / usage.projectsLimit) * 100) 
        : 0,
      storage: usage.storageLimit > 0 
        ? Math.round((usage.storageUsed / usage.storageLimit) * 100) 
        : 0,
    };
  },

  /**
   * Format price for display
   */
  formatPrice(price: number, billingCycle: 'monthly' | 'yearly'): string {
    if (price === 0) return 'Free';
    
    const period = billingCycle === 'yearly' ? '/year' : '/month';
    return `$${price.toFixed(2)}${period}`;
  },

  /**
   * Calculate yearly discount percentage
   */
  calculateYearlySavings(monthlyPrice: number, yearlyPrice: number): number {
    if (monthlyPrice === 0) return 0;
    
    const yearlyMonthlyEquivalent = yearlyPrice / 12;
    const savings = ((monthlyPrice - yearlyMonthlyEquivalent) / monthlyPrice) * 100;
    return Math.round(savings);
  },
};

export default billingService;
