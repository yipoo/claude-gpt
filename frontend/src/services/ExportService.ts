import { Share } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Message, Conversation } from '../api/client';

export type ExportFormat = 'json' | 'txt' | 'markdown' | 'csv';

interface ExportOptions {
  format: ExportFormat;
  includeMetadata?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  conversationIds?: string[];
}

class ExportService {
  async exportConversations(
    conversations: Conversation[],
    messages: Message[],
    options: ExportOptions
  ): Promise<void> {
    try {
      const exportData = this.prepareExportData(conversations, messages, options);
      const content = this.formatContent(exportData, options.format);
      const filename = this.generateFilename(options.format);
      
      await this.saveAndShare(content, filename, options.format);
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error('Failed to export conversations');
    }
  }

  async exportSingleConversation(
    conversation: Conversation,
    messages: Message[],
    format: ExportFormat = 'txt'
  ): Promise<void> {
    const options: ExportOptions = {
      format,
      includeMetadata: true,
      conversationIds: [conversation.id],
    };

    await this.exportConversations([conversation], messages, options);
  }

  private prepareExportData(
    conversations: Conversation[],
    messages: Message[],
    options: ExportOptions
  ) {
    // 过滤对话
    let filteredConversations = conversations;
    if (options.conversationIds) {
      filteredConversations = conversations.filter(c => 
        options.conversationIds!.includes(c.id)
      );
    }

    // 过滤消息
    let filteredMessages = messages;
    if (options.conversationIds) {
      filteredMessages = messages.filter(m => 
        options.conversationIds!.includes(m.conversationId)
      );
    }

    // 日期过滤
    if (options.dateRange) {
      const { start, end } = options.dateRange;
      filteredMessages = filteredMessages.filter(m => {
        const messageDate = new Date(m.timestamp || 0);
        return messageDate >= start && messageDate <= end;
      });
    }

    // 按对话分组消息
    const messagesByConversation = new Map<string, Message[]>();
    filteredMessages.forEach(message => {
      if (!messagesByConversation.has(message.conversationId)) {
        messagesByConversation.set(message.conversationId, []);
      }
      messagesByConversation.get(message.conversationId)!.push(message);
    });

    // 对每个对话的消息按时间排序
    messagesByConversation.forEach(messages => {
      messages.sort((a, b) => 
        (new Date(a.timestamp || 0)).getTime() - (new Date(b.timestamp || 0)).getTime()
      );
    });

    return {
      conversations: filteredConversations,
      messagesByConversation,
      exportDate: new Date().toISOString(),
      totalConversations: filteredConversations.length,
      totalMessages: filteredMessages.length,
    };
  }

  private formatContent(data: any, format: ExportFormat): string {
    switch (format) {
      case 'json':
        return this.formatAsJSON(data);
      case 'txt':
        return this.formatAsText(data);
      case 'markdown':
        return this.formatAsMarkdown(data);
      case 'csv':
        return this.formatAsCSV(data);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private formatAsJSON(data: any): string {
    return JSON.stringify(data, null, 2);
  }

  private formatAsText(data: any): string {
    let content = `Chat Export\n`;
    content += `Generated: ${new Date(data.exportDate).toLocaleString()}\n`;
    content += `Conversations: ${data.totalConversations}\n`;
    content += `Messages: ${data.totalMessages}\n`;
    content += `${'='.repeat(50)}\n\n`;

    data.conversations.forEach((conversation: any) => {
      content += `Conversation: ${conversation.title || 'Untitled'}\n`;
      content += `Created: ${new Date(conversation.createdAt).toLocaleString()}\n`;
      content += `${'─'.repeat(30)}\n\n`;

      const messages = data.messagesByConversation.get(conversation.id) || [];
      messages.forEach((message: Message) => {
        const timestamp = new Date(message.timestamp || 0).toLocaleString();
        const role = message.role === 'user' ? 'You' : 'Assistant';
        
        content += `[${timestamp}] ${role}:\n`;
        content += `${message.content}\n\n`;
      });

      content += `\n${'='.repeat(50)}\n\n`;
    });

    return content;
  }

  private formatAsMarkdown(data: any): string {
    let content = `# Chat Export\n\n`;
    content += `**Generated:** ${new Date(data.exportDate).toLocaleString()}\n`;
    content += `**Conversations:** ${data.totalConversations}\n`;
    content += `**Messages:** ${data.totalMessages}\n\n`;
    content += `---\n\n`;

    data.conversations.forEach((conversation: any) => {
      content += `## ${conversation.title || 'Untitled Conversation'}\n\n`;
      content += `**Created:** ${new Date(conversation.createdAt).toLocaleString()}\n\n`;

      const messages = data.messagesByConversation.get(conversation.id) || [];
      messages.forEach((message: Message) => {
        const timestamp = new Date(message.timestamp || 0).toLocaleString();
        const role = message.role === 'user' ? '**You**' : '**Assistant**';
        
        content += `### ${role} - ${timestamp}\n\n`;
        content += `${message.content}\n\n`;
      });

      content += `---\n\n`;
    });

    return content;
  }

  private formatAsCSV(data: any): string {
    let content = 'Conversation Title,Message Role,Message Content,Timestamp,Conversation ID,Message ID\n';

    data.conversations.forEach((conversation: any) => {
      const messages = data.messagesByConversation.get(conversation.id) || [];
      messages.forEach((message: Message) => {
        const timestamp = new Date(message.timestamp || 0).toISOString();
        const csvRow = [
          this.escapeCsvField(conversation.title || 'Untitled'),
          message.role,
          this.escapeCsvField(message.content),
          timestamp,
          conversation.id,
          message.id,
        ].join(',');
        
        content += csvRow + '\n';
      });
    });

    return content;
  }

  private escapeCsvField(field: string): string {
    // 转义CSV字段中的特殊字符
    const escaped = field.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  private generateFilename(format: ExportFormat): string {
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    return `chat-export-${date}-${time}.${format}`;
  }

  private async saveAndShare(
    content: string,
    filename: string,
    format: ExportFormat
  ): Promise<void> {
    try {
      // 保存到临时文件
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // 检查是否支持分享
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: this.getMimeType(format),
          dialogTitle: 'Export Chat Data',
        });
      } else {
        // 降级到系统分享
        await Share.share({
          message: content,
          title: 'Chat Export',
        });
      }

      // 清理临时文件
      setTimeout(async () => {
        try {
          await FileSystem.deleteAsync(fileUri);
        } catch (error) {
          console.warn('Failed to clean up temporary file:', error);
        }
      }, 5000);

    } catch (error) {
      console.error('Failed to save and share:', error);
      throw error;
    }
  }

  private getMimeType(format: ExportFormat): string {
    switch (format) {
      case 'json':
        return 'application/json';
      case 'txt':
        return 'text/plain';
      case 'markdown':
        return 'text/markdown';
      case 'csv':
        return 'text/csv';
      default:
        return 'text/plain';
    }
  }

  // 获取导出统计信息
  async getExportStats(conversations: Conversation[], messages: Message[]) {
    const stats = {
      totalConversations: conversations.length,
      totalMessages: messages.length,
      dateRange: {
        earliest: null as Date | null,
        latest: null as Date | null,
      },
      messagesByRole: {
        user: 0,
        assistant: 0,
      },
      estimatedFileSize: {
        json: 0,
        txt: 0,
        markdown: 0,
        csv: 0,
      },
    };

    // 计算日期范围和角色统计
    messages.forEach(message => {
      const messageDate = new Date(message.timestamp || 0);
      
      if (!stats.dateRange.earliest || messageDate < stats.dateRange.earliest) {
        stats.dateRange.earliest = messageDate;
      }
      if (!stats.dateRange.latest || messageDate > stats.dateRange.latest) {
        stats.dateRange.latest = messageDate;
      }

      stats.messagesByRole[message.role]++;
    });

    // 估算文件大小
    const sampleData = this.prepareExportData(conversations, messages, {
      format: 'json',
      includeMetadata: true,
    });

    Object.keys(stats.estimatedFileSize).forEach(format => {
      const content = this.formatContent(sampleData, format as ExportFormat);
      stats.estimatedFileSize[format as keyof typeof stats.estimatedFileSize] = 
        new Blob([content]).size;
    });

    return stats;
  }
}

export const exportService = new ExportService();