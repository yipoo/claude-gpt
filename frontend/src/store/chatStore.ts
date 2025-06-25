import { create } from 'zustand';
import { apiClient, Conversation, Message } from '../api/client';
import { APIError } from '../utils/retry';
import { ConversationStorageService, SettingsStorageService } from '../utils/syncStorage';

interface StreamMessage {
  type: 'message_start' | 'content_delta' | 'reasoning_delta' | 'message_end' | 'error';
  messageId?: string;
  conversationId?: string;
  delta?: string;
  content?: string;
  reasoning?: string;
  totalTokens?: number;
  usage?: any;
  error?: any;
}

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  streamingMessageId: string | null;
  
  // Actions
  loadConversations: () => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
  loadFromLocalStorage: () => void;
  saveToLocalStorage: () => void;
  sendMessage: (message: string) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
  regenerateMessage: (messageId: string) => Promise<void>;
  cancelMessage: () => void;
  deleteConversation: (conversationId: string) => Promise<void>;
  updateConversationTitle: (conversationId: string, title: string) => Promise<void>;
  createNewConversation: () => void;
  clearError: () => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  isStreaming: false,
  error: null,
  streamingMessageId: null,

  loadConversations: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const data = await apiClient.getConversations();
      
      set({
        conversations: data.conversations,
        isLoading: false,
      });

      // 自动保存到本地存储
      if (SettingsStorageService.getAutoSaveConversations()) {
        ConversationStorageService.saveConversations(data.conversations);
      }
    } catch (error: any) {
      // 如果网络失败，尝试从本地存储加载
      console.warn('Failed to load conversations from API, trying local storage:', error);
      get().loadFromLocalStorage();
      
      const errorMessage = error.response?.data?.error?.message || error.message || '加载对话列表失败，已显示本地缓存';
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  loadConversation: async (conversationId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const data = await apiClient.getConversation(conversationId);
      
      set({
        currentConversation: data.conversation,
        messages: data.messages,
        isLoading: false,
      });

      // 自动保存到本地存储
      if (SettingsStorageService.getAutoSaveConversations()) {
        ConversationStorageService.saveMessages(conversationId, data.messages);
        ConversationStorageService.setCurrentConversationId(conversationId);
      }
    } catch (error: any) {
      // 如果网络失败，尝试从本地存储加载
      console.warn('Failed to load conversation from API, trying local storage:', error);
      const localMessages = ConversationStorageService.getMessages(conversationId);
      const { conversations } = get();
      const conversation = conversations.find(conv => conv.id === conversationId);
      
      if (conversation && localMessages.length > 0) {
        set({
          currentConversation: conversation,
          messages: localMessages,
          isLoading: false,
          error: '加载对话失败，已显示本地缓存',
        });
      } else {
        const errorMessage = error.response?.data?.error?.message || error.message || '加载对话失败';
        set({
          error: errorMessage,
          isLoading: false,
        });
      }
    }
  },

  loadFromLocalStorage: () => {
    try {
      // 加载对话列表
      const conversations = ConversationStorageService.getConversations();
      
      // 加载当前对话
      const currentConversationId = ConversationStorageService.getCurrentConversationId();
      let currentConversation = null;
      let messages: Message[] = [];
      
      if (currentConversationId) {
        currentConversation = conversations.find(conv => conv.id === currentConversationId) || null;
        if (currentConversation) {
          messages = ConversationStorageService.getMessages(currentConversationId);
        }
      }
      
      set({
        conversations,
        currentConversation,
        messages,
        error: null,
      });
      
      console.log('Loaded from local storage:', {
        conversationCount: conversations.length,
        currentConversationId,
        messageCount: messages.length,
      });
    } catch (error) {
      console.error('Failed to load from local storage:', error);
      set({
        error: '加载本地数据失败',
      });
    }
  },

  saveToLocalStorage: () => {
    try {
      const { conversations, currentConversation, messages } = get();
      
      // 保存对话列表
      ConversationStorageService.saveConversations(conversations);
      
      // 保存当前对话的消息
      if (currentConversation) {
        ConversationStorageService.saveMessages(currentConversation.id, messages);
        ConversationStorageService.setCurrentConversationId(currentConversation.id);
      }
      
      console.log('Saved to local storage:', {
        conversationCount: conversations.length,
        currentConversationId: currentConversation?.id,
        messageCount: messages.length,
      });
    } catch (error) {
      console.error('Failed to save to local storage:', error);
    }
  },

  sendMessage: async (message: string) => {
    try {
      set({ isStreaming: true, error: null });
      
      const { currentConversation, messages } = get();
      
      // 添加用户消息到本地状态
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: message,
        contentType: 'text',
        status: 'sending',
        tokenCount: 0,
        createdAt: new Date().toISOString(),
      };
      
      set({ messages: [...messages, userMessage] });
      
      // 更新用户消息状态为已发送
      const updateUserMessageStatus = (status: Message['status'], error?: string) => {
        set(state => ({
          messages: state.messages.map(msg =>
            msg.id === userMessage.id
              ? { 
                  ...msg, 
                  status, 
                  error,
                  canRetry: status === 'failed',
                  updatedAt: new Date().toISOString()
                }
              : msg
          ),
        }));
      };
      
      // 发送消息并处理流式响应
      updateUserMessageStatus('sent');
      
      const stream = await apiClient.sendMessage(
        message,
        currentConversation?.id
      );
      
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      
      let assistantMessage: Message | null = null;
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              set({ isStreaming: false, streamingMessageId: null });
              break;
            }
            
            try {
              const streamMessage: StreamMessage = JSON.parse(data);
              
              switch (streamMessage.type) {
                case 'message_start':
                  // 创建新的助手消息
                  assistantMessage = {
                    id: streamMessage.messageId!,
                    role: 'assistant',
                    content: '',
                    contentType: 'text',
                    status: 'generating',
                    tokenCount: 0,
                    createdAt: new Date().toISOString(),
                  };
                  
                  set(state => ({
                    messages: [...state.messages, assistantMessage!],
                    streamingMessageId: streamMessage.messageId!,
                    currentConversation: streamMessage.conversationId 
                      ? { ...state.currentConversation!, id: streamMessage.conversationId }
                      : state.currentConversation,
                  }));
                  break;
                  
                case 'content_delta':
                  // 更新助手消息内容
                  set(state => ({
                    messages: state.messages.map(msg =>
                      msg.id === streamMessage.messageId
                        ? { ...msg, content: streamMessage.content! }
                        : msg
                    ),
                  }));
                  break;
                  
                case 'reasoning_delta':
                  // 更新助手消息的思考内容
                  set(state => ({
                    messages: state.messages.map(msg =>
                      msg.id === streamMessage.messageId
                        ? { ...msg, reasoning: streamMessage.reasoning! }
                        : msg
                    ),
                  }));
                  break;
                  
                case 'message_end':
                  // 完成消息
                  set(state => ({
                    messages: state.messages.map(msg =>
                      msg.id === streamMessage.messageId
                        ? { 
                            ...msg, 
                            status: 'completed' as const, 
                            tokenCount: streamMessage.totalTokens || 0,
                            updatedAt: new Date().toISOString()
                          }
                        : msg
                    ),
                    isStreaming: false,
                    streamingMessageId: null,
                  }));
                  
                  // 刷新对话列表
                  get().loadConversations();
                  
                  // 自动保存消息到本地存储
                  if (SettingsStorageService.getAutoSaveConversations()) {
                    get().saveToLocalStorage();
                  }
                  break;
                  
                case 'error':
                  set(state => ({
                    error: streamMessage.error?.message || '发送消息失败',
                    isStreaming: false,
                    streamingMessageId: null,
                    messages: state.messages.map(msg =>
                      msg.id === streamMessage.messageId
                        ? { 
                            ...msg, 
                            status: 'failed' as const,
                            error: streamMessage.error?.message,
                            canRetry: true,
                            updatedAt: new Date().toISOString()
                          }
                        : msg
                    ),
                  }));
                  break;
              }
            } catch (parseError) {
              console.error('Failed to parse stream message:', parseError);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Send message error:', error);
      
      let errorMessage = '发送消息失败';
      let shouldRetry = false;
      
      if (error instanceof APIError) {
        errorMessage = error.message;
        shouldRetry = error.retryable;
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // 根据错误类型提供不同的用户提示
      if (error.code === 'NETWORK_ERROR') {
        errorMessage = '网络连接失败，请检查网络设置后重试';
      } else if (error.code === 'TIMEOUT') {
        errorMessage = '请求超时，请稍后重试';
      }
      
      set({
        error: errorMessage,
        isStreaming: false,
        streamingMessageId: null,
      });
      
      // 更新用户消息状态为失败
      updateUserMessageStatus('failed', errorMessage);
    }
  },

  retryMessage: async (messageId: string) => {
    try {
      const { messages } = get();
      const failedMessage = messages.find(msg => msg.id === messageId);
      
      if (!failedMessage || failedMessage.role !== 'user') {
        throw new Error('Invalid message for retry');
      }
      
      // 重新发送消息
      await get().sendMessage(failedMessage.content);
      
      // 移除失败的消息
      set(state => ({
        messages: state.messages.filter(msg => msg.id !== messageId),
      }));
      
    } catch (error: any) {
      console.error('Retry message error:', error);
      set({
        error: error.message || '重试消息失败',
      });
    }
  },

  regenerateMessage: async (messageId: string) => {
    try {
      const { messages, currentConversation } = get();
      const messageIndex = messages.findIndex(msg => msg.id === messageId);
      
      if (messageIndex === -1 || messages[messageIndex].role !== 'assistant') {
        throw new Error('Invalid message for regeneration');
      }
      
      // 找到对应的用户消息
      let userMessage: Message | null = null;
      for (let i = messageIndex - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          userMessage = messages[i];
          break;
        }
      }
      
      if (!userMessage) {
        throw new Error('Cannot find corresponding user message');
      }
      
      // 移除当前助手消息及之后的所有消息
      set(state => ({
        messages: state.messages.slice(0, messageIndex),
      }));
      
      // 重新发送用户消息
      await get().sendMessage(userMessage.content);
      
    } catch (error: any) {
      console.error('Regenerate message error:', error);
      set({
        error: error.message || '重新生成消息失败',
      });
    }
  },

  cancelMessage: () => {
    try {
      // 取消当前请求
      apiClient.cancelCurrentRequest();
      
      // 更新状态
      set(state => ({
        isStreaming: false,
        streamingMessageId: null,
        messages: state.messages.map(msg =>
          msg.id === state.streamingMessageId
            ? { 
                ...msg, 
                status: 'cancelled' as const,
                updatedAt: new Date().toISOString()
              }
            : msg
        ),
      }));
      
    } catch (error: any) {
      console.error('Cancel message error:', error);
    }
  },

  deleteConversation: async (conversationId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      await apiClient.deleteConversation(conversationId);
      
      set(state => ({
        conversations: state.conversations.filter(conv => conv.id !== conversationId),
        currentConversation: state.currentConversation?.id === conversationId 
          ? null 
          : state.currentConversation,
        messages: state.currentConversation?.id === conversationId ? [] : state.messages,
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message || '删除对话失败';
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  updateConversationTitle: async (conversationId: string, title: string) => {
    try {
      const updatedConversation = await apiClient.updateConversationTitle(conversationId, title);
      
      set(state => ({
        conversations: state.conversations.map(conv =>
          conv.id === conversationId ? updatedConversation : conv
        ),
        currentConversation: state.currentConversation?.id === conversationId
          ? updatedConversation
          : state.currentConversation,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message || '更新标题失败';
      set({ error: errorMessage });
    }
  },

  createNewConversation: () => {
    set({
      currentConversation: null,
      messages: [],
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },

  setCurrentConversation: (conversation: Conversation | null) => {
    set({
      currentConversation: conversation,
      messages: [],
      error: null,
    });
  },
}));