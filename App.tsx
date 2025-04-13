import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { theme } from './src/constants/theme';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { Navigation } from './src/navigation';

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <ThemeProvider>
          <AuthProvider>
            <Navigation />
          </AuthProvider>
        </ThemeProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
} 