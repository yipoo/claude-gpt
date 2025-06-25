import { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Keyboard,
  Alert,
} from 'react-native';
import { SafeIcon } from '../SafeIcon';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isStreaming?: boolean;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isStreaming = false,
  disabled = false,
  placeholder = '输入消息...',
  maxLength = 4000,
}) => {
  const [message, setMessage] = useState('');
  const [inputHeight, setInputHeight] = useState(40);
  const textInputRef = useRef<TextInput>(null);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    
    if (!trimmedMessage) {
      Alert.alert('提示', '请输入消息内容');
      return;
    }

    if (trimmedMessage.length > maxLength) {
      Alert.alert('提示', `消息长度不能超过 ${maxLength} 个字符`);
      return;
    }

    onSendMessage(trimmedMessage);
    setMessage('');
    setInputHeight(40);
    Keyboard.dismiss();
  };

  const handleContentSizeChange = (event: any) => {
    const { height } = event.nativeEvent.contentSize;
    const newHeight = Math.min(Math.max(height, 40), 120); // 限制最小40px，最大120px
    setInputHeight(newHeight);
  };

  const canSend = message.trim().length > 0 && !isStreaming && !disabled;

  const handleCameraPress = () => {
    Alert.alert('功能开发中', '相机功能正在开发中');
  };

  const handleImagePress = () => {
    Alert.alert('功能开发中', '图片功能正在开发中');
  };

  const handleDocumentPress = () => {
    Alert.alert('功能开发中', '文档功能正在开发中');
  };

  const handleMicPress = () => {
    Alert.alert('功能开发中', '语音功能正在开发中');
  };

  const handleHeadphonesPress = () => {
    Alert.alert('功能开发中', '耳机功能正在开发中');
  };

  return (
    <View style={styles.container}>
      {/* 建议卡片 */}
      {/* {message.length === 0 && (
        <View style={styles.suggestionsContainer}>
          <TouchableOpacity style={styles.suggestionCard}>
            <Text style={styles.suggestionTitle}>Design a database schema</Text>
            <Text style={styles.suggestionSubtitle}>for an online merch store</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.suggestionCard}>
            <Text style={styles.suggestionTitle}>Explain airplane</Text>
            <Text style={styles.suggestionSubtitle}>to someone 5 years old</Text>
          </TouchableOpacity>
        </View>
      )} */}

      {/* 工具栏 */}
      <View style={styles.toolbarContainer}>
        {/* <TouchableOpacity style={styles.toolButton} onPress={handleCameraPress}>
          <SafeIcon name="camera-outline" size={24} color="#8E8E93" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.toolButton} onPress={handleImagePress}>
          <SafeIcon name="image-outline" size={24} color="#8E8E93" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.toolButton} onPress={handleDocumentPress}>
          <SafeIcon name="document-outline" size={24} color="#8E8E93" />
        </TouchableOpacity> */}
        
        <View style={styles.inputWrapper}>
          <TextInput
            ref={textInputRef}
            style={[styles.textInput, { height: inputHeight }]}
            value={message}
            onChangeText={setMessage}
            placeholder={placeholder}
            placeholderTextColor="#999"
            multiline
            maxLength={maxLength}
            editable={!isStreaming && !disabled}
            onContentSizeChange={handleContentSizeChange}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          {canSend && (
            <TouchableOpacity
              style={styles.sendIconButton}
              onPress={handleSend}
            >
              <SafeIcon name="arrow-up" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity style={styles.toolButton} onPress={handleMicPress}>
          <SafeIcon name="mic-outline" size={24} color="#8E8E93" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.toolButton} onPress={handleHeadphonesPress}>
          <SafeIcon name="headset-outline" size={24} color="#8E8E93" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 34, // Safe area bottom
  },
  suggestionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  suggestionCard: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  suggestionSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
  },
  toolbarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toolButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 48, // Space for send button
    fontSize: 16,
    textAlignVertical: 'top',
    backgroundColor: '#F8F8F8',
    minHeight: 44,
  },
  sendIconButton: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});