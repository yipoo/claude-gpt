/**
 * 订阅成功界面 - 显示订阅成功信息
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSubscriptionStore } from '../store/subscriptionStore';

interface SubscriptionSuccessScreenProps {
  navigation?: any;
}

export default function SubscriptionSuccessScreen({ navigation }: SubscriptionSuccessScreenProps) {
  const { loadSubscriptionStatus } = useSubscriptionStore();

  useEffect(() => {
    // 刷新订阅状态
    loadSubscriptionStatus().catch(() => {
      Alert.alert('提示', '获取最新订阅状态失败，请稍后重试');
    });
  }, [loadSubscriptionStatus]);

  const handleContinue = () => {
    if (navigation) {
      navigation.navigate('Main');
    }
  };

  const handleViewDetails = () => {
    if (navigation) {
      navigation.navigate('Subscription');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.successIcon}>✓</Text>
        </View>

        <Text style={styles.title}>订阅成功！</Text>
        <Text style={styles.subtitle}>
          感谢您的订阅，现在您可以享受更多功能了
        </Text>

        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>您现在可以享受：</Text>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🚀</Text>
            <Text style={styles.benefitText}>更多消息额度</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>⭐</Text>
            <Text style={styles.benefitText}>优先处理</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>💬</Text>
            <Text style={styles.benefitText}>无限对话历史</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🛠️</Text>
            <Text style={styles.benefitText}>更多高级功能</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]}
            onPress={handleContinue}
          >
            <Text style={styles.primaryButtonText}>开始使用</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]}
            onPress={handleViewDetails}
          >
            <Text style={styles.secondaryButtonText}>查看订阅详情</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            您的订阅将自动续费，可随时在设置中管理
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8f5e8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successIcon: {
    fontSize: 40,
    color: '#4caf50',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 32,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  benefitIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  benefitText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#2196f3',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  secondaryButtonText: {
    color: '#2196f3',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});