import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeIcon } from './SafeIcon';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useSubscriptionStore } from '../store/subscriptionStore';

interface DrawerContentProps {
  navigation: any;
}


export const DrawerContent: React.FC<DrawerContentProps> = ({ navigation }) => {
  const { user, logout } = useAuthStore();
  const { conversations, loadConversations, deleteConversation } = useChatStore();
  const { subscription, usage, loadSubscriptionStatus, getRemainingMessages, isUsageLimitReached } = useSubscriptionStore();

  React.useEffect(() => {
    loadConversations();
    loadSubscriptionStatus();
  }, []);

  const handleNewChat = () => {
    navigation.navigate('Chat', { conversationId: undefined });
    navigation.closeDrawer();
  };

  const handleSelectConversation = (conversationId: string) => {
    navigation.navigate('Chat', { conversationId });
    navigation.closeDrawer();
  };

  const handleDeleteConversation = (conversationId: string, title: string) => {
    Alert.alert(
      '删除对话',
      `确定要删除"${title}"吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => deleteConversation(conversationId),
        },
      ]
    );
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
    navigation.closeDrawer();
  };

  const handleSubscription = () => {
    navigation.navigate('Subscription');
    navigation.closeDrawer();
  };

  const handleProfile = () => {
    navigation.navigate('Profile');
    navigation.closeDrawer();
  };

  const handleLogout = () => {
    Alert.alert(
      '退出登录',
      '确定要退出当前账户吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '退出',
          style: 'destructive',
          onPress: () => {
            logout();
            navigation.closeDrawer();
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 3600 * 24));

    if (days === 0) {
      return '今天';
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
    }
  };

  const getTierDisplayName = (tier: string) => {
    switch (tier) {
      case 'FREE': return '免费版';
      case 'BASE': return '基础版';
      case 'PRO': return '专业版';
      default: return '免费版';
    }
  };

  const getUsageDisplay = () => {
    if (!usage) return '';
    const remaining = getRemainingMessages();
    const limitReached = isUsageLimitReached();
    
    if (subscription?.tier === 'PRO') {
      return '无限制';
    }
    
    if (limitReached) {
      return '已用完';
    }
    
    return `剩余 ${remaining} 条`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
          <SafeIcon name="add" size={20} color="#007AFF" />
          <Text style={styles.newChatText}>新建对话</Text>
        </TouchableOpacity>
      </View>

      {/* 历史对话列表 */}
      <ScrollView style={styles.conversationsList} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>历史对话</Text>
        {conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <SafeIcon name="chatbubbles-outline" size={48} color="#C7C7CC" />
            <Text style={styles.emptyText}>暂无对话记录</Text>
            <Text style={styles.emptySubtext}>开始一个新对话吧</Text>
          </View>
        ) : (
          conversations.map((conversation) => (
            <TouchableOpacity
              key={conversation.id}
              style={styles.conversationItem}
              onPress={() => handleSelectConversation(conversation.id)}
            >
              <View style={styles.conversationContent}>
                <Text style={styles.conversationTitle} numberOfLines={1}>
                  {conversation.title || '新对话'}
                </Text>
                <Text style={styles.conversationDate}>
                  {formatDate(conversation.lastMessageAt)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteConversation(conversation.id, conversation.title || '新对话')}
              >
                <SafeIcon name="trash-outline" size={16} color="#FF3B30" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* 订阅状态 */}
      {subscription && (
        <View style={styles.subscriptionStatus}>
          <TouchableOpacity style={styles.subscriptionCard} onPress={handleSubscription}>
            <View style={styles.subscriptionHeader}>
              <Text style={styles.subscriptionTier}>{getTierDisplayName(subscription.tier)}</Text>
              {isUsageLimitReached() && (
                <View style={styles.limitBadge}>
                  <Text style={styles.limitBadgeText}>已用完</Text>
                </View>
              )}
            </View>
            <Text style={styles.subscriptionUsage}>{getUsageDisplay()}</Text>
            {subscription.tier === 'FREE' && (
              <Text style={styles.upgradeHint}>点击升级订阅</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* 底部菜单 */}
      <View style={styles.bottomMenu}>
        <TouchableOpacity style={styles.menuItem} onPress={handleSubscription}>
          <SafeIcon name="card-outline" size={24} color="#8E8E93" />
          <Text style={styles.menuText}>订阅</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleSettings}>
          <SafeIcon name="settings-outline" size={24} color="#8E8E93" />
          <Text style={styles.menuText}>设置</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleProfile}>
          <SafeIcon name="person-outline" size={24} color="#8E8E93" />
          <Text style={styles.menuText}>个人资料</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <SafeIcon name="log-out-outline" size={24} color="#8E8E93" />
          <Text style={styles.menuText}>退出</Text>
        </TouchableOpacity>
      </View>

      {/* 用户信息 */}
      <View style={styles.userInfo}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userEmail} numberOfLines={1}>
            {user?.email || '未登录'}
          </Text>
          <Text style={styles.userTier}>
            {getTierDisplayName(subscription?.tier || 'FREE')}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  newChatText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  conversationsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    marginTop: 4,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  conversationContent: {
    flex: 1,
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
  deleteButton: {
    padding: 8,
    marginLeft: 12,
  },
  bottomMenu: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#fff',
  },
  menuItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  menuText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    fontWeight: '500',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  userTier: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  subscriptionStatus: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  subscriptionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subscriptionTier: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  limitBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  limitBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  subscriptionUsage: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  upgradeHint: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
});