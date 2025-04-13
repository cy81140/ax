export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Chat: undefined;
  Create: undefined;
  Search: undefined;
  Activity: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Feed: undefined;
  PostDetails: { postId: string };
};

export type ChatStackParamList = {
  ChatList: undefined;
  ChatRoom: { 
    roomId: string; 
    roomName: string;
    roomDescription: string;
    regionName: string;
  };
};

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  Settings: undefined;
  MutedUsers: undefined;
  Reports: undefined;
  AdminPanel: undefined;
}; 