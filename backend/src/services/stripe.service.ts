import Stripe from 'stripe';
import { config } from '@/config/app';
import { logger } from '@/utils/logger';
import { SubscriptionTierType, SubscriptionStatusType, SubscriptionTier, SubscriptionStatus } from '@/types';

// 价格配置
const SUBSCRIPTION_PRICES = {
  [SubscriptionTier.FREE]: null, // 免费计划没有价格ID
  [SubscriptionTier.BASE]: config.stripe.basicPriceId,
  [SubscriptionTier.PRO]: config.stripe.proPriceId,
} as const;

interface CreateCheckoutSessionParams {
  userId: string;
  userEmail: string;
  tier: SubscriptionTierType;
  successUrl: string;
  cancelUrl: string;
}

interface CreatePortalSessionParams {
  customerId: string;
  returnUrl: string;
}

export class StripeService {
  private static client: Stripe | null = null;

  /**
   * 获取Stripe客户端实例
   */
  private static getClient(): Stripe {
    if (!this.client) {
      if (!config.stripe.secretKey) {
        throw new Error('Stripe secret key not configured');
      }

      this.client = new Stripe(config.stripe.secretKey, {
        apiVersion: '2022-11-15',
      });
    }

    return this.client;
  }

  /**
   * 创建或获取客户
   */
  static async createOrGetCustomer(userId: string, email: string, name?: string): Promise<Stripe.Customer> {
    try {
      const stripe = this.getClient();

      // 首先尝试通过metadata查找现有客户
      const existingCustomers = await stripe.customers.list({
        email: email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        const customer = existingCustomers.data[0];
        
        // 更新客户的metadata以包含userId
        if (!customer.metadata.userId) {
          await stripe.customers.update(customer.id, {
            metadata: { userId },
          });
        }

        logger.info('Retrieved existing Stripe customer', {
          customerId: customer.id,
          userId,
          email,
        });

        return customer;
      }

      // 创建新客户
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId,
        },
      });

      logger.info('Created new Stripe customer', {
        customerId: customer.id,
        userId,
        email,
      });

      return customer;

    } catch (error: any) {
      logger.error('Failed to create/get Stripe customer', {
        error: error.message,
        userId,
        email,
      });
      throw new Error('无法创建客户账户');
    }
  }

  /**
   * 创建结账会话
   */
  static async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> {
    try {
      const stripe = this.getClient();
      const priceId = SUBSCRIPTION_PRICES[params.tier];

      if (!priceId) {
        throw new Error(`Invalid subscription tier: ${params.tier}`);
      }

      // 创建或获取客户
      const customer = await this.createOrGetCustomer(params.userId, params.userEmail);

      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: {
          userId: params.userId,
          tier: params.tier,
        },
        subscription_data: {
          metadata: {
            userId: params.userId,
            tier: params.tier,
          },
        },
      });

      logger.info('Created Stripe checkout session', {
        sessionId: session.id,
        customerId: customer.id,
        userId: params.userId,
        tier: params.tier,
      });

      return session;

    } catch (error: any) {
      logger.error('Failed to create checkout session', {
        error: error.message,
        userId: params.userId,
        tier: params.tier,
      });
      throw new Error('无法创建结账会话');
    }
  }

  /**
   * 创建客户门户会话
   */
  static async createPortalSession(params: CreatePortalSessionParams): Promise<Stripe.BillingPortal.Session> {
    try {
      const stripe = this.getClient();

      const session = await stripe.billingPortal.sessions.create({
        customer: params.customerId,
        return_url: params.returnUrl,
      });

      logger.info('Created Stripe portal session', {
        sessionId: session.id,
        customerId: params.customerId,
      });

      return session;

    } catch (error: any) {
      logger.error('Failed to create portal session', {
        error: error.message,
        customerId: params.customerId,
      });
      throw new Error('无法创建客户门户会话');
    }
  }

  /**
   * 获取订阅信息
   */
  static async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const stripe = this.getClient();
      return await stripe.subscriptions.retrieve(subscriptionId);
    } catch (error: any) {
      logger.error('Failed to get subscription', {
        error: error.message,
        subscriptionId,
      });
      throw new Error('无法获取订阅信息');
    }
  }

  /**
   * 取消订阅
   */
  static async cancelSubscription(subscriptionId: string, immediately = false): Promise<Stripe.Subscription> {
    try {
      const stripe = this.getClient();

      if (immediately) {
        // 立即取消
        return await stripe.subscriptions.cancel(subscriptionId);
      } else {
        // 在当前计费周期结束时取消
        return await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      }
    } catch (error: any) {
      logger.error('Failed to cancel subscription', {
        error: error.message,
        subscriptionId,
      });
      throw new Error('无法取消订阅');
    }
  }

  /**
   * 恢复订阅
   */
  static async resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const stripe = this.getClient();
      
      return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });
    } catch (error: any) {
      logger.error('Failed to resume subscription', {
        error: error.message,
        subscriptionId,
      });
      throw new Error('无法恢复订阅');
    }
  }

  /**
   * 构造Webhook事件
   */
  static constructWebhookEvent(body: string | Buffer, signature: string): Stripe.Event {
    try {
      const stripe = this.getClient();
      return stripe.webhooks.constructEvent(body, signature, config.stripe.webhookSecret);
    } catch (error: any) {
      logger.error('Failed to construct webhook event', {
        error: error.message,
      });
      throw new Error('Invalid webhook signature');
    }
  }

  /**
   * 将Stripe状态转换为应用状态
   */
  static mapStripeStatusToAppStatus(stripeStatus: string): SubscriptionStatusType {
    switch (stripeStatus) {
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'canceled':
        return SubscriptionStatus.CANCELED;
      case 'past_due':
        return SubscriptionStatus.PAST_DUE;
      case 'trialing':
        return SubscriptionStatus.TRIALING;
      case 'incomplete':
      case 'incomplete_expired':
      case 'unpaid':
      default:
        return SubscriptionStatus.INACTIVE;
    }
  }

  /**
   * 将价格ID转换为订阅层级
   */
  static mapPriceIdToTier(priceId: string): SubscriptionTierType {
    const entries = Object.entries(SUBSCRIPTION_PRICES);
    const entry = entries.find(([, id]) => id === priceId);
    
    if (entry) {
      return entry[0] as SubscriptionTierType;
    }

    // 默认返回免费层级
    return SubscriptionTier.FREE;
  }

  /**
   * 获取订阅价格
   */
  static getSubscriptionPrice(tier: SubscriptionTierType): string | null {
    return SUBSCRIPTION_PRICES[tier] || null;
  }

  /**
   * 验证Webhook签名
   */
  static validateWebhookSignature(body: string | Buffer, signature: string): boolean {
    try {
      this.constructWebhookEvent(body, signature);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 计算下个计费周期的日期
   */
  static calculateNextBillingDate(subscription: Stripe.Subscription): Date {
    return new Date(subscription.current_period_end * 1000);
  }

  /**
   * 检查订阅是否即将到期
   */
  static isSubscriptionExpiringSoon(subscription: Stripe.Subscription, daysThreshold = 7): boolean {
    const now = new Date();
    const endDate = new Date(subscription.current_period_end * 1000);
    const timeDiff = endDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return daysDiff <= daysThreshold;
  }

  /**
   * 获取订阅使用量
   */
  static async getUsageRecord(subscriptionItemId: string): Promise<Stripe.UsageRecordSummary[]> {
    try {
      const stripe = this.getClient();
      const usageRecords = await stripe.subscriptionItems.listUsageRecordSummaries(subscriptionItemId);
      return usageRecords.data as Stripe.UsageRecordSummary[];
    } catch (error: any) {
      logger.error('Failed to get usage records', {
        error: error.message,
        subscriptionItemId,
      });
      return [];
    }
  }

  /**
   * 创建使用量记录
   */
  static async createUsageRecord(subscriptionItemId: string, quantity: number, timestamp?: number): Promise<Stripe.UsageRecord> {
    try {
      const stripe = this.getClient();
      return await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
        quantity,
        timestamp: timestamp || Math.floor(Date.now() / 1000),
      });
    } catch (error: any) {
      logger.error('Failed to create usage record', {
        error: error.message,
        subscriptionItemId,
        quantity,
      });
      throw new Error('无法创建使用量记录');
    }
  }
}