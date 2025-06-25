import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button } from 'react-native-paper';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { Conversation } from '../api/client';

interface ConversationsScreenProps {
  onNavigateToChat: (conversationId?: string) => void;
}

const ConversationsScreen: React.FC<ConversationsScreenProps> = ({
  onNavigateToChat,
}) => {
  const { logout, user } = useAuthStore();
  const {
    conversations,
    isLoading,
    error,
    loadConversations,
    deleteConversation,
    updateConversationTitle,
    clearError,
  } = useChatStore();

  const [editingConversation, setEditingConversation] = useState<Conversation | null>(null);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('错误', error, [
        { text: '确定', onPress: clearError },
      ]);
    }
  }, [error]);

  const handleDeleteConversation = (conversation: Conversation) => {
    Alert.alert(
      '删除对话',
      `确定要删除对话"${conversation.title}"吗？此操作无法撤销。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => deleteConversation(conversation.id),
        },
      ]
    );
  };

  const handleEditTitle = (conversation: Conversation) => {
    setEditingConversation(conversation);
    setNewTitle(conversation.title);
  };

  const handleSaveTitle = async () => {
    if (!editingConversation || !newTitle.trim()) return;

    try {
      await updateConversationTitle(editingConversation.id, newTitle.trim());
      setEditingConversation(null);
      setNewTitle('');
    } catch (error) {
      console.error('Failed to update title:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => onNavigateToChat(item.id)}
      onLongPress={() => handleEditTitle(item)}
    >
      <View style={styles.conversationContent}>
        <Text style={styles.conversationTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.conversationMeta} numberOfLines={1}>
          {item.messageCount} 条消息 • {formatDate(item.lastMessageAt)}
        </Text>
        {item.modelUsed && (
          <Text style={styles.conversationModel}>
            {item.modelUsed}
          </Text>
        )}
      </View>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteConversation(item)}
      >
        <Text style={styles.deleteButtonText}>删除</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>还没有对话</Text>
      <Text style={styles.emptySubtitle}>
        开始您的第一次 AI 对话吧
      </Text>
      <Button
        mode="contained"
        onPress={() => onNavigateToChat()}
        style={styles.emptyButton}
      >
        开始新对话
      </Button>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>对话列表</Text>
        <Button
          mode="contained"
          onPress={() => onNavigateToChat()}
          style={styles.newChatButton}
          compact
        >
          新对话
        </Button>
      </View>
      
      <View style={styles.userInfo}>
        <Text style={styles.welcomeText}>
          欢迎, {user?.fullName}
        </Text>
        <Text style={styles.subscriptionText}>
          {user?.subscriptionTier} • 本月已使用 {user?.monthlyMessageCount} 条消息
        </Text>
      </View>
    </View>
  );

  const renderEditModal = () => (
    <Modal
      visible={!!editingConversation}
      transparent
      animationType="fade"
      onRequestClose={() => setEditingConversation(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>编辑对话标题</Text>
          
          <TextInput
            style={styles.titleInput}
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder="输入新标题"
            maxLength={100}
            autoFocus
          />
          
          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setEditingConversation(null)}
              style={styles.modalButton}
            >
              取消
            </Button>
            <Button
              mode="contained"
              onPress={handleSaveTitle}
              style={styles.modalButton}
              disabled={!newTitle.trim()}
            >
              保存
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {renderHeader()}
      
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversationItem}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadConversations}
            tintColor="#007AFF"
          />
        }
        contentContainerStyle={[
          styles.listContainer,
          conversations.length === 0 && !isLoading && styles.emptyListContainer,
        ]}
        showsVerticalScrollIndicator={false}
      />
      
      <View style={styles.footer}>
        <Button
          mode="outlined"
          onPress={logout}
          style={styles.logoutButton}
        >
          退出登录
        </Button>
      </View>

      {renderEditModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  newChatButton: {
    borderRadius: 8,
  },
  userInfo: {
    gap: 4,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  subscriptionText: {
    fontSize: 14,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  conversationContent: {
    flex: 1,
    gap: 4,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  conversationMeta: {
    fontSize: 14,
    color: '#666',
  },
  conversationModel: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#E8F4FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 8,
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  logoutButton: {
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
  },
});

export default ConversationsScreen;