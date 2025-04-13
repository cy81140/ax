import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList, RootStackParamList } from './src/types/navigation';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { theme } from './src/constants/theme';
import { LoginScreen, RegisterScreen } from './src/screens/auth';
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

// Create separate stack navigators for better typing
const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

// Auth Navigator component
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen as React.ComponentType<any>} />
    </AuthStack.Navigator>
  );
};

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // Show loading screen
    return null;
  }

  return (
    <NavigationContainer>
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

const MainStack = createNativeStackNavigator();

const MainNavigator = () => {
  return (
    <MainStack.Navigator>
      <MainStack.Screen name="Home" component={HomeScreen} />
      <MainStack.Screen name="Profile" component={ProfileScreen} />
      <MainStack.Screen name="PostDetails" component={PostDetailsScreen as React.ComponentType<any>} />
      <MainStack.Screen name="CreatePost" component={CreateScreen} />
      <MainStack.Screen name="EditProfile" component={EditProfileScreen} />
      <MainStack.Screen name="ChatRoom" component={ChatRoomScreen as React.ComponentType<any>} />
      <MainStack.Screen name="Search" component={SearchScreen} />
      <MainStack.Screen name="Notifications" component={NotificationsScreen as React.ComponentType<any>} />
      <MainStack.Screen name="Settings" component={SettingsScreen} />
      <MainStack.Screen name="AdminPanel" component={AdminPanelScreen} />
    </MainStack.Navigator>
  );
};

// Export the MainNavigator for use in other files
export { MainNavigator };

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
} 