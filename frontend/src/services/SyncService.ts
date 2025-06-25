import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface SyncData {
  conversations: any[];
  messages: any[];
  userSettings: any;
  lastSyncTime: number;
}

interface SyncConflict {
  type: 'conversation' | 'message' | 'settings';
  localData: any;
  remoteData: any;
  conflictId: string;
}

class SyncService {
  private syncInProgress = false;
  private syncQueue: Array<() => Promise<void>> = [];
  private lastSyncTime = 0;
  private readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5分钟
  private readonly STORAGE_KEYS = {
    LAST_SYNC: 'last_sync_time',
    PENDING_UPLOADS: 'pending_uploads',
    SYNC_CONFLICTS: 'sync_conflicts',
  };

  constructor() {
    this.initializeSync();
  }

  private async initializeSync() {
    try {
      const lastSync = await AsyncStorage.getItem(this.STORAGE_KEYS.LAST_SYNC);
      this.lastSyncTime = lastSync ? parseInt(lastSync, 10) : 0;
      
      // 启动定期同步
      this.startPeriodicSync();
      
      // 处理待上传的数据
      this.processPendingUploads();
    } catch (error) {
      console.error('Failed to initialize sync service:', error);
    }
  }

  private startPeriodicSync() {
    setInterval(async () => {
      await this.syncIfNeeded();
    }, this.SYNC_INTERVAL);
  }

  async syncIfNeeded(): Promise<boolean> {
    const { checkConnection } = useNetworkStatus();
    const isOnline = await checkConnection();
    
    if (!isOnline || this.syncInProgress) {
      return false;
    }

    const now = Date.now();
    const shouldSync = now - this.lastSyncTime > this.SYNC_INTERVAL;
    
    if (shouldSync) {
      return await this.performFullSync();
    }
    
    return false;
  }

  async performFullSync(): Promise<boolean> {
    if (this.syncInProgress) {
      return false;
    }

    try {
      this.syncInProgress = true;
      console.log('Starting full sync...');

      // 1. 获取本地数据
      const localData = await this.getLocalData();
      
      // 2. 上传本地更改
      await this.uploadLocalChanges(localData);
      
      // 3. 下载远程更改
      const remoteData = await this.downloadRemoteChanges();
      
      // 4. 合并数据并处理冲突
      const conflicts = await this.mergeData(localData, remoteData);
      
      // 5. 如果有冲突，存储冲突信息
      if (conflicts.length > 0) {
        await this.storeConflicts(conflicts);
      }
      
      // 6. 更新最后同步时间
      this.lastSyncTime = Date.now();
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.LAST_SYNC, 
        this.lastSyncTime.toString()
      );

      console.log('Full sync completed successfully');
      return true;
    } catch (error) {
      console.error('Full sync failed:', error);
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  private async getLocalData(): Promise<SyncData> {
    // 这里应该从本地存储获取数据
    // 实际实现中需要从 stores 获取数据
    return {
      conversations: [],
      messages: [],
      userSettings: {},
      lastSyncTime: this.lastSyncTime,
    };
  }

  private async uploadLocalChanges(localData: SyncData): Promise<void> {
    try {
      // 上传新的或修改的对话
      for (const conversation of localData.conversations) {
        if (conversation.lastModified > this.lastSyncTime) {
          await apiClient.post('/sync/conversations', conversation);
        }
      }

      // 上传新的或修改的消息
      for (const message of localData.messages) {
        if (message.timestamp > this.lastSyncTime) {
          await apiClient.post('/sync/messages', message);
        }
      }

      // 上传用户设置
      if (localData.userSettings.lastModified > this.lastSyncTime) {
        await apiClient.post('/sync/settings', localData.userSettings);
      }
    } catch (error) {
      console.error('Failed to upload local changes:', error);
      // 将失败的上传添加到队列中
      await this.queuePendingUpload(localData);
      throw error;
    }
  }

  private async downloadRemoteChanges(): Promise<SyncData> {
    try {
      const response = await apiClient.get(`/sync/changes?since=${this.lastSyncTime}`);
      return response.data;
    } catch (error) {
      console.error('Failed to download remote changes:', error);
      throw error;
    }
  }

  private async mergeData(localData: SyncData, remoteData: SyncData): Promise<SyncConflict[]> {
    const conflicts: SyncConflict[] = [];

    // 合并对话数据
    const conversationConflicts = await this.mergeConversations(
      localData.conversations,
      remoteData.conversations
    );
    conflicts.push(...conversationConflicts);

    // 合并消息数据
    const messageConflicts = await this.mergeMessages(
      localData.messages,
      remoteData.messages
    );
    conflicts.push(...messageConflicts);

    // 合并设置数据
    const settingsConflicts = await this.mergeSettings(
      localData.userSettings,
      remoteData.userSettings
    );
    conflicts.push(...settingsConflicts);

    return conflicts;
  }

  private async mergeConversations(local: any[], remote: any[]): Promise<SyncConflict[]> {
    const conflicts: SyncConflict[] = [];
    const remoteMap = new Map(remote.map(item => [item.id, item]));

    for (const localItem of local) {
      const remoteItem = remoteMap.get(localItem.id);
      
      if (remoteItem) {
        // 检查冲突
        if (localItem.lastModified !== remoteItem.lastModified) {
          if (localItem.lastModified > remoteItem.lastModified) {
            // 本地更新，保留本地版本
            continue;
          } else if (remoteItem.lastModified > localItem.lastModified) {
            // 远程更新，使用远程版本
            await this.updateLocalConversation(remoteItem);
          } else {
            // 时间戳相同但内容不同，记录冲突
            conflicts.push({
              type: 'conversation',
              localData: localItem,
              remoteData: remoteItem,
              conflictId: localItem.id,
            });
          }
        }
        remoteMap.delete(localItem.id);
      }
    }

    // 添加远程新增的对话
    for (const remoteItem of remoteMap.values()) {
      await this.addLocalConversation(remoteItem);
    }

    return conflicts;
  }

  private async mergeMessages(local: any[], remote: any[]): Promise<SyncConflict[]> {
    const conflicts: SyncConflict[] = [];
    // 类似对话的合并逻辑
    return conflicts;
  }

  private async mergeSettings(local: any, remote: any): Promise<SyncConflict[]> {
    const conflicts: SyncConflict[] = [];
    // 设置合并逻辑
    return conflicts;
  }

  private async updateLocalConversation(conversation: any): Promise<void> {
    // 更新本地对话数据
    console.log('Updating local conversation:', conversation.id);
  }

  private async addLocalConversation(conversation: any): Promise<void> {
    // 添加本地对话数据
    console.log('Adding local conversation:', conversation.id);
  }

  private async queuePendingUpload(data: SyncData): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem(this.STORAGE_KEYS.PENDING_UPLOADS);
      const pendingUploads = existing ? JSON.parse(existing) : [];
      
      pendingUploads.push({
        data,
        timestamp: Date.now(),
        retryCount: 0,
      });
      
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.PENDING_UPLOADS,
        JSON.stringify(pendingUploads)
      );
    } catch (error) {
      console.error('Failed to queue pending upload:', error);
    }
  }

  private async processPendingUploads(): Promise<void> {
    try {
      const pending = await AsyncStorage.getItem(this.STORAGE_KEYS.PENDING_UPLOADS);
      if (!pending) return;

      const pendingUploads = JSON.parse(pending);
      const remainingUploads = [];

      for (const upload of pendingUploads) {
        try {
          await this.uploadLocalChanges(upload.data);
          // 上传成功，不需要重试
        } catch (error) {
          upload.retryCount += 1;
          if (upload.retryCount < 3) {
            remainingUploads.push(upload);
          }
          // 超过重试次数，丢弃
        }
      }

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.PENDING_UPLOADS,
        JSON.stringify(remainingUploads)
      );
    } catch (error) {
      console.error('Failed to process pending uploads:', error);
    }
  }

  private async storeConflicts(conflicts: SyncConflict[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.SYNC_CONFLICTS,
        JSON.stringify(conflicts)
      );
    } catch (error) {
      console.error('Failed to store conflicts:', error);
    }
  }

  async getConflicts(): Promise<SyncConflict[]> {
    try {
      const conflicts = await AsyncStorage.getItem(this.STORAGE_KEYS.SYNC_CONFLICTS);
      return conflicts ? JSON.parse(conflicts) : [];
    } catch (error) {
      console.error('Failed to get conflicts:', error);
      return [];
    }
  }

  async resolveConflict(conflictId: string, resolution: 'local' | 'remote'): Promise<void> {
    try {
      const conflicts = await this.getConflicts();
      const conflict = conflicts.find(c => c.conflictId === conflictId);
      
      if (conflict) {
        const dataToUse = resolution === 'local' ? conflict.localData : conflict.remoteData;
        
        // 应用解决方案
        switch (conflict.type) {
          case 'conversation':
            await this.updateLocalConversation(dataToUse);
            break;
          case 'message':
            // 处理消息冲突
            break;
          case 'settings':
            // 处理设置冲突
            break;
        }

        // 从冲突列表中移除
        const updatedConflicts = conflicts.filter(c => c.conflictId !== conflictId);
        await AsyncStorage.setItem(
          this.STORAGE_KEYS.SYNC_CONFLICTS,
          JSON.stringify(updatedConflicts)
        );
      }
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  }

  // 手动触发同步
  async manualSync(): Promise<boolean> {
    return await this.performFullSync();
  }

  // 获取同步状态
  getSyncStatus(): {
    isInProgress: boolean;
    lastSyncTime: number;
    pendingUploads: number;
    conflicts: number;
  } {
    return {
      isInProgress: this.syncInProgress,
      lastSyncTime: this.lastSyncTime,
      pendingUploads: this.syncQueue.length,
      conflicts: 0, // 需要从存储中获取
    };
  }
}

export const syncService = new SyncService();
export type { SyncConflict };