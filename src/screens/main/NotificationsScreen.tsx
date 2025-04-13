import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { List, Text, useTheme, Avatar, Divider, Button } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { Notification } from '../../types/services';
import { supabase } from '../../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export const NotificationsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      setError(null);
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          sender:users!sender_id(*),
          post:posts(*),
          comment:comments(*)
        `)
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${user?.id}`,
      }, (payload: { new: Notification }) => {
        const newNotification = payload.new;
        setNotifications(prev => [newNotification, ...prev]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: Notification) => {
    try {
      // Mark as read
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notification.id);

      if (error) throw error;

      // Navigate based on notification type
      switch (notification.type) {
        case 'post_like':
        case 'post_comment':
          if (notification.post_id) {
            navigation.navigate('PostDetails', { postId: notification.post_id });
          }
          break;
        case 'follow':
          if (notification.sender_id) {
            navigation.navigate('Profile', { userId: notification.sender_id });
          }
          break;
        case 'comment_reply':
          if (notification.post_id) {
            navigation.navigate('PostDetails', {
              postId: notification.post_id,
              commentId: notification.comment_id,
            });
          }
          break;
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    let title = '';
    let description = '';
    let icon = '';

    switch (item.type) {
      case 'post_like':
        title = `${item.sender?.username} liked your post`;
        description = item.post?.content?.substring(0, 50) || '';
        icon = 'heart';
        break;
      case 'post_comment':
        title = `${item.sender?.username} commented on your post`;
        description = item.comment?.text?.substring(0, 50) || '';
        icon = 'comment';
        break;
      case 'follow':
        title = `${item.sender?.username} started following you`;
        icon = 'account-plus';
        break;
      case 'comment_reply':
        title = `${item.sender?.username} replied to your comment`;
        description = item.comment?.text?.substring(0, 50) || '';
        icon = 'reply';
        break;
    }

    return (
      <>
        <List.Item
          title={title}
          description={description}
          left={(props: any) => (
            <Avatar.Image
              {...props}
              size={40}
              source={
                item.sender?.profile_picture
                  ? { uri: item.sender.profile_picture }
                  : require('../../assets/default-avatar.png')
              }
            />
          )}
          right={(props: any) => (
            <List.Icon {...props} icon={icon} color={item.read ? theme.colors.outline : theme.colors.primary} />
          )}
          onPress={() => handleNotificationPress(item)}
          style={[
            styles.notificationItem,
            !item.read && styles.unreadNotification
          ]}
        />
        <Divider />
      </>
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text variant="bodyLarge">Please log in to view notifications</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="bodyLarge" style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={fetchNotifications} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge">No notifications yet</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notificationItem: {
    paddingVertical: 8,
  },
  unreadNotification: {
    backgroundColor: '#f0f9ff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
  },
}); 