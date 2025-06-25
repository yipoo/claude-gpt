import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeIcon } from '../components/SafeIcon';
import { useAuthStore } from '../store/authStore';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, updateUserProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');

  const handleClose = () => {
    navigation.goBack();
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (updateUserProfile) {
      updateUserProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
      });
    }
    setIsEditing(false);
    Alert.alert('保存成功', '个人资料已更新');
  };

  const handleCancel = () => {
    setDisplayName(user?.displayName || '');
    setBio(user?.bio || '');
    setIsEditing(false);
  };

  const getUserInitials = () => {
    if (displayName) {
      return displayName.charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const ProfileItem = ({ 
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
      style={styles.profileItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.profileIcon}>
        <SafeIcon name={icon} size={20} color="#007AFF" />
      </View>
      <View style={styles.profileContent}>
        <Text style={styles.profileTitle}>{title}</Text>
        {value && (
          <Text style={styles.profileValue}>{value}</Text>
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
        <TouchableOpacity style={styles.backButton} onPress={handleClose}>
          <SafeIcon name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={isEditing ? handleSave : handleEdit}
        >
          <Text style={styles.editButtonText}>
            {isEditing ? 'Save' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 用户头像和基本信息 */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getUserInitials()}</Text>
          </View>
          
          {isEditing ? (
            <View style={styles.editForm}>
              <Text style={styles.inputLabel}>Display Name</Text>
              <TextInput
                style={styles.textInput}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter your display name"
                placeholderTextColor="#C7C7CC"
              />
              
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={[styles.textInput, styles.bioInput]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself"
                placeholderTextColor="#C7C7CC"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.userInfo}>
              <Text style={styles.displayName}>
                {displayName || 'Set Display Name'}
              </Text>
              <Text style={styles.email}>{user?.email}</Text>
              {bio ? (
                <Text style={styles.bio}>{bio}</Text>
              ) : (
                <Text style={styles.noBio}>Add a bio to tell others about yourself</Text>
              )}
            </View>
          )}
        </View>

        {/* 账户信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT INFORMATION</Text>
          
          <ProfileItem
            icon="mail-outline"
            title="Email"
            value={user?.email}
            showArrow={false}
          />
          
          <ProfileItem
            icon="calendar-outline"
            title="Member Since"
            value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            showArrow={false}
          />
          
          <ProfileItem
            icon="shield-checkmark-outline"
            title="Account Status"
            value="Active"
            showArrow={false}
          />
        </View>

        {/* 使用统计 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>USAGE STATISTICS</Text>
          
          <ProfileItem
            icon="chatbubbles-outline"
            title="Total Conversations"
            value={user?.totalConversations?.toString() || '0'}
            showArrow={false}
          />
          
          <ProfileItem
            icon="send-outline"
            title="Messages Sent"
            value={user?.totalMessages?.toString() || '0'}
            showArrow={false}
          />
          
          <ProfileItem
            icon="time-outline"
            title="Last Active"
            value={user?.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : 'Today'}
            showArrow={false}
          />
        </View>

        {/* 隐私设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRIVACY</Text>
          
          <ProfileItem
            icon="eye-outline"
            title="Profile Visibility"
            value="Private"
            onPress={() => Alert.alert('隐私设置', '个人资料可见性设置功能正在开发中')}
          />
          
          <ProfileItem
            icon="notifications-outline"
            title="Data & Privacy"
            onPress={() => Alert.alert('数据隐私', '数据和隐私设置功能正在开发中')}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F2F2F7',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  editButton: {
    padding: 4,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  scrollView: {
    flex: 1,
  },
  avatarSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  userInfo: {
    alignItems: 'center',
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  noBio: {
    fontSize: 14,
    color: '#C7C7CC',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  editForm: {
    width: '100%',
    paddingHorizontal: 32,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
    marginBottom: 16,
  },
  bioInput: {
    height: 80,
    paddingTop: 12,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 24,
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
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  profileIcon: {
    marginRight: 12,
    width: 20,
  },
  profileContent: {
    flex: 1,
  },
  profileTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000',
  },
  profileValue: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 2,
  },
});