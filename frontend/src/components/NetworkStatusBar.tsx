import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeIcon } from './SafeIcon';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export const NetworkStatusBar: React.FC = () => {
  const { t } = useTranslation();
  const { networkStatus, isOffline, getConnectionQuality } = useNetworkStatus();
  const [slideAnim] = useState(new Animated.Value(-60));
  const [showBar, setShowBar] = useState(false);
  const [lastOfflineState, setLastOfflineState] = useState(false);

  useEffect(() => {
    if (isOffline && !lastOfflineState) {
      // 刚变为离线状态
      setShowBar(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (!isOffline && lastOfflineState) {
      // 刚变为在线状态，显示短暂的恢复消息
      setShowBar(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // 2秒后隐藏
      setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -60,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowBar(false);
        });
      }, 2000);
    }

    setLastOfflineState(isOffline);
  }, [isOffline, lastOfflineState, slideAnim]);

  const getStatusColor = () => {
    if (isOffline) return '#FF3B30';
    return '#34C759';
  };

  const getStatusIcon = () => {
    if (isOffline) return 'wifi-off';
    
    const quality = getConnectionQuality();
    switch (quality) {
      case 'excellent':
        return networkStatus.isWifi ? 'wifi' : 'cellular-sharp';
      case 'good':
        return networkStatus.isWifi ? 'wifi' : 'cellular-outline';
      case 'poor':
        return 'signal';
      default:
        return 'wifi-off';
    }
  };

  const getStatusText = () => {
    if (isOffline) {
      return t('errors.noInternet');
    }
    
    if (lastOfflineState) {
      return t('common.success'); // 连接已恢复
    }
    
    return `${networkStatus.type.toUpperCase()} Connected`;
  };

  if (!showBar) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        { backgroundColor: getStatusColor() },
        { transform: [{ translateY: slideAnim }] }
      ]}
    >
      <View style={styles.content}>
        <SafeIcon 
          name={getStatusIcon()} 
          size={16} 
          color="#fff" 
        />
        <Text style={styles.text}>{getStatusText()}</Text>
      </View>
    </Animated.View>
  );
};

interface NetworkStatusIndicatorProps {
  showQuality?: boolean;
  style?: any;
}

export const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  showQuality = false,
  style,
}) => {
  const { networkStatus, isOffline, getConnectionQuality } = useNetworkStatus();

  const getIndicatorColor = () => {
    if (isOffline) return '#FF3B30';
    
    const quality = getConnectionQuality();
    switch (quality) {
      case 'excellent':
        return '#34C759';
      case 'good':
        return '#FF9500';
      case 'poor':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getIndicatorIcon = () => {
    if (isOffline) return 'wifi-off';
    
    if (networkStatus.isWifi) {
      return 'wifi';
    } else if (networkStatus.isCellular) {
      const quality = getConnectionQuality();
      switch (quality) {
        case 'excellent':
          return 'cellular-sharp';
        case 'good':
          return 'cellular-outline';
        case 'poor':
          return 'cellular';
        default:
          return 'cellular';
      }
    }
    
    return 'globe-outline';
  };

  return (
    <View style={[styles.indicator, style]}>
      <SafeIcon 
        name={getIndicatorIcon()} 
        size={16} 
        color={getIndicatorColor()} 
      />
      {showQuality && (
        <View style={[styles.qualityDot, { backgroundColor: getIndicatorColor() }]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    paddingTop: 20, // 状态栏高度
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(142, 142, 147, 0.1)',
  },
  qualityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 4,
  },
});