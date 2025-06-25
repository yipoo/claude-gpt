import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './en.json';
import zh from './zh.json';

const LANGUAGE_STORAGE_KEY = 'app_language';

// 获取设备语言 - 使用 Expo Localization
const getDeviceLanguage = (): string => {
  try {
    const locales = Localization.getLocales();
    if (locales && locales.length > 0) {
      const languageCode = locales[0].languageCode;
      // 支持的语言列表
      const supportedLanguages = ['en', 'zh'];
      return supportedLanguages.includes(languageCode) ? languageCode : 'en';
    }
  } catch (error) {
    console.warn('Error getting device language:', error);
  }
  return 'en';
};

// 从存储中获取语言设置 - 增强错误处理
const getStoredLanguage = async (): Promise<string> => {
  try {
    // 添加超时保护
    const timeoutPromise = new Promise<string>((resolve) => {
      setTimeout(() => resolve(getDeviceLanguage()), 2000);
    });

    const storagePromise = AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    
    const storedLanguage = await Promise.race([storagePromise, timeoutPromise]);
    
    if (typeof storedLanguage === 'string' && storedLanguage) {
      const supportedLanguages = ['en', 'zh'];
      return supportedLanguages.includes(storedLanguage) ? storedLanguage : getDeviceLanguage();
    }
  } catch (error) {
    console.warn('Error getting stored language:', error);
  }
  return getDeviceLanguage();
};

// 保存语言设置到存储 - 增强错误处理
const setStoredLanguage = async (language: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.warn('Error storing language:', error);
  }
};

const resources = {
  en: {
    translation: en,
  },
  zh: {
    translation: zh,
  },
};

// 初始化 i18n 配置 - 增强错误处理
const initI18n = () => {
  try {
    i18n
      .use(initReactI18next)
      .init({
        resources,
        lng: 'en', // 默认语言，会在初始化时被覆盖
        fallbackLng: 'en',
        debug: false, // 禁用调试模式以减少控制台输出
        
        interpolation: {
          escapeValue: false, // React already escapes values
        },
        
        react: {
          useSuspense: false,
        },
        
        // 添加错误处理配置
        missingKeyHandler: (lng, ns, key) => {
          console.warn(`Missing translation key: ${key} for language: ${lng}`);
        },
      });
    
    console.log('i18n initialized successfully');
  } catch (error) {
    console.error('Error initializing i18n:', error);
    // 如果 i18n 初始化失败，使用基本配置
    try {
      i18n.init({
        lng: 'en',
        fallbackLng: 'en',
        resources: {
          en: { translation: {} },
        },
        react: {
          useSuspense: false,
        },
      });
    } catch (fallbackError) {
      console.error('Error initializing fallback i18n:', fallbackError);
    }
  }
};

// 立即初始化 i18n
initI18n();

// 初始化语言设置 - 增强错误处理
export const initializeLanguage = async (): Promise<void> => {
  try {
    const language = await getStoredLanguage();
    
    // 确保 i18n 已经初始化
    if (i18n.isInitialized) {
      await i18n.changeLanguage(language);
      console.log('Language initialized:', language);
    } else {
      console.warn('i18n not initialized, using default language');
    }
  } catch (error) {
    console.warn('Error initializing language:', error);
    // 如果初始化失败，尝试设置默认语言
    try {
      if (i18n.isInitialized) {
        await i18n.changeLanguage('en');
      }
    } catch (fallbackError) {
      console.warn('Error setting fallback language:', fallbackError);
    }
  }
};

// 切换语言 - 增强错误处理
export const changeLanguage = async (language: string): Promise<void> => {
  try {
    if (!i18n.isInitialized) {
      console.warn('i18n not initialized, cannot change language');
      return;
    }

    await i18n.changeLanguage(language);
    await setStoredLanguage(language);
    console.log('Language changed to:', language);
  } catch (error) {
    console.warn('Error changing language:', error);
  }
};

// 获取当前语言 - 增强错误处理
export const getCurrentLanguage = (): string => {
  try {
    if (i18n.isInitialized) {
      return i18n.language || 'en';
    }
  } catch (error) {
    console.warn('Error getting current language:', error);
  }
  return 'en';
};

// 获取支持的语言列表
export const getSupportedLanguages = () => {
  return [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' },
  ];
};

export default i18n;