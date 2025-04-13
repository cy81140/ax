import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/contexts/AuthContext';
import { useAuth } from './src/contexts/AuthContext';
import { LoginScreen } from './src/screens/auth';
import {
  HomeScreen,
  ProfileScreen,
  PostDetailsScreen,
  CreateScreen,
  EditProfileScreen,
  ChatRoomScreen,
  SearchScreen,
  NotificationsScreen,
  SettingsScreen,
  AdminPanelScreen,
} from './src/screens/main';
import { MainStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<MainStackParamList>();

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <Stack.Navigator>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="PostDetails" component={PostDetailsScreen} />
          <Stack.Screen name="CreatePost" component={CreateScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
          <Stack.Screen name="Search" component={SearchScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="AdminPanel" component={AdminPanelScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

const App = () => {
  return (
    <PaperProvider>
      <NavigationContainer>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </NavigationContainer>
    </PaperProvider>
  );
};

export default App; 