import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

export const config = {
  // 应用配置
  app: {
    name: process.env.APP_NAME || 'Claude GPT API',
    version: process.env.APP_VERSION || '1.0.0',
    port: parseInt(process.env.PORT || '3000'),
    env: process.env.NODE_ENV || 'development',
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-development-only-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // AI服务配置 (支持OpenAI和DeepSeek)
  openai: {
    apiKey: process.env.DEEPSEEK_API_KEY  || '',
    baseURL: process.env.DEEPSEEK_API_URL || 'https://api.openai.com/v1',
    defaultModel: process.env.DEEPSEEK_MODEL,
  },

  // Stripe配置
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    webhookEndpoint: process.env.STRIPE_WEBHOOK_ENDPOINT || '/api/v1/webhooks/stripe',
    basicPriceId: process.env.STRIPE_BASIC_PRICE_ID || '',
    proPriceId: process.env.STRIPE_PRO_PRICE_ID || '',
  },

  // 安全配置
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:19006'],
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },

  // 文件上传配置
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf'
    ],
  },

  // 邮件配置
  email: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '1025'),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'noreply@claudegpt.local',
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    file: process.env.LOG_FILE || 'logs/app.log',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '5'),
  },

  // 监控配置
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN || '',
    sentryEnabled: process.env.SENTRY_ENABLED === 'true',
    healthCheckEndpoint: process.env.HEALTH_CHECK_ENDPOINT || '/health',
  },
};

// 验证必需的配置
export const validateConfig = (): void => {
  const requiredConfigs = [
    { key: 'JWT_SECRET', value: config.jwt.secret },
  ];

  // 在生产环境下验证更多配置
  if (config.app.env === 'production') {
    requiredConfigs.push(
      { key: 'AI_API_KEY', value: config.openai.apiKey },
      { key: 'STRIPE_SECRET_KEY', value: config.stripe.secretKey }
    );
  }

  for (const { key, value } of requiredConfigs) {
    if (!value) {
      throw new Error(`Missing required configuration: ${key}`);
    }
  }

  console.log('✅ Configuration validation passed');
};