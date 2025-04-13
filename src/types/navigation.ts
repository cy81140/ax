import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Post, User } from './services';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Admin: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  Profile: { userId: string };
  PostDetails: { postId: string; commentId?: string };
  CreatePost: undefined;
  EditProfile: undefined;
  Search: undefined;
  Notifications: undefined;
  Settings: undefined;
  AdminPanel: undefined;
  Reports: undefined;
  UserManagement: undefined;
  ContentModeration: undefined;
  Analytics: undefined;
  Database: undefined;
  Login: undefined;
  Register: undefined;
  ChatRoom: { chatId: string };
  Auth: undefined;
  Main: undefined;
};

export type AdminStackParamList = {
  AdminPanel: undefined;
  Reports: undefined;
  UserManagement: undefined;
  ContentModeration: undefined;
  Analytics: undefined;
  Database: undefined;
};

export type ChatStackParamList = {
  ChatRoom: { chatId: string };
};

export type MainTabParamList = {
  Feed: undefined;
  Discover: undefined;
  Create: undefined;
  Activity: undefined;
  Profile: { userId?: string };
};

export type MainStackScreenProps<T extends keyof MainStackParamList> = NativeStackScreenProps<MainStackParamList, T>;
export type AuthStackScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<AuthStackParamList, T>;
export type ChatStackScreenProps<T extends keyof ChatStackParamList> = NativeStackScreenProps<ChatStackParamList, T>;
export type MainTabScreenProps<T extends keyof MainTabParamList> = NativeStackScreenProps<MainTabParamList, T>;
export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
export type AdminStackScreenProps<T extends keyof AdminStackParamList> = NativeStackScreenProps<AdminStackParamList, T>; 