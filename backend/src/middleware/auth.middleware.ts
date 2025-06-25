import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/prisma';
import { JWTService } from '@/utils/jwt';
import { logger } from '@/utils/logger';
import { UserService } from '@/services/user.service';

/**
 * JWT认证中间件
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTService.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: '未提供认证令牌',
        },
      });
      return;
    }

    // 验证令牌
    const decoded = JWTService.verifyToken(token);

    // 从数据库获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_002',
          message: '用户不存在',
        },
      });
      return;
    }

    // 将用户信息添加到请求对象
    (req as any).user = user;
    (req as any).userId = user.id;

    // 更新用户最后活跃时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() }
    });

    next();
  } catch (error) {
    logger.error('Token验证失败:', error);

    if (error instanceof Error) {
      if (error.message.includes('过期')) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_003',
            message: 'Token已过期',
          },
        });
        return;
      }

      if (error.message.includes('无效')) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_002',
            message: '无效的Token',
          },
        });
        return;
      }
    }

    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_001',
        message: '认证失败',
      },
    });
  }
};

/**
 * 可选认证中间件（允许未认证用户通过）
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTService.extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = JWTService.verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (user) {
        (req as any).user = user;
        (req as any).userId = user.id;

        // 更新最后活跃时间
        user.lastActiveAt = new Date();
        await prisma.user.update({
          where: { id: user.id },
          data: { lastActiveAt: new Date() }
        });
      }
    }

    next();
  } catch (error) {
    // 可选认证失败时不阻止请求
    logger.warn('可选认证失败:', error);
    next();
  }
};

/**
 * 检查订阅状态中间件
 */
export const requireSubscription = (allowedTiers: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!(req as any).user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: '需要认证',
        },
      });
      return;
    }

    if (!allowedTiers.includes((req as any).user.subscriptionTier)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'BIZ_001',
          message: '需要订阅升级',
          details: {
            currentTier: (req as any).user.subscriptionTier,
            requiredTiers: allowedTiers,
          },
        },
      });
      return;
    }

    next();
  };
};

/**
 * 检查使用量限制中间件
 */
export const checkUsageLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!(req as any).user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: '需要认证',
        },
      });
      return;
    }

    // 检查用户是否可以发送消息
    const canSend = await UserService.canSendMessage((req as any).userId);
    if (!canSend) {
      const user = (req as any).user;
      const remainingMessages = await UserService.getRemainingMessages((req as any).userId);
      
      res.status(429).json({
        success: false,
        error: {
          code: 'BIZ_002',
          message: '已达到当月使用限制',
          details: {
            currentUsage: user.monthlyMessageCount,
            subscriptionTier: user.subscriptionTier,
            remaining: remainingMessages,
          },
        },
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('检查使用量限制失败:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SYS_001',
        message: '服务器内部错误',
      },
    });
  }
};

/**
 * 管理员权限中间件
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!(req as any).user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_001',
        message: '需要认证',
      },
    });
    return;
  }

  // 这里可以添加管理员检查逻辑
  // 比如检查用户角色或特定权限
  
  next();
};