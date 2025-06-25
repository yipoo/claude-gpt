/**
 * 订阅管理界面 - 包含订阅状态和计划选择
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SubscriptionStatus, SubscriptionPlans } from '../components/Subscription';
import { useSubscriptionStore } from '../store/subscriptionStore';

interface SubscriptionScreenProps {
  navigation?: any;
}

export default function SubscriptionScreen({ navigation }: SubscriptionScreenProps) {
  const [showPlans, setShowPlans] = useState(false);
  const { subscription, createCheckoutSession, createPortalSession } = useSubscriptionStore();

  const handleUpgrade = () => {
    setShowPlans(true);
  };

  const handleManage = async () => {
    try {
      const result = await createPortalSession('myapp://subscription');
      
      // 测试模式：显示客户门户URL
      Alert.alert(
        '🧪 测试模式 - 客户门户',
        `Stripe客户门户会话创建成功！\n\n在生产环境中，用户将被重定向到Stripe客户门户来管理订阅、查看发票和更新付款方式。`,
        [
          { text: '取消', style: 'cancel' },
          { 
            text: '打开客户门户', 
            onPress: () => {
              console.log('✅ Stripe Portal URL:', result.url);
              Linking.openURL(result.url).catch(() => {
                Alert.alert('提示', '无法打开客户门户，请检查网络连接');
              });
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('错误', '无法打开客户门户，请稍后重试');
    }
  };

  const handleSelectPlan = async (tier: 'BASE' | 'PRO') => {
    try {
      const result = await createCheckoutSession(
        tier,
        'myapp://subscription/success',
        'myapp://subscription/cancel'
      );
      
      // 测试模式：模拟订阅流程
      Alert.alert(
        '🧪 测试模式 - 订阅演示',
        `Stripe结账会话创建成功！\n\n计划：${tier === 'BASE' ? '基础版 (¥29/月)' : '专业版 (¥99/月)'}\n\n在生产环境中，用户将被重定向到Stripe支付页面完成订阅。`,
        [
          { text: '取消', style: 'cancel' },
          { 
            text: '模拟支付成功', 
            onPress: () => {
              // 在测试模式下，模拟支付成功并跳转到成功页面
              console.log('✅ Stripe Checkout URL:', result.url);
              if (navigation) {
                navigation.navigate('SubscriptionSuccess');
              }
            }
          },
          {
            text: '打开Stripe页面',
            onPress: () => {
              Linking.openURL(result.url).catch(() => {
                Alert.alert('提示', '无法打开支付页面，请检查网络连接');
              });
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('错误', '无法创建支付会话，请稍后重试');
    }
  };

  const handleBack = () => {
    if (showPlans) {
      setShowPlans(false);
    } else if (navigation) {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {showPlans && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>← 返回</Text>
          </TouchableOpacity>
        )}
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {showPlans ? '选择订阅计划' : '订阅管理'}
          </Text>
          <View style={styles.testModeIndicator}>
            <Text style={styles.testModeText}>🧪 测试模式</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {showPlans ? (
          <SubscriptionPlans onSelectPlan={handleSelectPlan} />
        ) : (
          <>
            <SubscriptionStatus 
              onUpgrade={handleUpgrade}
              onManage={handleManage}
            />
            
            {/* 订阅说明 */}
            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>订阅说明</Text>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>• 计费周期：</Text>
                <Text style={styles.infoText}>按月计费，自动续订</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>• 取消政策：</Text>
                <Text style={styles.infoText}>可随时取消，取消后在当前计费周期结束前仍可正常使用</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>• 退款政策：</Text>
                <Text style={styles.infoText}>根据使用情况和相关条款，可能提供部分退款</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>• 升级生效：</Text>
                <Text style={styles.infoText}>升级后立即生效，按比例计费</Text>
              </View>
            </View>

            {/* 常见问题 */}
            <View style={styles.faqSection}>
              <Text style={styles.faqTitle}>常见问题</Text>
              
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>Q: 可以随时取消订阅吗？</Text>
                <Text style={styles.faqAnswer}>
                  A: 是的，您可以随时在客户门户中取消订阅。取消后您的订阅将在当前计费周期结束时停止。
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>Q: 升级订阅如何计费？</Text>
                <Text style={styles.faqAnswer}>
                  A: 升级会立即生效，我们会按比例计算剩余时间的费用差额。
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>Q: 消息使用量如何计算？</Text>
                <Text style={styles.faqAnswer}>
                  A: 每次您发送消息给AI助手都会计入使用量，AI的回复不计入。使用量每月1号重置。
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2196f3',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  infoSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoItem: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    lineHeight: 20,
  },
  faqSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  faqItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});