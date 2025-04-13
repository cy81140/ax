import { Dimensions } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';

// Breakpoints
export const breakpoints = {
  small: 375,   // Small phone
  medium: 768,  // Large phone / small tablet
  large: 1024,  // Tablet / small desktop
  xlarge: 1280, // Desktop / large tablet
};

// Helper to generate responsive width based on screen size percentage
export const getResponsiveWidth = (percentage: number) => {
  const { width } = Dimensions.get('window');
  return (width * percentage) / 100;
};

// Helper to generate responsive height based on screen size percentage
export const getResponsiveHeight = (percentage: number) => {
  const { height } = Dimensions.get('window');
  return (height * percentage) / 100;
};

// Generate responsive font size
export const getResponsiveFontSize = (baseFontSize: number) => {
  const { width } = Dimensions.get('window');
  // Scale font based on screen width - minimum size is baseFontSize
  // This creates a slight increase on larger screens but prevents tiny text on small screens
  const scaleFactor = Math.max(1, width / 375); // 375 is baseline (iPhone X width)
  return Math.round(baseFontSize * Math.min(scaleFactor, 1.3)); // Cap scaling at 1.3x
};

// Responsive spacing units (margin, padding)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Get appropriate spacing based on screen size
export const getResponsiveSpacing = (size: keyof typeof spacing) => {
  const { deviceType } = useResponsive();
  const baseSpacing = spacing[size];
  
  // Scale spacing based on device type
  switch (deviceType) {
    case 'desktop':
      return baseSpacing * 1.5;
    case 'tablet':
      return baseSpacing * 1.25;
    default:
      return baseSpacing;
  }
};

// Helper to create responsive styles
export const createResponsiveStyles = (styles: any) => {
  const { deviceType, isWeb } = useResponsive();
  
  // Base styles
  let responsiveStyles = { ...styles.base };
  
  // Add device specific styles
  if (styles[deviceType]) {
    responsiveStyles = { ...responsiveStyles, ...styles[deviceType] };
  }
  
  // Add platform specific styles
  if (isWeb && styles.web) {
    responsiveStyles = { ...responsiveStyles, ...styles.web };
  } else if (!isWeb && styles.native) {
    responsiveStyles = { ...responsiveStyles, ...styles.native };
  }
  
  return responsiveStyles;
}; 