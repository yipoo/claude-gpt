/**
 * 订阅计划组件 - 显示可用的订阅计划和价格
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSubscriptionStore } from '../../store/subscriptionStore';

interface PlanFeature {
  name: string;
  included: boolean;
}

interface Plan {
  id: 'FREE' | 'BASE' | 'PRO';
  name: string;
  price: string;
  period: string;
  description: string;
  features: PlanFeature[];
  highlighted?: boolean;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'FREE',
    name: '免费版',
    price: '¥0',
    period: '永久',
    description: '适合轻度使用者',
    features: [
      { name: '每月10条消息', included: true },
      { name: 'DeepSeek模型', included: true },
      { name: '基础客服支持', included: true },
      { name: '无限对话历史', included: false },
      { name: '优先处理', included: false },
      { name: 'API访问', included: false },
    ],
  },
  {
    id: 'BASE',
    name: '基础版',
    price: '¥29',
    period: '月',
    description: '适合个人用户',
    features: [
      { name: '每月100条消息', included: true },
      { name: 'DeepSeek模型', included: true },
      { name: '邮件客服支持', included: true },
      { name: '无限对话历史', included: true },
      { name: '优先处理', included: false },
      { name: 'API访问', included: false },
    ],
    highlighted: true,
  },
  {
    id: 'PRO',
    name: '专业版',
    price: '¥99',
    period: '月',
    description: '适合专业用户和团队',
    features: [
      { name: '无限条消息', included: true },
      { name: 'DeepSeek模型', included: true },
      { name: '优先客服支持', included: true },
      { name: '无限对话历史', included: true },
      { name: '优先处理', included: true },
      { name: 'API访问', included: true },
    ],
    popular: true,
  },
];

interface SubscriptionPlansProps {
  onSelectPlan?: (planId: 'BASE' | 'PRO') => void;
}

export default function SubscriptionPlans({ onSelectPlan }: SubscriptionPlansProps) {
  const { subscription, isLoading } = useSubscriptionStore();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSelectPlan = (plan: Plan) => {
    if (plan.id === 'FREE') {
      Alert.alert('提示', '您已在使用免费版');
      return;
    }

    if (subscription?.tier === plan.id) {
      Alert.alert('提示', `您已订阅${plan.name}`);
      return;
    }

    setSelectedPlan(plan.id);
    onSelectPlan?.(plan.id as 'BASE' | 'PRO');
  };

  const getCurrentPlanId = () => {
    return subscription?.tier || 'FREE';
  };

  const isPlanCurrent = (planId: string) => {
    return getCurrentPlanId() === planId;
  };

  const canSelectPlan = (planId: string) => {
    if (planId === 'FREE') return false;
    return !isPlanCurrent(planId);
  };

  const getButtonText = (plan: Plan) => {
    if (isPlanCurrent(plan.id)) {
      return '当前计划';
    }
    if (plan.id === 'FREE') {
      return '免费使用';
    }
    return '选择此计划';
  };

  const getButtonStyle = (plan: Plan) => {
    if (isPlanCurrent(plan.id)) {
      return [styles.selectButton, styles.currentButton];
    }
    if (!canSelectPlan(plan.id)) {
      return [styles.selectButton, styles.disabledButton];
    }
    if (plan.highlighted || plan.popular) {
      return [styles.selectButton, styles.highlightedButton];
    }
    return [styles.selectButton, styles.defaultButton];
  };

  const getButtonTextStyle = (plan: Plan) => {
    if (isPlanCurrent(plan.id)) {
      return [styles.selectButtonText, styles.currentButtonText];
    }
    if (!canSelectPlan(plan.id)) {
      return [styles.selectButtonText, styles.disabledButtonText];
    }
    if (plan.highlighted || plan.popular) {
      return [styles.selectButtonText, styles.highlightedButtonText];
    }
    return [styles.selectButtonText, styles.defaultButtonText];
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>选择订阅计划</Text>
        <Text style={styles.subtitle}>升级您的AI助手体验</Text>
      </View>

      <View style={styles.plansContainer}>
        {plans.map((plan) => (
          <View 
            key={plan.id} 
            style={[
              styles.planCard,
              plan.highlighted && styles.highlightedCard,
              isPlanCurrent(plan.id) && styles.currentCard
            ]}
          >
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>推荐</Text>
              </View>
            )}

            <View style={styles.planHeader}>
              <Text style={styles.planName}>{plan.name}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>{plan.price}</Text>
                {plan.period && (
                  <Text style={styles.period}>/{plan.period}</Text>
                )}
              </View>
              <Text style={styles.description}>{plan.description}</Text>
            </View>

            <View style={styles.featuresContainer}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={[
                    styles.featureIcon,
                    feature.included ? styles.includedIcon : styles.excludedIcon
                  ]}>
                    <Text style={[
                      styles.featureIconText,
                      feature.included ? styles.includedIconText : styles.excludedIconText
                    ]}>
                      {feature.included ? '✓' : '✗'}
                    </Text>
                  </View>
                  <Text style={[
                    styles.featureName,
                    !feature.included && styles.excludedFeature
                  ]}>
                    {feature.name}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={getButtonStyle(plan)}
              onPress={() => handleSelectPlan(plan)}
              disabled={!canSelectPlan(plan.id) || isLoading}
            >
              {isLoading && selectedPlan === plan.id ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={getButtonTextStyle(plan)}>
                  {getButtonText(plan)}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          • 可随时升级或取消订阅{'\n'}
          • 支持支付宝、微信支付{'\n'}
          • 安全可靠的支付保护
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  plansContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  highlightedCard: {
    borderColor: '#2196f3',
    shadowColor: '#2196f3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  currentCard: {
    borderColor: '#4caf50',
    backgroundColor: '#f8fff8',
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    right: 20,
    backgroundColor: '#ff9800',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    transform: [{ translateY: -8 }],
  },
  popularText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    marginBottom: 20,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196f3',
  },
  period: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  includedIcon: {
    backgroundColor: '#e8f5e8',
  },
  excludedIcon: {
    backgroundColor: '#ffebee',
  },
  featureIconText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  includedIconText: {
    color: '#4caf50',
  },
  excludedIconText: {
    color: '#f44336',
  },
  featureName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  excludedFeature: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  selectButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  defaultButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  highlightedButton: {
    backgroundColor: '#2196f3',
  },
  currentButton: {
    backgroundColor: '#4caf50',
  },
  disabledButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  defaultButtonText: {
    color: '#333',
  },
  highlightedButtonText: {
    color: '#fff',
  },
  currentButtonText: {
    color: '#fff',
  },
  disabledButtonText: {
    color: '#999',
  },
  footer: {
    padding: 20,
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});