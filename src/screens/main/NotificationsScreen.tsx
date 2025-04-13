import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { activityService } from '../../services/activity';
import { Activity } from '../../types/services';
import { MainStackScreenProps } from '../../types/navigation';

type Props = MainStackScreenProps<'Notifications'>;

export const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const data = await activityService.getActivityFeed(user?.id || '');
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityTitle = (activity: Activity) => {
    switch (activity.type) {
      case 'post':
        return 'New post';
      case 'comment':
        return 'New comment';
      case 'like':
        return 'New like';
      case 'follow':
        return 'New follower';
      default:
        return 'New activity';
    }
  };

  const handleActivityPress = (activity: Activity) => {
    if (activity.post) {
      navigation.navigate('PostDetails', { postId: activity.post.id });
    } else if (activity.comment) {
      navigation.navigate('PostDetails', {
        postId: activity.comment.post_id,
        commentId: activity.comment.id,
      });
    } else if (activity.user) {
      navigation.navigate('Profile', { userId: activity.user.id });
    }
  };

  const renderItem = ({ item }: { item: Activity }) => (
    <View style={styles.activityItem}>
      <Text variant="bodyMedium">{getActivityTitle(item)}</Text>
      <Text variant="bodySmall" style={styles.timestamp}>
        {new Date(item.created_at).toLocaleString()}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={activities}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  activityItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  timestamp: {
    color: '#666',
    marginTop: 4,
  },
}); 