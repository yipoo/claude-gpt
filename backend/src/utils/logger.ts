import winston from 'winston';
import { config } from '@/config/app';

// 创建logger实例
export const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: config.app.name,
    version: config.app.version 
  },
  transports: [
    // 写入所有日志到文件
    new winston.transports.File({ 
      filename: config.logging.file,
      maxsize: parseInt(config.logging.maxSize) * 1024 * 1024, // 转换为字节
      maxFiles: config.logging.maxFiles,
    }),
    
    // 写入错误日志到单独文件
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: parseInt(config.logging.maxSize) * 1024 * 1024,
      maxFiles: config.logging.maxFiles,
    }),
  ],
});

// 在开发环境下同时输出到控制台
if (config.app.env !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// 请求日志中间件
export const requestLogger = winston.format.printf(({ timestamp, level, message, ...meta }) => {
  return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
});

// 导出方便使用的日志方法
export const logError = (message: string, error?: Error, meta?: any) => {
  logger.error(message, { error: error?.message, stack: error?.stack, ...meta });
};

export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};