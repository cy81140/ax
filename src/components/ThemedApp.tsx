import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { Navigation } from '../navigation';

/**
 * Inner component that uses the theme context
 */
const ThemedAppContent = () => {
  const { theme, isDarkMode } = useTheme();
  
  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <Navigation />
      </SafeAreaProvider>
    </PaperProvider>
  );
};

/**
 * ThemedApp provides theme context to the entire application
 */
export const ThemedApp = () => {
  return (
    <ThemeProvider>
      <ThemedAppContent />
    </ThemeProvider>
  );
};

export default ThemedApp; 