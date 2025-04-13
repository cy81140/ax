import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, Text } from 'react-native-paper';
import { AdminStackScreenProps } from '../../types/navigation';

type Props = AdminStackScreenProps<'AdminPanel'>;

interface ListIconProps {
  color: string;
  size: number;
}

const AdminPanelScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Admin Panel</Text>
      
      <List.Item
        title="Reports"
        description="View and manage user reports"
        left={(props: ListIconProps) => <List.Icon {...props} icon="alert" />}
        onPress={() => navigation.navigate('Reports')}
      />
      
      <List.Item
        title="User Management"
        description="Manage users, roles, and permissions"
        left={(props: ListIconProps) => <List.Icon {...props} icon="account-group" />}
        onPress={() => navigation.navigate('UserManagement')}
      />
      
      <List.Item
        title="Content Moderation"
        description="Review and moderate content"
        left={(props: ListIconProps) => <List.Icon {...props} icon="shield-check" />}
        onPress={() => navigation.navigate('ContentModeration')}
      />
      
      <List.Item
        title="Analytics"
        description="View platform analytics and statistics"
        left={(props: ListIconProps) => <List.Icon {...props} icon="chart-bar" />}
        onPress={() => navigation.navigate('Analytics')}
      />
      
      <List.Item
        title="Database"
        description="Direct database operations and maintenance"
        left={(props: ListIconProps) => <List.Icon {...props} icon="database" />}
        onPress={() => navigation.navigate('Database')}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default AdminPanelScreen; 