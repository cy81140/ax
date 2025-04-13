import React, { createContext, useContext, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { lightTheme, darkTheme } from '../theme';

type ThemeContextType = {
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

/**
 * Inner component that uses the theme context
 */
const ThemedAppContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      {children}
    </SafeAreaProvider>
  );
};

interface ThemedAppProps {
  children: React.ReactNode;
}

/**
 * ThemedApp provides theme context to the entire application
 */
export function ThemedApp({ children }: ThemedAppProps) {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <PaperProvider theme={isDark ? darkTheme : lightTheme}>
        <ThemedAppContent>
          {children}
        </ThemedAppContent>
      </PaperProvider>
    </ThemeContext.Provider>
  );
}

export default ThemedApp; 