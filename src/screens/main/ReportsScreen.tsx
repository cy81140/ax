import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Avatar, Button, Chip, ActivityIndicator } from 'react-native-paper';
import { supabase } from '../../services/supabase';
import { theme } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Reports'>;

interface Report {
  id: string;
  type: 'post' | 'comment' | 'user';
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  reported_item: {
    id: string;
    content?: string;
    user?: {
      username: string;
      profile_picture: string | null;
    };
  };
  reporter: {
    username: string;
    profile_picture: string | null;
  };
}

const ReportsScreen = ({ navigation }: Props) => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          reported_item:posts!reports_post_id_fkey(*, user:users(username, profile_picture)),
          reporter:users!reports_reporter_id_fkey(username, profile_picture)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setReports(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'resolved' })
        .eq('id', reportId);

      if (error) throw error;

      setReports(prev =>
        prev.map(report =>
          report.id === reportId
            ? { ...report, status: 'resolved' }
            : report
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve report');
    }
  };

  const handleDismiss = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'dismissed' })
        .eq('id', reportId);

      if (error) throw error;

      setReports(prev =>
        prev.map(report =>
          report.id === reportId
            ? { ...report, status: 'dismissed' }
            : report
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss report');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return theme.colors.warning;
      case 'resolved':
        return theme.colors.success;
      case 'dismissed':
        return theme.colors.error;
      default:
        return theme.colors.onSurface;
    }
  };

  const renderReport = ({ item }: { item: Report }) => (
    <Card style={styles.reportCard}>
      <Card.Content>
        <View style={styles.reportHeader}>
          <Avatar.Image
            size={40}
            source={item.reporter.profile_picture ? { uri: item.reporter.profile_picture } : undefined}
          />
          <View style={styles.reportUserInfo}>
            <Text style={styles.reportUsername}>{item.reporter.username}</Text>
            <Text style={styles.reportDate}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
          <Chip
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={styles.statusText}
          >
            {item.status}
          </Chip>
        </View>

        <Text style={styles.reportType}>Report Type: {item.type}</Text>
        <Text style={styles.reportReason}>Reason: {item.reason}</Text>

        {item.reported_item && (
          <View style={styles.reportedContent}>
            <Text style={styles.reportedContentTitle}>Reported Content:</Text>
            {item.reported_item.content && (
              <Text style={styles.reportedContentText}>{item.reported_item.content}</Text>
            )}
            {item.reported_item.user && (
              <View style={styles.reportedUser}>
                <Avatar.Image
                  size={30}
                  source={item.reported_item.user.profile_picture ? { uri: item.reported_item.user.profile_picture } : undefined}
                />
                <Text style={styles.reportedUsername}>{item.reported_item.user.username}</Text>
              </View>
            )}
          </View>
        )}
      </Card.Content>

      <Card.Actions>
        <Button
          mode="contained"
          onPress={() => handleResolve(item.id)}
          disabled={item.status !== 'pending'}
        >
          Resolve
        </Button>
        <Button
          mode="outlined"
          onPress={() => handleDismiss(item.id)}
          disabled={item.status !== 'pending'}
        >
          Dismiss
        </Button>
      </Card.Actions>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <Text style={styles.error}>{error}</Text>
      )}
      <FlatList
        data={reports}
        renderItem={renderReport}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
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
  listContent: {
    padding: 10,
  },
  reportCard: {
    marginBottom: 10,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reportUserInfo: {
    flex: 1,
    marginLeft: 10,
  },
  reportUsername: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  reportDate: {
    fontSize: 12,
    color: theme.colors.onSurface,
  },
  statusChip: {
    marginLeft: 10,
  },
  statusText: {
    color: theme.colors.white,
  },
  reportType: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  reportReason: {
    fontSize: 14,
    marginBottom: 10,
  },
  reportedContent: {
    marginTop: 10,
    padding: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
  },
  reportedContentTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  reportedContentText: {
    fontSize: 14,
    marginBottom: 10,
  },
  reportedUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportedUsername: {
    marginLeft: 10,
    fontSize: 14,
  },
  error: {
    color: theme.colors.error,
    margin: 10,
    textAlign: 'center',
  },
});

export default ReportsScreen; 