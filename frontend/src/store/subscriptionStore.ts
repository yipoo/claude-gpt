/**
 * 订阅状态管理 Store
 */

import { create } from 'zustand';
import { apiClient, SubscriptionStatus, SubscriptionInfo, UsageInfo, SubscriptionFeatures } from '../api/client';

interface SubscriptionState {
  subscription: SubscriptionInfo | null;
  usage: UsageInfo | null;
  features: SubscriptionFeatures | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadSubscriptionStatus: () => Promise<void>;
  createCheckoutSession: (tier: 'BASE' | 'PRO', successUrl: string, cancelUrl: string) => Promise<{ sessionId: string; url: string }>;
  createPortalSession: (returnUrl: string) => Promise<{ url: string }>;
  cancelSubscription: (immediately?: boolean) => Promise<void>;
  resumeSubscription: () => Promise<void>;
  clearError: () => void;
  
  // Computed properties
  isSubscribed: () => boolean;
  canUpgrade: () => boolean;
  canDowngrade: () => boolean;
  getRemainingMessages: () => number;
  getUsagePercentage: () => number;
  isUsageLimitReached: () => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscription: null,
  usage: null,
  features: null,
  isLoading: false,
  error: null,

  loadSubscriptionStatus: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const status: SubscriptionStatus = await apiClient.getSubscriptionStatus();
      
      set({
        subscription: status.subscription,
        usage: status.usage,
        features: status.features,
        isLoading: false,
      });
      
      console.log('Subscription status loaded:', status);
    } catch (error: any) {
      console.error('Failed to load subscription status:', error);
      const errorMessage = error.response?.data?.error?.message || error.message || '加载订阅状态失败';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  createCheckoutSession: async (tier: 'BASE' | 'PRO', successUrl: string, cancelUrl: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const result = await apiClient.createCheckoutSession(tier, successUrl, cancelUrl);
      
      set({ isLoading: false });
      
      console.log('Checkout session created:', result);
      return result;
    } catch (error: any) {
      console.error('Failed to create checkout session:', error);
      const errorMessage = error.response?.data?.error?.message || error.message || '创建支付会话失败';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  createPortalSession: async (returnUrl: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const result = await apiClient.createPortalSession(returnUrl);
      
      set({ isLoading: false });
      
      console.log('Portal session created:', result);
      return result;
    } catch (error: any) {
      console.error('Failed to create portal session:', error);
      const errorMessage = error.response?.data?.error?.message || error.message || '创建客户门户会话失败';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  cancelSubscription: async (immediately = false) => {
    try {
      set({ isLoading: true, error: null });
      
      await apiClient.cancelSubscription(immediately);
      
      // 重新加载订阅状态
      await get().loadSubscriptionStatus();
      
      console.log('Subscription canceled:', { immediately });
    } catch (error: any) {
      console.error('Failed to cancel subscription:', error);
      const errorMessage = error.response?.data?.error?.message || error.message || '取消订阅失败';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  resumeSubscription: async () => {
    try {
      set({ isLoading: true, error: null });
      
      await apiClient.resumeSubscription();
      
      // 重新加载订阅状态
      await get().loadSubscriptionStatus();
      
      console.log('Subscription resumed');
    } catch (error: any) {
      console.error('Failed to resume subscription:', error);
      const errorMessage = error.response?.data?.error?.message || error.message || '恢复订阅失败';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  // Computed properties
  isSubscribed: () => {
    const { subscription } = get();
    return subscription?.tier !== 'FREE' && subscription?.status === 'ACTIVE';
  },

  canUpgrade: () => {
    const { subscription } = get();
    if (!subscription) return false;
    
    return subscription.tier === 'FREE' || 
           (subscription.tier === 'BASE' && subscription.status === 'ACTIVE');
  },

  canDowngrade: () => {
    const { subscription } = get();
    if (!subscription) return false;
    
    return (subscription.tier === 'BASE' || subscription.tier === 'PRO') && 
           subscription.status === 'ACTIVE';
  },

  getRemainingMessages: () => {
    const { usage } = get();
    return usage?.remainingMessages || 0;
  },

  getUsagePercentage: () => {
    const { usage, features } = get();
    if (!usage || !features) return 0;
    
    const maxMessages = features.maxMessagesPerMonth;
    if (maxMessages === -1) return 0; // Unlimited
    
    return Math.min((usage.monthlyMessageCount / maxMessages) * 100, 100);
  },

  isUsageLimitReached: () => {
    const { usage } = get();
    return usage ? usage.remainingMessages <= 0 : false;
  },
}));