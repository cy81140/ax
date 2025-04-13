import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for push notifications
export const registerForPushNotifications = async (userId: string) => {
  try {
    // Check for existing permissions
    const permissionsResponse = await Notifications.getPermissionsAsync();
    // TypeScript workaround for Expo Notifications API
    const existingStatus = (permissionsResponse as any).status || 'undetermined';
    let finalStatus = existingStatus;

    // If no existing permission, ask for it
    if (existingStatus !== 'granted') {
      const requestResponse = await Notifications.requestPermissionsAsync();
      finalStatus = (requestResponse as any).status || 'undetermined';
    }

    // If still not granted, return error
    if (finalStatus !== 'granted') {
      return { data: null, error: new Error('Permission not granted for notifications') };
    }

    // Get push token
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId ?? undefined,
    });

    // Update user with push token
    const { data, error } = await supabase
      .from('users')
      .update({ push_token: token.data })
      .eq('id', userId)
      .select();

    if (error) throw error;

    // On Android, set notification channel
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Send push notification (for testing - in prod this would be handled by a server)
export const sendPushNotification = async (
  expoPushToken: string,
  title: string,
  body: string,
  data?: any
) => {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data: data || {},
  };

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    return { error: null };
  } catch (error) {
    return { error };
  }
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
  const subscription = Notifications.addNotificationResponseReceivedListener(callback);
  return subscription;
}; 