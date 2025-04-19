import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, StyleProp, ViewStyle } from 'react-native';
import { Text, useTheme, ActivityIndicator, Surface, Appbar, List, Avatar, Divider } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { activityService, Activity, getActivityDescription, getUserNotifications } from '../../services/activity';
import { MainStackScreenProps } from '../../types/navigation';
import { formatDistanceToNow } from 'date-fns';

type Props = MainStackScreenProps<'Notifications'>;
type ListItemProps = { color: string; style?: StyleProp<ViewStyle> };

export const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications(user.id);
    }
  }, [user]);

  const fetchNotifications = async (userId: string) => {
    setLoading(true);
    try {
      // Get activities where the user is the target (notifications) instead of activities by the user
      const response = await getUserNotifications(userId);
      setActivities(response.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (actionType: string): string => {
    switch (actionType) {
      case 'new_post':
        return 'file-document-outline';
      case 'new_comment':
        return 'comment-outline';
      case 'like':
        return 'heart';
      case 'follow':
        return 'account-plus';
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
        return 'bell';
    }
  };

  const handleActivityPress = (activity: Activity) => {
    switch (activity.action_type) {
      case 'new_post':
      case 'new_comment':
      case 'like':
      case 'vote_poll':
      case 'create_poll':
        if (activity.target_type === 'post' && activity.target_id) {
          navigation.navigate('PostDetails', { postId: activity.target_id });
        } else {
          console.warn("Missing target_id for post-related activity:", activity.id);
        }
        break;
      case 'follow':
      case 'mention':
        if (activity.actor_id) {
          navigation.navigate('Profile', { userId: activity.actor_id });
        } else {
          console.warn("Missing actor_id for user-related activity:", activity.id);
        }
        break;
      default:
        console.log('Unhandled activity type press:', activity.action_type);
    }
  };

  const renderItem = ({ item }: { item: Activity }) => {
    const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });
    const actorName = item.user?.username || 'Someone';
    const description = getActivityDescription(item.action_type, actorName);
    const icon = getActivityIcon(item.action_type);

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
          : <Avatar.Icon {...props} icon={icon} size={40} />
        )}
      />
    );
  };

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
         <Appbar.Content title="Notifications" />
         <Appbar.Action 
           icon="refresh" 
           onPress={() => user && fetchNotifications(user.id)} 
           disabled={loading} 
         />
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
                            No notifications yet.
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
  centerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
});

export default NotificationsScreen; 