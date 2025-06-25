import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { config } from '@/config/app';
import { prisma } from '@/config/prisma';
import { SubscriptionTier, SubscriptionStatus } from '@/types';
import { JWTService } from '@/utils/jwt';
import { createAPIError, handleValidationError, asyncHandler } from '@/middleware/error.middleware';
import { authenticateToken } from '@/middleware/auth.middleware';
import { logger } from '@/utils/logger';

const router = Router();

// 用户注册验证规则
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('密码长度至少8位')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('密码必须包含大小写字母和数字'),
  body('fullName')
    .isLength({ min: 2, max: 50 })
    .withMessage('姓名长度必须在2-50个字符之间')
    .matches(/^[a-zA-Z\u4e00-\u9fa5\s0-9]+$/)
    .withMessage('姓名只能包含字母、中文、数字和空格'),
];

// 用户登录验证规则
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空'),
];

// 用户注册
router.post('/register', registerValidation, asyncHandler(async (req: Request, res: Response) => {
  // 检查验证结果
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw handleValidationError(errors.array());
  }

  const { email, password, fullName } = req.body;

  // 检查用户是否已存在
  const existingUser = await prisma.user.findUnique({ where: { email } });
  
  if (existingUser) {
    throw createAPIError('该邮箱已被注册', 409, 'AUTH_002');
  }

  // 加密密码
  const saltRounds = config.security.bcryptRounds;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // 创建新用户
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashedPassword,
      fullName,
      subscriptionTier: SubscriptionTier.FREE,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      monthlyMessageCount: 0,
      totalMessageCount: 0,
      emailVerified: false,
    }
  });

  // 生成JWT令牌
  const accessToken = JWTService.generateAccessToken({
    userId: user.id,
    email: user.email,
    subscriptionTier: user.subscriptionTier,
  });

  const refreshToken = JWTService.generateRefreshToken(user.id);

  logger.info('User registered successfully', {
    userId: user.id,
    email: user.email,
    subscriptionTier: user.subscriptionTier,
  });

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        monthlyMessageCount: user.monthlyMessageCount,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: '1h',
      },
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}));

// 用户登录
router.post('/login', loginValidation, asyncHandler(async (req: Request, res: Response) => {
  // 检查验证结果
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw handleValidationError(errors.array());
  }

  const { email, password } = req.body;

  // 查找用户
  const user = await prisma.user.findUnique({ 
    where: { email },
    select: {
      id: true,
      email: true,
      fullName: true,
      passwordHash: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      monthlyMessageCount: true
    }
  });

  if (!user) {
    throw createAPIError('邮箱或密码错误', 401, 'AUTH_001');
  }

  // 验证密码
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw createAPIError('邮箱或密码错误', 401, 'AUTH_001');
  }

  // 生成新的JWT令牌
  const accessToken = JWTService.generateAccessToken({
    userId: user.id,
    email: user.email,
    subscriptionTier: user.subscriptionTier,
  });

  const refreshToken = JWTService.generateRefreshToken(user.id);

  // 更新最后登录时间
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  logger.info('User logged in successfully', {
    userId: user.id,
    email: user.email,
    subscriptionTier: user.subscriptionTier,
  });

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        monthlyMessageCount: user.monthlyMessageCount,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: '1h',
      },
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}));

// 刷新令牌
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw createAPIError('刷新令牌不能为空', 400, 'AUTH_003');
  }

  try {
    // 验证刷新令牌
    const decoded = JWTService.verifyToken(refreshToken);
    
    // 查找用户
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      throw createAPIError('无效的刷新令牌', 401, 'AUTH_004');
    }

    // 生成新的访问令牌
    const newAccessToken = JWTService.generateAccessToken({
      userId: user.id,
      email: user.email,
      subscriptionTier: user.subscriptionTier,
    });

    // 生成新的刷新令牌（提高安全性）
    const newRefreshToken = JWTService.generateRefreshToken(user.id);

    logger.info('Token refreshed successfully', {
      userId: user.id,
      email: user.email,
    });

    res.json({
      success: true,
      data: {
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          expiresIn: '1h',
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw createAPIError('刷新令牌已过期', 401, 'AUTH_005');
    } else if (error.name === 'JsonWebTokenError') {
      throw createAPIError('无效的刷新令牌', 401, 'AUTH_004');
    }
    throw error;
  }
}));

// 用户登出
router.post('/logout', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  logger.info('User logged out successfully', { userId });

  res.json({
    success: true,
    data: {
      message: '注销成功',
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}));

// 获取当前用户信息
router.get('/me', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      monthlyMessageCount: true,
      subscriptionCurrentPeriodEnd: true,
      stripeCustomerId: true,
      createdAt: true,
      lastLoginAt: true
    }
  });

  if (!user) {
    throw createAPIError('用户不存在', 404, 'RESOURCE_001');
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        monthlyMessageCount: user.monthlyMessageCount,
        subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd,
        stripeCustomerId: user.stripeCustomerId,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}));

// 更新用户信息
router.put('/profile', authenticateToken, [
  body('fullName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('姓名长度必须在2-50个字符之间')
    .matches(/^[a-zA-Z\u4e00-\u9fa5\s0-9]+$/)
    .withMessage('姓名只能包含字母、中文、数字和空格'),
], asyncHandler(async (req: Request, res: Response) => {
  // 检查验证结果
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw handleValidationError(errors.array());
  }

  const userId = (req as any).userId;
  const { fullName } = req.body;

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw createAPIError('用户不存在', 404, 'RESOURCE_001');
  }

  // 更新用户信息
  if (fullName !== undefined) {
    user.fullName = fullName;
  }

  await prisma.user.update({
    where: { id: userId },
    data: user,
  });

  logger.info('User profile updated successfully', {
    userId: user.id,
    email: user.email,
  });

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        monthlyMessageCount: user.monthlyMessageCount,
      },
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}));

export default router;