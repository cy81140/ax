/**
 * Types for component props used throughout the application
 */

import { ImageSourcePropType, StyleProp, ViewStyle, TextStyle } from 'react-native';

export interface AvatarTextProps {
  size: number;
  label: string;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export interface AvatarImageProps {
  size: number;
  source: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
}

export interface ListIconProps {
  color?: string;
  style?: StyleProp<ViewStyle>;
  icon: string;
} 