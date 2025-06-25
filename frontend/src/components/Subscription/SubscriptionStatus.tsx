/**
 * 订阅状态组件 - 显示当前订阅信息和使用情况
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSubscriptionStore } from '../../store/subscriptionStore';

interface SubscriptionStatusProps {
  onUpgrade?: () => void;
  onManage?: () => void;
}

export default function SubscriptionStatus({ onUpgrade, onManage }: SubscriptionStatusProps) {
  const {
    subscription,
    usage,
    features,
    isLoading,
    error,
    loadSubscriptionStatus,
    isSubscribed,
    canUpgrade,
    getRemainingMessages,
    getUsagePercentage,
    isUsageLimitReached,
    clearError,
  } = useSubscriptionStore();

  useEffect(() => {
    loadSubscriptionStatus();
  }, [loadSubscriptionStatus]);

  const handleRetry = () => {
    clearError();
    loadSubscriptionStatus();
  };

  const getTierDisplayName = (tier: string) => {
    switch (tier) {
      case 'FREE': return '免费版';
      case 'BASE': return '基础版';
      case 'PRO': return '专业版';
      default: return tier;
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '有效';
      case 'CANCELED': return '已取消';
      case 'PAST_DUE': return '逾期';
      case 'TRIALING': return '试用中';
      case 'INACTIVE': return '未激活';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  if (isLoading && !subscription) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={styles.loadingText}>加载订阅信息...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>加载失败: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!subscription || !usage || !features) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>订阅信息不可用</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>重新加载</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const usagePercentage = getUsagePercentage();
  const remainingMessages = getRemainingMessages();
  const limitReached = isUsageLimitReached();

  return (
    <View style={styles.container}>
      {/* 订阅信息 */}
      <View style={styles.subscriptionSection}>
        <View style={styles.header}>
          <Text style={styles.title}>订阅状态</Text>
          {subscription.tier !== 'FREE' && (
            <View style={[
              styles.statusBadge,
              subscription.status === 'ACTIVE' ? styles.activeBadge : styles.inactiveBadge
            ]}>
              <Text style={[
                styles.statusText,
                subscription.status === 'ACTIVE' ? styles.activeText : styles.inactiveText
              ]}>
                {getStatusDisplayName(subscription.status)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.tierSection}>
          <Text style={styles.tierLabel}>当前计划</Text>
          <Text style={styles.tierName}>{getTierDisplayName(subscription.tier)}</Text>
        </View>

        {subscription.currentPeriodEnd && (
          <View style={styles.periodSection}>
            <Text style={styles.periodLabel}>
              {subscription.cancelAtPeriodEnd ? '到期日期' : '下次续费'}
            </Text>
            <Text style={styles.periodDate}>
              {formatDate(subscription.currentPeriodEnd)}
            </Text>
            {subscription.cancelAtPeriodEnd && (
              <Text style={styles.cancelNotice}>订阅将在此日期后取消</Text>
            )}
          </View>
        )}
      </View>

      {/* 使用情况 */}
      <View style={styles.usageSection}>
        <Text style={styles.sectionTitle}>使用情况</Text>
        
        <View style={styles.usageItem}>
          <View style={styles.usageHeader}>
            <Text style={styles.usageLabel}>本月消息数</Text>
            <Text style={[
              styles.usageValue,
              limitReached ? styles.limitReachedText : undefined
            ]}>
              {usage.monthlyMessageCount}
              {features.maxMessagesPerMonth !== -1 && ` / ${features.maxMessagesPerMonth}`}
            </Text>
          </View>
          
          {features.maxMessagesPerMonth !== -1 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(usagePercentage, 100)}%` },
                    limitReached ? styles.limitReachedProgress : undefined
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>{usagePercentage.toFixed(0)}%</Text>
            </View>
          )}
        </View>

        <View style={styles.usageItem}>
          <Text style={styles.usageLabel}>剩余消息数</Text>
          <Text style={[
            styles.usageValue,
            limitReached ? styles.limitReachedText : undefined
          ]}>
            {features.maxMessagesPerMonth === -1 ? '无限制' : remainingMessages}
          </Text>
        </View>

        <View style={styles.usageItem}>
          <Text style={styles.usageLabel}>月度重置日期</Text>
          <Text style={styles.usageValue}>
            {formatDate(usage.monthlyResetDate)}
          </Text>
        </View>

        {limitReached && (
          <View style={styles.limitWarning}>
            <Text style={styles.limitWarningText}>
              您已达到本月消息限制，请升级订阅以继续使用。
            </Text>
          </View>
        )}
      </View>

      {/* 操作按钮 */}
      <View style={styles.actionsSection}>
        {canUpgrade() && onUpgrade && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.upgradeButton]} 
            onPress={onUpgrade}
          >
            <Text style={styles.upgradeButtonText}>
              {subscription.tier === 'FREE' ? '升级订阅' : '升级到专业版'}
            </Text>
          </TouchableOpacity>
        )}

        {isSubscribed() && onManage && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.manageButton]} 
            onPress={onManage}
          >
            <Text style={styles.manageButtonText}>管理订阅</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
  },
  errorText: {
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  subscriptionSection: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#e8f5e8',
  },
  inactiveBadge: {
    backgroundColor: '#ffebee',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeText: {
    color: '#4caf50',
  },
  inactiveText: {
    color: '#f44336',
  },
  tierSection: {
    marginBottom: 12,
  },
  tierLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  tierName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  periodSection: {
    marginBottom: 12,
  },
  periodLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  periodDate: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  cancelNotice: {
    fontSize: 12,
    color: '#ff9800',
    marginTop: 4,
  },
  usageSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  usageItem: {
    marginBottom: 16,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  usageLabel: {
    fontSize: 14,
    color: '#666',
  },
  usageValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  limitReachedText: {
    color: '#f44336',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196f3',
    borderRadius: 3,
  },
  limitReachedProgress: {
    backgroundColor: '#f44336',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    minWidth: 32,
    textAlign: 'right',
  },
  limitWarning: {
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  limitWarningText: {
    color: '#e65100',
    fontSize: 14,
  },
  actionsSection: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  upgradeButton: {
    backgroundColor: '#2196f3',
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  manageButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  manageButtonText: {
    color: '#2196f3',
    fontSize: 16,
    fontWeight: '600',
  },
});