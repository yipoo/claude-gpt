import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card, 
  Snackbar 
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from 'react-i18next';

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation();
  const { register, isLoading, error, clearError } = useAuthStore();
  const { t } = useTranslation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !fullName.trim()) {
      Alert.alert(t('auth.error'), t('auth.errorMessage'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('auth.error'), t('auth.passwordNotSameToConfirmPassword'));
      return;
    }

    if (password.length < 8) {
      Alert.alert(t('auth.error'), t('auth.passwordTooShort'));
      return;
    }

    try {
      await register(email.trim(), password, fullName.trim());
    } catch (error) {
      // 错误已经在store中处理
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
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
              {t('auth.register')}
            </Text>
            
            <TextInput
              label={t('auth.fullName1')}
              value={fullName}
              onChangeText={setFullName}
              mode="outlined"
              autoComplete="name"
              style={styles.input}
            />
            
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
              autoComplete="password-new"
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              style={styles.input}
            />
            
            <TextInput
              label={t('auth.confirmPassword')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              autoComplete="password-new"
              style={styles.input}
            />
            
            <Button
              mode="contained"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
            >
              {t('auth.register')}
            </Button>
            
            <Button
              mode="text"
              onPress={navigateToLogin}
              disabled={isLoading}
              style={styles.linkButton}
            >
              {t('auth.hasAccount')}
            </Button>
          </Card.Content>
        </Card>
      </View>

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
  content: {
    flex: 1,
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
});

export default RegisterScreen;