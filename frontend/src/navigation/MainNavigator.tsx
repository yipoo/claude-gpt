import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeIcon } from '../components/SafeIcon';
import { ChatScreen } from '../screens/ChatScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import SubscriptionSuccessScreen from '../screens/SubscriptionSuccessScreen';
import { DrawerContent } from '../components/DrawerContent';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

interface MainNavigatorProps {
  onNavigateToConversations?: () => void;
}

// 主抽屉导航器
const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent navigation={props.navigation} />}
      screenOptions={({ navigation }) => ({
        headerStyle: {
          backgroundColor: '#F8F8F8',
          borderBottomWidth: 1,
          borderBottomColor: '#E5E5EA',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontSize: 16,
          fontWeight: '700',
          color: '#000',
        },
        headerTitleAlign: 'center',
        headerLeft: () => (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.openDrawer()}
          >
            <SafeIcon name="menu" size={24} color="#000" />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              // TODO: 实现编辑功能
            }}
          >
            <SafeIcon name="create-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        ),
        drawerStyle: {
          width: 280,
        },
        drawerType: 'slide',
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        swipeEnabled: true,
        swipeEdgeWidth: 50,
      })}
    >
      <Drawer.Screen
        name="Chat"
        component={ChatScreenWrapper}
        options={{
          title: 'ChatGPT',
        }}
      />
    </Drawer.Navigator>
  );
};

export const MainNavigator: React.FC<MainNavigatorProps> = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Main" component={DrawerNavigator} />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen 
          name="Subscription" 
          component={SubscriptionScreen}
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen 
          name="SubscriptionSuccess" 
          component={SubscriptionSuccessScreen}
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// 包装ChatScreen以适配抽屉导航
const ChatScreenWrapper: React.FC<any> = ({ route, navigation }) => {
  const conversationId = route.params?.conversationId;

  const handleNavigateToConversations = () => {
    navigation.openDrawer();
  };

  return (
    <View style={styles.screenContainer}>
      <ChatScreen
        conversationId={conversationId}
        onNavigateToConversations={handleNavigateToConversations}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  menuButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});