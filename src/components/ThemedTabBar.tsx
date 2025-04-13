import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../context/ThemeContext';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Text } from 'react-native-paper';

/**
 * A custom themed tab bar component that applies consistent theme styling
 */
export const ThemedTabBar: React.FC<BottomTabBarProps> = ({ 
  state,
  descriptors,
  navigation 
}) => {
  const { theme, isDarkMode } = useTheme();
  
  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.colors.surface,
        borderTopColor: theme.colors.surfaceVariant,
      }
    ]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || options.title || route.name;
        const isFocused = state.index === index;

        // Get the icon component
        const Icon = options.tabBarIcon ? 
          options.tabBarIcon({ 
            color: isFocused ? theme.colors.primary : theme.colors.onSurface, 
            size: 24,
            focused: isFocused 
          }) : null;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            // The `merge: true` option makes sure that the params inside the tab screen are preserved
            navigation.navigate({ name: route.name, merge: true, params: {} });
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabButton}
          >
            {Icon}
            <Text
              style={[
                styles.label,
                { 
                  color: isFocused ? theme.colors.primary : theme.colors.onSurface,
                  opacity: isFocused ? 1 : 0.7
                }
              ]}
            >
              {label as string}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 60,
    borderTopWidth: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default ThemedTabBar; 