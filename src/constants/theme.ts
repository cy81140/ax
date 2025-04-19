import { MD3LightTheme as DefaultLightTheme, MD3DarkTheme as DefaultDarkTheme } from 'react-native-paper';
import { Appearance } from 'react-native';

// Enhanced color palette with more modern colors
const colorPalette = {
  // Primary (Enhanced Green)
  primaryGreen: '#1DD1A1',
  primaryGreenDark: '#10AC84',
  primaryGreenLight: '#48DBAD',
  
  // Secondary (Purple/Blue)
  secondaryPurple: '#786CE9',
  secondaryPurpleDark: '#6155D4',
  secondaryPurpleLight: '#9A90F2',
  
  // Accent (Coral)
  accentCoral: '#FF6B6B',
  accentCoralLight: '#FF8E8E',
  accentCoralDark: '#E05050',
  
  // Dark Backgrounds
  darkBgPrimary: '#1E2235',  // Deeper, more premium dark
  darkBgSecondary: '#2A2D3F', // Slightly lighter surface
  darkBgTertiary: '#3E4160',  // Card backgrounds
  darkBgQuaternary: '#4F537A', // Elevated components
  
  // Light Backgrounds
  lightBgPrimary: '#FFFFFF',
  lightBgSecondary: '#F8F9FA',
  lightBgTertiary: '#F1F3F5',
  
  // Text
  textLight: '#FFFFFF',
  textLightSecondary: '#E5E5E5',
  textDark: '#1A1A1A',
  textDarkSecondary: '#555555',
  textMuted: '#999999',
  
  // Status colors
  success: '#4CAF50',
  successLight: '#E8F5E9',
  warning: '#FFAB00',
  warningLight: '#FFF8E1',
  info: '#2196F3',
  infoLight: '#E3F2FD',
  error: '#F44336',
  errorLight: '#FFEBEE',
  errorDark: '#D32F2F',
};

// Gradient presets for components
export const gradients = {
  primary: ['#1DD1A1', '#10AC84'],
  secondary: ['#786CE9', '#6155D4'],
  accent: ['#FF6B6B', '#E05050'],
  success: ['#4CAF50', '#2E7D32'],
  info: ['#2196F3', '#1565C0'],
  warning: ['#FFAB00', '#F57C00'],
  error: ['#F44336', '#C62828'],
  darkHeader: ['#1E2235', '#2A2D3F'],
  card: ['#3E4160', '#4F537A'],
};

// Enhanced Light Theme
export const lightTheme = {
  ...DefaultLightTheme,
  dark: false,
  roundness: 12,
  colors: {
    ...DefaultLightTheme.colors,
    primary: colorPalette.primaryGreen,
    primaryContainer: colorPalette.primaryGreenLight,
    onPrimaryContainer: colorPalette.textDark,
    secondary: colorPalette.secondaryPurple,
    secondaryContainer: colorPalette.secondaryPurpleLight,
    onSecondaryContainer: colorPalette.textLight,
    tertiary: colorPalette.accentCoral,
    tertiaryContainer: colorPalette.accentCoralLight,
    background: colorPalette.lightBgPrimary,
    surface: colorPalette.lightBgSecondary,
    surfaceVariant: colorPalette.lightBgTertiary,
    onSurface: colorPalette.textDark,
    onSurfaceVariant: colorPalette.textDarkSecondary,
    text: colorPalette.textDark,
    outline: colorPalette.textMuted,
    error: colorPalette.error,
    errorContainer: colorPalette.errorLight,
    success: colorPalette.success,
    successContainer: colorPalette.successLight,
    warning: colorPalette.warning,
    warningContainer: colorPalette.warningLight,
    info: colorPalette.info,
    infoContainer: colorPalette.infoLight,
    backdrop: 'rgba(0, 0, 0, 0.3)',
    // Enhanced elevation
    elevation: {
      level0: 'transparent',
      level1: colorPalette.lightBgPrimary,
      level2: colorPalette.lightBgSecondary,
      level3: colorPalette.lightBgTertiary,
      level4: colorPalette.lightBgTertiary,
      level5: colorPalette.lightBgTertiary,
    },
  },
  animation: {
    scale: 1.0,
  },
};

// Enhanced Dark Theme
export const darkTheme = {
  ...DefaultDarkTheme,
  dark: true,
  roundness: 12,
  colors: {
    ...DefaultDarkTheme.colors,
    primary: colorPalette.primaryGreen,
    primaryContainer: colorPalette.primaryGreenDark,
    onPrimaryContainer: colorPalette.textLight,
    secondary: colorPalette.secondaryPurple,
    secondaryContainer: colorPalette.secondaryPurpleDark,
    onSecondaryContainer: colorPalette.textLight,
    tertiary: colorPalette.accentCoral,
    tertiaryContainer: colorPalette.accentCoralDark,
    onTertiaryContainer: colorPalette.textLight,
    background: colorPalette.darkBgPrimary,
    surface: colorPalette.darkBgSecondary,
    surfaceVariant: colorPalette.darkBgTertiary,
    onSurface: colorPalette.textLight,
    onSurfaceVariant: colorPalette.textLightSecondary,
    text: colorPalette.textLight,
    outline: colorPalette.textMuted,
    error: colorPalette.errorDark,
    errorContainer: '#370B1E',
    success: colorPalette.success,
    warning: colorPalette.warning,
    info: colorPalette.info,
    backdrop: 'rgba(0, 0, 0, 0.7)',
    // Enhanced elevation
    elevation: {
      level0: 'transparent',
      level1: colorPalette.darkBgPrimary,
      level2: colorPalette.darkBgSecondary,
      level3: colorPalette.darkBgTertiary,
      level4: colorPalette.darkBgQuaternary,
      level5: '#636790',
    },
    // Component-specific colors
    card: colorPalette.darkBgTertiary,
    sentMessageBackground: colorPalette.primaryGreen,
    receivedMessageBackground: colorPalette.darkBgTertiary,
  },
  animation: {
    scale: 1.0,
  },
};

// Export types used by ThemeContext
export type ThemeType = 'light' | 'dark' | 'system';

// Export the theme for backward compatibility - Deprecate this?
export const theme = Appearance.getColorScheme() === 'dark' ? darkTheme : lightTheme;

// Enhanced typography styles with modern font sizes
export const typography = {
  h1: {
    fontSize: 34,
    fontWeight: 'bold',
    letterSpacing: 0.25,
    lineHeight: 44,
  },
  h2: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 0,
    lineHeight: 36,
  },
  h3: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 0.15,
    lineHeight: 30,
  },
  subtitle1: {
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 0.15,
    lineHeight: 26,
  },
  subtitle2: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.1,
    lineHeight: 24,
  },
  body1: {
    fontSize: 16,
    letterSpacing: 0.5,
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    letterSpacing: 0.25,
    lineHeight: 20,
  },
  button: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1.25,
    textTransform: 'uppercase',
  },
  caption: {
    fontSize: 12,
    letterSpacing: 0.4,
    lineHeight: 16,
  },
  overline: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    lineHeight: 14,
  },
};

// Enhanced shadows for more premium look
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
}; 