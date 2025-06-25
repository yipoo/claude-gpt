/**
 * 重试工具类 - 提供指数退避重试机制
 */

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: any) => boolean;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,     // 1秒
  maxDelay: 10000,     // 10秒
  backoffFactor: 2,    // 指数退避因子
  retryCondition: (error) => {
    // 默认重试条件：网络错误或5xx服务器错误
    return (
      error.code === 'NETWORK_ERROR' ||
      error.code === 'TIMEOUT' ||
      (error.status >= 500 && error.status < 600) ||
      error.message?.includes('fetch')
    );
  }
};

/**
 * 带重试机制的异步函数执行器
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: any;
  
  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // 如果是最后一次尝试，直接抛出错误
      if (attempt === finalConfig.maxAttempts) {
        throw error;
      }
      
      // 检查是否应该重试
      if (finalConfig.retryCondition && !finalConfig.retryCondition(error)) {
        throw error;
      }
      
      // 计算延迟时间（指数退避）
      const delay = Math.min(
        finalConfig.baseDelay * Math.pow(finalConfig.backoffFactor, attempt - 1),
        finalConfig.maxDelay
      );
      
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error);
      
      // 等待指定时间后重试
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * 网络连接检查
 */
export async function checkNetworkConnection(): Promise<boolean> {
  try {
    // 尝试请求一个轻量级的健康检查端点
    const response = await fetch('/health', {
      method: 'HEAD',
      timeout: 5000
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * 错误分类器
 */
export class APIError extends Error {
  public code: string;
  public status?: number;
  public retryable: boolean;
  
  constructor(message: string, code: string, status?: number, retryable = false) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
  
  static fromResponse(response: Response, message?: string): APIError {
    const isRetryable = response.status >= 500 && response.status < 600;
    return new APIError(
      message || `HTTP ${response.status}: ${response.statusText}`,
      'HTTP_ERROR',
      response.status,
      isRetryable
    );
  }
  
  static networkError(message = 'Network connection failed'): APIError {
    return new APIError(message, 'NETWORK_ERROR', undefined, true);
  }
  
  static timeout(message = 'Request timeout'): APIError {
    return new APIError(message, 'TIMEOUT', undefined, true);
  }
}