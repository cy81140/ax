import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, ActivityIndicator, useTheme } from 'react-native-paper';
import { activityService } from '../../services/activity';
import { Activity } from '../../types/services';

export const ActivityFeedScreen = () => {
  const theme = useTheme();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const data = await activityService.getActivityFeed('current-user-id'); // Replace with actual user ID
      setActivities(data);
    } catch (err) {
      setError('Failed to load activities');
      console.error('Error loading activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderActivity = ({ item }: { item: Activity }) => {
    let content = '';
    let icon = '';

    switch (item.type) {
      case 'post':
        content = `Created a new post: ${item.post?.content}`;
        icon = 'post';
        break;
      case 'comment':
        content = `Commented on a post: ${item.comment?.text}`;
        icon = 'comment';
        break;
      case 'like':
        content = 'Liked a post';
        icon = 'heart';
        break;
      case 'follow':
        content = `Started following ${item.user?.username}`;
        icon = 'account-plus';
        break;
    }

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.content}>{content}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.created_at).toLocaleString()}
          </Text>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={activities}
      renderItem={renderActivity}
      keyExtractor={(item) => item.id}
      style={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    margin: 10,
  },
  content: {
    fontSize: 16,
    marginBottom: 10,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  error: {
    color: 'red',
    fontSize: 16,
  },
}); 