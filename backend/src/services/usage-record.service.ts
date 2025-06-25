import { prisma } from '../config/prisma';
import { UsageType } from '@/types';

export class UsageRecordService {
  /**
   * 创建令牌使用记录
   */
  static async createTokenUsage(data: {
    userId: string;
    quantity: number;
    modelUsed: string;
    cost: number;
    messageId?: string;
    conversationId?: string;
  }) {
    return prisma.usageRecord.create({
      data: {
        userId: data.userId,
        usageType: UsageType.MESSAGE,
        quantity: data.quantity,
        modelUsed: data.modelUsed,
        cost: data.cost,
        messageId: data.messageId,
        conversationId: data.conversationId,
      }
    });
  }

  /**
   * 创建图像使用记录
   */
  static async createImageUsage(data: {
    userId: string;
    quantity: number;
    modelUsed: string;
    cost: number;
    messageId?: string;
    conversationId?: string;
  }) {
    return prisma.usageRecord.create({
      data: {
        userId: data.userId,
        usageType: UsageType.IMAGE,
        quantity: data.quantity,
        modelUsed: data.modelUsed,
        cost: data.cost,
        messageId: data.messageId,
        conversationId: data.conversationId,
      }
    });
  }

  /**
   * 获取用户的使用记录
   */
  static async findByUserId(userId: string, limit = 100) {
    return prisma.usageRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  /**
   * 获取用户的总使用量
   */
  static async getUserTotalUsage(userId: string) {
    const result = await prisma.usageRecord.aggregate({
      where: { userId },
      _sum: {
        quantity: true,
        cost: true
      }
    });

    return {
      totalTokens: result._sum.quantity || 0,
      totalCost: result._sum.cost || 0
    };
  }
}
