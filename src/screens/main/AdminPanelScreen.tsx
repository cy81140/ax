import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, Text, useTheme, Button, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types/navigation';
import { moderationService } from '../../services/moderation';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  totalReports: number;
  activeUsers: number;
}

export const AdminPanelScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    if (!user?.is_admin) {
      setError('Unauthorized access');
      setLoading(false);
      return;
    }

    try {
      const stats = await moderationService.getAdminStats();
      setStats(stats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      setError('Failed to load admin statistics');
    } finally {
      setLoading(false);
    }
  };

  if (!user?.is_admin) {
    return (
      <View style={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>
          Unauthorized Access
        </Text>
        <Text variant="bodyLarge" style={styles.message}>
          You do not have permission to access this page.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>
          Error
        </Text>
        <Text variant="bodyLarge" style={styles.message}>
          {error}
        </Text>
        <Button mode="contained" onPress={fetchStats} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Admin Panel
      </Text>

      <List.Section>
        <List.Subheader>Reports & Moderation</List.Subheader>
        <List.Item
          title={`Reports (${stats?.totalReports || 0})`}
          description="View and handle user reports"
          left={(props: any) => <List.Icon {...props} icon="alert" />}
          onPress={() => navigation.navigate('Reports')}
        />
        <List.Item
          title="User Management"
          description="Manage users and permissions"
          left={(props: any) => <List.Icon {...props} icon="account-group" />}
          onPress={() => navigation.navigate('UserManagement')}
        />
        <List.Item
          title="Content Moderation"
          description="Review and moderate content"
          left={(props: any) => <List.Icon {...props} icon="shield-check" />}
          onPress={() => navigation.navigate('ContentModeration')}
        />
        <List.Item
          title="Analytics"
          description="View platform analytics"
          left={(props: any) => <List.Icon {...props} icon="chart-line" />}
          onPress={() => navigation.navigate('Analytics')}
        />
      </List.Section>

      <List.Section>
        <List.Subheader>System</List.Subheader>
        <List.Item
          title="Settings"
          description="Configure system settings"
          left={(props: any) => <List.Icon {...props} icon="cog" />}
          onPress={() => navigation.navigate('Settings')}
        />
        <List.Item
          title="Database"
          description="Manage database operations"
          left={(props: any) => <List.Icon {...props} icon="database" />}
          onPress={() => navigation.navigate('Database')}
        />
      </List.Section>

      <View style={styles.statsContainer}>
        <Text variant="titleLarge" style={styles.statsTitle}>
          Platform Statistics
        </Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text variant="headlineMedium">{stats?.totalUsers || 0}</Text>
            <Text variant="bodyMedium">Total Users</Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="headlineMedium">{stats?.activeUsers || 0}</Text>
            <Text variant="bodyMedium">Active Users</Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="headlineMedium">{stats?.totalPosts || 0}</Text>
            <Text variant="bodyMedium">Total Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="headlineMedium">{stats?.totalComments || 0}</Text>
            <Text variant="bodyMedium">Total Comments</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    textAlign: 'center',
    marginVertical: 16,
  },
  message: {
    textAlign: 'center',
    marginHorizontal: 16,
  },
  retryButton: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  statsContainer: {
    padding: 16,
  },
  statsTitle: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
}); 