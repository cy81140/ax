import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, ActivityIndicator, useTheme, Avatar } from 'react-native-paper';
import { getUserActivity, Activity, getActivityDescription } from '../../services/activity';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

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

  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case 'new_post':
        return 'file-document-outline';
      case 'new_comment':
        return 'comment-processing-outline';
      case 'like':
        return 'heart-outline';
      case 'follow':
        return 'account-plus-outline';
      case 'mention':
        return 'at';
      case 'reply':
        return 'reply';
      case 'repost':
        return 'repeat';
      case 'create_poll':
        return 'poll';
      case 'vote_poll':
        return 'vote';
      default:
        return 'help-circle-outline';
    }
  };

  const renderActivity = ({ item }: { item: Activity }) => {
    const icon = getActivityIcon(item.action_type);
    const actorName = item.user?.username || 'Someone';
    const content = getActivityDescription(item.action_type, actorName);
    const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });

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
            <Text style={styles.timestamp}>{timeAgo}</Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
  avatar: {
    marginRight: 12,
  },
  card: {
    marginHorizontal: 8,
    marginVertical: 4,
  },
  cardContent: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    flex: 1,
  },
  content: {
    fontSize: 15,
  },
  error: {
    fontSize: 16,
  },
  textContainer: {
    flex: 1,
  },
  timestamp: {
    color: 'grey',
    fontSize: 12,
    marginTop: 4,
  },
}); 