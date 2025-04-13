/**
 * Types for component props used throughout the application
 */

export interface AvatarTextProps {
  size: number;
  label: string;
  color?: string;
  style?: any;
}

export interface AvatarImageProps {
  size: number;
  source: any;
  style?: any;
}

export interface ListIconProps {
  color?: string;
  style?: any;
  icon: string;
} 