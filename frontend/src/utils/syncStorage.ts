/**
 * 同步存储包装器 - 提供同步接口的临时解决方案
 * 这个文件提供了与原MMKV兼容的同步接口
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Conversation, Message } from '../api/client';

// 内存缓存
const cache = new Map<string, any>();
let isInitialized = false;

// 存储键常量
export const STORAGE_KEYS = {
  // 用户相关
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_INFO: 'user_info',
  
  // 对话相关
  CONVERSATIONS: 'conversations',
  MESSAGES_PREFIX: 'messages_', // messages_${conversationId}
  CURRENT_CONVERSATION_ID: 'current_conversation_id',
  
  // 设置相关
  THEME: 'theme',
  LANGUAGE: 'language',
  FONT_SIZE: 'font_size',
  NOTIFICATIONS_ENABLED: 'notifications_enabled',
  AUTO_SAVE_CONVERSATIONS: 'auto_save_conversations',
  MESSAGE_DISPLAY_LIMIT: 'message_display_limit',
};

// 初始化缓存 - 增强错误处理
export async function initializeStorage(): Promise<void> {
  if (isInitialized) return;
  
  try {
    // 使用超时保护，防止 AsyncStorage 操作无限等待
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Storage initialization timeout')), 5000);
    });

    const initPromise = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        
        // 如果没有 keys 或 keys 为空，直接返回
        if (!keys || keys.length === 0) {
          console.log('No existing storage keys found');
          isInitialized = true;
          return;
        }

        const values = await AsyncStorage.multiGet(keys);
        
        values.forEach(([key, value]) => {
          if (value) {
            try {
              // 尝试解析JSON，如果失败则存储原始字符串
              const parsedValue = JSON.parse(value);
              cache.set(key, parsedValue);
            } catch (parseError) {
              // 如果JSON解析失败，存储原始字符串
              cache.set(key, value);
            }
          }
        });
      } catch (storageError) {
        console.warn('AsyncStorage operation failed:', storageError);
        // 即使存储操作失败，也继续初始化
      }
    };

    await Promise.race([initPromise(), timeoutPromise]);
    isInitialized = true;
    console.log('Storage initialized successfully');
  } catch (error) {
    console.warn('Failed to initialize storage cache:', error);
    // 即使初始化失败，也设置为已初始化，让应用继续运行
    isInitialized = true;
  }
}

// 同步设置值 - 增强错误处理
function setSync(key: string, value: any): void {
  try {
    cache.set(key, value);
    
    // 异步保存到磁盘，不等待，并增加错误处理
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    AsyncStorage.setItem(key, stringValue).catch((error) => {
      console.warn(`Failed to save key "${key}" to AsyncStorage:`, error);
    });
  } catch (error) {
    console.warn(`Failed to set sync value for key "${key}":`, error);
  }
}

// 同步获取值 - 增强错误处理
function getSync(key: string): any {
  try {
    return cache.get(key) || null;
  } catch (error) {
    console.warn(`Failed to get sync value for key "${key}":`, error);
    return null;
  }
}

// 同步删除值 - 增强错误处理
function deleteSync(key: string): void {
  try {
    cache.delete(key);
    AsyncStorage.removeItem(key).catch((error) => {
      console.warn(`Failed to remove key "${key}" from AsyncStorage:`, error);
    });
  } catch (error) {
    console.warn(`Failed to delete sync value for key "${key}":`, error);
  }
}

/**
 * 用户数据存储服务
 */
export class UserStorageService {
  static setAccessToken(token: string): void {
    setSync(STORAGE_KEYS.ACCESS_TOKEN, token);
  }

  static getAccessToken(): string | null {
    return getSync(STORAGE_KEYS.ACCESS_TOKEN);
  }

  static setRefreshToken(token: string): void {
    setSync(STORAGE_KEYS.REFRESH_TOKEN, token);
  }

  static getRefreshToken(): string | null {
    return getSync(STORAGE_KEYS.REFRESH_TOKEN);
  }

  static setUserInfo(userInfo: any): void {
    setSync(STORAGE_KEYS.USER_INFO, userInfo);
  }

  static getUserInfo(): any | null {
    return getSync(STORAGE_KEYS.USER_INFO);
  }

  static clearUserData(): void {
    deleteSync(STORAGE_KEYS.ACCESS_TOKEN);
    deleteSync(STORAGE_KEYS.REFRESH_TOKEN);
    deleteSync(STORAGE_KEYS.USER_INFO);
  }
}

/**
 * 对话数据存储服务
 */
export class ConversationStorageService {
  static saveConversations(conversations: Conversation[]): void {
    setSync(STORAGE_KEYS.CONVERSATIONS, conversations);
  }

  static getConversations(): Conversation[] {
    return getSync(STORAGE_KEYS.CONVERSATIONS) || [];
  }

  static saveMessages(conversationId: string, messages: Message[]): void {
    const key = `${STORAGE_KEYS.MESSAGES_PREFIX}${conversationId}`;
    setSync(key, messages);
  }

  static getMessages(conversationId: string): Message[] {
    const key = `${STORAGE_KEYS.MESSAGES_PREFIX}${conversationId}`;
    return getSync(key) || [];
  }

  static deleteConversationMessages(conversationId: string): void {
    const key = `${STORAGE_KEYS.MESSAGES_PREFIX}${conversationId}`;
    deleteSync(key);
  }

  static setCurrentConversationId(conversationId: string | null): void {
    if (conversationId) {
      setSync(STORAGE_KEYS.CURRENT_CONVERSATION_ID, conversationId);
    } else {
      deleteSync(STORAGE_KEYS.CURRENT_CONVERSATION_ID);
    }
  }

  static getCurrentConversationId(): string | null {
    return getSync(STORAGE_KEYS.CURRENT_CONVERSATION_ID);
  }

  static clearAllConversationData(): void {
    const conversations = this.getConversations();
    
    // 删除所有消息
    conversations.forEach(conv => {
      this.deleteConversationMessages(conv.id);
    });
    
    // 删除对话列表和当前对话ID
    deleteSync(STORAGE_KEYS.CONVERSATIONS);
    deleteSync(STORAGE_KEYS.CURRENT_CONVERSATION_ID);
  }

  /**
   * 获取本地存储使用情况统计
   */
  static getStorageStats(): {
    conversationCount: number;
    totalMessages: number;
    storageSize: number;
  } {
    const conversations = this.getConversations();
    let totalMessages = 0;
    
    conversations.forEach(conv => {
      const messages = this.getMessages(conv.id);
      totalMessages += messages.length;
    });

    return {
      conversationCount: conversations.length,
      totalMessages,
      storageSize: cache.size, // 简化的大小计算
    };
  }

  /**
   * 清理旧数据 - 保留最近的N个对话
   */
  static cleanupOldData(keepRecentCount = 50): void {
    const conversations = this.getConversations();
    
    // 按最后消息时间排序，保留最近的对话
    const sortedConversations = conversations
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
      .slice(0, keepRecentCount);
    
    // 删除旧对话的消息
    conversations.forEach(conv => {
      if (!sortedConversations.find(kept => kept.id === conv.id)) {
        this.deleteConversationMessages(conv.id);
      }
    });
    
    // 更新对话列表
    this.saveConversations(sortedConversations);
  }
}

/**
 * 设置存储服务
 */
export class SettingsStorageService {
  static setTheme(theme: 'light' | 'dark' | 'system'): void {
    setSync(STORAGE_KEYS.THEME, theme);
  }

  static getTheme(): 'light' | 'dark' | 'system' {
    return getSync(STORAGE_KEYS.THEME) || 'system';
  }

  static setLanguage(language: string): void {
    setSync(STORAGE_KEYS.LANGUAGE, language);
  }

  static getLanguage(): string {
    return getSync(STORAGE_KEYS.LANGUAGE) || 'zh-CN';
  }

  static setFontSize(fontSize: number): void {
    setSync(STORAGE_KEYS.FONT_SIZE, fontSize);
  }

  static getFontSize(): number {
    const fontSize = getSync(STORAGE_KEYS.FONT_SIZE);
    return fontSize || 16;
  }

  static setNotificationsEnabled(enabled: boolean): void {
    setSync(STORAGE_KEYS.NOTIFICATIONS_ENABLED, enabled);
  }

  static getNotificationsEnabled(): boolean {
    const enabled = getSync(STORAGE_KEYS.NOTIFICATIONS_ENABLED);
    return enabled !== null ? enabled : true;
  }

  static setAutoSaveConversations(enabled: boolean): void {
    setSync(STORAGE_KEYS.AUTO_SAVE_CONVERSATIONS, enabled);
  }

  static getAutoSaveConversations(): boolean {
    const enabled = getSync(STORAGE_KEYS.AUTO_SAVE_CONVERSATIONS);
    return enabled !== null ? enabled : true;
  }

  static setMessageDisplayLimit(limit: number): void {
    setSync(STORAGE_KEYS.MESSAGE_DISPLAY_LIMIT, limit);
  }

  static getMessageDisplayLimit(): number {
    const limit = getSync(STORAGE_KEYS.MESSAGE_DISPLAY_LIMIT);
    return limit || 100;
  }

  static getAllSettings(): {
    theme: string;
    language: string;
    fontSize: number;
    notificationsEnabled: boolean;
    autoSaveConversations: boolean;
    messageDisplayLimit: number;
  } {
    return {
      theme: this.getTheme(),
      language: this.getLanguage(),
      fontSize: this.getFontSize(),
      notificationsEnabled: this.getNotificationsEnabled(),
      autoSaveConversations: this.getAutoSaveConversations(),
      messageDisplayLimit: this.getMessageDisplayLimit(),
    };
  }

  static clearAllSettings(): void {
    deleteSync(STORAGE_KEYS.THEME);
    deleteSync(STORAGE_KEYS.LANGUAGE);
    deleteSync(STORAGE_KEYS.FONT_SIZE);
    deleteSync(STORAGE_KEYS.NOTIFICATIONS_ENABLED);
    deleteSync(STORAGE_KEYS.AUTO_SAVE_CONVERSATIONS);
    deleteSync(STORAGE_KEYS.MESSAGE_DISPLAY_LIMIT);
  }
}

/**
 * 统一存储管理服务
 */
export class StorageManager {
  /**
   * 完全清除所有存储数据
   */
  static clearAll(): void {
    cache.clear();
    AsyncStorage.clear().catch(console.warn);
  }

  /**
   * 获取总存储使用情况
   */
  static getStorageUsage(): {
    userStorageSize: number;
    conversationStorageSize: number;
    settingsStorageSize: number;
    totalSize: number;
  } {
    const size = cache.size;
    return {
      userStorageSize: size,
      conversationStorageSize: size,
      settingsStorageSize: size,
      totalSize: size,
    };
  }

  /**
   * 导出所有数据（用于备份）
   */
  static exportAllData(): {
    conversations: Conversation[];
    messages: { [conversationId: string]: Message[] };
    settings: any;
    exportTime: string;
  } {
    const conversations = ConversationStorageService.getConversations();
    const messages: { [conversationId: string]: Message[] } = {};
    
    conversations.forEach(conv => {
      messages[conv.id] = ConversationStorageService.getMessages(conv.id);
    });

    return {
      conversations,
      messages,
      settings: SettingsStorageService.getAllSettings(),
      exportTime: new Date().toISOString(),
    };
  }

  /**
   * 导入数据（用于恢复）
   */
  static importData(data: {
    conversations: Conversation[];
    messages: { [conversationId: string]: Message[] };
    settings: any;
  }): void {
    // 导入对话
    ConversationStorageService.saveConversations(data.conversations);
    
    // 导入消息
    Object.keys(data.messages).forEach(conversationId => {
      ConversationStorageService.saveMessages(conversationId, data.messages[conversationId]);
    });
    
    // 导入设置
    if (data.settings) {
      Object.keys(data.settings).forEach(key => {
        switch (key) {
          case 'theme':
            SettingsStorageService.setTheme(data.settings[key]);
            break;
          case 'language':
            SettingsStorageService.setLanguage(data.settings[key]);
            break;
          case 'fontSize':
            SettingsStorageService.setFontSize(data.settings[key]);
            break;
          case 'notificationsEnabled':
            SettingsStorageService.setNotificationsEnabled(data.settings[key]);
            break;
          case 'autoSaveConversations':
            SettingsStorageService.setAutoSaveConversations(data.settings[key]);
            break;
          case 'messageDisplayLimit':
            SettingsStorageService.setMessageDisplayLimit(data.settings[key]);
            break;
        }
      });
    }
  }
}