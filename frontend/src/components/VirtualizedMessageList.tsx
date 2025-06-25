import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  ListRenderItem,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Message } from '../api/client';
import { MessageBubble } from './Chat/MessageBubble';
import { SkeletonLoader, EmptyState } from './LoadingOverlay';

const { height: screenHeight } = Dimensions.get('window');

interface VirtualizedMessageListProps {
  messages: Message[];
  isLoading?: boolean;
  isStreaming?: boolean;
  streamingMessageId?: string;
  onRetry?: (messageId: string) => void;
  onCopy?: (content: string) => void;
}

interface MessageListItem {
  id: string;
  type: 'message' | 'date_separator' | 'loading';
  data?: Message;
  date?: string;
}

export const VirtualizedMessageList: React.FC<VirtualizedMessageListProps> = ({
  messages,
  isLoading = false,
  isStreaming = false,
  streamingMessageId,
  onRetry,
  onCopy,
}) => {
  const { t } = useTranslation();

  // 优化消息列表，添加日期分隔符和加载项
  const optimizedMessages = useMemo(() => {
    const items: MessageListItem[] = [];
    let lastDate = '';

    messages.forEach((message, index) => {
      const messageDate = new Date(message.timestamp || Date.now()).toDateString();
      
      // 添加日期分隔符
      if (messageDate !== lastDate) {
        items.push({
          id: `date_${messageDate}`,
          type: 'date_separator',
          date: messageDate,
        });
        lastDate = messageDate;
      }

      // 添加消息
      items.push({
        id: message.id,
        type: 'message',
        data: message,
      });
    });

    // 如果正在流式传输，添加加载指示器
    if (isStreaming && streamingMessageId) {
      items.push({
        id: 'streaming_indicator',
        type: 'loading',
      });
    }

    return items;
  }, [messages, isStreaming, streamingMessageId]);

  const renderDateSeparator = useCallback((date: string) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    let displayDate = date;
    if (date === today) {
      displayDate = t('drawer.today');
    } else if (date === yesterday) {
      displayDate = t('drawer.yesterday');
    } else {
      displayDate = new Date(date).toLocaleDateString();
    }

    return (
      <View style={styles.dateSeparator}>
        <View style={styles.dateSeparatorLine} />
        <Text style={styles.dateSeparatorText}>{displayDate}</Text>
        <View style={styles.dateSeparatorLine} />
      </View>
    );
  }, [t]);

  const renderLoadingIndicator = useCallback(() => (
    <View style={styles.loadingContainer}>
      <SkeletonLoader lines={2} animated />
    </View>
  ), []);

  const renderMessage = useCallback((message: Message) => {
    const isStreaming = streamingMessageId === message.id;
    
    return (
      <MessageBubble
        message={message}
        isStreaming={isStreaming}
        onRetry={onRetry}
        onCopy={onCopy}
      />
    );
  }, [streamingMessageId, onRetry, onCopy]);

  const renderItem: ListRenderItem<MessageListItem> = useCallback(({ item }) => {
    switch (item.type) {
      case 'date_separator':
        return renderDateSeparator(item.date!);
      case 'loading':
        return renderLoadingIndicator();
      case 'message':
        return renderMessage(item.data!);
      default:
        return null;
    }
  }, [renderDateSeparator, renderLoadingIndicator, renderMessage]);

  const getItemLayout = useCallback((data: MessageListItem[] | null | undefined, index: number) => {
    const ESTIMATED_ITEM_HEIGHT = 80; // 估算的消息高度
    return {
      length: ESTIMATED_ITEM_HEIGHT,
      offset: ESTIMATED_ITEM_HEIGHT * index,
      index,
    };
  }, []);

  const keyExtractor = useCallback((item: MessageListItem) => item.id, []);

  if (isLoading && messages.length === 0) {
    return (
      <View style={styles.container}>
        <SkeletonLoader lines={5} animated />
      </View>
    );
  }

  if (messages.length === 0) {
    return (
      <EmptyState
        icon="chatbubbles-outline"
        title={t('chat.emptyHistory')}
        description={t('chat.emptyHistorySubtext')}
      />
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={optimizedMessages}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={21}
      legacyImplementation={false}
      showsVerticalScrollIndicator={false}
      inverted={true} // 消息从底部开始显示
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 100,
      }}
    />
  );
};

interface ConversationListProps {
  conversations: any[];
  isLoading?: boolean;
  onSelectConversation?: (id: string) => void;
  onDeleteConversation?: (id: string, title: string) => void;
}

export const VirtualizedConversationList: React.FC<ConversationListProps> = ({
  conversations,
  isLoading = false,
  onSelectConversation,
  onDeleteConversation,
}) => {
  const { t } = useTranslation();

  const renderConversation = useCallback(({ item }: { item: any }) => (
    <ConversationItem
      conversation={item}
      onSelect={onSelectConversation}
      onDelete={onDeleteConversation}
    />
  ), [onSelectConversation, onDeleteConversation]);

  const keyExtractor = useCallback((item: any) => item.id, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SkeletonLoader lines={8} animated />
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon="chatbubbles-outline"
        title={t('drawer.noConversations')}
        description={t('drawer.startNewConversation')}
      />
    );
  }

  return (
    <FlatList
      data={conversations}
      renderItem={renderConversation}
      keyExtractor={keyExtractor}
      removeClippedSubviews={true}
      maxToRenderPerBatch={15}
      updateCellsBatchingPeriod={50}
      initialNumToRender={15}
      windowSize={21}
      showsVerticalScrollIndicator={false}
      getItemLayout={(data, index) => ({
        length: 80,
        offset: 80 * index,
        index,
      })}
    />
  );
};

// ConversationItem组件的简化实现
const ConversationItem: React.FC<{
  conversation: any;
  onSelect?: (id: string) => void;
  onDelete?: (id: string, title: string) => void;
}> = ({ conversation, onSelect, onDelete }) => {
  const { t } = useTranslation();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 3600 * 24));

    if (days === 0) {
      return t('drawer.today');
    } else if (days === 1) {
      return t('drawer.yesterday');
    } else if (days < 7) {
      return t('drawer.daysAgo', { count: days });
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <View style={styles.conversationItem}>
      <Text style={styles.conversationTitle}>
        {conversation.title || t('chat.conversationTitle')}
      </Text>
      <Text style={styles.conversationDate}>
        {formatDate(conversation.lastMessageAt)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  dateSeparatorText: {
    fontSize: 12,
    color: '#8E8E93',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    padding: 16,
  },
  conversationItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  conversationDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
});