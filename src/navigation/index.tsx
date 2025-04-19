import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { DefaultTheme } from '@react-navigation/native';
import { useTheme } from 'react-native-paper';

// Import the navigation types
import { 
  RootStackParamList, 
  AuthStackParamList, 
  MainStackParamList, 
  MainTabParamList 
} from './types';

// Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import RegionListScreen from '../screens/main/RegionListScreen';
import ProvinceListScreen from '../screens/main/ProvinceListScreen';
import ProvinceChatRoomScreen from '../screens/main/ProvinceChatRoomScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import ProvinceChatListScreen from '../screens/main/ProvinceChatListScreen';
import CreateScreen from '../screens/main/CreateScreen';
import FeedScreen from '../screens/main/FeedScreen';
import ActivityScreen from '../screens/main/ActivityScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import PostDetailsScreen from '../screens/main/PostDetailsScreen';
import TermsScreen from '../screens/settings/TermsScreen';
import PrivacyPolicyScreen from '../screens/settings/PrivacyPolicyScreen';
import MutedUsersScreen from '../screens/settings/MutedUsersScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

// Placeholder for Loading Screen if needed
import { View, ActivityIndicator } from 'react-native';
const LoadingScreen = () => {
    const theme = useTheme();
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
    );
};

const RootStack = createStackNavigator<RootStackParamList>();
const AuthNavStack = createStackNavigator<AuthStackParamList>();
const MainNavStack = createStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// --- Main Bottom Tab Navigator ---
const MainNavigator = () => {
  const theme = useTheme();
  return (
    <Tab.Navigator
      initialRouteName="Home" 
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: React.ComponentProps<typeof MaterialCommunityIcons>['name'] = 'help-circle'; 

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Chats') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'account-circle' : 'account-circle-outline';
          } else if (route.name === 'Create') {
            iconName = focused ? 'plus-circle' : 'plus-circle-outline';
          } else if (route.name === 'Activity') {
            iconName = focused ? 'bell' : 'bell-outline';
          }

          // Return icon with updated styling
          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary, 
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: { 
            backgroundColor: theme.colors.elevation.level2, 
            borderTopWidth: 0,
            elevation: 0,
            height: 60,
            paddingTop: 8,
            paddingBottom: 10,
        },
        headerStyle: { 
            backgroundColor: theme.colors.elevation.level2,
            shadowColor: 'transparent' 
        },
        headerTintColor: theme.colors.onSurface,
        tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
        },
      })}
    >
      <Tab.Screen 
          name="Home" 
          component={FeedScreen} 
          options={{ title: 'Home' }} 
      />
      <Tab.Screen 
          name="Create" 
          component={CreateScreen} 
          options={{ title: 'Create' }} 
      />
      <Tab.Screen 
          name="Chats" 
          component={RegionListScreen} 
          options={{ title: 'Regions' }} 
      />
      <Tab.Screen 
          name="Activity" 
          component={ActivityScreen} 
          options={{ title: 'Activity' }} 
      />
      <Tab.Screen 
          name="ProfileTab" 
          component={ProfileScreen} 
          options={{ title: 'Profile' }} 
      />
    </Tab.Navigator>
  );
};

// --- Root App Navigator (Handles Auth vs Main) ---
const AppNavigator = () => {
  const { user, loading } = useAuth();
  const theme = useTheme();

  // Create a navigation theme based on the Paper theme
  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.onSurface,
      border: theme.colors.outline,
      notification: theme.colors.error,
    },
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer theme={navTheme}> 
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <RootStack.Screen name="Main" component={MainStack} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthStack} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

// --- Auth Stack ---
const AuthStack = () => {
  const theme = useTheme();
  return (
    <AuthNavStack.Navigator 
      initialRouteName="Login"
      screenOptions={{
          headerStyle: { backgroundColor: theme.colors.elevation.level2 },
          headerTintColor: theme.colors.onSurface,
          cardStyle: { backgroundColor: theme.colors.background }, 
      }}
    >
      <AuthNavStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <AuthNavStack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
      <AuthNavStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Reset Password' }} />
      <AuthNavStack.Screen name="TermsOfService" component={TermsScreen} options={{ title: 'Terms of Service' }} />
      <AuthNavStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Privacy Policy' }} />
    </AuthNavStack.Navigator>
  );
};

// --- Main Stack (Includes Tabs and other screens) ---
const MainStack = () => {
  const theme = useTheme();
  
  return (
    <MainNavStack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
          headerStyle: { backgroundColor: theme.colors.elevation.level2 },
          headerTintColor: theme.colors.onSurface,
          cardStyle: { backgroundColor: theme.colors.background }, 
      }}
    >
      <MainNavStack.Screen name="MainTabs" component={MainNavigator} options={{ headerShown: false }} />
      <MainNavStack.Screen 
          name="ProvinceList" 
          component={ProvinceListScreen} 
          options={({ route }) => ({ 
            title: route.params.regionName || 'Provinces' 
          })} 
      />
      <MainNavStack.Screen name="ProvinceChatRoom" component={ProvinceChatRoomScreen} options={{ headerShown: false }} />
      <MainNavStack.Screen name="Profile" component={ProfileScreen} />
      <MainNavStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <MainNavStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings', headerShown: false }} />
      <MainNavStack.Screen name="MutedUsers" component={MutedUsersScreen} options={{ title: 'Muted Users' }} />
      <MainNavStack.Screen name="Reports" component={TermsScreen} options={{ title: 'Reports' }} />
      <MainNavStack.Screen name="AdminPanel" component={AdminPanelScreen} options={{ title: 'Admin Panel' }} />
      <MainNavStack.Screen name="PostDetails" component={PostDetailsScreen} options={{ title: 'Post Details' }} />
      <MainNavStack.Screen name="TermsOfService" component={TermsScreen} options={{ title: 'Terms of Service' }} />
      <MainNavStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Privacy Policy' }} />
    </MainNavStack.Navigator>
  );
};

export default AppNavigator;