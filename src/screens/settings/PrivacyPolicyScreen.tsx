import React from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import { Appbar, Surface, Paragraph, Title, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const PrivacyPolicyScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const styles = createStyles(theme);

  // TODO: Fetch and display real privacy policy content here.

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Surface style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Privacy Policy" />
        </Appbar.Header>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Title style={styles.title}>Privacy Policy</Title>
          <Paragraph style={styles.paragraph}>
            {/* TODO: Replace with real privacy policy content */}
            Privacy Policy will be available soon.
          </Paragraph>
        </ScrollView>
      </Surface>
    </SafeAreaView>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
  },
  safeArea: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
  },
  title: {
    marginBottom: 16,
  },
});

export default PrivacyPolicyScreen; 