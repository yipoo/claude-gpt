import OpenAI from 'openai';
import { config } from '@/config/app';
import { logger } from '@/utils/logger';

// 定义消息接口
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionParams {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
}

interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface ChatCompletionChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
      // DeepSeek 特有字段
      reasoning?: string;
    };
    finish_reason?: string;
  }>;
  usage?: TokenUsage;
}

// 定价表（每1000 tokens的价格，单位：美元）
const MODEL_PRICING = {
  'gpt-3.5-turbo': {
    input: 0.001,
    output: 0.002,
  },
  'gpt-4': {
    input: 0.03,
    output: 0.06,
  },
  'gpt-4-turbo': {
    input: 0.01,
    output: 0.03,
  },
  // DeepSeek 模型定价（参考价格）
  'deepseek-r1-250120': {
    input: 0.001,
    output: 0.002,
  },
  'deepseek-chat': {
    input: 0.001,
    output: 0.002,
  },
} as const;

export class OpenAIService {
  private static client: OpenAI | null = null;

  /**
   * 获取OpenAI客户端实例
   */
  private static getClient(): OpenAI {
    if (!this.client) {
      console.log('=== OpenAI Service Debug ===');
      console.log('API Key exists:', !!config.openai.apiKey);
      console.log('API Key length:', config.openai.apiKey?.length || 0);
      console.log('Base URL:', config.openai.baseURL);
      console.log('Default Model:', config.openai.defaultModel);
      
      if (!config.openai.apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      this.client = new OpenAI({
        apiKey: config.openai.apiKey,
        baseURL: config.openai.baseURL,
      });
    }

    return this.client;
  }

  /**
   * 创建聊天完成（流式）
   */
  static async createChatCompletionStream(params: ChatCompletionParams): Promise<AsyncIterable<ChatCompletionChunk>> {
    try {
      const client = this.getClient();

      logger.info('Creating chat completion stream', {
        model: params.model,
        messageCount: params.messages.length,
        temperature: params.temperature,
        maxTokens: params.max_tokens,
      });

      const stream = await client.chat.completions.create({
        ...params,
        stream: true,
      });

      return stream as AsyncIterable<ChatCompletionChunk>;

    } catch (error: any) {
      logger.error('OpenAI stream creation failed', {
        error: error.message,
        model: params.model,
        messageCount: params.messages.length,
      });

      // 处理不同类型的错误
      if (error.code === 'insufficient_quota') {
        throw new Error('OpenAI配额不足，请稍后重试');
      } else if (error.code === 'model_not_found') {
        throw new Error('请求的模型不存在');
      } else if (error.code === 'invalid_request_error') {
        throw new Error('请求参数错误');
      } else if (error.code === 'rate_limit_exceeded') {
        throw new Error('请求频率过高，请稍后重试');
      } else {
        throw new Error('AI服务暂时不可用，请稍后重试');
      }
    }
  }

  /**
   * 创建聊天完成（非流式）
   */
  static async createChatCompletion(params: ChatCompletionParams) {
    try {
      const client = this.getClient();

      logger.info('Creating chat completion', {
        model: params.model,
        messageCount: params.messages.length,
        temperature: params.temperature,
        maxTokens: params.max_tokens,
      });

      const completion = await client.chat.completions.create({
        ...params,
        stream: false,
      });

      logger.info('Chat completion created successfully', {
        model: params.model,
        usage: completion.usage,
        finishReason: completion.choices[0]?.finish_reason,
      });

      return completion;

    } catch (error: any) {
      logger.error('OpenAI completion failed', {
        error: error.message,
        model: params.model,
        messageCount: params.messages.length,
      });

      // 处理不同类型的错误
      if (error.code === 'insufficient_quota') {
        throw new Error('OpenAI配额不足，请稍后重试');
      } else if (error.code === 'model_not_found') {
        throw new Error('请求的模型不存在');
      } else if (error.code === 'invalid_request_error') {
        throw new Error('请求参数错误');
      } else if (error.code === 'rate_limit_exceeded') {
        throw new Error('请求频率过高，请稍后重试');
      } else {
        throw new Error('AI服务暂时不可用，请稍后重试');
      }
    }
  }

  /**
   * 计算使用成本
   */
  static calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING];
    
    if (!pricing) {
      logger.warn('Unknown model for cost calculation', { model });
      return 0;
    }

    const inputCost = (inputTokens / 1000) * pricing.input;
    const outputCost = (outputTokens / 1000) * pricing.output;
    
    return inputCost + outputCost;
  }

  /**
   * 估算文本的token数量
   */
  static estimateTokenCount(text: string): number {
    // 简单估算：英文大约4个字符=1个token，中文大约1.5个字符=1个token
    const englishChars = text.match(/[a-zA-Z0-9\s.,!?;:'"()-]/g)?.length || 0;
    const chineseChars = text.length - englishChars;
    
    return Math.ceil(englishChars / 4 + chineseChars / 1.5);
  }

  /**
   * 验证模型是否可用
   */
  static isModelAvailable(model: string): boolean {
    return Object.keys(MODEL_PRICING).includes(model);
  }

  /**
   * 获取所有可用模型
   */
  static getAvailableModels(): string[] {
    return Object.keys(MODEL_PRICING);
  }

  /**
   * 检查OpenAI服务状态
   */
  static async checkHealth(): Promise<boolean> {
    try {
      const client = this.getClient();
      
      // 发送一个简单的测试请求
      await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
      });

      return true;
    } catch (error) {
      logger.error('OpenAI health check failed', error);
      return false;
    }
  }

  /**
   * 生成对话标题
   */
  static async generateConversationTitle(firstMessage: string): Promise<string> {
    try {
      const client = this.getClient();

      const completion = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '请为下面的对话生成一个简短的标题（不超过20个字符），只返回标题内容，不要包含引号或其他格式。',
          },
          {
            role: 'user',
            content: firstMessage,
          },
        ],
        max_tokens: 50,
        temperature: 0.7,
      });

      const title = completion.choices[0]?.message?.content?.trim();
      return title || firstMessage.substring(0, 20);

    } catch (error) {
      logger.error('Failed to generate conversation title', error);
      return firstMessage.substring(0, 20);
    }
  }

  /**
   * 内容审核
   */
  static async moderateContent(content: string): Promise<{ flagged: boolean; categories: string[] }> {
    try {
      const client = this.getClient();

      const moderation = await client.moderations.create({
        input: content,
      });

      const result = moderation.results[0];
      const flaggedCategories = Object.keys(result.categories).filter(
        category => result.categories[category as keyof typeof result.categories]
      );

      return {
        flagged: result.flagged,
        categories: flaggedCategories,
      };

    } catch (error) {
      logger.error('Content moderation failed', error);
      // 如果审核失败，默认不标记为违规
      return {
        flagged: false,
        categories: [],
      };
    }
  }
}