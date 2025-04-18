import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightActions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  onBackPress,
  rightActions,
}) => {
  const theme = useTheme();

  return (
    <Appbar.Header>
      {showBackButton && (
        <Appbar.BackAction onPress={onBackPress} />
      )}
      <View style={styles.titleContainer}>
        <Image 
          source={require('../../assets/app-logo.png')} 
          style={styles.logo} 
        />
        {title && <Appbar.Content title={title} />}
      </View>
      {rightActions}
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  logo: {
    height: 40,
    marginRight: 8,
    width: 40,
  },
  titleContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
});

export default Header; 