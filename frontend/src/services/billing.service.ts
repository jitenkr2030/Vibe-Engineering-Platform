import { api } from './api';

export interface PricingPlan {
  name: string;
  tier: string;
  price: number;
  yearlyPrice: number;
  features: string[];
}

export interface Subscription {
  id: string;
  userId: string;
  plan: string;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
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

export const billingService = {
  // Get all available pricing plans
  async getPlans(): Promise<PricingPlan[]> {
    const response = await api.get('/billing/plans');
    return response.data.data;
  },

  // Get current subscription status
  async getSubscription(): Promise<Subscription | null> {
    try {
      const response = await api.get('/billing/subscription');
      return response.data.data;
    } catch {
      return null;
    }
  },

  // Get usage metrics
  async getUsage(): Promise<UsageMetrics> {
    const response = await api.get('/billing/usage');
    return response.data.data;
  },

  // Create checkout session for subscription
  async createCheckout(plan: string, billingCycle: 'monthly' | 'yearly'): Promise<{ url: string }> {
    const response = await api.post('/billing/create-checkout', {
      plan,
      billingCycle,
    });
    return response.data;
  },

  // Create customer portal session
  async createPortalSession(): Promise<{ url: string }> {
    const response = await api.post('/billing/create-portal');
    return response.data;
  },

  // Cancel subscription
  async cancelSubscription(): Promise<void> {
    await api.post('/billing/cancel');
  },

  // Resume subscription
  async resumeSubscription(): Promise<void> {
    await api.post('/billing/resume');
  },

  // Update payment method
  async updatePaymentMethod(): Promise<{ url: string }> {
    const response = await api.post('/billing/update-payment');
    return response.data;
  },

  // Get invoices
  async getInvoices(): Promise<Array<{
    id: string;
    amount: number;
    status: string;
    date: string;
    pdfUrl: string;
  }>> {
    const response = await api.get('/billing/invoices');
    return response.data.data;
  },

  // Apply promo code
  async applyPromoCode(code: string): Promise<{ discount: number; valid: boolean }> {
    const response = await api.post('/billing/apply-promo', { code });
    return response.data.data;
  },

  // Get revenue stats (for monetization dashboard)
  async getRevenueStats(period: 'day' | 'week' | 'month' | 'year'): Promise<{
    totalRevenue: number;
    subscriptionRevenue: number;
    usageRevenue: number;
    transactionCount: number;
    averageValue: number;
  }> {
    const response = await api.get(`/billing/stats?period=${period}`);
    return response.data.data;
  },

  // Get creator earnings (for marketplace)
  async getCreatorEarnings(): Promise<{
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
  }> {
    const response = await api.get('/billing/creator-earnings');
    return response.data.data;
  },

  // Request payout (for creators)
  async requestPayout(amount: number): Promise<{ success: boolean }> {
    const response = await api.post('/billing/request-payout', { amount });
    return response.data.data;
  },

  // Get marketplace sales (for creators)
  async getMarketplaceSales(productId?: string): Promise<Array<{
    id: string;
    productName: string;
    buyerName: string;
    amount: number;
    commission: number;
    date: string;
    status: string;
  }>> {
    const url = productId 
      ? `/billing/marketplace-sales?productId=${productId}`
      : '/billing/marketplace-sales';
    const response = await api.get(url);
    return response.data.data;
  },
};

export default billingService;
