import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { provinceChatService } from '../../services/provinceChatService'; // Adjust path if needed
import { Card, Button, useTheme, Paragraph, Title } from 'react-native-paper'; // Removed List, Divider
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth to get user ID
import { MaterialCommunityIcons } from '@expo/vector-icons'; // For icons
import SkeletonPlaceholder from "react-native-skeleton-placeholder"; // Import Skeleton Placeholder

// Define proper type for navigation
type RootStackParamList = {
  ProvinceList: { regionId: string, regionName?: string }; // Added regionName
  ProvinceChatRoom: { provinceChatId: string, provinceName: string };
};

type ProvinceListRouteProp = RouteProp<RootStackParamList, 'ProvinceList'>;

// Define types based on our updated database schema
interface Province {
  id: string;
  name: string;
  region_id?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

interface ProvinceChat {
  id: string;
  name: string;
  region_id?: string;
  province_id?: string;
  description?: string;
  last_message_at?: string;
  message_count?: number;
  is_active?: boolean;
  chat_type?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

// Skeleton Component for Loading State
const ProvinceCardSkeleton = () => {
  const theme = useTheme();
  return (
    <SkeletonPlaceholder 
      borderRadius={theme.roundness * 2} // Match card border radius
      backgroundColor={theme.colors.surfaceVariant} // Use a theme color for background
      highlightColor={theme.colors.surface} // Use a theme color for highlight
    >
      <View style={styles.skeletonCard}>
        <View style={styles.skeletonContent}>
          <View style={{ width: '60%', height: 20, marginBottom: 8 }} />
          <View style={{ width: '90%', height: 16, marginBottom: 4 }} />
          <View style={{ width: '80%', height: 16 }} />
        </View>
        <View style={styles.skeletonActions}>
          <View style={{ width: 100, height: 40, borderRadius: 20 }} />
        </View>
      </View>
    </SkeletonPlaceholder>
  );
};

const ProvinceListScreen = () => {
  const navigation = useNavigation<any>(); // Using any temporarily for navigation
  const route = useRoute<ProvinceListRouteProp>(); // Use typed route
  const theme = useTheme(); // Get theme
  const { user } = useAuth(); // Get user info

  // Extract regionId and regionName from route params
  const regionId = route.params?.regionId;
  const regionName = route.params?.regionName; // Use for context/title

  // Set navigation title dynamically
  useEffect(() => {
      navigation.setOptions({ title: regionName ? `${regionName} Provinces` : 'Provinces' });
  }, [navigation, regionName]);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [provinceChats, setProvinceChats] = useState<ProvinceChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningChat, setJoiningChat] = useState<string | null>(null); // Track which chat is being joined
  const [error, setError] = useState<string | null>(null);

  // --- Data Fetching ---
  const fetchData = useCallback(async () => { // Renamed and wrapped in useCallback
    if (!regionId) {
      Alert.alert('Error', 'Region ID is missing. Cannot load provinces.');
      setLoading(false);
      setError('Missing Region ID');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Fetch provinces for the region
      const { data: provincesData, error: provincesError } = await provinceChatService.getProvincesByRegion(regionId);
      
      if (provincesError) {
        throw new Error(provincesError.message || 'Failed to load provinces');
      }
      
      setProvinces(provincesData || []);
      
      // Also fetch province chats for the region
      const { data: chatsData, error: chatsError } = await provinceChatService.getProvinceChatsByRegion(regionId);
      
      if (chatsError) {
        throw new Error(chatsError.message || 'Failed to load province chats');
      }
      
      setProvinceChats(chatsData || []);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
      // Keep alert for immediate feedback, but rely on error screen for retry
      Alert.alert('Error', err.message || 'Could not load data'); 
    } finally {
      setLoading(false);
    }
  }, [regionId]); // Dependency: regionId

  useEffect(() => {
    fetchData(); // Call fetchData on mount and when regionId changes
  }, [fetchData]);

  // Helper function to find the chat for a province
  const findChatForProvince = (provinceId: string): ProvinceChat | undefined => {
    return provinceChats.find(chat => chat.province_id === provinceId);
  };

  const handleProvincePress = async (province: Province) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to join a chat.');
      return;
    }
    
    // Find the corresponding chat for this province
    const provinceChat = findChatForProvince(province.id);
    
    if (!provinceChat) {
      // This case should ideally be prevented by disabling the button, but keep as fallback
      Alert.alert('No Chat Available', `There is no active chat for ${province.name}.`);
      return;
    }
    
    if (joiningChat) return; // Prevent multiple join attempts

    setJoiningChat(provinceChat.id);
    console.log(`Attempting to join province chat: ${provinceChat.name} (${provinceChat.id}) for user: ${user.id}`);
    
    // Attempt to join the chat
    const { error: joinError } = await provinceChatService.joinProvinceChat(provinceChat.id, user.id);
    
    setJoiningChat(null);
    
    if (joinError) {
      console.error('Error joining province chat:', joinError);
      Alert.alert('Error Joining Chat', joinError.message || 'Could not join the selected chat.');
    } else {
      console.log(`Successfully joined (or was already in) province chat: ${provinceChat.name}`);
      // Navigate to the chat room screen after successful join
      navigation.navigate('ProvinceChatRoom', { 
        provinceChatId: provinceChat.id,
        provinceName: province.name // Pass province name for title
      });
    }
  };

  // --- Render Loading State ---
  if (loading) {
    // Use FlatList to render multiple skeletons
    return (
      <View style={styles.container}>
        <FlatList
          data={Array(5).fill(0)} // Render 5 skeleton items
          keyExtractor={(_, index) => `skeleton-${index}`}
          renderItem={() => <ProvinceCardSkeleton />}
          contentContainerStyle={styles.listContentContainer}
        />
      </View>
    );
  }

  // --- Render Error State ---
  if (error && !loading) { 
    return (
      <View style={[styles.container, styles.center]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={theme.colors.error} />
        <Title style={[styles.errorTitle, { color: theme.colors.error }]}>Oops!</Title>
        <Paragraph style={[styles.errorText, { color: theme.colors.onSurfaceVariant }]}>
          {error}
        </Paragraph>
        <Button 
          mode="contained" 
          onPress={fetchData} // Use fetchData for retry
          icon="reload"
          style={styles.retryButton}
        >
          Retry
        </Button>
      </View>
    );
  }

  // --- Render Province List ---
  return (
    <View style={styles.container}>
      <FlatList
        data={provinces}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContentContainer} // Add padding
        renderItem={({ item }) => {
          const chat = findChatForProvince(item.id);
          const chatAvailable = !!chat;
          const isJoiningThisChat = joiningChat === chat?.id;

          return (
            <Card 
              style={[
                styles.card, 
                !chatAvailable && styles.disabledCard,
                { backgroundColor: theme.colors.surface } 
              ]}
              elevation={chatAvailable ? 2 : 0} // Lower elevation for disabled
            >
              <Card.Title 
                title={item.name} 
                titleStyle={styles.cardTitle}
                // Optional: Add a subtitle or left icon
                // subtitle={item.description} 
                // left={(props) => <Avatar.Icon {...props} icon="map-marker" />}
              />
              <Card.Content>
                <Paragraph style={styles.cardDescription}>
                  {chatAvailable 
                    ? item.description || `Join the chat for ${item.name}` 
                    : 'No public chat currently available for this province.'}
                </Paragraph>
              </Card.Content>
              {chatAvailable && chat && ( // Only show actions if chat exists
                <Card.Actions style={styles.cardActions}>
                  <Button 
                    mode="contained" 
                    icon="arrow-right" 
                    onPress={() => handleProvincePress(item)}
                    disabled={isJoiningThisChat}
                    loading={isJoiningThisChat}
                    style={styles.joinButton}
                  >
                    {isJoiningThisChat ? 'Joining...' : 'Join Chat'}
                  </Button>
                </Card.Actions>
              )}
            </Card>
          );
        }}
        // ItemSeparatorComponent={() => <View style={styles.separator} />} // Use padding instead
        ListEmptyComponent={() => (
          <View style={[styles.center, { paddingTop: 50 }]}>
            <MaterialCommunityIcons name="map-marker-off-outline" size={48} color={theme.colors.onSurfaceVariant} />
            <Paragraph style={{ color: theme.colors.onSurfaceVariant, marginTop: 10 }}>
              No provinces found for {regionName || 'this region'}.
            </Paragraph>
          </View>
        )}
      />
    </View>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
  retryButton: {
    marginTop: 10,
  },
  listContentContainer: {
    padding: 8, // Add padding around the list
  },
  card: {
    marginVertical: 8, // Vertical spacing between cards
    marginHorizontal: 4, // Horizontal spacing from screen edges
  },
  disabledCard: {
    opacity: 0.7,
    // backgroundColor: '#f0f0f0', // Example: different background
  },
  cardTitle: {
    fontWeight: 'bold', // Keep title bold
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardActions: {
    justifyContent: 'flex-end', // Align button to the right
    paddingRight: 8, // Add some padding for the button
    paddingBottom: 8,
  },
  joinButton: {
    // Add specific styles if needed
  },
  // separator: { // Alternative to padding for separation
  //   height: 10,
  // },

  // --- Skeleton Styles ---
  skeletonCard: {
    marginVertical: 8,
    marginHorizontal: 4,
    borderRadius: 12, // Should ideally match Card's border radius if possible
    padding: 16,
    height: 150, // Approximate height of a card
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  skeletonContent: {
    // Styles for the top part (title, description)
  },
  skeletonActions: {
    alignItems: 'flex-end', // Match card action alignment
  },
});

export default ProvinceListScreen; 