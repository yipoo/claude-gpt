import { prisma } from '../config/prisma';
import bcrypt from 'bcrypt';
import { SubscriptionTier, SubscriptionTierType } from '@/types';

export class UserService {
  /**
   * 根据ID查找用户
   */
  static async findById(id: string) {
    return prisma.user.findUnique({
      where: { id }
    });
  }

  /**
   * 根据邮箱查找用户
   */
  static async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email }
    });
  }

  /**
   * 创建新用户
   */
  static async create(data: {
    email: string;
    password: string;
    fullName?: string;
  }) {
    const passwordHash = await bcrypt.hash(data.password, 10);
    
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        fullName: data.fullName,
      }
    });
  }

  /**
   * 更新用户信息
   */
  static async update(id: string, data: any) {
    return prisma.user.update({
      where: { id },
      data
    });
  }

  /**
   * 检查用户是否可以发送消息
   */
  static async canSendMessage(userId: string): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user) return false;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // 检查是否需要重置月度统计
    if (user.monthlyResetDate < monthStart) {
      await prisma.user.update({
        where: { id: userId },
        data: { 
          monthlyMessageCount: 0,
          monthlyResetDate: now
        }
      });
      return true;
    }

    switch (user.subscriptionTier) {
      case SubscriptionTier.FREE:
        return user.monthlyMessageCount < 10;
      case SubscriptionTier.BASE:
        return user.monthlyMessageCount < 100;
      case SubscriptionTier.PRO:
        return true; // 无限制
      default:
        return false;
    }
  }

  /**
   * 获取用户可用的模型列表
   */
  static async getAvailableModels(userId: string): Promise<string[]> {
    const user = await this.findById(userId);
    if (!user) return ['deepseek-r1-250120'];

    switch (user.subscriptionTier) {
      case SubscriptionTier.FREE:
        return ['deepseek-r1-250120'];
      case SubscriptionTier.BASE:
        return ['deepseek-r1-250120', 'gpt-4'];
      case SubscriptionTier.PRO:
        return ['deepseek-r1-250120', 'gpt-4', 'gpt-4-turbo'];
      default:
        return ['deepseek-r1-250120'];
    }
  }

  /**
   * 获取用户剩余消息数
   */
  static async getRemainingMessages(userId: string): Promise<number> {
    const user = await this.findById(userId);
    if (!user) return 0;

    if (user.subscriptionTier === SubscriptionTier.PRO) {
      return -1; // 无限制
    }

    const limits: { [key in SubscriptionTierType]: number } = {
      [SubscriptionTier.FREE]: 10,
      [SubscriptionTier.BASE]: 100,
      [SubscriptionTier.PRO]: -1, // 无限制
    };

    const limit = limits[user.subscriptionTier as SubscriptionTierType] || 0;
    return Math.max(0, limit - user.monthlyMessageCount);
  }
}
