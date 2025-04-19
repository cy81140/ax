import React from 'react';
import { StatusBar } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider, useAppTheme } from './src/contexts/ThemeContext';
import AppNavigator from './src/navigation';

// Create an inner component to use the theme context
const ThemedApp = () => {
  const { theme, isDark } = useAppTheme();
  
  return (
    <PaperProvider theme={theme}>
      <StatusBar 
        backgroundColor={theme.colors.elevation.level2} 
        barStyle={isDark ? "light-content" : "dark-content"} 
      />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </PaperProvider>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
} 