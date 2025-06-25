// 只在生产环境使用module-alias，开发环境使用tsconfig-paths
if (process.env.NODE_ENV === 'production') {
  require('module-alias/register');
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config, validateConfig } from '@/config/app';
import { prisma } from '@/config/prisma';
import { errorHandler, notFoundHandler } from '@/middleware/error.middleware';
import { logger } from '@/utils/logger';

// 导入路由
import authRoutes from '@/routes/auth.routes';
import chatRoutes from '@/routes/chat.routes';
import subscriptionRoutes from '@/routes/subscription.routes';
// import userRoutes from '@/routes/user.routes';
// import systemRoutes from '@/routes/system.routes';

class Application {
  public app: express.Application;
  private server: any;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // 安全中间件
    this.app.use(helmet({
      contentSecurityPolicy: false, // 暂时禁用CSP以支持开发
    }));

    // CORS配置
    this.app.use(cors({
      origin: config.security.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // 请求日志
    if (config.app.env !== 'test') {
      this.app.use(morgan('combined', {
        stream: {
          write: (message: string) => logger.info(message.trim())
        }
      }));
    }

    // 解析JSON请求体
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 信任代理（用于获取真实IP）
    this.app.set('trust proxy', 1);

    // 添加请求ID
    this.app.use((req, res, next) => {
      req.headers['x-request-id'] = req.headers['x-request-id'] || 
        `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      next();
    });
  }

  private initializeRoutes(): void {
    // 健康检查端点
    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: config.app.version,
          environment: config.app.env,
        },
      });
    });

    // API路由
    const apiV1 = '/api/v1';
    
    // 注册路由
    this.app.use(`${apiV1}/auth`, authRoutes);
    this.app.use(`${apiV1}/chat`, chatRoutes);
    this.app.use(`${apiV1}/subscription`, subscriptionRoutes);
    // this.app.use(`${apiV1}/user`, userRoutes);
    // this.app.use(`${apiV1}/system`, systemRoutes);

    // 临时测试路由
    this.app.get(`${apiV1}/test`, (req, res) => {
      res.json({
        success: true,
        data: {
          message: 'Claude GPT API is running!',
          timestamp: new Date().toISOString(),
        },
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404处理
    this.app.use(notFoundHandler);
    
    // 全局错误处理
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // 验证配置
      validateConfig();

      // 测试数据库连接
      await prisma.$connect();
      logger.info('✅ Database connected successfully');

      // 启动服务器
      this.server = this.app.listen(config.app.port, () => {
        logger.info(`🚀 ${config.app.name} v${config.app.version} started`);
        logger.info(`📡 Server running on port ${config.app.port}`);
        logger.info(`🌍 Environment: ${config.app.env}`);
        logger.info(`📊 Health check: http://localhost:${config.app.port}/health`);
        logger.info(`🔗 API base URL: http://localhost:${config.app.port}/api/v1`);
      });

      // 优雅关闭处理
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`📴 Received ${signal}. Starting graceful shutdown...`);

      // 停止接受新连接
      if (this.server) {
        this.server.close(async () => {
          logger.info('🔌 HTTP server closed');

          try {
            // 关闭数据库连接
            await prisma.$disconnect();
            logger.info('✅ Graceful shutdown completed');
            process.exit(0);
          } catch (error) {
            logger.error('❌ Error during shutdown:', error);
            process.exit(1);
          }
        });
      }

      // 强制退出（30秒后）
      setTimeout(() => {
        logger.error('⏰ Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // 监听退出信号
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // 监听未捕获的异常
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
  }
}

// 创建应用实例
const application = new Application();

// 启动应用
if (require.main === module) {
  application.start();
}

export default application.app;