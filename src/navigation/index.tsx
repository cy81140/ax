import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import { 
  RootStackParamList, 
  AuthStackParamList, 
  MainTabParamList, 
  ChatStackParamList,
  ProfileStackParamList,
  HomeStackParamList,
  ProvinceChatStackParamList,
  AdminStackParamList
} from './types';
import { useAuth } from '../contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import ThemedAppbar from '../components/ThemedAppbar';

// Import screens using barrel exports
import { LoginScreen, RegisterScreen } from '../screens/auth';
import {
  HomeScreen,
  CreateScreen,
  SearchScreen,
  ProfileScreen,
  ActivityFeedScreen,
  PostDetailsScreen,
  NotificationsScreen,
  EditProfileScreen,
  RegionListScreen,
  ProvinceListScreen,
  ProvinceChatListScreen,
  ProvinceChatRoomScreen,
  FeedScreen,
  AdminPanelScreen,
  ReportsScreen
} from '../screens/main';

// Import settings screens
import SettingsScreen from '../screens/settings/SettingsScreen';
import MutedUsersScreen from '../screens/settings/MutedUsersScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createMaterialBottomTabNavigator<MainTabParamList>();
const ChatStack = createNativeStackNavigator<ChatStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ProvinceChatStack = createNativeStackNavigator<ProvinceChatStackParamList>();
const AdminStack = createNativeStackNavigator<AdminStackParamList>();

/**
 * Authentication Navigator
 * Handles login, registration, and password reset flows
 */
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen as React.ComponentType<any>} />
    </AuthStack.Navigator>
  );
};

/**
 * Home Stack Navigator
 * Handles main feed and post details
 */
const HomeNavigator = () => {
  return (
    <HomeStack.Navigator initialRouteName="Feed">
      <HomeStack.Screen 
        name="Feed" 
        component={HomeScreen} 
        options={{ headerShown: false }}
      />
      <HomeStack.Screen 
        name="PostDetails" 
        component={PostDetailsScreen} 
        options={{
          title: "Post",
          headerShown: true,
          header: (props) => <ThemedAppbar {...props} />,
        }}
      />
    </HomeStack.Navigator>
  );
};

/**
 * Chat Navigator (Using NEW Province System)
 * Handles browsing regions/provinces and province chat rooms
 */
const ChatNavigator = () => {
  return (
    <ProvinceChatStack.Navigator initialRouteName="RegionList">
      <ProvinceChatStack.Screen 
        name="RegionList" 
        component={RegionListScreen}
        options={{ title: 'Regions' }}
      />
      <ProvinceChatStack.Screen 
        name="ProvinceList" 
        component={ProvinceListScreen}
        options={({ route }) => ({ 
          title: (route.params as { regionName?: string })?.regionName || 'Provinces', 
        })}
      />
      <ProvinceChatStack.Screen 
        name="MyProvinceChats"
        component={ProvinceChatListScreen}
        options={{ title: 'My Chats' }}
      />
      <ProvinceChatStack.Screen 
        name="ProvinceChatRoom"
        component={ProvinceChatRoomScreen}
        options={({ route }) => ({ 
          title: (route.params as { provinceName?: string })?.provinceName || 'Chat',
          headerBackTitle: 'Back',
        })}
      />
    </ProvinceChatStack.Navigator>
  );
};

/**
 * Profile Navigator
 * Handles user profile, settings, and related screens
 */
const ProfileNavigator = () => {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          title: 'Edit Profile',
          headerBackTitle: 'Back',
        }}
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

/**
 * Admin Navigator (Placeholder)
 * Handles admin-specific screens like reports and moderation
 */
const AdminNavigator = () => {
  return (
    <AdminStack.Navigator initialRouteName="AdminPanel">
      <AdminStack.Screen 
        name="AdminPanel" 
        component={AdminPanelScreen}
        options={{ title: 'Admin Panel' }}
      />
      <AdminStack.Screen 
        name="Reports" 
        component={ReportsScreen}
        options={{ title: 'Reports' }}
      />
    </AdminStack.Navigator>
  );
};

/**
 * Main Tab Navigator (Using Material Bottom Tabs)
 */
const MainNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <MainTab.Navigator
      initialRouteName="Home"
      activeColor={theme.colors.primary}
      inactiveColor={theme.colors.onSurfaceVariant}
      barStyle={{ backgroundColor: theme.colors.elevation.level2 }}
      screenOptions={{
      }}
    >
      <MainTab.Screen 
        name="Home" 
        component={HomeNavigator} 
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }: { color: string, focused: boolean }) => (
            <MaterialCommunityIcons name={focused ? "home" : "home-outline"} color={color} size={24} />
          ),
        }}
      />
      <MainTab.Screen 
        name="Chat" 
        component={ChatNavigator} 
        options={{
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color, focused }: { color: string, focused: boolean }) => (
            <MaterialCommunityIcons name={focused ? "chat" : "chat-outline"} color={color} size={24} />
          ),
        }}
      />
      <MainTab.Screen 
        name="Create" 
        component={CreateScreen} 
        options={{
          tabBarLabel: 'Create',
          tabBarIcon: ({ color, focused }: { color: string, focused: boolean }) => (
            <MaterialCommunityIcons name={focused ? "plus-circle" : "plus-circle-outline"} color={color} size={24} />
          ),
        }}
      />
      <MainTab.Screen 
        name="Search" 
        component={SearchScreen} 
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, focused }: { color: string, focused: boolean }) => (
            <MaterialCommunityIcons name="magnify" color={color} size={24} />
          ),
        }}
      />
      <MainTab.Screen 
        name="Activity" 
        component={NotificationsScreen as React.ComponentType<any>} 
        options={{
          tabBarLabel: 'Activity',
          tabBarIcon: ({ color, focused }: { color: string, focused: boolean }) => (
            <MaterialCommunityIcons name={focused ? "bell" : "bell-outline"} color={color} size={24} />
          ),
        }}
      />
      <MainTab.Screen 
        name="ProfileTab" 
        component={ProfileNavigator} 
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }: { color: string, focused: boolean }) => (
            <MaterialCommunityIcons name={focused ? "account" : "account-outline"} color={color} size={24} />
          ),
        }}
      />
    </MainTab.Navigator>
  );
};

/**
 * Root Navigation Component
 * The main navigation container that handles auth state and theme
 */
export const Navigation = () => {
  const { user, session, loading } = useAuth();
  const { theme } = useTheme();

  const isAdmin = (user as any)?.is_admin === true;

  if (loading) {
    return null;
  }

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
        {user && session ? (
          <>
            <RootStack.Screen name="Main" component={MainNavigator} />
            {isAdmin && (
              <RootStack.Screen name="Admin" component={AdminNavigator} />
            )}
          </>
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}; 