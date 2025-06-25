import { Message, Conversation } from '../api/client';

export interface SearchResult {
  id: string;
  type: 'message' | 'conversation';
  conversationId: string;
  conversationTitle: string;
  content: string;
  snippet: string;
  timestamp: number;
  relevanceScore: number;
  highlights: Array<{
    start: number;
    end: number;
  }>;
}

export interface SearchOptions {
  query: string;
  searchInMessages?: boolean;
  searchInTitles?: boolean;
  conversationIds?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  limit?: number;
  sortBy?: 'relevance' | 'date';
  sortOrder?: 'asc' | 'desc';
}

class SearchService {
  private stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
    'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you',
    'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
  ]);

  async search(
    conversations: Conversation[],
    messages: Message[],
    options: SearchOptions
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const searchTerms = this.parseQuery(options.query);
    
    if (searchTerms.length === 0) {
      return results;
    }

    // 搜索对话标题
    if (options.searchInTitles !== false) {
      const titleResults = this.searchInConversationTitles(
        conversations,
        searchTerms,
        options
      );
      results.push(...titleResults);
    }

    // 搜索消息内容
    if (options.searchInMessages !== false) {
      const messageResults = this.searchInMessages(
        conversations,
        messages,
        searchTerms,
        options
      );
      results.push(...messageResults);
    }

    // 排序和限制结果
    return this.sortAndLimitResults(results, options);
  }

  private parseQuery(query: string): string[] {
    // 处理引号包围的短语
    const phrases: string[] = [];
    const phraseRegex = /"([^"]+)"/g;
    let match;
    let processedQuery = query;

    while ((match = phraseRegex.exec(query)) !== null) {
      phrases.push(match[1].toLowerCase());
      processedQuery = processedQuery.replace(match[0], '');
    }

    // 分词并过滤停用词
    const words = processedQuery
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 1 && !this.stopWords.has(word));

    return [...phrases, ...words];
  }

  private searchInConversationTitles(
    conversations: Conversation[],
    searchTerms: string[],
    options: SearchOptions
  ): SearchResult[] {
    const results: SearchResult[] = [];

    conversations.forEach(conversation => {
      if (options.conversationIds && !options.conversationIds.includes(conversation.id)) {
        return;
      }

      const title = (conversation.title || '').toLowerCase();
      const relevanceScore = this.calculateRelevance(title, searchTerms);
      
      if (relevanceScore > 0) {
        const highlights = this.findHighlights(title, searchTerms);
        
        results.push({
          id: conversation.id,
          type: 'conversation',
          conversationId: conversation.id,
          conversationTitle: conversation.title || 'Untitled',
          content: conversation.title || '',
          snippet: this.generateSnippet(conversation.title || '', highlights),
          timestamp: new Date(conversation.createdAt).getTime(),
          relevanceScore,
          highlights,
        });
      }
    });

    return results;
  }

  private searchInMessages(
    conversations: Conversation[],
    messages: Message[],
    searchTerms: string[],
    options: SearchOptions
  ): SearchResult[] {
    const results: SearchResult[] = [];
    const conversationMap = new Map(conversations.map(c => [c.id, c]));

    messages.forEach(message => {
      if (options.conversationIds && !options.conversationIds.includes(message.conversationId)) {
        return;
      }

      // 日期过滤
      if (options.dateRange) {
        const messageDate = new Date(message.timestamp || 0);
        if (messageDate < options.dateRange.start || messageDate > options.dateRange.end) {
          return;
        }
      }

      const content = message.content.toLowerCase();
      const relevanceScore = this.calculateRelevance(content, searchTerms);
      
      if (relevanceScore > 0) {
        const highlights = this.findHighlights(content, searchTerms);
        const conversation = conversationMap.get(message.conversationId);
        
        results.push({
          id: message.id,
          type: 'message',
          conversationId: message.conversationId,
          conversationTitle: conversation?.title || 'Untitled',
          content: message.content,
          snippet: this.generateSnippet(message.content, highlights),
          timestamp: new Date(message.timestamp || 0).getTime(),
          relevanceScore,
          highlights,
        });
      }
    });

    return results;
  }

  private calculateRelevance(content: string, searchTerms: string[]): number {
    let score = 0;
    const words = content.toLowerCase().split(/\s+/);
    
    searchTerms.forEach(term => {
      // 精确匹配得分更高
      if (content.includes(term)) {
        score += term.length * 2;
        
        // 在开头匹配得分更高
        if (content.startsWith(term)) {
          score += 10;
        }
      }
      
      // 单词边界匹配
      words.forEach(word => {
        if (word === term) {
          score += 5;
        } else if (word.includes(term)) {
          score += 2;
        }
      });
    });

    // 根据内容长度调整得分（避免长文本占优势）
    return score / Math.sqrt(content.length);
  }

  private findHighlights(content: string, searchTerms: string[]): Array<{ start: number; end: number }> {
    const highlights: Array<{ start: number; end: number }> = [];
    const lowerContent = content.toLowerCase();
    
    searchTerms.forEach(term => {
      let index = 0;
      while ((index = lowerContent.indexOf(term, index)) !== -1) {
        highlights.push({
          start: index,
          end: index + term.length,
        });
        index += term.length;
      }
    });

    // 合并重叠的高亮区域
    return this.mergeHighlights(highlights);
  }

  private mergeHighlights(highlights: Array<{ start: number; end: number }>): Array<{ start: number; end: number }> {
    if (highlights.length === 0) return highlights;
    
    const sorted = highlights.sort((a, b) => a.start - b.start);
    const merged: Array<{ start: number; end: number }> = [sorted[0]];
    
    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const last = merged[merged.length - 1];
      
      if (current.start <= last.end + 1) {
        // 重叠或相邻，合并
        last.end = Math.max(last.end, current.end);
      } else {
        // 不重叠，添加新的高亮
        merged.push(current);
      }
    }
    
    return merged;
  }

  private generateSnippet(content: string, highlights: Array<{ start: number; end: number }>): string {
    const maxSnippetLength = 150;
    
    if (highlights.length === 0) {
      return content.length > maxSnippetLength 
        ? content.substring(0, maxSnippetLength) + '...'
        : content;
    }

    // 找到第一个高亮的位置
    const firstHighlight = highlights[0];
    const start = Math.max(0, firstHighlight.start - 50);
    const end = Math.min(content.length, start + maxSnippetLength);
    
    let snippet = content.substring(start, end);
    
    if (start > 0) {
      snippet = '...' + snippet;
    }
    if (end < content.length) {
      snippet = snippet + '...';
    }
    
    return snippet;
  }

  private sortAndLimitResults(results: SearchResult[], options: SearchOptions): SearchResult[] {
    // 排序
    const sortBy = options.sortBy || 'relevance';
    const sortOrder = options.sortOrder || 'desc';
    
    results.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'relevance') {
        comparison = a.relevanceScore - b.relevanceScore;
      } else if (sortBy === 'date') {
        comparison = a.timestamp - b.timestamp;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // 限制结果数量
    const limit = options.limit || 50;
    return results.slice(0, limit);
  }

  // 搜索建议（自动完成）
  async getSearchSuggestions(
    conversations: Conversation[],
    messages: Message[],
    query: string,
    limit: number = 5
  ): Promise<string[]> {
    const suggestions = new Set<string>();
    const lowerQuery = query.toLowerCase();
    
    // 从对话标题中提取建议
    conversations.forEach(conversation => {
      if (conversation.title && conversation.title.toLowerCase().includes(lowerQuery)) {
        const words = conversation.title.split(/\s+/);
        words.forEach(word => {
          if (word.toLowerCase().startsWith(lowerQuery) && word.length > lowerQuery.length) {
            suggestions.add(word);
          }
        });
      }
    });

    // 从消息内容中提取建议
    messages.forEach(message => {
      if (message.content.toLowerCase().includes(lowerQuery)) {
        const words = message.content.split(/\s+/);
        words.forEach(word => {
          // 清理标点符号
          const cleanWord = word.replace(/[^\w]/g, '');
          if (cleanWord.toLowerCase().startsWith(lowerQuery) && 
              cleanWord.length > lowerQuery.length &&
              !this.stopWords.has(cleanWord.toLowerCase())) {
            suggestions.add(cleanWord);
          }
        });
      }
    });

    return Array.from(suggestions)
      .sort()
      .slice(0, limit);
  }

  // 搜索历史管理
  private searchHistory: string[] = [];
  private readonly maxHistorySize = 20;

  addToHistory(query: string) {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length === 0) return;

    // 移除已存在的查询
    this.searchHistory = this.searchHistory.filter(q => q !== trimmedQuery);
    
    // 添加到开头
    this.searchHistory.unshift(trimmedQuery);
    
    // 限制历史记录大小
    if (this.searchHistory.length > this.maxHistorySize) {
      this.searchHistory = this.searchHistory.slice(0, this.maxHistorySize);
    }
  }

  getSearchHistory(): string[] {
    return [...this.searchHistory];
  }

  clearSearchHistory() {
    this.searchHistory = [];
  }
}

export const searchService = new SearchService();