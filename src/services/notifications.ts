import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { Notification } from '../types/services';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request permission for push notifications
export const registerForPushNotifications = async () => {
  try {
    // Check if this is a physical device (notifications won't work in simulators)
    if (!Constants.isDevice) {
      return { status: 'error', message: 'Must use a physical device for notifications' };
    }

    // Request permissions
    const permissionResponse = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowAnnouncements: true,
      },
    });

    if (!permissionResponse.granted) {
      return { status: 'error', message: 'Permission for notifications not granted' };
    }

    // Get the token
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });

    // Return the token
    return { status: 'success', token: token.data };
  } catch (error) {
    console.error('Error getting push token:', error);
    return { status: 'error', message: 'Error requesting notification permissions' };
  }
};

// Send push notification (for testing - in prod this would be handled by a server)
export const sendPushNotification = async (token: string, title: string, body: string) => {
  const message = {
    to: token,
    sound: 'default',
    title,
    body,
    data: { someData: 'goes here' },
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
};

// Handle notification received
export const handleNotification = (
  callback: (notification: Notifications.Notification) => void
) => {
  const subscription = Notifications.addNotificationReceivedListener(callback);
  return subscription;
};

// Handle notification response (when user taps notification)
export const handleNotificationResponse = (
  callback: (response: Notifications.NotificationResponse) => void
) => {
  Notifications.addNotificationResponseReceivedListener(callback);
};

export const notificationsService = {
  async getNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
  },

  async createNotification(notification: Omit<Notification, 'id' | 'created_at' | 'read'>): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert([notification])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}; 