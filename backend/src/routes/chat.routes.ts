import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, checkUsageLimit } from '@/middleware/auth.middleware';
import { createAPIError, handleValidationError, asyncHandler } from '@/middleware/error.middleware';
import { OpenAIService } from '@/services/openai.service';
import { logger } from '@/utils/logger';
import { UserService } from '@/services/user.service';
import { ConversationService } from '@/services/conversation.service';
import { MessageService } from '@/services/message.service';
import { UsageRecordService } from '@/services/usage-record.service';
import { prisma } from '@/config/prisma';
import { $Enums, MessageRole, MessageStatus } from '@/types';
import { config } from '@/config/app';

const router = Router();

// 验证规则
const chatValidation = [
  body('message')
    .isString()
    .isLength({ min: 1, max: 4000 })
    .withMessage('消息内容长度必须在1-4000个字符之间'),
  body('conversationId')
    .optional()
    .isUUID()
    .withMessage('对话ID格式不正确'),
  body('model')
    .optional()
    .isIn(['deepseek-r1-250120', 'gpt-3.5-turbo', 'gpt-4'])
    .withMessage('不支持的模型类型'),
];

// 发送消息（支持流式响应）
router.post('/send', authenticateToken, checkUsageLimit, chatValidation, asyncHandler(async (req: Request, res: Response) => {
  console.error('!!!! CHAT ROUTE REACHED !!!!');
  console.error('Request body:', JSON.stringify(req.body, null, 2));
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    throw handleValidationError(errors.array());
  }

  const userId = (req as any).userId;
  const { message, conversationId, model = config.openai.defaultModel || 'deepseek-r1-250120' } = req.body;
  
  console.error('=== CHAT ROUTE DEBUG ===');
  console.error('Config default model:', config.openai.defaultModel);
  console.error('Final model used:', model);

  // 获取用户信息
  const user = await UserService.findById(userId);
  if (!user) {
    throw createAPIError('用户不存在', 404, 'RESOURCE_001');
  }

  // 检查用户是否有权限使用指定模型
  const availableModels = await UserService.getAvailableModels(userId);
  if (!availableModels.includes(model)) {
    throw createAPIError('当前订阅计划不支持此模型', 403, 'BIZ_001', {
      requestedModel: model,
      availableModels,
      subscriptionTier: user.subscriptionTier,
    });
  }

  // 获取或创建对话
  let conversation;
  
  if (conversationId) {
    // 使用现有对话
    conversation = await ConversationService.findById(conversationId, true);
    
    if (!conversation || conversation.userId !== userId) {
      throw createAPIError('对话不存在', 404, 'RESOURCE_001');
    }
  } else {
    // 创建新对话
    conversation = await ConversationService.create({
      userId,
      title: message.substring(0, 50)
    });
  }

  // 创建用户消息
  const userMessage = await MessageService.create({
    conversationId: conversation.id,
    userId,
    role: MessageRole.USER,
    content: message,
    status: MessageStatus.SENT
  });

  // 设置SSE响应头
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  try {
    // 准备消息历史（包含上下文）
    const messageHistory = await MessageService.findByConversationId(conversation.id);
    const messages = messageHistory.map((msg: any) => ({
      role: msg.role.toLowerCase(), // 转换为小写以符合OpenAI API要求
      content: msg.content,
    })).slice(-20); // 限制上下文长度

    // 创建助手消息占位符
    const assistantMessage = await MessageService.create({
      conversationId: conversation.id,
      userId,
      role: MessageRole.ASSISTANT,
      content: '',
      status: MessageStatus.SENDING,
      modelUsed: model,
    });
    // 发送消息开始事件
    res.write(`data: ${JSON.stringify({
      type: 'message_start',
      messageId: assistantMessage.id,
      conversationId: conversation.id,
    })}\n\n`);

    let fullContent = '';
    let fullReasoning = '';
    let totalTokens = 0;
    let isDeepSeekModel = model.includes('deepseek');

    // 调用OpenAI流式API
    const stream = await OpenAIService.createChatCompletionStream({
      model: model,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    // 处理流式响应
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      
      // 处理 DeepSeek 思考内容
      if (delta?.reasoning && isDeepSeekModel) {
        fullReasoning += delta.reasoning;
        
        // 发送思考内容增量
        res.write(`data: ${JSON.stringify({
          type: 'reasoning_delta',
          messageId: assistantMessage.id,
          delta: delta.reasoning,
          reasoning: fullReasoning,
        })}\n\n`);
      }
      
      // 处理正常回答内容
      if (delta?.content) {
        fullContent += delta.content;
        
        // 发送内容增量
        res.write(`data: ${JSON.stringify({
          type: 'content_delta',
          messageId: assistantMessage.id,
          delta: delta.content,
          content: fullContent,
        })}\n\n`);
      }

      // 处理使用量信息
      if (chunk.usage) {
        totalTokens = chunk.usage.total_tokens;
      }
    }

    // 更新助手消息
    let finalContent = fullContent;
    
    // 如果是 DeepSeek 模型并且有思考内容，使用 JSON 格式保存
    if (isDeepSeekModel && fullReasoning) {
      finalContent = JSON.stringify({
        reasoning: fullReasoning,
        content: fullContent
      });
    }
    
    await MessageService.update(assistantMessage.id, {
      content: finalContent,
      status: MessageStatus.SENT,
      totalTokens
    });

    // 更新用户消息的token计数（估算）
    const userTokens = Math.ceil(message.length / 4);
    await MessageService.update(userMessage.id, {
      totalTokens: userTokens
    });

    // 更新对话统计
    await ConversationService.updateStats(conversation.id, {
      messageCount: conversation.messageCount + 2,
      totalTokens: conversation.totalTokens + totalTokens + userTokens,
      lastMessageAt: new Date()
    });

    // 更新用户使用量
    await UserService.update(userId, {
      monthlyMessageCount: { increment: 1 },
      totalMessageCount: { increment: 1 }
    });

    // 记录使用记录
    await UsageRecordService.createTokenUsage({
      userId,
      quantity: userTokens + totalTokens,
      modelUsed: model,
      cost: OpenAIService.calculateCost(model, userTokens, totalTokens),
      messageId: assistantMessage.id,
      conversationId: conversation.id
    });

    // 获取用户剩余消息数
    const remainingMessages = await UserService.getRemainingMessages(userId);
    const updatedUser = await UserService.findById(userId);

    // 发送完成事件
    res.write(`data: ${JSON.stringify({
      type: 'message_end',
      messageId: assistantMessage.id,
      conversationId: conversation.id,
      totalTokens,
      usage: {
        remainingMessages,
        monthlyUsage: updatedUser?.monthlyMessageCount || 0,
      },
    })}\n\n`);

    res.write(`data: [DONE]\n\n`);
    res.end();

    logger.info('Chat message sent successfully', {
      userId,
      conversationId: conversation.id,
      messageId: assistantMessage.id,
      model,
      tokens: totalTokens,
    });

  } catch (error) {
    logger.error('Chat message failed', error);

    // 查找最新的助手消息
    const messages = await prisma.message.findMany({
      where: { 
        conversationId: conversation.id, 
        role: $Enums.MessageRole.ASSISTANT 
      },
      orderBy: { createdAt: 'desc' },
      take: 1
    });

    const assistantMessage = messages[0];
    if (assistantMessage) {
      // 更新助手消息状态为失败
      await MessageService.updateStatus(assistantMessage.id, MessageStatus.FAILED);
    }

    // 发送错误事件
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: {
        code: 'AI_001',
        message: 'AI服务暂时不可用，请稍后重试',
      },
    })}\n\n`);

    res.end();
  }
}));

// 获取对话列表
router.get('/conversations', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  // 使用 Prisma 查询对话列表
  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where: { userId },
      orderBy: { lastMessageAt: 'desc' },
      take: limit,
      skip: skip,
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    }),
    prisma.conversation.count({
      where: { userId }
    })
  ]);

  res.json({
    success: true,
    data: {
      conversations: conversations.map((conv: any) => ({
        id: conv.id,
        title: conv.title,
        modelUsed: conv.messages[0]?.modelUsed,
        messageCount: conv.messageCount,
        lastMessageAt: conv.lastMessageAt,
        createdAt: conv.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}));

// 获取对话详情和消息历史
router.get('/conversations/:conversationId', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { conversationId } = req.params;

  // 使用 Prisma 查询对话详情
  const conversation = await prisma.conversation.findFirst({
    where: { 
      id: conversationId, 
      userId 
    },
    include: {
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!conversation) {
    throw createAPIError('对话不存在', 404, 'RESOURCE_001');
  }

  // 使用 Prisma 查询消息历史
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' }
  });

  res.json({
    success: true,
    data: {
      conversation: {
        id: conversation.id,
        title: conversation.title,
        modelUsed: conversation.messages[0]?.modelUsed,
        messageCount: conversation.messageCount,
        totalTokens: conversation.totalTokens,
        lastMessageAt: conversation.lastMessageAt,
        createdAt: conversation.createdAt,
      },
      messages: messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        contentType: msg.contentType,
        status: msg.status,
        totalTokens: msg.totalTokens,
        createdAt: msg.createdAt,
      })),
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}));

// 删除对话
router.delete('/conversations/:conversationId', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { conversationId } = req.params;

  // 使用 Prisma 查询对话
  const conversation = await prisma.conversation.findFirst({
    where: { 
      id: conversationId, 
      userId 
    }
  });

  if (!conversation) {
    throw createAPIError('对话不存在', 404, 'RESOURCE_001');
  }

  // 使用 Prisma 删除对话（已设置级联删除，会自动删除相关消息）
  await prisma.conversation.delete({
    where: { id: conversationId }
  });

  logger.info('Conversation deleted', {
    userId,
    conversationId,
  });

  res.json({
    success: true,
    data: {
      message: '对话已删除',
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}));

// 更新对话标题
router.put('/conversations/:conversationId/title', authenticateToken, [
  body('title')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('标题长度必须在1-100个字符之间'),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw handleValidationError(errors.array());
  }

  const userId = (req as any).userId;
  const { conversationId } = req.params;
  const { title } = req.body;

  // 使用 Prisma 查询对话
  const conversation = await prisma.conversation.findFirst({
    where: { 
      id: conversationId, 
      userId 
    },
    include: {
      messages: {
        take: 1
      }
    }
  });

  if (!conversation) {
    throw createAPIError('对话不存在', 404, 'RESOURCE_001');
  }

  // 使用 Prisma 更新对话标题
  const updatedConversation = await ConversationService.updateTitle(conversationId, title);

  logger.info('Conversation title updated', {
    userId,
    conversationId,
    newTitle: title,
  });

  res.json({
    success: true,
    data: {
      conversation: {
        id: updatedConversation.id,
        title: updatedConversation.title,
        modelUsed: conversation.messages?.[0]?.modelUsed,
        messageCount: updatedConversation.messageCount,
        lastMessageAt: updatedConversation.lastMessageAt,
        createdAt: updatedConversation.createdAt,
      },
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}));

export default router;
