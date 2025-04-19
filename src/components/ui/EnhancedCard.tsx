import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { Card, useTheme } from 'react-native-paper';
import { shadows } from '../../constants/theme';

type EnhancedCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  elevation?: 'small' | 'medium' | 'large' | 'none';
  compact?: boolean;
  borderRadius?: number;
};

/**
 * An enhanced card component with better styling and shadows
 */
const EnhancedCard: React.FC<EnhancedCardProps> = ({
  children,
  style,
  contentStyle,
  elevation = 'medium',
  compact = false,
  borderRadius,
}) => {
  const theme = useTheme();
  
  // Get appropriate shadow style
  const getShadowStyle = () => {
    if (elevation === 'none') return {};
    return shadows[elevation];
  };
  
  // Get border radius - use theme roundness as default if not specified
  const getBorderRadius = () => {
    return borderRadius !== undefined ? borderRadius : theme.roundness;
  };

  return (
    <Card
      style={[
        styles.card,
        getShadowStyle(),
        { 
          backgroundColor: theme.colors.elevation.level2,
          borderRadius: getBorderRadius(),
        },
        compact && styles.compactCard,
        style,
      ]}
    >
      <Card.Content style={[styles.content, compact && styles.compactContent, contentStyle]}>
        {children}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 0,
    marginHorizontal: 0,
    marginVertical: 8,
  },
  compactCard: {
    marginVertical: 4,
  },
  compactContent: {
    padding: 12,
  },
  content: {
    padding: 16,
  },
});

export default EnhancedCard; 