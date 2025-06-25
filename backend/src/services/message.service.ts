import { prisma } from '../config/prisma';
import { MessageStatus, MessageStatusType, MessageRoleType } from '@/types';

export class MessageService {
  /**
   * 创建新消息
   */
  static async create(data: {
    conversationId: string;
    userId: string;
    role: MessageRoleType;
    content: string;
    modelUsed?: string;
    status?: MessageStatusType;
  }) {
    const message = await prisma.message.create({
      data: {
        conversationId: data.conversationId,
        userId: data.userId,
        role: data.role,
        content: data.content,
        modelUsed: data.modelUsed,
        status: data.status || MessageStatus.SENT,
      }
    });

    // 更新对话统计信息
    await prisma.conversation.update({
      where: { id: data.conversationId },
      data: {
        messageCount: {
          increment: 1
        },
        lastMessageAt: new Date()
      }
    });

    return message;
  }

  /**
   * 更新消息状态
   */
  static async updateStatus(id: string, status: MessageStatusType) {
    return prisma.message.update({
      where: { id },
      data: { status }
    });
  }

  /**
   * 更新消息内容和令牌数
   */
  static async update(id: string, data: {
    content?: string;
    totalTokens?: number;
    status?: MessageStatusType;
  }) {
    const message = await prisma.message.update({
      where: { id },
      data,
      include: {
        conversation: true
      }
    });

    // 如果更新了令牌数，同时更新对话的总令牌数
    if (data.totalTokens) {
      await prisma.conversation.update({
        where: { id: message.conversationId },
        data: {
          totalTokens: {
            increment: data.totalTokens
          }
        }
      });
    }

    return message;
  }

  /**
   * 获取消息详情
   */
  static async findById(id: string) {
    return prisma.message.findUnique({
      where: { id }
    });
  }

  /**
   * 获取对话的所有消息
   */
  static async findByConversationId(conversationId: string) {
    return prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' }
    });
  }
}
