import React, { useEffect } from 'react';
import { ActivityFeedScreen } from './ActivityFeedScreen';
import { useNavigation } from '@react-navigation/native';

// This is a pass-through component to maintain consistent naming with the navigation
const ActivityScreen = () => {
  return <ActivityFeedScreen />;
};

export default ActivityScreen; 