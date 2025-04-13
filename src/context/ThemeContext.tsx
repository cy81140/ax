import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '../constants/theme';

type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: typeof lightTheme | typeof darkTheme;
  themeType: ThemeType;
  setThemeType: (type: ThemeType) => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  themeType: 'system',
  setThemeType: () => {},
  isDarkMode: false,
});

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const colorScheme = useColorScheme();
  const [themeType, setThemeType] = useState<ThemeType>('system');
  
  // Determine the current theme based on themeType and system preference
  const getTheme = () => {
    if (themeType === 'system') {
      return colorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return themeType === 'dark' ? darkTheme : lightTheme;
  };
  
  const [theme, setTheme] = useState(getTheme());
  const isDarkMode = theme === darkTheme;
  
  // Update theme when theme type or system preference changes
  useEffect(() => {
    setTheme(getTheme());
  }, [themeType, colorScheme]);
  
  return (
    <ThemeContext.Provider value={{ theme, themeType, setThemeType, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme
export const useTheme = () => useContext(ThemeContext);

export default ThemeContext; 