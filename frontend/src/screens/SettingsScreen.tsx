import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { SafeIcon } from '../components/SafeIcon';
import { useAuthStore } from '../store/authStore';
import { changeLanguage, getCurrentLanguage, getSupportedLanguages } from '../locales/i18n';

interface SettingsScreenProps {
  navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [colorScheme, setColorScheme] = useState('System');
  const currentLang = getCurrentLanguage();
  const supportedLanguages = getSupportedLanguages();
  const currentLanguageInfo = supportedLanguages.find(lang => lang.code === currentLang) || supportedLanguages[0];

  const handleClose = () => {
    navigation.goBack();
  };

  const handleLogout = () => {
    Alert.alert(
      t('settings.logout'),
      t('settings.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.logout'),
          style: 'destructive',
          onPress: () => {
            logout();
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleLanguageChange = async () => {
    const languageOptions = supportedLanguages.map(lang => ({
      text: lang.nativeName,
      onPress: () => changeLanguage(lang.code),
    }));

    Alert.alert(
      t('settings.languageDialog'),
      t('settings.selectLanguage'),
      [
        ...languageOptions,
        { text: t('common.cancel'), style: 'cancel' }
      ]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    value, 
    onPress, 
    showArrow = true,
    children 
  }: {
    icon: string;
    title: string;
    value?: string;
    onPress?: () => void;
    showArrow?: boolean;
    children?: React.ReactNode;
  }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingIcon}>
        <SafeIcon name={icon} size={20} color="#000" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {value && (
          <Text style={styles.settingValue}>{value}</Text>
        )}
      </View>
      {children}
      {showArrow && onPress && (
        <SafeIcon name="chevron-forward" size={16} color="#C7C7CC" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* 标题栏 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <SafeIcon name="close" size={24} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 账户部分 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
          
          <SettingItem
            icon="mail-outline"
            title={t('settings.email')}
            value={user?.email || 'rey@gmail.com'}
            showArrow={false}
          />
          
          <SettingItem
            icon="card-outline"
            title={t('settings.subscription')}
            value={user?.subscriptionTier === 'pro' ? t('subscription.proPlan') : t('subscription.freePlan')}
            onPress={() => navigation.navigate('Subscription')}
          />
          
          <SettingItem
            icon="document-text-outline"
            title={t('settings.customInstructions')}
            value="Off"
          />
        </View>

        {/* 应用设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.app')}</Text>
          
          <SettingItem
            icon="color-palette-outline"
            title={t('settings.colorScheme')}
            value={colorScheme}
            onPress={() => {
              Alert.alert(
                t('settings.colorSchemeDialog'),
                t('settings.selectTheme'),
                [
                  { text: t('settings.light'), onPress: () => setColorScheme('Light') },
                  { text: t('settings.dark'), onPress: () => setColorScheme('Dark') },
                  { text: t('settings.system'), onPress: () => setColorScheme('System') },
                  { text: t('common.cancel'), style: 'cancel' }
                ]
              );
            }}
          />
          
          <SettingItem
            icon="phone-portrait-outline"
            title={t('settings.hapticFeedback')}
            showArrow={false}
          >
            <Switch
              value={hapticFeedback}
              onValueChange={setHapticFeedback}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              thumbColor={hapticFeedback ? '#fff' : '#fff'}
            />
          </SettingItem>
        </View>

        {/* 语音设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.speech')}</Text>
          
          <SettingItem
            icon="globe-outline"
            title={t('settings.mainLanguage')}
            value={currentLanguageInfo.nativeName}
            onPress={handleLanguageChange}
          />
        </View>

        {/* 关于部分 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
          
          <SettingItem
            icon="help-circle-outline"
            title={t('settings.helpSupport')}
            onPress={() => Alert.alert(t('settings.helpSupport'), t('settings.helpMessage'))}
          />
          
          <SettingItem
            icon="information-circle-outline"
            title={t('settings.appVersion')}
            value="1.0.0"
            showArrow={false}
          />
          
          <SettingItem
            icon="log-out-outline"
            title={t('settings.logout')}
            onPress={handleLogout}
            showArrow={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F2F2F7',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  settingIcon: {
    marginRight: 12,
    width: 20,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000',
  },
  settingValue: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 2,
  },
  languageNote: {
    fontSize: 13,
    color: '#8E8E93',
    paddingHorizontal: 16,
    paddingTop: 8,
    lineHeight: 18,
  },
});