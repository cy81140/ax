import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// No need to import param lists defined in this same file
// import { AuthStackParamList } from './AuthStack'; 
// import { MainTabParamList } from './MainTab';
// import { AdminStackParamList } from './AdminStack';

/**
 * Root Stack Parameter List
 * Contains the top-level navigation paths including nested navigators
 */
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>; 
  Main: NavigatorScreenParams<MainStackParamList>;
  Admin: NavigatorScreenParams<AdminStackParamList>;
};

/**
 * Authentication Stack Parameter List
 * Contains all screens related to authentication
 */
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  ForgotPassword: undefined;
};

/**
 * Main Tab Navigation Parameter List
 * Contains all the tabs in the main bottom tab navigation
 */
export type MainTabParamList = {
  Home: undefined;
  Create: undefined;
  Chats: undefined;
  Activity: undefined;
  ProfileTab: undefined;
};

/**
 * Main Stack Parameter List
 * Contains all screens accessible from the Main navigator
 */
export type MainStackParamList = {
  MainTabs: undefined; // Main tabs navigator
  RegionList: undefined;
  ProvinceList: { regionId: string; regionName: string };
  ProvinceChatRoom: { provinceChatId: string; provinceName: string; provinceId?: string };
  Settings: undefined;
  Profile: undefined;
  EditProfile: undefined;
  MutedUsers: undefined;
  Reports: undefined;
  AdminPanel: undefined;
  PostDetails: { postId: string; commentId?: string };
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  Debug: undefined;
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
 * Chat Stack Parameter List (Original/Generic - Keep if needed for other features)
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
 * Province Chat Stack Parameter List (NEW)
 * Contains screens for browsing regions/provinces and province chats
 */
export type ProvinceChatStackParamList = {
  RegionList: undefined;
  ProvinceList: { regionId: string; regionName?: string };
  MyProvinceChats: undefined; // Screen to list chats user is in
  ProvinceChatRoom: { provinceChatId: string; provinceName: string; provinceId?: string };
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
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
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

export type ProvinceChatStackScreenProps<T extends keyof ProvinceChatStackParamList> = 
  NativeStackScreenProps<ProvinceChatStackParamList, T>;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> = 
  NativeStackScreenProps<ProfileStackParamList, T>;

export type AdminStackScreenProps<T extends keyof AdminStackParamList> = 
  NativeStackScreenProps<AdminStackParamList, T>;

export type MainStackScreenProps<T extends keyof MainStackParamList> = 
  NativeStackScreenProps<MainStackParamList, T>; 