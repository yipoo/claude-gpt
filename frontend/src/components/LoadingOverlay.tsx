import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeIcon } from './SafeIcon';

const { width, height } = Dimensions.get('window');

interface LoadingOverlayProps {
  visible: boolean;
  text?: string;
  type?: 'loading' | 'success' | 'error';
  onClose?: () => void;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  text,
  type = 'loading',
  onClose,
}) => {
  const { t } = useTranslation();

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <SafeIcon name="checkmark-circle" size={48} color="#34C759" />;
      case 'error':
        return <SafeIcon name="close-circle" size={48} color="#FF3B30" />;
      default:
        return <ActivityIndicator size="large" color="#007AFF" />;
    }
  };

  const getText = () => {
    if (text) return text;
    switch (type) {
      case 'success':
        return t('common.success');
      case 'error':
        return t('common.error');
      default:
        return t('common.loading');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {getIcon()}
          <Text style={styles.text}>{getText()}</Text>
        </View>
      </View>
    </Modal>
  );
};

interface SkeletonLoaderProps {
  lines?: number;
  animated?: boolean;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  lines = 3,
  animated = true,
}) => {
  return (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: lines }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.skeletonLine,
            index === lines - 1 && styles.skeletonLastLine,
            animated && styles.skeletonAnimated,
          ]}
        />
      ))}
    </View>
  );
};

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  onRetry,
  showRetry = true,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.errorContainer}>
      <SafeIcon name="alert-circle-outline" size={64} color="#FF3B30" />
      <Text style={styles.errorTitle}>{t('common.error')}</Text>
      <Text style={styles.errorMessage}>
        {message || t('errors.unknownError')}
      </Text>
      {showRetry && onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

interface EmptyStateProps {
  icon?: string;
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'document-outline',
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <View style={styles.emptyContainer}>
      <SafeIcon name={icon} size={64} color="#C7C7CC" />
      {title && <Text style={styles.emptyTitle}>{title}</Text>}
      {description && <Text style={styles.emptyDescription}>{description}</Text>}
      {actionText && onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionButtonText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    textAlign: 'center',
  },
  skeletonContainer: {
    padding: 16,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: '#E1E5E9',
    borderRadius: 6,
    marginBottom: 8,
  },
  skeletonLastLine: {
    width: '70%',
  },
  skeletonAnimated: {
    // React Native doesn't support CSS animations, 
    // would need react-native-reanimated for shimmer effect
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});