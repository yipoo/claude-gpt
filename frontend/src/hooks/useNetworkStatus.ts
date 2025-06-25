import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
  isWifi: boolean;
  isCellular: boolean;
  strength?: number;
}

export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
    isWifi: false,
    isCellular: false,
  });
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const status: NetworkStatus = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
        isWifi: state.type === 'wifi',
        isCellular: state.type === 'cellular',
      };

      // 添加网络强度信息（如果可用）
      if (state.details && 'strength' in state.details) {
        status.strength = state.details.strength as number;
      }

      setNetworkStatus(status);
      setIsOffline(!status.isConnected || !status.isInternetReachable);
    });

    // 获取初始网络状态
    NetInfo.fetch().then((state: NetInfoState) => {
      const status: NetworkStatus = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
        isWifi: state.type === 'wifi',
        isCellular: state.type === 'cellular',
      };

      if (state.details && 'strength' in state.details) {
        status.strength = state.details.strength as number;
      }

      setNetworkStatus(status);
      setIsOffline(!status.isConnected || !status.isInternetReachable);
    });

    return unsubscribe;
  }, []);

  const checkConnection = async (): Promise<boolean> => {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable;
  };

  const getConnectionQuality = (): 'excellent' | 'good' | 'poor' | 'offline' => {
    if (isOffline) return 'offline';
    
    if (networkStatus.isWifi) {
      return 'excellent';
    }
    
    if (networkStatus.isCellular) {
      const strength = networkStatus.strength;
      if (strength !== undefined) {
        if (strength > 75) return 'excellent';
        if (strength > 50) return 'good';
        return 'poor';
      }
      return 'good'; // 默认为良好
    }
    
    return 'poor';
  };

  return {
    networkStatus,
    isOffline,
    checkConnection,
    getConnectionQuality,
  };
};