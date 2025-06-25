import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '@/config/prisma';
import { User, SubscriptionTier, SubscriptionStatus } from '@/types';
import { authenticateToken } from '@/middleware/auth.middleware';
import { createAPIError, handleValidationError, asyncHandler } from '@/middleware/error.middleware';
import { StripeService } from '@/services/stripe.service';
import { logger } from '@/utils/logger';
import { config } from '@/config/app';
import { UserService } from '@/services/user.service';

const router = Router();

// 创建订阅结账会话
router.post('/create-checkout-session', authenticateToken, [
  body('tier')
    .isIn([SubscriptionTier.BASE, SubscriptionTier.PRO])
    .withMessage('无效的订阅层级'),
  body('successUrl')
    .matches(/^(https?:\/\/|myapp:\/\/)/)
    .withMessage('成功页面URL格式不正确'),
  body('cancelUrl')
    .matches(/^(https?:\/\/|myapp:\/\/)/)
    .withMessage('取消页面URL格式不正确'),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw handleValidationError(errors.array());
  }

  const userId = (req as any).userId;
  const { tier, successUrl, cancelUrl } = req.body;

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw createAPIError('用户不存在', 404, 'RESOURCE_001');
  }

  // 检查用户是否已经有该层级或更高层级的订阅
  if (user.subscriptionTier === tier || 
      (user.subscriptionTier === SubscriptionTier.PRO && tier === SubscriptionTier.BASE)) {
    throw createAPIError('您已拥有此订阅或更高级的订阅', 400, 'BIZ_001');
  }

  try {
    const session = await StripeService.createCheckoutSession({
      userId,
      userEmail: user.email,
      tier,
      successUrl,
      cancelUrl,
    });

    logger.info('Checkout session created', {
      userId,
      tier,
      sessionId: session.id,
    });

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    logger.error('Failed to create checkout session', {
      error: error.message,
      stack: error.stack,
      userId,
      tier,
    });
    throw createAPIError(error.message || '创建结账会话失败', 500, 'EXT_001');
  }
}));

// 创建客户门户会话
router.post('/create-portal-session', authenticateToken, [
  body('returnUrl')
    .matches(/^(https?:\/\/|myapp:\/\/)/)
    .withMessage('返回页面URL格式不正确'),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw handleValidationError(errors.array());
  }

  const userId = (req as any).userId;
  const { returnUrl } = req.body;

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw createAPIError('用户不存在', 404, 'RESOURCE_001');
  }

  if (!user.stripeCustomerId) {
    throw createAPIError('用户没有有效的订阅账户', 400, 'BIZ_001');
  }

  try {
    const session = await StripeService.createPortalSession({
      customerId: user.stripeCustomerId,
      returnUrl,
    });

    logger.info('Portal session created', {
      userId,
      customerId: user.stripeCustomerId,
      sessionId: session.id,
    });

    res.json({
      success: true,
      data: {
        url: session.url,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    logger.error('Failed to create portal session', error);
    throw createAPIError(error.message || '创建客户门户会话失败', 500, 'EXT_001');
  }
}));

// 获取当前订阅状态
router.get('/status', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw createAPIError('用户不存在', 404, 'RESOURCE_001');
  }

  const remainingMessages = await UserService.getRemainingMessages(userId);
  const availableModels = await UserService.getAvailableModels(userId);


  res.json({
    success: true,
    data: {
      subscription: {
        tier: user.subscriptionTier,
        status: user.subscriptionStatus,
        currentPeriodEnd: user.subscriptionCurrentPeriodEnd,
        cancelAtPeriodEnd: user.subscriptionCancelAtPeriodEnd,
      },
      usage: {
        monthlyMessageCount: user.monthlyMessageCount,
        totalMessageCount: user.totalMessageCount,
        remainingMessages,
        monthlyResetDate: user.monthlyResetDate,
      },
      features: {
        availableModels,
        maxMessagesPerMonth: user.subscriptionTier === SubscriptionTier.FREE ? 10 :
          user.subscriptionTier === SubscriptionTier.BASE ? 100 : -1,
      },
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}));

// 取消订阅
router.post('/cancel', authenticateToken, [
  body('immediately')
    .optional()
    .isBoolean()
    .withMessage('immediately参数必须是布尔值'),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw handleValidationError(errors.array());
  }

  const userId = (req as any).userId;
  const { immediately = false } = req.body;

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw createAPIError('用户不存在', 404, 'RESOURCE_001');
  }

  if (!user.subscriptionId || user.subscriptionStatus === SubscriptionStatus.CANCELED) {
    throw createAPIError('没有有效的订阅可以取消', 400, 'BIZ_001');
  }

  try {
    const subscription = await StripeService.cancelSubscription(user.subscriptionId, immediately);

    // 更新用户订阅状态
    if (immediately) {
      user.subscriptionStatus = SubscriptionStatus.CANCELED;
      user.subscriptionTier = SubscriptionTier.FREE;
    } else {
      user.subscriptionCancelAtPeriodEnd = true;
    }

    await prisma.user.update({
      where: { id: userId },
      data: user,
    });

    logger.info('Subscription canceled', {
      userId,
      subscriptionId: user.subscriptionId,
      immediately,
    });

    res.json({
      success: true,
      data: {
        message: immediately ? '订阅已立即取消' : '订阅将在当前计费周期结束时取消',
        subscription: {
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    logger.error('Failed to cancel subscription', error);
    throw createAPIError(error.message || '取消订阅失败', 500, 'EXT_001');
  }
}));

// 恢复订阅
router.post('/resume', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw createAPIError('用户不存在', 404, 'RESOURCE_001');
  }

  if (!user.subscriptionId || !user.subscriptionCancelAtPeriodEnd) {
    throw createAPIError('没有可恢复的订阅', 400, 'BIZ_001');
  }

  try {
    const subscription = await StripeService.resumeSubscription(user.subscriptionId);

    // 更新用户订阅状态
    user.subscriptionCancelAtPeriodEnd = false;
    await prisma.user.update({
      where: { id: userId },
      data: user,
    });

    logger.info('Subscription resumed', {
      userId,
      subscriptionId: user.subscriptionId,
    });

    res.json({
      success: true,
      data: {
        message: '订阅已成功恢复',
        subscription: {
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    logger.error('Failed to resume subscription', error);
    throw createAPIError(error.message || '恢复订阅失败', 500, 'EXT_001');
  }
}));

// Stripe Webhook处理
router.post('/webhook', asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  
  if (!signature) {
    throw createAPIError('Missing Stripe signature', 400, 'VAL_001');
  }

  try {
    const event = StripeService.constructWebhookEvent(req.body, signature);
    
    logger.info('Received Stripe webhook', {
      eventType: event.type,
      eventId: event.id,
    });


    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const userId = subscription.metadata.userId;
        
        if (userId) {
          const user = await prisma.user.findUnique({ where: { id: userId } });
          if (user) {
            // 更新订阅信息
            user.subscriptionId = subscription.id;
            user.subscriptionStatus = StripeService.mapStripeStatusToAppStatus(subscription.status);
            user.subscriptionCurrentPeriodEnd = new Date(subscription.current_period_end * 1000);
            user.subscriptionCancelAtPeriodEnd = subscription.cancel_at_period_end;
            
            // 更新订阅层级
            if (subscription.items && subscription.items.data.length > 0) {
              const priceId = subscription.items.data[0].price.id;
              user.subscriptionTier = StripeService.mapPriceIdToTier(priceId);
            }

            await prisma.user.update({
              where: { id: userId },
              data: user,
            });
            
            logger.info('Updated user subscription from webhook', {
              userId,
              subscriptionId: subscription.id,
              status: subscription.status,
              tier: user.subscriptionTier,
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const userId = subscription.metadata.userId;
        
        if (userId) {
          const user = await prisma.user.findUnique({ where: { id: userId } });
          if (user) {
            user.subscriptionStatus = SubscriptionStatus.CANCELED;
            user.subscriptionTier = SubscriptionTier.FREE;
            user.subscriptionCurrentPeriodEnd = null;
            user.subscriptionCancelAtPeriodEnd = false;
            
            await prisma.user.update({
              where: { id: userId },
              data: user,
            });
            
            logger.info('Canceled user subscription from webhook', {
              userId,
              subscriptionId: subscription.id,
            });
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        
        if (invoice.subscription) {
          const subscription = await StripeService.getSubscription(invoice.subscription);
          const userId = subscription.metadata.userId;
          
          if (userId) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (user) {
              user.subscriptionStatus = SubscriptionStatus.ACTIVE;
              user.subscriptionCurrentPeriodEnd = new Date(subscription.current_period_end * 1000);
              
              // 重置月度使用量（如果是新的计费周期）
              const now = new Date();
              const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
              if (user.monthlyResetDate < monthStart) {
                user.monthlyMessageCount = 0;
                user.monthlyResetDate = monthStart;
              }
              
              await prisma.user.update({
                where: { id: userId },
                data: user,
              });
              
              logger.info('Payment succeeded, updated subscription', {
                userId,
                subscriptionId: subscription.id,
                invoiceId: invoice.id,
              });
            }
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        
        if (invoice.subscription) {
          const subscription = await StripeService.getSubscription(invoice.subscription);
          const userId = subscription.metadata.userId;
          
          if (userId) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (user) {
              user.subscriptionStatus = SubscriptionStatus.PAST_DUE;
              await prisma.user.update({
                where: { id: userId },
                data: user,
              });
              
              logger.warn('Payment failed for subscription', {
                userId,
                subscriptionId: subscription.id,
                invoiceId: invoice.id,
              });
            }
          }
        }
        break;
      }

      default:
        logger.info('Unhandled webhook event type', { eventType: event.type });
    }

    res.json({ received: true });

  } catch (error: any) {
    logger.error('Webhook processing failed', error);
    throw createAPIError('Webhook处理失败', 400, 'EXT_001');
  }
}));

export default router;