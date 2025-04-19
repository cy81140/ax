import React, { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { Appearance } from 'react-native';
import { darkTheme, lightTheme, ThemeType } from '../constants/theme'; // Make sure ThemeType is exported
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextProps {
  theme: typeof lightTheme | typeof darkTheme;
  themeType: ThemeType;
  toggleTheme: (type: ThemeType) => void;
  isDark: boolean;
}

export const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // **Set initial state to 'dark'**
  const [themeType, setThemeType] = useState<ThemeType>('dark'); 

  // --- Load saved theme preference --- 
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedThemeType = await AsyncStorage.getItem('@themeType') as ThemeType | null;
        if (savedThemeType) {
          setThemeType(savedThemeType);
        } 
        // No else needed - initial state is already 'dark' if nothing is saved
      } catch (e) {
        console.error("Failed to load theme preference.", e);
        // Keep default dark theme on error
      }
    };

    loadThemePreference();
  }, []);

  // --- Save theme preference --- 
  const saveThemePreference = async (newThemeType: ThemeType) => {
    try {
      await AsyncStorage.setItem('@themeType', newThemeType);
    } catch (e) {
      console.error("Failed to save theme preference.", e);
    }
  };

  // --- Toggle Theme Function ---
  const toggleTheme = useCallback((type: ThemeType) => {
    let newThemeType: ThemeType;
    if (type === 'system') {
      const systemTheme = Appearance.getColorScheme() ?? 'light';
      newThemeType = systemTheme;
      setThemeType('system'); // Keep track that user wants system pref
      saveThemePreference('system'); // Save 'system' pref
    } else {
      newThemeType = type;
      setThemeType(type);
      saveThemePreference(type); // Save 'light' or 'dark' pref
    }
  }, []);

  // Determine the actual theme based on themeType state
  const currentTheme = useMemo(() => {
    let resolvedType = themeType;
    if (resolvedType === 'system') {
        resolvedType = Appearance.getColorScheme() ?? 'light';
    }
    return resolvedType === 'dark' ? darkTheme : lightTheme;
  }, [themeType]);
  
  const isDark = currentTheme.dark;

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, themeType, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
}; 