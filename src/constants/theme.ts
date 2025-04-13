import { MD3LightTheme as DefaultLightTheme, MD3DarkTheme as DefaultDarkTheme } from 'react-native-paper';
import { Appearance } from 'react-native';

const colorPalette = {
  // Primary colors
  primary: '#4A90E2',
  primaryDark: '#3A80D2',
  primaryLight: '#62B1F6',
  
  // Secondary colors
  secondary: '#9013FE',
  secondaryDark: '#7A03EE',
  secondaryLight: '#B162F6',
  
  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  lightGray: '#F5F5F5',
  mediumGray: '#DDDDDD',
  darkGray: '#333333',
  
  // Feedback colors
  error: '#B00020',
  errorDark: '#CF6679',
  success: '#4CAF50',
  warning: '#FF9800',
  info: '#2196F3',
};

export const lightTheme = {
  ...DefaultLightTheme,
  dark: false,
  roundness: 8,
  colors: {
    ...DefaultLightTheme.colors,
    primary: colorPalette.primary,
    primaryContainer: colorPalette.primaryLight,
    secondary: colorPalette.secondary,
    secondaryContainer: colorPalette.secondaryLight,
    background: colorPalette.white,
    surface: colorPalette.lightGray,
    surfaceVariant: colorPalette.mediumGray,
    text: colorPalette.darkGray,
    onSurface: colorPalette.darkGray,
    error: colorPalette.error,
    errorContainer: '#FFEBEE',
    success: colorPalette.success,
    warning: colorPalette.warning,
    info: colorPalette.info,
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
  animation: {
    scale: 1.0,
  },
};

export const darkTheme = {
  ...DefaultDarkTheme,
  dark: true,
  roundness: 8,
  colors: {
    ...DefaultDarkTheme.colors,
    primary: colorPalette.primaryLight,
    primaryContainer: colorPalette.primary,
    secondary: colorPalette.secondaryLight,
    secondaryContainer: colorPalette.secondary,
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2C2C2C',
    text: '#E1E1E1',
    onSurface: '#E1E1E1',
    error: colorPalette.errorDark,
    errorContainer: '#370B1E',
    success: '#81C784',
    warning: '#FFB74D',
    info: '#64B5F6',
    backdrop: 'rgba(0, 0, 0, 0.7)',
  },
  animation: {
    scale: 1.0,
  },
};

// Export types used by ThemeContext
export type ThemeType = 'light' | 'dark' | 'system';

// Export the theme for backward compatibility
export const theme = Appearance.getColorScheme() === 'dark' ? darkTheme : lightTheme;

// Typography styles
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 0.25,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0,
  },
  h3: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.15,
  },
  subtitle1: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.15,
  },
  subtitle2: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  body1: {
    fontSize: 16,
    letterSpacing: 0.5,
  },
  body2: {
    fontSize: 14,
    letterSpacing: 0.25,
  },
  button: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1.25,
    textTransform: 'uppercase',
  },
  caption: {
    fontSize: 12,
    letterSpacing: 0.4,
  },
  overline: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
};

// Common shadows for elevation
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2.5,
    elevation: 3,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
}; 