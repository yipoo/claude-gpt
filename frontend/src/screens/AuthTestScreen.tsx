/**
 * 认证功能测试界面 - 用于测试前端认证集成
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../store/authStore';

export default function AuthTestScreen() {
  const [email, setEmail] = useState('t1@test.com');
  const [password, setPassword] = useState('Test123456');
  const [fullName, setFullName] = useState('Test User 1');
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshUser,
    initializeAuth,
    clearError,
  } = useAuthStore();

  useEffect(() => {
    // 初始化认证状态
    initializeAuth();
  }, [initializeAuth]);

  const handleLogin = async () => {
    try {
      clearError();
      await login(email, password);
      Alert.alert('成功', '登录成功！');
    } catch (error) {
      Alert.alert('登录失败', error.message || '未知错误');
    }
  };

  const handleRegister = async () => {
    try {
      clearError();
      await register(email, password, fullName);
      Alert.alert('成功', '注册成功！');
    } catch (error) {
      Alert.alert('注册失败', error.message || '未知错误');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      Alert.alert('成功', '退出登录成功！');
    } catch (error) {
      Alert.alert('退出失败', error.message || '未知错误');
    }
  };

  const handleRefreshUser = async () => {
    try {
      await refreshUser();
      Alert.alert('成功', '刷新用户信息成功！');
    } catch (error) {
      Alert.alert('刷新失败', error.message || '未知错误');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>认证功能测试</Text>
      
      {/* 认证状态显示 */}
      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>认证状态</Text>
        <Text style={styles.statusText}>
          状态: {isAuthenticated ? '已认证' : '未认证'}
        </Text>
        <Text style={styles.statusText}>
          加载中: {isLoading ? '是' : '否'}
        </Text>
        {error && (
          <Text style={[styles.statusText, styles.errorText]}>
            错误: {error}
          </Text>
        )}
        {user && (
          <View style={styles.userInfo}>
            <Text style={styles.userInfoText}>用户ID: {user.id}</Text>
            <Text style={styles.userInfoText}>邮箱: {user.email}</Text>
            <Text style={styles.userInfoText}>姓名: {user.fullName}</Text>
            <Text style={styles.userInfoText}>订阅等级: {user.subscriptionTier}</Text>
            <Text style={styles.userInfoText}>订阅状态: {user.subscriptionStatus}</Text>
            <Text style={styles.userInfoText}>
              月消息数: {user.monthlyMessageCount}
            </Text>
          </View>
        )}
      </View>

      {/* 模式选择 */}
      <View style={styles.modeSection}>
        <Text style={styles.sectionTitle}>操作模式</Text>
        <View style={styles.modeButtons}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === 'login' && styles.modeButtonActive,
            ]}
            onPress={() => setMode('login')}
          >
            <Text
              style={[
                styles.modeButtonText,
                mode === 'login' && styles.modeButtonTextActive,
              ]}
            >
              登录
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === 'register' && styles.modeButtonActive,
            ]}
            onPress={() => setMode('register')}
          >
            <Text
              style={[
                styles.modeButtonText,
                mode === 'register' && styles.modeButtonTextActive,
              ]}
            >
              注册
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 表单输入 */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>
          {mode === 'login' ? '登录' : '注册'}表单
        </Text>
        
        <TextInput
          style={styles.input}
          placeholder="邮箱"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="密码"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        {mode === 'register' && (
          <TextInput
            style={styles.input}
            placeholder="姓名"
            value={fullName}
            onChangeText={setFullName}
          />
        )}
        
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={mode === 'login' ? handleLogin : handleRegister}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {mode === 'login' ? '登录' : '注册'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 操作按钮 */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>操作</Text>
        
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleRefreshUser}
          disabled={!isAuthenticated || isLoading}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            刷新用户信息
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={handleLogout}
          disabled={!isAuthenticated || isLoading}
        >
          <Text style={styles.buttonText}>退出登录</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={clearError}
          disabled={!error}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            清除错误
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  statusSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  statusText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
  errorText: {
    color: '#f44336',
  },
  userInfo: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  userInfoText: {
    fontSize: 12,
    marginBottom: 2,
    color: '#333',
  },
  modeSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#2196f3',
    borderColor: '#2196f3',
  },
  modeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2196f3',
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
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
  },
  dangerButton: {
    backgroundColor: '#f44336',
  },
  actionsSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
});