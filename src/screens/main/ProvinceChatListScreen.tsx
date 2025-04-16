import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ProvinceChatListScreen = () => {
  return (
    <View style={styles.container}>
      <Text>My Province Chats Screen (Placeholder)</Text>
      {/* TODO: Fetch and display list of province chats the user is a member of */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProvinceChatListScreen; 