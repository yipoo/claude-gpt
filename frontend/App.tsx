import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { View, Text, StyleSheet } from 'react-native';
import 'react-native-gesture-handler';

import { useAuthStore } from './src/store/authStore';
import { initializeStorage } from './src/utils/syncStorage';
import { initializeLanguage } from './src/locales/i18n';
import LoginScreen from './src/screens/LoginScreen';
import LoadingScreen from './src/screens/LoadingScreen';
import { MainNavigator } from './src/navigation/MainNavigator';
import './src/locales/i18n'; // 导入i18n配置

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: 1000,
    },
  },
});

// Error Fallback Component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>应用遇到了错误</Text>
      <Text style={styles.errorMessage}>{error.message}</Text>
      <Text style={styles.retryText} onPress={resetErrorBoundary}>
        点击重试
      </Text>
    </View>
  );
}

export default function App() {
  const { isAuthenticated, isLoading, refreshUser } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 添加延迟确保所有原生模块都已加载
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await initializeStorage();
        await initializeLanguage();
        await refreshUser();
        
        setIsInitialized(true);
      } catch (error) {
        console.error('App initialization error:', error);
        // 即使初始化失败也设置为已初始化，让应用继续运行
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, [refreshUser]);

  if (!isInitialized || isLoading) {
    return <LoadingScreen />;
  }

  const renderAuthenticatedApp = () => {
    return <MainNavigator />;
  };

  const renderUnauthenticatedApp = () => {
    return <LoginScreen />;
  };

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('React Error Boundary caught an error:', error, errorInfo);
      }}
    >
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <PaperProvider>
            <StatusBar style="auto" />
            {isAuthenticated ? renderAuthenticatedApp() : renderUnauthenticatedApp()}
          </PaperProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#d32f2f',
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  retryText: {
    fontSize: 16,
    color: '#1976d2',
    textDecorationLine: 'underline',
  },
});