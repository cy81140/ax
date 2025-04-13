import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, List, Divider, ActivityIndicator } from 'react-native-paper';
import { supabase } from '../../services/supabase';
import { theme } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'AdminPanel'>;

interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  totalReports: number;
  activeUsers: number;
}

const AdminPanelScreen = ({ navigation }: Props) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    totalReports: 0,
    activeUsers: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get total users
      const { count: totalUsers, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Get total posts
      const { count: totalPosts, error: postsError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

      if (postsError) throw postsError;

      // Get total comments
      const { count: totalComments, error: commentsError } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true });

      if (commentsError) throw commentsError;

      // Get total reports
      const { count: totalReports, error: reportsError } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true });

      if (reportsError) throw reportsError;

      // Get active users (users who posted in the last 7 days)
      const { count: activeUsers, error: activeUsersError } = await supabase
        .from('posts')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (activeUsersError) throw activeUsersError;

      setStats({
        totalUsers: totalUsers || 0,
        totalPosts: totalPosts || 0,
        totalComments: totalComments || 0,
        totalReports: totalReports || 0,
        activeUsers: activeUsers || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {error && (
        <Text style={styles.error}>{error}</Text>
      )}

      <Card style={styles.statsCard}>
        <Card.Content>
          <Text style={styles.statsTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalUsers}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.activeUsers}</Text>
              <Text style={styles.statLabel}>Active Users</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalPosts}</Text>
              <Text style={styles.statLabel}>Total Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalComments}</Text>
              <Text style={styles.statLabel}>Total Comments</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.actionsCard}>
        <Card.Content>
          <Text style={styles.actionsTitle}>Quick Actions</Text>
          <List.Section>
            <List.Item
              title="Manage Reports"
              description="View and handle user reports"
              left={props => <List.Icon {...props} icon="alert" />}
              onPress={() => navigation.navigate('Reports')}
            />
            <Divider />
            <List.Item
              title="User Management"
              description="Manage user accounts and permissions"
              left={props => <List.Icon {...props} icon="account-group" />}
              onPress={() => navigation.navigate('UserManagement')}
            />
            <Divider />
            <List.Item
              title="Content Moderation"
              description="Review and moderate content"
              left={props => <List.Icon {...props} icon="shield-check" />}
              onPress={() => navigation.navigate('ContentModeration')}
            />
            <Divider />
            <List.Item
              title="Analytics"
              description="View detailed analytics and insights"
              left={props => <List.Icon {...props} icon="chart-line" />}
              onPress={() => navigation.navigate('Analytics')}
            />
          </List.Section>
        </Card.Content>
      </Card>

      <Card style={styles.settingsCard}>
        <Card.Content>
          <Text style={styles.settingsTitle}>Admin Settings</Text>
          <List.Section>
            <List.Item
              title="System Settings"
              description="Configure system-wide settings"
              left={props => <List.Icon {...props} icon="cog" />}
              onPress={() => navigation.navigate('SystemSettings')}
            />
            <Divider />
            <List.Item
              title="Backup & Restore"
              description="Manage data backup and restoration"
              left={props => <List.Icon {...props} icon="database" />}
              onPress={() => navigation.navigate('BackupRestore')}
            />
          </List.Section>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: theme.colors.error,
    margin: 10,
    textAlign: 'center',
  },
  statsCard: {
    margin: 10,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    padding: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.onSurface,
    marginTop: 5,
  },
  actionsCard: {
    margin: 10,
  },
  actionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  settingsCard: {
    margin: 10,
    marginBottom: 20,
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
});

export default AdminPanelScreen; 