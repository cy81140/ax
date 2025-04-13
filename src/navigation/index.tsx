import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamList, AuthStackParamList, MainTabParamList, ChatStackParamList, ProfileStackParamList } from './types';
import { useAuth } from '../hooks/useAuth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import ThemedTabBar from '../components/ThemedTabBar';

// Import screens using barrel exports
import { LoginScreen, RegisterScreen } from '../screens/auth';
import {
  HomeScreen,
  ChatScreen,
  CreateScreen,
  SearchScreen,
  ProfileScreen,
  ChatRoomScreen,
  ActivityFeedScreen
} from '../screens/main';

// Import settings screens
import SettingsScreen from '../screens/settings/SettingsScreen';
import MutedUsersScreen from '../screens/settings/MutedUsersScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const ChatStack = createNativeStackNavigator<ChatStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen as React.ComponentType<any>} />
    </AuthStack.Navigator>
  );
};

const ChatNavigator = () => {
  return (
    <ChatStack.Navigator>
      <ChatStack.Screen 
        name="ChatList" 
        component={ChatScreen} 
        options={{ headerShown: false }}
      />
      <ChatStack.Screen 
        name="ChatRoom" 
        component={ChatRoomScreen as React.ComponentType<any>}
        options={({ route }) => ({ 
          title: route.params.roomName,
          headerBackTitle: 'Back',
        })}
      />
    </ChatStack.Navigator>
  );
};

const ProfileNavigator = () => {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ 
          title: 'Settings',
          headerBackTitle: 'Back',
        }}
      />
      <ProfileStack.Screen 
        name="MutedUsers" 
        component={MutedUsersScreen}
        options={{ 
          title: 'Muted Users',
          headerBackTitle: 'Back',
        }}
      />
    </ProfileStack.Navigator>
  );
};

const MainNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <MainTab.Navigator
      tabBar={props => <ThemedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurface,
      }}
    >
      <MainTab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <MainTab.Screen 
        name="Chat" 
        component={ChatNavigator} 
        options={{
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <MaterialCommunityIcons name="chat" color={color} size={size} />
          ),
        }}
      />
      <MainTab.Screen 
        name="Create" 
        component={CreateScreen} 
        options={{
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <MaterialCommunityIcons name="plus-circle" color={color} size={size} />
          ),
        }}
      />
      <MainTab.Screen 
        name="Search" 
        component={SearchScreen} 
        options={{
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <MaterialCommunityIcons name="magnify" color={color} size={size} />
          ),
        }}
      />
      <MainTab.Screen 
        name="Activity" 
        component={ActivityFeedScreen} 
        options={{
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <MaterialCommunityIcons name="bell" color={color} size={size} />
          ),
        }}
      />
      <MainTab.Screen 
        name="ProfileTab" 
        component={ProfileNavigator} 
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <MaterialCommunityIcons name="account" color={color} size={size} />
          ),
        }}
      />
    </MainTab.Navigator>
  );
};

export const Navigation = () => {
  const { user } = useAuth();
  const { theme } = useTheme();

  return (
    <NavigationContainer theme={{
      dark: theme.dark,
      colors: {
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.text,
        border: theme.colors.surfaceVariant,
        notification: theme.colors.error,
      }
    }}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}; 