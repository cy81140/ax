import React, { useEffect, useRef } from 'react';
import 'react-native-gesture-handler';
import ThemedApp from './src/components/ThemedApp';
import * as Notifications from 'expo-notifications';
import { 
  handleNotification, 
  handleNotificationResponse 
} from './src/services/notifications';

export default function App() {
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    // Listen for notifications received while app is foregrounded
    notificationListener.current = handleNotification((notification) => {
      console.log('Notification received:', notification);
    });

    // Listen for user tapping on notification
    responseListener.current = handleNotificationResponse((response) => {
      console.log('Notification response:', response);
      
      // Navigation is now handled inside ThemedApp
      // You may need to set up a notification handler service to handle this properly
    });

    // Clean up listeners on unmount
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return <ThemedApp />;
} 