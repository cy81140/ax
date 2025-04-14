import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, useTheme, ActivityIndicator, Surface, Appbar, List, Avatar, Divider } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { activityService, Activity } from '../../services/activity';
import { MainStackScreenProps } from '../../types/navigation';
import { formatDistanceToNow } from 'date-fns';

type Props = MainStackScreenProps<'Notifications'>;
type ListItemProps = { color: string; style?: any };

export const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
        fetchActivities(user.id);
    }
  }, [user]);

  const fetchActivities = async (userId: string) => {
    setLoading(true);
    try {
      const data = await activityService.getActivitiesByUserId(userId);
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityDescription = (activity: Activity): string => {
    const actorName = activity.user?.username || 'Someone';
    switch (activity.action_type) {
      case 'post':
        return `${actorName} created a new post.`;
      case 'comment':
        return `${actorName} commented.`;
      case 'like':
        return `${actorName} liked something.`;
      case 'follow':
        return `${actorName} started following you.`;
      default:
        return `${actorName} performed an action.`;
    }
  };

  const handleActivityPress = (activity: Activity) => {
    switch (activity.action_type) {
      case 'post':
      case 'comment':
      case 'like':
        if (activity.target_id) {
            console.log("Navigating to Post:", activity.target_id);
        } else {
            console.warn("Missing target_id for post/comment/like activity:", activity.id);
        }
        break;
      case 'follow':
        if (activity.actor_id) {
             console.log("Navigating to User Profile:", activity.actor_id);
        } else {
             console.warn("Missing actor_id for follow activity:", activity.id);
        }
        break;
      default:
        console.log('Unhandled activity type press:', activity.action_type);
    }
  };

  const renderItem = ({ item }: { item: Activity }) => {
    const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });
    const description = getActivityDescription(item);

    return (
      <List.Item
        title={description}
        description={timeAgo}
        titleNumberOfLines={2}
        descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
        onPress={() => handleActivityPress(item)}
        left={(props: ListItemProps) => (
          item.user?.profile_picture
          ? <Avatar.Image {...props} source={{ uri: item.user.profile_picture }} size={40} />
          : <Avatar.Icon {...props} icon="account-circle" size={40} />
        )}
      />
    );
  }

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
         <Appbar.Content title="Activity" />
         <Appbar.Action icon="refresh" onPress={() => user && fetchActivities(user.id)} disabled={loading} />
      </Appbar.Header>

      {loading && activities.length === 0 ? (
          <View style={styles.centerContainer}>
             <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
          </View>
      ) : (
          <FlatList
            data={activities}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <Divider />}
            ListEmptyComponent={(
                !loading ? (
                    <View style={styles.centerContainer}>
                        <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                            No recent activity.
                        </Text>
                    </View>
                ) : null
            )}
          />
      )}
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
});

export default NotificationsScreen; 