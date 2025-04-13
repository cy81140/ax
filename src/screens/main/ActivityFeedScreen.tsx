import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Avatar, Card, Divider, ActivityIndicator } from 'react-native-paper';
import { theme } from '../../constants/theme';
import { getActivityFeed, ActivityItem, subscribeToActivity } from '../../services/activity';
import { formatDistanceToNow } from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ActivityFeedScreen = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadActivities = useCallback(async () => {
    try {
      setError(null);
      const { data, error } = await getActivityFeed();
      
      if (error) throw error;
      
      if (data) {
        setActivities(data);
      }
    } catch (err) {
      console.error('Error loading activities:', err);
      setError('Unable to load activity feed. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load initial activities
  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // Subscribe to real-time updates
  useEffect(() => {
    const subscription = subscribeToActivity((payload) => {
      if (payload.eventType === 'INSERT') {
        // Add new activity to the list
        const newActivity = payload.new;
        setActivities((prev) => [newActivity, ...prev]);
      }
    });

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadActivities();
  };

  const renderActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'new_post':
        return <MaterialCommunityIcons name="file-document-outline" size={24} color={theme.colors.primary} />;
      case 'new_comment':
        return <MaterialCommunityIcons name="comment-outline" size={24} color={theme.colors.primary} />;
      case 'like':
        return <MaterialCommunityIcons name="heart-outline" size={24} color={theme.colors.primary} />;
      case 'follow':
        return <MaterialCommunityIcons name="account-plus-outline" size={24} color={theme.colors.primary} />;
      default:
        return <MaterialCommunityIcons name="bell-outline" size={24} color={theme.colors.primary} />;
    }
  };

  const renderActivityText = (item: ActivityItem) => {
    switch (item.type) {
      case 'new_post':
        return (
          <Text>
            <Text style={styles.username}>{item.actor.username}</Text> created a new post
          </Text>
        );
      case 'new_comment':
        return (
          <Text>
            <Text style={styles.username}>{item.actor.username}</Text> commented on a post
          </Text>
        );
      case 'like':
        return (
          <Text>
            <Text style={styles.username}>{item.actor.username}</Text> liked a post
          </Text>
        );
      case 'follow':
        return (
          <Text>
            <Text style={styles.username}>{item.actor.username}</Text> followed{' '}
            {item.target_user ? <Text style={styles.username}>{item.target_user.username}</Text> : 'someone'}
          </Text>
        );
      default:
        return <Text>Unknown activity</Text>;
    }
  };

  const renderItem = ({ item }: { item: ActivityItem }) => {
    return (
      <Card style={styles.card} mode="outlined">
        <Card.Title
          title={renderActivityText(item)}
          subtitle={formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          left={(props: any) => 
            item.actor.profile_picture ? (
              <Avatar.Image {...props} size={40} source={{ uri: item.actor.profile_picture }} />
            ) : (
              <Avatar.Text 
                {...props} 
                size={40} 
                label={item.actor.username.charAt(0).toUpperCase()} 
              />
            )
          }
          right={(props: any) => renderActivityIcon(item.type)}
        />
        {item.target_content && (
          <Card.Content>
            <Text style={styles.contentPreview}>
              {item.target_content.length > 100
                ? `${item.target_content.substring(0, 100)}...`
                : item.target_content}
            </Text>
          </Card.Content>
        )}
      </Card>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading activities...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activity Feed</Text>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="bell-off-outline" size={64} color={theme.colors.outline} />
            <Text style={styles.emptyText}>No activities yet</Text>
            <Text>Activities will appear here as users interact with the app</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: theme.colors.primary,
  },
  card: {
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
  },
  listContent: {
    paddingBottom: 16,
  },
  username: {
    fontWeight: 'bold',
  },
  contentPreview: {
    marginTop: 8,
    opacity: 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: theme.colors.primary,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorContainer: {
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#ffebee',
    borderRadius: 4,
  },
  errorText: {
    color: '#c62828',
  },
});

export default ActivityFeedScreen; 