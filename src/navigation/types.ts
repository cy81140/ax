import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

/**
 * Root Stack Parameter List
 * Contains the top-level navigation paths
 */
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Admin: undefined;
};

/**
 * Authentication Stack Parameter List
 * Contains all screens related to authentication
 */
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

/**
 * Main Tab Navigation Parameter List
 * Contains all the tabs in the main bottom tab navigation
 */
export type MainTabParamList = {
  Home: undefined;
  Chat: undefined;
  Create: undefined;
  Search: undefined;
  Activity: undefined;
  ProfileTab: undefined;
};

/**
 * Home Stack Parameter List
 * Contains screens accessible from the Home tab
 */
export type HomeStackParamList = {
  Feed: undefined;
  PostDetails: { postId: string; commentId?: string };
};

/**
 * Chat Stack Parameter List
 * Contains screens accessible from the Chat tab
 */
export type ChatStackParamList = {
  ChatList: undefined;
  ChatRoom: { 
    roomId: string; 
    roomName: string;
    roomDescription?: string;
    regionName?: string;
  };
};

/**
 * Profile Stack Parameter List
 * Contains screens accessible from the Profile tab
 */
export type ProfileStackParamList = {
  Profile: { userId?: string };
  EditProfile: undefined;
  Settings: undefined;
  MutedUsers: undefined;
};

/**
 * Admin Stack Parameter List
 * Contains screens accessible from the Admin section
 */
export type AdminStackParamList = {
  AdminPanel: undefined;
  Reports: undefined;
  UserManagement: undefined;
  ContentModeration: undefined;
  Analytics: undefined;
  Database: undefined;
};

/**
 * Main Stack Parameter List
 * Contains all main screens for reference in other components
 */
export type MainStackParamList = {
  Home: undefined;
  Profile: { userId?: string };
  PostDetails: { postId: string; commentId?: string };
  CreatePost: undefined;
  EditProfile: undefined;
  Search: undefined;
  Notifications: undefined;
  Settings: undefined;
  AdminPanel: undefined;
  ChatRoom: { 
    roomId: string; 
    roomName: string;
    roomDescription?: string;
    regionName?: string;
  };
};

// Screen props types for consuming in components
export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = 
  NativeStackScreenProps<AuthStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = 
  NativeStackScreenProps<MainTabParamList, T>;

export type HomeStackScreenProps<T extends keyof HomeStackParamList> = 
  NativeStackScreenProps<HomeStackParamList, T>;

export type ChatStackScreenProps<T extends keyof ChatStackParamList> = 
  NativeStackScreenProps<ChatStackParamList, T>;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> = 
  NativeStackScreenProps<ProfileStackParamList, T>;

export type AdminStackScreenProps<T extends keyof AdminStackParamList> = 
  NativeStackScreenProps<AdminStackParamList, T>;

export type MainStackScreenProps<T extends keyof MainStackParamList> = 
  NativeStackScreenProps<MainStackParamList, T>; 