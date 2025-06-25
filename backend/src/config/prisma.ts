import { PrismaClient } from '@prisma/client';

// 创建 Prisma 客户端实例
export const prisma = new PrismaClient({
  // log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// 添加中间件用于日志记录
prisma.$use(async (params: any, next: any) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  
  // 暂时关闭数据库查询耗时日志
  if (process.env.NODE_ENV === 'development') {
    console.log(`${params.model}.${params.action} 耗时: ${after - before}ms`);
  }
  
  return result;
});

export default prisma;
