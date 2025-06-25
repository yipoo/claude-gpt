import { prisma } from '../config/prisma';

export class ConversationService {
  /**
   * 创建新对话
   */
  static async create(data: {
    userId: string;
    title: string;
  }) {
    return prisma.conversation.create({
      data: {
        userId: data.userId,
        title: data.title,
      }
    });
  }

  /**
   * 获取对话详情
   */
  static async findById(id: string, includeMessages = false) {
    return prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: includeMessages ? {
          orderBy: { createdAt: 'asc' }
        } : false
      }
    });
  }

  /**
   * 获取用户的所有对话
   */
  static async findByUserId(userId: string) {
    return prisma.conversation.findMany({
      where: { userId },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  /**
   * 更新对话标题
   */
  static async updateTitle(id: string, title: string) {
    return prisma.conversation.update({
      where: { id },
      data: { title }
    });
  }

  /**
   * 更新对话统计信息
   */
  static async updateStats(id: string, data: {
    messageCount?: number;
    totalTokens?: number;
    lastMessageAt?: Date;
  }) {
    return prisma.conversation.update({
      where: { id },
      data
    });
  }

  /**
   * 删除对话
   */
  static async delete(id: string) {
    return prisma.conversation.delete({
      where: { id }
    });
  }
}
