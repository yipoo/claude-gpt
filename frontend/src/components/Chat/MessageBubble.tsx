import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Message } from '../../api/client';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  onRegenerate?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isStreaming = false,
  onRegenerate,
}) => {
  const [isReasoningExpanded, setIsReasoningExpanded] = useState(false);
  
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isGenerating = message.status === 'generating' || isStreaming;
  const isFailed = message.status === 'failed';
  
  // 解析 DeepSeek 消息内容
  const parseDeepSeekContent = () => {
    if (!message.content) return { content: '', reasoning: message.reasoning || '' };
    
    try {
      // 尝试解析 JSON 格式的内容（数据库存储格式）
      const parsed = JSON.parse(message.content);
      if (parsed.reasoning && parsed.content) {
        return {
          content: parsed.content,
          reasoning: parsed.reasoning
        };
      }
    } catch {
      // 不是 JSON 格式，使用原始内容
    }
    
    return {
      content: message.content,
      reasoning: message.reasoning || ''
    };
  };
  
  const { content, reasoning } = parseDeepSeekContent();
  const hasReasoning = reasoning && reasoning.trim().length > 0;

  const handleCopyMessage = async () => {
    const textToCopy = content || message.content;
    if (textToCopy) {
      await Clipboard.setStringAsync(textToCopy);
      Alert.alert('已复制', '消息内容已复制到剪贴板');
    }
  };
  
  const handleCopyReasoning = async () => {
    if (reasoning) {
      await Clipboard.setStringAsync(reasoning);
      Alert.alert('已复制', '思考过程已复制到剪贴板');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {/* 角色指示器 */}
        {!isUser && (
          <View style={styles.roleIndicator}>
            <Text style={styles.roleText}>AI</Text>
          </View>
        )}

        {/* DeepSeek 思考内容 */}
        {hasReasoning && isAssistant && (
          <View style={styles.reasoningContainer}>
            <TouchableOpacity 
              style={styles.reasoningHeader}
              onPress={() => setIsReasoningExpanded(!isReasoningExpanded)}
            >
              <Text style={styles.reasoningTitle}>💭 思考过程</Text>
              <Text style={styles.reasoningToggle}>
                {isReasoningExpanded ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>
            {isReasoningExpanded && (
              <View style={styles.reasoningContent}>
                <Text style={styles.reasoningText}>{reasoning}</Text>
              </View>
            )}
          </View>
        )}

        {/* 消息内容 */}
        <View style={styles.contentContainer}>
          {content ? (
            <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
              {content}
            </Text>
          ) : isGenerating ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={isUser ? '#fff' : '#007AFF'} />
              <Text style={[styles.loadingText, isUser ? styles.userText : styles.assistantText]}>
                {reasoning ? 'AI 正在思考...' : 'AI 正在回答...'}
              </Text>
            </View>
          ) : null}

          {/* 错误状态 */}
          {isFailed && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>消息发送失败</Text>
              {isAssistant && onRegenerate && (
                <TouchableOpacity style={styles.retryButton} onPress={onRegenerate}>
                  <Text style={styles.retryText}>重新生成</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* 消息操作 */}
        {(content || message.content) && !isGenerating && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCopyMessage}>
              <Text style={styles.actionText}>复制回答</Text>
            </TouchableOpacity>
            {hasReasoning && (
              <TouchableOpacity style={styles.actionButton} onPress={handleCopyReasoning}>
                <Text style={styles.actionText}>复制思考</Text>
              </TouchableOpacity>
            )}
            {isAssistant && onRegenerate && (
              <TouchableOpacity style={styles.actionButton} onPress={onRegenerate}>
                <Text style={styles.actionText}>重新生成</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 时间戳 */}
        <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.assistantTimestamp]}>
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
    position: 'relative',
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#F2F2F7',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  roleIndicator: {
    position: 'absolute',
    top: -8,
    left: 12,
    backgroundColor: '#34C759',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  contentContainer: {
    marginTop: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  assistantText: {
    color: '#000',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  errorContainer: {
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    fontStyle: 'italic',
  },
  retryButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  actionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.7,
  },
  userTimestamp: {
    color: '#fff',
    textAlign: 'right',
  },
  assistantTimestamp: {
    color: '#666',
    textAlign: 'left',
  },
  reasoningContainer: {
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    overflow: 'hidden',
  },
  reasoningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#E8F4FD',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  reasoningTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1DA1F2',
  },
  reasoningToggle: {
    fontSize: 10,
    color: '#657786',
  },
  reasoningContent: {
    padding: 8,
  },
  reasoningText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#536471',
    fontFamily: 'monospace',
  },
});