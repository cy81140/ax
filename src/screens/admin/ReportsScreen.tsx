import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { List, Text, Button, Card } from 'react-native-paper';
import { AdminStackScreenProps } from '../../types/navigation';
import { supabase } from '../../lib/supabase';

type Props = AdminStackScreenProps<'Reports'>;

interface Report {
  id: string;
  type: 'post' | 'comment' | 'user';
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  reporter_id: string;
  target_id: string;
  reporter: {
    username: string;
  };
}

const ReportsScreen: React.FC<Props> = ({ navigation }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:reporter_id (
            username
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
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
      fetchReports();
    } catch (error) {
      console.error('Error resolving report:', error);
    }
  };

  const handleDismiss = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'dismissed' })
        .eq('id', reportId);

      if (error) throw error;
      fetchReports();
    } catch (error) {
      console.error('Error dismissing report:', error);
    }
  };

  const renderReport = ({ item }: { item: Report }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium">Report Type: {item.type}</Text>
        <Text variant="bodyMedium">Reason: {item.reason}</Text>
        <Text variant="bodySmall">Reported by: {item.reporter.username}</Text>
        <Text variant="bodySmall">
          Status: {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Text>
        <Text variant="bodySmall">
          Date: {new Date(item.created_at).toLocaleDateString()}
        </Text>
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

  return (
    <View style={styles.container}>
      <FlatList
        data={reports}
        renderItem={renderReport}
        keyExtractor={item => item.id}
        refreshing={loading}
        onRefresh={fetchReports}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
});

export default ReportsScreen; 