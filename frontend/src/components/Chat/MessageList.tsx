import React, { useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  ActivityIndicator,
} from 'react-native';
import { MessageBubble } from './MessageBubble';
import { Message } from '../../api/client';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  isStreaming?: boolean;
  streamingMessageId?: string | null;
  onRefresh?: () => void;
  onRegenerate?: (messageId: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading = false,
  isStreaming = false,
  streamingMessageId,
  onRefresh,
  onRegenerate,
}) => {
  const flatListRef = useRef<FlatList>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const renderMessage = ({ item: message, index }: { item: Message; index: number }) => {
    const isStreamingThisMessage = streamingMessageId === message.id;
    
    return (
      <MessageBubble
        message={message}
        isStreaming={isStreamingThisMessage}
        onRegenerate={() => onRegenerate?.(message.id)}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>开始新对话</Text>
      <Text style={styles.emptySubtitle}>
        发送消息开始与 AI 助手对话
      </Text>
    </View>
  );

  const renderHeader = () => {
    if (isLoading && messages.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      );
    }
    return null;
  };

  const keyExtractor = (item: Message) => item.id;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={keyExtractor}
        renderItem={renderMessage}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={[
          styles.contentContainer,
          messages.length === 0 && !isLoading && styles.emptyContentContainer,
        ]}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isLoading}
              onRefresh={onRefresh}
              tintColor="#007AFF"
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    paddingVertical: 16,
  },
  emptyContentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});