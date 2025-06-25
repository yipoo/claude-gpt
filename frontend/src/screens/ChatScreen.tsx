import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageList } from '../components/Chat/MessageList';
import { MessageInput } from '../components/Chat/MessageInput';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';

interface ChatScreenProps {
  conversationId?: string;
  onNavigateToConversations?: () => void;
}


export const ChatScreen: React.FC<ChatScreenProps> = ({
  conversationId,
  onNavigateToConversations,
}) => {
  
  const {
    messages,
    currentConversation,
    isLoading,
    isStreaming,
    error,
    streamingMessageId,
    loadConversation,
    sendMessage,
    clearError,
    createNewConversation,
  } = useChatStore();

  const { user } = useAuthStore();

  // 加载对话
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    } else {
      createNewConversation();
    }
  }, [conversationId]);

  // 错误处理
  useEffect(() => {
    if (error) {
      Alert.alert('错误', error, [
        { text: '确定', onPress: clearError },
      ]);
    }
  }, [error]);

  const handleSendMessage = async (message: string) => {
    try {
      await sendMessage(message);
    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  const handleRegenerate = (messageId: string) => {
    Alert.alert(
      '重新生成',
      '确定要重新生成这条消息吗？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '确定', 
          onPress: () => {
            // 找到要重新生成的消息
            const messageIndex = messages.findIndex(msg => msg.id === messageId);
            if (messageIndex > 0) {
              const previousMessage = messages[messageIndex - 1];
              if (previousMessage.role === 'user') {
                handleSendMessage(previousMessage.content);
              }
            }
          }
        },
      ]
    );
  };



  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F8F8" />
      
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >

        {/* 消息列表 */}
        <MessageList
          messages={messages}
          isLoading={isLoading}
          isStreaming={isStreaming}
          streamingMessageId={streamingMessageId}
          onRegenerate={handleRegenerate}
        />

        {/* 消息输入 */}
        <MessageInput
          onSendMessage={handleSendMessage}
          isStreaming={isStreaming}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardContainer: {
    flex: 1,
  },
});