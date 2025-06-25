import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { config } from '@/config/app';

export interface APIError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

/**
 * 全局错误处理中间件
 */
export const errorHandler = (
  error: APIError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = req.headers['x-request-id'] as string || generateRequestId();
  
  // 记录错误日志
  logger.error('API Error:', {
    requestId,
    method: req.method,
    path: req.path,
    error: error.message,
    stack: error.stack,
    statusCode: error.statusCode,
    code: error.code,
    details: error.details,
    userId: (req as any).userId,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });

  // 确定状态码
  const statusCode = error.statusCode || 500;
  
  // 确定错误代码
  const errorCode = error.code || getErrorCodeByStatus(statusCode);
  
  // 确定错误消息
  const message = getErrorMessage(error, statusCode);

  // 构建错误响应
  const errorResponse: any = {
    success: false,
    error: {
      code: errorCode,
      message: message,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  // 在开发环境下包含更多调试信息
  if (config.app.env === 'development') {
    errorResponse.error.stack = error.stack;
    errorResponse.error.details = error.details;
  }

  // 如果有额外的详细信息，添加到响应中
  if (error.details && config.app.env !== 'production') {
    errorResponse.error.details = error.details;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 错误处理中间件
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const requestId = generateRequestId();
  
  logger.warn('Route not found:', {
    requestId,
    method: req.method,
    path: req.path,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });

  res.status(404).json({
    success: false,
    error: {
      code: 'RESOURCE_001',
      message: '请求的资源不存在',
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  });
};

/**
 * 异步错误捕获包装器
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 创建API错误
 */
export const createAPIError = (
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any
): APIError => {
  const error = new Error(message) as APIError;
  error.statusCode = statusCode;
  error.code = code || getErrorCodeByStatus(statusCode);
  error.details = details;
  return error;
};

/**
 * 生成请求ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 根据状态码获取错误代码
 */
function getErrorCodeByStatus(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return 'VAL_001';
    case 401:
      return 'AUTH_001';
    case 403:
      return 'PERM_001';
    case 404:
      return 'RESOURCE_001';
    case 409:
      return 'RESOURCE_002';
    case 429:
      return 'BIZ_002';
    case 500:
    default:
      return 'SYS_001';
  }
}

/**
 * 获取用户友好的错误消息
 */
function getErrorMessage(error: APIError, statusCode: number): string {
  // 如果是已知的业务错误，直接返回错误消息
  if (error.message && statusCode < 500) {
    return error.message;
  }

  // 对于服务器错误，返回通用消息（避免泄露内部信息）
  switch (statusCode) {
    case 400:
      return '请求参数错误';
    case 401:
      return '认证失败';
    case 403:
      return '权限不足';
    case 404:
      return '资源不存在';
    case 409:
      return '资源冲突';
    case 429:
      return '请求过于频繁';
    case 500:
    default:
      return config.app.env === 'production' 
        ? '服务器内部错误' 
        : error.message || '服务器内部错误';
  }
}

/**
 * 验证错误处理
 */
export const handleValidationError = (errors: any[]): APIError => {
  const message = errors.map(err => err.msg || err.message).join(', ');
  return createAPIError(message, 400, 'VAL_001', { errors });
};

/**
 * 数据库错误处理
 */
export const handleDatabaseError = (error: any): APIError => {
  logger.error('Database error:', error);

  // 唯一约束冲突
  if (error.code === '23505') {
    return createAPIError('数据已存在', 409, 'RESOURCE_002');
  }

  // 外键约束冲突
  if (error.code === '23503') {
    return createAPIError('关联数据不存在', 400, 'VAL_001');
  }

  // 非空约束冲突
  if (error.code === '23502') {
    return createAPIError('必填字段不能为空', 400, 'VAL_001');
  }

  // 其他数据库错误
  return createAPIError('数据库操作失败', 500, 'EXT_003');
};