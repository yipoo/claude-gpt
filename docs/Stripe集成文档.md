# Stripe 支付集成文档

## 概述

本文档详细说明如何在 Claude GPT 应用中集成 Stripe 支付系统，实现订阅付费功能。集成包括前端 React Native 支付界面和后端支付处理。

## 订阅计划设计

### 计划级别
```typescript
enum SubscriptionTier {
  FREE = 'free',
  BASE = 'base', 
  PRO = 'pro'
}

interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  price: number; // 月费，单位：分
  currency: string;
  features: string[];
  limits: {
    messagesPerMonth: number; // -1 表示无限制
    aiModels: string[];
    prioritySupport: boolean;
    dataExport: boolean;
  };
}
```

### 具体计划配置
```typescript
const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    tier: SubscriptionTier.FREE,
    name: 'Free',
    price: 0,
    currency: 'CNY',
    features: [
      '每月10次对话',
      '基础AI模型',
      '基础客服支持'
    ],
    limits: {
      messagesPerMonth: 10,
      aiModels: ['gpt-3.5-turbo'],
      prioritySupport: false,
      dataExport: false
    }
  },
  {
    id: 'base',
    tier: SubscriptionTier.BASE,
    name: 'Base',
    price: 2900, // ¥29.00
    currency: 'CNY',
    features: [
      '每月100次对话',
      '高级AI模型',
      '优先响应',
      '邮件客服支持'
    ],
    limits: {
      messagesPerMonth: 100,
      aiModels: ['gpt-3.5-turbo', 'gpt-4'],
      prioritySupport: true,
      dataExport: false
    }
  },
  {
    id: 'pro',
    tier: SubscriptionTier.PRO,
    name: 'Pro',
    price: 9900, // ¥99.00
    currency: 'CNY',
    features: [
      '无限对话',
      '最新AI模型',
      '优先客服支持',
      '数据导出功能',
      '高级分析'
    ],
    limits: {
      messagesPerMonth: -1,
      aiModels: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
      prioritySupport: true,
      dataExport: true
    }
  }
];
```

## 前端集成 (React Native)

### 1. 依赖安装
```bash
npm install @stripe/stripe-react-native
npm install @stripe/stripe-js # 如果有Web版本需求
```

### 2. Stripe Provider 配置
```typescript
// src/components/providers/StripeProvider.tsx
import React from 'react';
import { StripeProvider as RNStripeProvider } from '@stripe/stripe-react-native';
import { STRIPE_PUBLISHABLE_KEY } from '@/utils/constants';

interface Props {
  children: React.ReactNode;
}

export const StripeProvider: React.FC<Props> = ({ children }) => {
  return (
    <RNStripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      {children}
    </RNStripeProvider>
  );
};
```

### 3. 支付服务封装
```typescript
// src/services/payment/stripe.ts
import { 
  useStripe, 
  useConfirmPayment,
  PaymentSheet,
  initPaymentSheet,
  presentPaymentSheet
} from '@stripe/stripe-react-native';

export class StripeService {
  private stripe;
  
  constructor() {
    this.stripe = useStripe();
  }

  // 初始化Payment Sheet
  async initializePaymentSheet(paymentIntentClientSecret: string) {
    const { error } = await initPaymentSheet({
      merchantDisplayName: 'Claude GPT',
      paymentIntentClientSecret,
      style: 'alwaysDark', // 或者 'alwaysLight'
      returnURL: 'claudegpt://payment-complete',
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  // 展示支付界面
  async presentPaymentSheet() {
    const { error } = await presentPaymentSheet();
    
    if (error) {
      if (error.code === 'Canceled') {
        throw new Error('用户取消支付');
      }
      throw new Error(error.message);
    }
    
    return true;
  }

  // 创建订阅
  async createSubscription(planId: string): Promise<{ clientSecret: string }> {
    const response = await fetch('/api/create-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
      body: JSON.stringify({ planId }),
    });

    if (!response.ok) {
      throw new Error('创建订阅失败');
    }

    return response.json();
  }

  // 取消订阅
  async cancelSubscription(): Promise<void> {
    const response = await fetch('/api/cancel-subscription', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('取消订阅失败');
    }
  }

  // 获取订阅状态
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    const response = await fetch('/api/subscription-status', {
      headers: {
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('获取订阅状态失败');
    }

    return response.json();
  }
}
```

### 4. 支付Hook
```typescript
// src/hooks/useSubscription.ts
import { useState, useEffect } from 'react';
import { StripeService } from '@/services/payment';
import { useAuthStore } from '@/store';

export const useSubscription = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const { user } = useAuthStore();

  const stripeService = new StripeService();

  // 升级订阅
  const upgradeSubscription = async (planId: string) => {
    setIsLoading(true);
    try {
      // 1. 创建Payment Intent
      const { clientSecret } = await stripeService.createSubscription(planId);
      
      // 2. 初始化Payment Sheet
      await stripeService.initializePaymentSheet(clientSecret);
      
      // 3. 展示支付界面
      await stripeService.presentPaymentSheet();
      
      // 4. 支付成功，刷新订阅状态
      await refreshSubscriptionStatus();
      
      return true;
    } catch (error) {
      console.error('升级订阅失败:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 取消订阅
  const cancelSubscription = async () => {
    setIsLoading(true);
    try {
      await stripeService.cancelSubscription();
      await refreshSubscriptionStatus();
      return true;
    } catch (error) {
      console.error('取消订阅失败:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 刷新订阅状态
  const refreshSubscriptionStatus = async () => {
    try {
      const status = await stripeService.getSubscriptionStatus();
      setSubscription(status);
    } catch (error) {
      console.error('获取订阅状态失败:', error);
    }
  };

  useEffect(() => {
    if (user) {
      refreshSubscriptionStatus();
    }
  }, [user]);

  return {
    subscription,
    isLoading,
    upgradeSubscription,
    cancelSubscription,
    refreshSubscriptionStatus,
  };
};
```

### 5. 订阅页面组件
```typescript
// src/screens/Subscription/PlansScreen/index.tsx
import React from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { Button, Card } from '@/components/ui';
import { useSubscription } from '@/hooks';
import { SUBSCRIPTION_PLANS } from '@/utils/constants';
import { styles } from './styles';

export const PlansScreen: React.FC = () => {
  const { subscription, isLoading, upgradeSubscription } = useSubscription();

  const handleSelectPlan = async (planId: string) => {
    try {
      await upgradeSubscription(planId);
      Alert.alert('成功', '订阅升级成功！');
    } catch (error) {
      Alert.alert('错误', error.message);
    }
  };

  const renderPlanCard = (plan) => (
    <Card key={plan.id} style={styles.planCard}>
      <View style={styles.planHeader}>
        <Text style={styles.planName}>{plan.name}</Text>
        <Text style={styles.planPrice}>
          {plan.price === 0 ? '免费' : `¥${plan.price / 100}/月`}
        </Text>
      </View>
      
      <View style={styles.featuresList}>
        {plan.features.map((feature, index) => (
          <Text key={index} style={styles.featureItem}>
            • {feature}
          </Text>
        ))}
      </View>

      <Button
        title={subscription?.tier === plan.tier ? '当前计划' : '选择此计划'}
        onPress={() => handleSelectPlan(plan.id)}
        disabled={subscription?.tier === plan.tier || isLoading}
        style={styles.selectButton}
      />
    </Card>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>选择订阅计划</Text>
        <Text style={styles.subtitle}>升级以获得更多功能</Text>
      </View>

      {SUBSCRIPTION_PLANS.map(renderPlanCard)}
    </ScrollView>
  );
};
```

## 后端集成 (Node.js)

### 1. 依赖安装
```bash
npm install stripe
npm install express
npm install cors
npm install helmet
```

### 2. Stripe 配置
```typescript
// src/config/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Stripe产品和价格ID配置
export const STRIPE_PRODUCTS = {
  base: {
    productId: 'prod_base_subscription',
    priceId: 'price_base_monthly',
  },
  pro: {
    productId: 'prod_pro_subscription', 
    priceId: 'price_pro_monthly',
  },
};
```

### 3. 订阅API路由
```typescript
// src/routes/subscription.ts
import express from 'express';
import { stripe, STRIPE_PRODUCTS } from '../config/stripe';
import { authenticateToken } from '../middleware/auth';
import { User } from '../models/User';

const router = express.Router();

// 创建订阅
router.post('/create-subscription', authenticateToken, async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;

    // 获取用户信息
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 创建或获取Stripe客户
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: userId },
      });
      customerId = customer.id;
      
      // 保存客户ID到数据库
      await User.updateById(userId, { stripeCustomerId: customerId });
    }

    // 获取价格ID
    const priceId = STRIPE_PRODUCTS[planId]?.priceId;
    if (!priceId) {
      return res.status(400).json({ error: '无效的订阅计划' });
    }

    // 创建订阅
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    res.json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    });

  } catch (error) {
    console.error('创建订阅失败:', error);
    res.status(500).json({ error: '创建订阅失败' });
  }
});

// 取消订阅
router.post('/cancel-subscription', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user?.subscriptionId) {
      return res.status(400).json({ error: '没有有效的订阅' });
    }

    // 取消订阅（在当前计费周期结束时）
    await stripe.subscriptions.update(user.subscriptionId, {
      cancel_at_period_end: true,
    });

    res.json({ success: true });

  } catch (error) {
    console.error('取消订阅失败:', error);
    res.status(500).json({ error: '取消订阅失败' });
  }
});

// 获取订阅状态
router.get('/subscription-status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user?.subscriptionId) {
      return res.json({
        tier: 'free',
        status: 'inactive',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      });
    }

    const subscription = await stripe.subscriptions.retrieve(user.subscriptionId);
    
    res.json({
      tier: subscription.metadata.tier || 'base',
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

  } catch (error) {
    console.error('获取订阅状态失败:', error);
    res.status(500).json({ error: '获取订阅状态失败' });
  }
});

export default router;
```

### 4. Webhook 处理
```typescript
// src/routes/webhooks.ts
import express from 'express';
import { stripe } from '../config/stripe';
import { User } from '../models/User';

const router = express.Router();

router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook签名验证失败:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 处理事件
  switch (event.type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object);
      break;
      
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
      
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
      
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
      
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
      
    default:
      console.log(`未处理的事件类型: ${event.type}`);
  }

  res.json({ received: true });
});

// 处理订阅创建
async function handleSubscriptionCreated(subscription) {
  const customer = await stripe.customers.retrieve(subscription.customer);
  const userId = customer.metadata.userId;
  
  await User.updateById(userId, {
    subscriptionId: subscription.id,
    subscriptionStatus: subscription.status,
    subscriptionTier: subscription.metadata.tier,
  });
}

// 处理订阅更新
async function handleSubscriptionUpdated(subscription) {
  const customer = await stripe.customers.retrieve(subscription.customer);
  const userId = customer.metadata.userId;
  
  await User.updateById(userId, {
    subscriptionStatus: subscription.status,
    subscriptionTier: subscription.metadata.tier,
  });
}

// 处理订阅删除
async function handleSubscriptionDeleted(subscription) {
  const customer = await stripe.customers.retrieve(subscription.customer);
  const userId = customer.metadata.userId;
  
  await User.updateById(userId, {
    subscriptionId: null,
    subscriptionStatus: 'inactive',
    subscriptionTier: 'free',
  });
}

export default router;
```

## 使用量控制

### 1. 使用量中间件
```typescript
// src/middleware/usage.ts
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { SUBSCRIPTION_PLANS } from '../config/plans';

export const checkUsageLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ error: '用户未认证' });
    }

    // 获取用户当前订阅计划
    const currentPlan = SUBSCRIPTION_PLANS.find(plan => 
      plan.tier === (user.subscriptionTier || 'free')
    );

    if (!currentPlan) {
      return res.status(400).json({ error: '无效的订阅计划' });
    }

    // 检查使用量限制
    if (currentPlan.limits.messagesPerMonth !== -1) {
      const currentUsage = await getCurrentMonthUsage(userId);
      
      if (currentUsage >= currentPlan.limits.messagesPerMonth) {
        return res.status(429).json({ 
          error: '已达到当月使用限制', 
          usage: currentUsage,
          limit: currentPlan.limits.messagesPerMonth 
        });
      }
    }

    // 记录使用量
    await recordUsage(userId);
    
    next();
  } catch (error) {
    console.error('检查使用量失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

// 获取当月使用量
async function getCurrentMonthUsage(userId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const usage = await Usage.count({
    userId,
    createdAt: { $gte: startOfMonth }
  });

  return usage;
}

// 记录使用量
async function recordUsage(userId: string): Promise<void> {
  await Usage.create({
    userId,
    type: 'message',
    createdAt: new Date()
  });
}
```

## 测试

### 1. 前端测试
```typescript
// __tests__/services/stripe.test.ts
import { StripeService } from '../../src/services/payment/stripe';

describe('StripeService', () => {
  let stripeService: StripeService;

  beforeEach(() => {
    stripeService = new StripeService();
  });

  test('应该能够创建订阅', async () => {
    const planId = 'base';
    const result = await stripeService.createSubscription(planId);
    
    expect(result).toHaveProperty('clientSecret');
    expect(result.clientSecret).toMatch(/^pi_/);
  });

  test('应该能够取消订阅', async () => {
    await expect(stripeService.cancelSubscription()).resolves.not.toThrow();
  });
});
```

### 2. 后端测试
```typescript
// __tests__/routes/subscription.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('Subscription API', () => {
  test('POST /api/create-subscription', async () => {
    const response = await request(app)
      .post('/api/create-subscription')
      .set('Authorization', 'Bearer valid-token')
      .send({ planId: 'base' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('clientSecret');
  });

  test('GET /api/subscription-status', async () => {
    const response = await request(app)
      .get('/api/subscription-status')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('tier');
    expect(response.body).toHaveProperty('status');
  });
});
```

## 安全考虑

### 1. API密钥安全
- 后端使用Secret Key，前端使用Publishable Key
- 密钥通过环境变量配置，不提交到代码库
- 定期轮换API密钥

### 2. Webhook安全
- 验证Webhook签名
- 使用HTTPS端点
- 实现幂等性处理

### 3. 用户数据安全
- 支付信息由Stripe安全存储
- 本地只存储必要的订阅状态信息
- 实现访问控制和权限验证

## 监控和分析

### 1. 支付监控
- 监控支付成功率
- 监控订阅取消率
- 监控退款和争议

### 2. 使用量分析
- 分析各计划使用率
- 监控API调用量
- 优化计划定价策略

### 3. 错误处理
- 记录支付错误日志
- 实现用户友好的错误提示
- 建立客服支持流程

这个 Stripe 集成方案提供了完整的订阅支付功能，包括前端支付界面、后端API处理、Webhook事件处理和使用量控制。