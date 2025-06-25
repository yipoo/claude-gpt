import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  StatusBar,
  ScrollView 
} from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card, 
  Snackbar 
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from 'react-i18next';

const LoginScreen: React.FC = () => {
  const { login, register, isLoading, error, clearError } = useAuthStore();
  const { t } = useTranslation();
  
  const [email, setEmail] = useState('test@test.com');
  const [password, setPassword] = useState('A888888a');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('login.error'), t('login.errorMessage'));
      return;
    }

    try {
      await login(email.trim(), password);
    } catch (error) {
      // 错误已经在store中处理
    }
  };

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !fullName.trim()) {
      Alert.alert(t('login.error'), t('login.errorMessage'));
      return;
    }

    if (password.length < 8) {
      Alert.alert(t('login.error'), t('login.errorMessage'));
      return;
    }

    try {
      await register(email.trim(), password, fullName.trim());
    } catch (error) {
      // 错误已经在store中处理
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    clearError();
    setEmail('');
    setPassword('');
    setFullName('');
    setShowPassword(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.header}>
          <Text variant="headlineLarge" style={styles.title}>
            {t('common.appName')}
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            {t('common.appDescription')}
          </Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.cardTitle}>
              {isRegisterMode ? t('auth.register') : t('auth.login')}
            </Text>
            
            {isRegisterMode && (
              <TextInput
                label={t('auth.fullName')}
                value={fullName}
                onChangeText={setFullName}
                mode="outlined"
                autoCapitalize="words"
                autoComplete="name"
                style={styles.input}
              />
            )}
            
            <TextInput
              label={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.input}
            />
            
            <TextInput
              label={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              autoComplete={isRegisterMode ? 'new-password' : 'password'}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              style={styles.input}
            />
            
            {isRegisterMode && (
              <Text variant="bodySmall" style={styles.passwordHint}>
                {t('auth.passwordHint')}
              </Text>
            )}
            
            <Button
              mode="contained"
              onPress={isRegisterMode ? handleRegister : handleLogin}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
            >
              {isRegisterMode ? t('auth.register') : t('auth.login')}
            </Button>
            
            <Button
              mode="text"
              onPress={toggleMode}
              disabled={isLoading}
              style={styles.linkButton}
            >
              {isRegisterMode ? t('auth.hasAccount') : t('auth.noAccount')}
            </Button>
          </Card.Content>
        </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={!!error}
        onDismiss={clearError}
        duration={4000}
      >
        {error}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.7,
  },
  card: {
    elevation: 4,
  },
  cardTitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
  },
  linkButton: {
    marginTop: 8,
  },
  passwordHint: {
    marginBottom: 16,
    marginTop: -8,
    color: '#666',
    textAlign: 'center',
  },
});

export default LoginScreen;