import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, ActivityIndicator, useTheme, Avatar } from 'react-native-paper';
import { getUserActivity, Activity } from '../../services/activity';
import { useAuth } from '../../contexts/AuthContext';

export const ActivityFeedScreen = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadActivities(user.id);
    }
  }, [user]);

  const loadActivities = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getUserActivity(userId);
      if (response.error) throw response.error;
      setActivities(response.data || []);
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

    const actorName = item.user?.username || 'Someone';

    switch (item.action_type) {
      case 'post':
        content = `${actorName} created a new post.`;
        icon = 'file-document-outline';
        break;
      case 'comment':
        content = `${actorName} commented.`;
        icon = 'comment-processing-outline';
        break;
      case 'like':
        content = `${actorName} liked something.`;
        icon = 'heart-outline';
        break;
      case 'follow':
        content = `${actorName} started following someone.`;
        icon = 'account-plus-outline';
        break;
      default:
        content = `${actorName} performed an action.`;
        icon = 'help-circle-outline';
    }

    return (
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          {item.user?.profile_picture ? (
            <Avatar.Image size={40} source={{ uri: item.user.profile_picture }} style={styles.avatar} />
          ) : (
            <Avatar.Icon size={40} icon={icon} style={styles.avatar} />
          )}
          <View style={styles.textContainer}>
            <Text style={styles.content}>{content}</Text>
            <Text style={styles.timestamp}>
              {new Date(item.created_at).toLocaleString()}
            </Text>
          </View>
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
      contentContainerStyle={activities.length === 0 ? styles.center : null}
      ListEmptyComponent={!loading ? <Text>No recent activity.</Text> : null}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    marginVertical: 4,
    marginHorizontal: 8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  content: {
    fontSize: 15,
  },
  timestamp: {
    fontSize: 12,
    color: 'grey',
    marginTop: 4,
  },
  error: {
    fontSize: 16,
  },
}); 