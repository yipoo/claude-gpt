/**
 * AsyncStorage 工具类 - 提供本地存储功能
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Conversation, Message } from '../api/client';

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

/**
 * 用户数据存储服务
 */
export class UserStorageService {
  static async setAccessToken(token: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  }

  static async getAccessToken(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  static async setRefreshToken(token: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  }

  static async getRefreshToken(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  static async setUserInfo(userInfo: any): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));
  }

  static async getUserInfo(): Promise<any | null> {
    const userInfoStr = await AsyncStorage.getItem(STORAGE_KEYS.USER_INFO);
    return userInfoStr ? JSON.parse(userInfoStr) : null;
  }

  static async clearUserData(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER_INFO,
    ]);
  }

  // 同步版本（为了兼容现有代码）
  // 注意：这些是临时的兼容方法，实际上AsyncStorage是异步的
  private static _syncCache: { [key: string]: string | null } = {};

  static setAccessTokenSync(token: string): void {
    this._syncCache[STORAGE_KEYS.ACCESS_TOKEN] = token;
    AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  }

  static getAccessTokenSync(): string | null {
    return this._syncCache[STORAGE_KEYS.ACCESS_TOKEN] || null;
  }

  static setRefreshTokenSync(token: string): void {
    this._syncCache[STORAGE_KEYS.REFRESH_TOKEN] = token;
    AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  }

  static getRefreshTokenSync(): string | null {
    return this._syncCache[STORAGE_KEYS.REFRESH_TOKEN] || null;
  }

  static clearUserDataSync(): void {
    this._syncCache[STORAGE_KEYS.ACCESS_TOKEN] = null;
    this._syncCache[STORAGE_KEYS.REFRESH_TOKEN] = null;
    this._syncCache[STORAGE_KEYS.USER_INFO] = null;
    this.clearUserData();
  }

  // 初始化缓存（在应用启动时调用）
  static async initializeCache(): Promise<void> {
    try {
      this._syncCache[STORAGE_KEYS.ACCESS_TOKEN] = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      this._syncCache[STORAGE_KEYS.REFRESH_TOKEN] = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      this._syncCache[STORAGE_KEYS.USER_INFO] = await AsyncStorage.getItem(STORAGE_KEYS.USER_INFO);
    } catch (error) {
      console.warn('Failed to initialize storage cache:', error);
    }
  }
}

/**
 * 对话数据存储服务
 */
export class ConversationStorageService {
  static async saveConversations(conversations: Conversation[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  }

  static async getConversations(): Promise<Conversation[]> {
    const conversationsStr = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    return conversationsStr ? JSON.parse(conversationsStr) : [];
  }

  static async saveMessages(conversationId: string, messages: Message[]): Promise<void> {
    const key = `${STORAGE_KEYS.MESSAGES_PREFIX}${conversationId}`;
    await AsyncStorage.setItem(key, JSON.stringify(messages));
  }

  static async getMessages(conversationId: string): Promise<Message[]> {
    const key = `${STORAGE_KEYS.MESSAGES_PREFIX}${conversationId}`;
    const messagesStr = await AsyncStorage.getItem(key);
    return messagesStr ? JSON.parse(messagesStr) : [];
  }

  static async deleteConversationMessages(conversationId: string): Promise<void> {
    const key = `${STORAGE_KEYS.MESSAGES_PREFIX}${conversationId}`;
    await AsyncStorage.removeItem(key);
  }

  static async setCurrentConversationId(conversationId: string | null): Promise<void> {
    if (conversationId) {
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_CONVERSATION_ID, conversationId);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_CONVERSATION_ID);
    }
  }

  static async getCurrentConversationId(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_CONVERSATION_ID);
  }

  static async clearAllConversationData(): Promise<void> {
    // 获取所有对话ID并删除对应的消息
    const conversations = await this.getConversations();
    const keysToRemove = [
      STORAGE_KEYS.CONVERSATIONS,
      STORAGE_KEYS.CURRENT_CONVERSATION_ID,
    ];
    
    conversations.forEach(conv => {
      keysToRemove.push(`${STORAGE_KEYS.MESSAGES_PREFIX}${conv.id}`);
    });
    
    await AsyncStorage.multiRemove(keysToRemove);
  }

  /**
   * 获取本地存储使用情况统计
   */
  static async getStorageStats(): Promise<{
    conversationCount: number;
    totalMessages: number;
    storageKeys: number;
  }> {
    const conversations = await this.getConversations();
    let totalMessages = 0;
    
    for (const conv of conversations) {
      const messages = await this.getMessages(conv.id);
      totalMessages += messages.length;
    }

    const allKeys = await AsyncStorage.getAllKeys();

    return {
      conversationCount: conversations.length,
      totalMessages,
      storageKeys: allKeys.length,
    };
  }

  /**
   * 清理旧数据 - 保留最近的N个对话
   */
  static async cleanupOldData(keepRecentCount = 50): Promise<void> {
    const conversations = await this.getConversations();
    
    // 按最后消息时间排序，保留最近的对话
    const sortedConversations = conversations
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
      .slice(0, keepRecentCount);
    
    // 删除旧对话的消息
    const keysToRemove: string[] = [];
    conversations.forEach(conv => {
      if (!sortedConversations.find(kept => kept.id === conv.id)) {
        keysToRemove.push(`${STORAGE_KEYS.MESSAGES_PREFIX}${conv.id}`);
      }
    });
    
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }
    
    // 更新对话列表
    await this.saveConversations(sortedConversations);
  }
}

/**
 * 设置存储服务
 */
export class SettingsStorageService {
  static async setTheme(theme: 'light' | 'dark' | 'system'): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, theme);
  }

  static async getTheme(): Promise<'light' | 'dark' | 'system'> {
    const theme = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
    return (theme as any) || 'system';
  }

  static async setLanguage(language: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
  }

  static async getLanguage(): Promise<string> {
    const language = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
    return language || 'zh-CN';
  }

  static async setFontSize(fontSize: number): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.FONT_SIZE, fontSize.toString());
  }

  static async getFontSize(): Promise<number> {
    const fontSize = await AsyncStorage.getItem(STORAGE_KEYS.FONT_SIZE);
    return fontSize ? parseInt(fontSize, 10) : 16;
  }

  static async setNotificationsEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, enabled.toString());
  }

  static async getNotificationsEnabled(): Promise<boolean> {
    const enabled = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED);
    return enabled !== null ? enabled === 'true' : true;
  }

  static async setAutoSaveConversations(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTO_SAVE_CONVERSATIONS, enabled.toString());
  }

  static async getAutoSaveConversations(): Promise<boolean> {
    const enabled = await AsyncStorage.getItem(STORAGE_KEYS.AUTO_SAVE_CONVERSATIONS);
    return enabled !== null ? enabled === 'true' : true;
  }

  static async setMessageDisplayLimit(limit: number): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.MESSAGE_DISPLAY_LIMIT, limit.toString());
  }

  static async getMessageDisplayLimit(): Promise<number> {
    const limit = await AsyncStorage.getItem(STORAGE_KEYS.MESSAGE_DISPLAY_LIMIT);
    return limit ? parseInt(limit, 10) : 100;
  }

  static async getAllSettings(): Promise<{
    theme: string;
    language: string;
    fontSize: number;
    notificationsEnabled: boolean;
    autoSaveConversations: boolean;
    messageDisplayLimit: number;
  }> {
    return {
      theme: await this.getTheme(),
      language: await this.getLanguage(),
      fontSize: await this.getFontSize(),
      notificationsEnabled: await this.getNotificationsEnabled(),
      autoSaveConversations: await this.getAutoSaveConversations(),
      messageDisplayLimit: await this.getMessageDisplayLimit(),
    };
  }

  static async clearAllSettings(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.THEME,
      STORAGE_KEYS.LANGUAGE,
      STORAGE_KEYS.FONT_SIZE,
      STORAGE_KEYS.NOTIFICATIONS_ENABLED,
      STORAGE_KEYS.AUTO_SAVE_CONVERSATIONS,
      STORAGE_KEYS.MESSAGE_DISPLAY_LIMIT,
    ]);
  }
}

/**
 * 统一存储管理服务
 */
export class StorageManager {
  /**
   * 完全清除所有存储数据
   */
  static async clearAll(): Promise<void> {
    await AsyncStorage.clear();
  }

  /**
   * 获取总存储使用情况
   */
  static async getStorageUsage(): Promise<{
    totalKeys: number;
    estimatedSize: number;
  }> {
    const keys = await AsyncStorage.getAllKeys();
    let estimatedSize = 0;
    
    // 估算存储大小（粗略计算）
    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        estimatedSize += key.length + value.length;
      }
    }

    return {
      totalKeys: keys.length,
      estimatedSize,
    };
  }

  /**
   * 导出所有数据（用于备份）
   */
  static async exportAllData(): Promise<{
    conversations: Conversation[];
    messages: { [conversationId: string]: Message[] };
    settings: any;
    exportTime: string;
  }> {
    const conversations = await ConversationStorageService.getConversations();
    const messages: { [conversationId: string]: Message[] } = {};
    
    for (const conv of conversations) {
      messages[conv.id] = await ConversationStorageService.getMessages(conv.id);
    }

    return {
      conversations,
      messages,
      settings: await SettingsStorageService.getAllSettings(),
      exportTime: new Date().toISOString(),
    };
  }

  /**
   * 导入数据（用于恢复）
   */
  static async importData(data: {
    conversations: Conversation[];
    messages: { [conversationId: string]: Message[] };
    settings: any;
  }): Promise<void> {
    // 导入对话
    await ConversationStorageService.saveConversations(data.conversations);
    
    // 导入消息
    for (const conversationId of Object.keys(data.messages)) {
      await ConversationStorageService.saveMessages(conversationId, data.messages[conversationId]);
    }
    
    // 导入设置
    if (data.settings) {
      const settings = data.settings;
      if (settings.theme) await SettingsStorageService.setTheme(settings.theme);
      if (settings.language) await SettingsStorageService.setLanguage(settings.language);
      if (settings.fontSize) await SettingsStorageService.setFontSize(settings.fontSize);
      if (settings.notificationsEnabled !== undefined) await SettingsStorageService.setNotificationsEnabled(settings.notificationsEnabled);
      if (settings.autoSaveConversations !== undefined) await SettingsStorageService.setAutoSaveConversations(settings.autoSaveConversations);
      if (settings.messageDisplayLimit) await SettingsStorageService.setMessageDisplayLimit(settings.messageDisplayLimit);
    }
  }
}