import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { withRetry, APIError, checkNetworkConnection } from '../utils/retry';
import { UserStorageService } from '../utils/syncStorage';

const API_BASE_URL = 'http://192.168.1.188:3000/api/v1';
// const API_BASE_URL = 'http://192.168.3.171:3000/api/v1';

// API响应接口
export interface APIResponse<T = any> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    timestamp: string;
    requestId?: string;
  };
}

// 认证相关接口
export interface User {
  id: string;
  email: string;
  fullName: string;
  displayName?: string;
  bio?: string;
  subscriptionTier: 'free' | 'base' | 'pro';
  subscriptionStatus: string;
  monthlyMessageCount: number;
  createdAt?: string;
  lastActiveAt?: string;
  totalConversations?: number;
  totalMessages?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// 聊天相关接口
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  contentType: 'text';
  status: 'sending' | 'sent' | 'generating' | 'completed' | 'failed' | 'cancelled';
  tokenCount: number;
  createdAt: string;
  updatedAt?: string;
  reasoning?: string; // DeepSeek 思考内容
  error?: string; // 错误信息
  canRetry?: boolean; // 是否可以重试
}

export interface Conversation {
  id: string;
  title: string;
  modelUsed?: string;
  messageCount: number;
  lastMessageAt: string;
  createdAt: string;
}

// 订阅相关接口
export interface SubscriptionInfo {
  tier: 'FREE' | 'BASE' | 'PRO';
  status: 'INACTIVE' | 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING';
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface UsageInfo {
  monthlyMessageCount: number;
  totalMessageCount: number;
  remainingMessages: number;
  monthlyResetDate: string;
}

export interface SubscriptionFeatures {
  availableModels: string[];
  maxMessagesPerMonth: number;
}

export interface SubscriptionStatus {
  subscription: SubscriptionInfo;
  usage: UsageInfo;
  features: SubscriptionFeatures;
}

class APIClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private currentStreamingRequest: XMLHttpRequest | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.setupInterceptors();
    this.loadTokensFromStorage();
  }

  private setupInterceptors() {
    // 请求拦截器 - 添加认证头
    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 响应拦截器 - 处理token刷新
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${this.accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            await this.logout();
            throw refreshError;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async loadTokensFromStorage() {
    try {
      const accessToken = UserStorageService.getAccessToken();
      const refreshToken = UserStorageService.getRefreshToken();
      
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
    } catch (error) {
      console.error('Failed to load tokens from storage:', error);
    }
  }

  private async saveTokensToStorage(tokens: AuthTokens) {
    try {
      UserStorageService.setAccessToken(tokens.accessToken);
      UserStorageService.setRefreshToken(tokens.refreshToken);
      
      this.accessToken = tokens.accessToken;
      this.refreshToken = tokens.refreshToken;
    } catch (error) {
      console.error('Failed to save tokens to storage:', error);
    }
  }

  private async clearTokensFromStorage() {
    try {
      UserStorageService.clearUserData();
      
      this.accessToken = null;
      this.refreshToken = null;
    } catch (error) {
      console.error('Failed to clear tokens from storage:', error);
    }
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken: this.refreshToken,
    });

    const { tokens } = response.data.data;
    await this.saveTokensToStorage(tokens);
  }

  // 认证方法
  async register(email: string, password: string, fullName: string): Promise<AuthResponse> {
    const response = await this.client.post<APIResponse<AuthResponse>>('/auth/register', {
      email,
      password,
      fullName,
    });

    await this.saveTokensToStorage(response.data.data.tokens);
    UserStorageService.setUserInfo(response.data.data.user);
    return response.data.data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post<APIResponse<AuthResponse>>('/auth/login', {
      email,
      password,
    });

    await this.saveTokensToStorage(response.data.data.tokens);
    UserStorageService.setUserInfo(response.data.data.user);
    return response.data.data;
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      await this.clearTokensFromStorage();
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<APIResponse<{ user: User }>>('/auth/me');
    return response.data.data.user;
  }

  // 聊天方法
  async getConversations(page = 1, limit = 20): Promise<{ conversations: Conversation[]; pagination: any }> {
    const response = await this.client.get<APIResponse<{ conversations: Conversation[]; pagination: any }>>(
      `/chat/conversations?page=${page}&limit=${limit}`
    );
    return response.data.data;
  }

  async getConversation(conversationId: string): Promise<{ conversation: Conversation; messages: Message[] }> {
    const response = await this.client.get<APIResponse<{ conversation: Conversation; messages: Message[] }>>(
      `/chat/conversations/${conversationId}`
    );
    return response.data.data;
  }

  async deleteConversation(conversationId: string): Promise<void> {
    await this.client.delete(`/chat/conversations/${conversationId}`);
  }

  async updateConversationTitle(conversationId: string, title: string): Promise<Conversation> {
    const response = await this.client.put<APIResponse<{ conversation: Conversation }>>(
      `/chat/conversations/${conversationId}/title`,
      { title }
    );
    return response.data.data.conversation;
  }

  // 流式聊天方法 - 使用XMLHttpRequest支持真正的流式传输，带重试机制
  async sendMessage(
    message: string,
    conversationId?: string
  ): Promise<ReadableStream> {
    console.log('=== DEBUG INFO ===');
    console.log('API_BASE_URL:', API_BASE_URL);
    console.log('Access Token exists:', !!this.accessToken);
    console.log('Access Token preview:', this.accessToken ? this.accessToken.substring(0, 20) + '...' : 'null');
    
    // 检查网络连接
    const isConnected = await checkNetworkConnection();
    if (!isConnected) {
      throw APIError.networkError('网络连接不可用，请检查网络设置');
    }
    
    return withRetry(
      () => this._sendMessageWithStreaming(message, conversationId),
      {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 5000,
        retryCondition: (error) => {
          // 重试条件：网络错误或5xx服务器错误
          return (
            error.code === 'NETWORK_ERROR' ||
            error.code === 'TIMEOUT' ||
            (error.status >= 500 && error.status < 600)
          );
        }
      }
    );
  }

  private _sendMessageWithStreaming(
    message: string,
    conversationId?: string
  ): Promise<ReadableStream> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // 创建ReadableStream来处理流式响应
      const stream = new ReadableStream({
        start(controller) {
          let buffer = '';
          
          xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
              console.log('Headers received:', {
                status: xhr.status,
                statusText: xhr.statusText,
                contentType: xhr.getResponseHeader('Content-Type')
              });
              
              if (xhr.status !== 200) {
                let error: APIError;
                if (xhr.status === 0) {
                  error = APIError.networkError('网络连接失败');
                } else if (xhr.status >= 500) {
                  error = APIError.fromResponse(new Response(null, { 
                    status: xhr.status, 
                    statusText: xhr.statusText 
                  }), '服务器内部错误，请稍后重试');
                } else {
                  error = APIError.fromResponse(new Response(null, { 
                    status: xhr.status, 
                    statusText: xhr.statusText 
                  }));
                }
                
                controller.error(error);
                reject(error);
                return;
              }
              
              // 开始流式传输，解析响应
              resolve(stream);
            }
            
            if (xhr.readyState === XMLHttpRequest.LOADING || xhr.readyState === XMLHttpRequest.DONE) {
              try {
                // 获取新的响应数据
                const newData = xhr.responseText.substring(buffer.length);
                buffer = xhr.responseText;
                
                if (newData) {
                  // 按行分割数据
                  const lines = newData.split('\n');
                  const encoder = new TextEncoder();
                  
                  for (const line of lines) {
                    if (line.trim()) {
                      controller.enqueue(encoder.encode(line + '\n'));
                    }
                  }
                }
                
                // 如果请求完成，关闭流
                if (xhr.readyState === XMLHttpRequest.DONE) {
                  controller.close();
                }
              } catch (streamError) {
                console.error('Stream processing error:', streamError);
                controller.error(streamError);
              }
            }
          };
          
          xhr.onerror = () => {
            const error = APIError.networkError('网络连接错误');
            controller.error(error);
            reject(error);
          };
          
          xhr.ontimeout = () => {
            const error = APIError.timeout('请求超时，请检查网络连接');
            controller.error(error);
            reject(error);
          };
          
          xhr.onabort = () => {
            const error = new APIError('请求被取消', 'ABORTED');
            controller.error(error);
            reject(error);
          };
          
          // 配置请求
          xhr.open('POST', `${API_BASE_URL}/chat/send`, true);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.setRequestHeader('Accept', 'text/event-stream');
          xhr.setRequestHeader('Cache-Control', 'no-cache');
          
          if (this.accessToken) {
            xhr.setRequestHeader('Authorization', `Bearer ${this.accessToken}`);
          }
          
          xhr.timeout = 60000; // 60秒超时
          
          // 保存当前请求引用，用于取消
          this.currentStreamingRequest = xhr;
          
          // 发送请求
          xhr.send(JSON.stringify({
            message,
            conversationId,
          }));
        }
      });
    });
  }

  // 取消当前流式请求
  cancelCurrentRequest(): void {
    if (this.currentStreamingRequest) {
      this.currentStreamingRequest.abort();
      this.currentStreamingRequest = null;
    }
  }

  // 订阅方法
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    const response = await this.client.get<APIResponse<SubscriptionStatus>>('/subscription/status');
    return response.data.data;
  }

  async createCheckoutSession(tier: 'BASE' | 'PRO', successUrl: string, cancelUrl: string): Promise<{ sessionId: string; url: string }> {
    const response = await this.client.post<APIResponse<{ sessionId: string; url: string }>>(
      '/subscription/create-checkout-session',
      { tier, successUrl, cancelUrl }
    );
    return response.data.data;
  }

  async createPortalSession(returnUrl: string): Promise<{ url: string }> {
    const response = await this.client.post<APIResponse<{ url: string }>>(
      '/subscription/create-portal-session',
      { returnUrl }
    );
    return response.data.data;
  }

  async cancelSubscription(immediately = false): Promise<any> {
    const response = await this.client.post<APIResponse<any>>('/subscription/cancel', {
      immediately,
    });
    return response.data.data;
  }

  async resumeSubscription(): Promise<any> {
    const response = await this.client.post<APIResponse<any>>('/subscription/resume');
    return response.data.data;
  }

  // 工具方法
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }
}

export const apiClient = new APIClient();