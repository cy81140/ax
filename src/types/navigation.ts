import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
  Search: undefined;
  ActivityFeed: undefined;
  EditProfile: undefined;
  Settings: undefined;
  MutedUsers: undefined;
  Reports: undefined;
  AdminPanel: undefined;
  PostDetails: { postId: string };
  CreatePost: undefined;
  Search: undefined;
  ChatRoom: { roomId: string };
  UserManagement: undefined;
  ContentModeration: undefined;
  Analytics: undefined;
  SystemSettings: undefined;
  BackupRestore: undefined;
  Login: undefined;
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
  ChatRoom: { roomId: string };
  Search: undefined;
  Notifications: undefined;
  Settings: undefined;
  AdminPanel: undefined;
  Login: undefined;
  Register: undefined;
};

export type ChatStackParamList = {
  ChatList: undefined;
  ChatRoom: { roomId: string; roomName: string; roomDescription: string; regionName: string };
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