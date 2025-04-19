import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, Image, StatusBar } from 'react-native';
import { Button, useTheme, Surface, Avatar, IconButton, TextInput, Appbar } from 'react-native-paper';
import { useRoute, RouteProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { provinceChatService } from '../../services/provinceChatService';
import { useAuth } from '../../contexts/AuthContext'; 
import { formatDistanceToNow } from 'date-fns'; 
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import * as Haptics from 'expo-haptics'; 
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MainStackParamList } from '../../navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Define user profile type
interface UserProfile { id: string; username: string; profile_picture?: string; }

// Define our chat message type
interface ChatMessage {
  id: string; 
  province_chat_id: string; 
  user_id: string; 
  content: string; 
  image_url?: string; 
  created_at: string; // Always required in our app
  users?: Pick<UserProfile, 'username' | 'profile_picture'>;
}

// Helper to safely convert raw data to our expected type
const ensureValidMessage = (message: any): ChatMessage => ({
  id: message.id,
  province_chat_id: message.province_chat_id,
  user_id: message.user_id,
  content: message.content,
  image_url: message.image_url,
  created_at: message.created_at || new Date().toISOString(),
  users: message.users
});

// Define route prop type
type ProvinceChatRoomRouteProp = RouteProp<MainStackParamList, 'ProvinceChatRoom'>;
type ProvinceChatRoomNavigationProp = NativeStackNavigationProp<MainStackParamList, 'ProvinceChatRoom'>;

const ProvinceChatRoomScreen = () => {
  const route = useRoute<ProvinceChatRoomRouteProp>(); 
  const navigation = useNavigation<ProvinceChatRoomNavigationProp>(); // Get navigation object
  const { user } = useAuth(); 
  const theme = useTheme();
  const flatListRef = useRef<FlatList<ChatMessage>>(null); 

  // Extract params safely
  const provinceChatId = route.params?.provinceChatId;
  const provinceName = route.params?.provinceName; // Used for title or context
  const provinceId = route.params?.provinceId;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false); // Add sending state
  const [loadingOlder, setLoadingOlder] = useState(false); // State for loading older messages
  const [canLoadMore, setCanLoadMore] = useState(true); // State to track if more messages exist
  const [isOnline, setIsOnline] = useState(true); // Mock online status

  const MESSAGES_PER_PAGE = 30; // Define page size

  // --- Data Fetching --- 
  const fetchInitialMessages = useCallback(async () => {
    if (!provinceChatId) {
      setError('Missing Province Chat ID');
      setLoadingInitial(false);
      return;
    }
    
    setLoadingInitial(true);
    setError(null);
    setCanLoadMore(true); // Reset load more status on initial fetch

    const { data, error: fetchError } = await provinceChatService.getProvinceMessages(
      provinceChatId,
      MESSAGES_PER_PAGE
    );

    if (fetchError) {
      console.error('Error fetching initial messages:', fetchError);
      
      // Check if the error is from a foreign key constraint violation
      // which might indicate the chat room doesn't exist
      if (fetchError.code === '23503' || fetchError.message?.includes('foreign key constraint')) {
        Alert.alert(
          'Chat Room Error',
          'This chat room may no longer exist.',
          [{ 
            text: 'Go Back', 
            onPress: () => navigation.goBack() 
          }]
        );
      } else {
        setError(fetchError.message || 'Failed to load messages.');
        Alert.alert('Error', fetchError.message || 'Could not load messages.');
      }
      
      setCanLoadMore(false); // Can't load more if initial fetch fails
    } else {
      const fetchedMessages = data || [];
      // Convert raw messages to our type with ensured created_at
      const typedMessages = fetchedMessages.map(ensureValidMessage);
      setMessages(typedMessages);
      // Check if we can load more based on initial fetch
      if (fetchedMessages.length < MESSAGES_PER_PAGE) {
        setCanLoadMore(false);
      }
    }

    setLoadingInitial(false);
  }, [provinceChatId, navigation]);

  // --- Load More Messages --- 
  const loadOlderMessages = useCallback(async () => {
      // Prevent loading more if already loading, cannot load more, or no messages exist
      if (loadingOlder || !canLoadMore || messages.length === 0 || !provinceChatId) return;

      // Get the timestamp of the oldest message (first in the array since it's reversed)
      const oldestMessageCursor = messages[0]?.created_at;
      if (!oldestMessageCursor) return; // Should not happen if messages.length > 0

      console.log('Loading older messages before:', oldestMessageCursor)
      setLoadingOlder(true);

      const { data, error: fetchError } = await provinceChatService.getProvinceMessages(
          provinceChatId,
          MESSAGES_PER_PAGE,
          oldestMessageCursor // Pass the cursor
      );

      if (fetchError) {
          console.error('Error fetching older messages:', fetchError);
          // Optionally show a less intrusive error (e.g., toast) instead of Alert
          Alert.alert('Error', 'Could not load older messages.');
          setCanLoadMore(false); // Assume we can't load more after an error
      } else {
          const olderMessages = data || [];
          if (olderMessages.length > 0) {
              // Prepend older messages to the beginning of the array
              const typedOlderMessages = olderMessages.map(ensureValidMessage);
              setMessages(prev => [...typedOlderMessages, ...prev]);
          }
          // If fewer messages than requested were fetched, no more older messages exist
          if (olderMessages.length < MESSAGES_PER_PAGE) {
              console.log('No more older messages to load.');
              setCanLoadMore(false);
          }
      }

      setLoadingOlder(false);
  }, [loadingOlder, canLoadMore, messages, provinceChatId]); // Dependencies

  // --- Initial Load & Realtime Subscription --- 
  useEffect(() => {
    let isMounted = true; // Track mount status for async operations
    let subscription: any = null; // Use 'any' for now, refine if needed

    const joinAndSetup = async () => {
      if (!provinceChatId || !user?.id) {
        console.error('Missing provinceChatId or user ID, cannot join or setup chat.');
        setError('Cannot load chat. Missing information.');
        setLoadingInitial(false);
        return; // Exit early if essential info is missing
      }
      
      // Ensure user is a member of the chat
      try {
        console.log('Attempting to join chat...');
        const { error: joinError } = await provinceChatService.joinProvinceChat(provinceChatId, user.id, provinceId);
        if (joinError) {
          console.error('Error joining province chat:', joinError);
          
          // Update error handling to include the new error codes
          if (joinError.code === 'NOT_FOUND' || joinError.code === 'PROVINCE_NOT_FOUND') {
            Alert.alert(
              'Chat Room Not Found',
              'The chat room you are trying to join does not exist.',
              [{ 
                text: 'OK', 
                onPress: () => navigation.goBack() 
              }]
            );
            setLoadingInitial(false);
            return; // Stop further processing
          } else if (joinError.code === 'PROVINCE_REQUIRED') {
            Alert.alert(
              'Province Information Required',
              'Cannot create this chat room without province information.',
              [{ 
                text: 'OK', 
                onPress: () => navigation.goBack() 
              }]
            );
            setLoadingInitial(false);
            return; // Stop further processing
          } else {
            // Handle other errors
            Alert.alert(
              'Error Joining Chat',
              'There was a problem joining this chat room. ' + 
              (joinError.message || 'Please try again later.'),
              [{ text: 'OK' }]
            );
            setError('Failed to join chat. You may not be able to send messages.');
          }
        } else {
          console.log('Successfully joined or confirmed membership for chat:', provinceChatId);
        }
      } catch (e) {
        console.error('Exception during joinProvinceChat call:', e);
        // Handle unexpected errors during the join process
        Alert.alert(
          'Unexpected Error',
          'An unexpected error occurred when trying to join the chat.',
          [{ text: 'OK' }]
        );
        setError('Unexpected error joining chat room.');
      }
      
      // Proceed with fetching messages even if join failed
      fetchInitialMessages();
      
      // Define the callback for handling incoming realtime messages
      const handleRealtimeMessage = (payload: any) => {
        if (!isMounted) return; // Don't update state if unmounted
        console.log('Realtime Message Received:', payload);

        if (payload.eventType === 'INSERT') {
          const newMessagePayload = payload.new;
          console.log('New message received via realtime:', newMessagePayload);
          
          // Ensure created_at is a string
          const typedMessage = ensureValidMessage(newMessagePayload);
          
          // Add message only if it's not already in the list
          setMessages(prev => {
            // Check if message already exists
            if (prev.some(msg => msg.id === typedMessage.id)) {
              console.log('Message already exists in state, not adding duplicate');
              return prev; // Already exists
            }
            
            // Provide haptic feedback for new messages from others
            if (typedMessage.user_id !== user?.id) {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
            }
            
            console.log('Adding new message to state:', typedMessage);
            const updatedMessages = [...prev, typedMessage];
            
            // Auto-scroll to bottom on new message
            if (flatListRef.current) {
              setTimeout(() => {
                try {
                  flatListRef.current?.scrollToEnd({ animated: true });
                  console.log('Scrolled to end after new message');
                } catch (err) {
                  console.error('Error scrolling to end:', err);
                }
              }, 100);
            }
            
            return updatedMessages;
          });
        } else if (payload.eventType === 'DELETE') {
            const deletedMessageId = (payload.old as { id: string })?.id;
            if (deletedMessageId) {
                setMessages(prev => prev.filter(msg => msg.id !== deletedMessageId));
            }
        } else if (payload.eventType === 'UPDATE') {
            const updatedMessage = ensureValidMessage(payload.new);
            setMessages(prev => 
                prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
            );
        }
      };

      // Setup realtime subscription
      subscription = provinceChatService.subscribeToNewProvinceMessages(
          provinceChatId,
          handleRealtimeMessage
      );
    };

    joinAndSetup(); // Call the async setup function

    // Cleanup function - this only unsubscribes from events, doesn't leave the chat
    return () => {
      console.log('Unsubscribing from chat events only...');
      isMounted = false;
      if (provinceChatId) {
        // Only unsubscribe from realtime events
        provinceChatService.unsubscribeFromProvinceChat(provinceChatId)
          .then(() => console.log('Successfully unsubscribed from province chat events'))
          .catch(err => console.error('Error unsubscribing from province chat events:', err));
      }
    };
  }, [provinceChatId, user?.id, fetchInitialMessages]); // Added user?.id dependency

  // Focus effect to mark chat as read when screen gains focus
  useFocusEffect(
    useCallback(() => {
      console.log('Chat screen focused');
      
      return () => {
        console.log('Chat screen unfocused');
      };
    }, [])
  );

  // --- Message Sending ---
  const handleSend = async () => {
    if (!newMessage.trim() || !provinceChatId || !user) return;

    const message = newMessage.trim();
    setNewMessage(''); // Immediately clear input
    setSending(true);

    try {
      // Create a temporary message for immediate display
      const tempId = `temp-${Date.now()}`;
      const tempMessage: ChatMessage = {
        id: tempId,
        province_chat_id: provinceChatId,
        user_id: user.id,
        content: message,
        created_at: new Date().toISOString(),
        users: {
          username: user.email?.split('@')[0] || 'You',
          profile_picture: undefined
        }
      };
      
      // Add to local state immediately for responsive UX
      setMessages(prev => [...prev, tempMessage]);
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);

      // Send to server
      const { data, error } = await provinceChatService.sendProvinceMessage(
        provinceChatId,
        user.id,
        message
      );

      if (error) throw error;

      console.log("Message sent successfully:", data);
      
      // Replace temp message with real one if needed
      if (data) {
        setMessages(prev => 
          prev.map(msg => msg.id === tempId ? ensureValidMessage(data) : msg)
        );
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      // Optionally restore the message to the input
      setNewMessage(message);
    } finally {
      setSending(false);
    }
  };

  // --- Navigation Handling ---
  const handleGoBack = () => {
    navigation.goBack();
  };

  // Handle leaving the chat - this removes the user from the chat members
  const handleLeaveChat = () => {
    if (!provinceChatId || !user?.id) return;
    
    Alert.alert(
      'Leave Chat',
      'Are you sure you want to leave this chat room? You will need to rejoin to see future messages.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Explicitly leaving chat room:', provinceChatId);
              const { error } = await provinceChatService.leaveProvinceChat(provinceChatId, user.id);
              if (error) {
                console.error('Error leaving chat:', error);
                Alert.alert('Error', 'Failed to leave chat room. Please try again.');
                return;
              }
              
              // Successfully left the chat
              console.log('Successfully left chat room:', provinceChatId);
              navigation.goBack();
            } catch (err) {
              console.error('Exception leaving chat:', err);
              Alert.alert('Error', 'An unexpected error occurred. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Create header menu
  const showHeaderMenu = () => {
    Alert.alert(
      'Chat Options',
      'Choose an option',
      [
        { text: 'Leave Chat', onPress: handleLeaveChat, style: 'destructive' },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // --- UI Rendering ---
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    // Determine if this message is from the current user
    const isCurrentUser = item.user_id === user?.id;
    
    // Get username for the message
    const username = item.users?.username || 'Unknown User';
    
    // Get profile picture or use first letter of username
    const avatarLetter = (username.charAt(0) || '?').toUpperCase();
    
    // Use formatDistanceToNow to show relative time
    const timeAgo = item.created_at ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true }) : 'recently';

    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
      ]}>
        {!isCurrentUser && (
          <Avatar.Text 
            label={avatarLetter}
            size={34}
            style={styles.messageAvatar}
            labelStyle={styles.avatarLabel}
          />
        )}
        
        <View style={[
          styles.messageBubble,
          isCurrentUser ? 
            { backgroundColor: theme.colors.primary, borderBottomRightRadius: 0 } : 
            { backgroundColor: theme.colors.surfaceVariant, borderBottomLeftRadius: 0 }
        ]}>
          {!isCurrentUser && (
            <Text style={styles.messageUsername}>{username}</Text>
          )}
          
          <Text style={[
            styles.messageText,
            isCurrentUser ? { color: '#FFFFFF' } : { color: theme.colors.onSurface }
          ]}>
            {item.content}
          </Text>
          
          {item.image_url && (
            <Image 
              source={{ uri: item.image_url }} 
              style={styles.messageImage}
              resizeMode="cover"
            />
          )}
          
          <Text style={[
            styles.messageTime,
            isCurrentUser ? { color: 'rgba(255, 255, 255, 0.7)' } : { color: theme.colors.onSurfaceVariant }
          ]}>
            {timeAgo}
          </Text>
        </View>
      </View>
    );
  };

  // RENDER MAIN UI
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <StatusBar backgroundColor={theme.colors.elevation.level2} barStyle="light-content" />
      
      {/* Custom Header */}
      <Surface style={[styles.header, { backgroundColor: theme.colors.elevation.level2 }]} elevation={4}>
        <View style={styles.headerContent}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={handleGoBack}
            iconColor={theme.colors.onSurface}
            style={styles.backButton}
          />
          
          <Avatar.Text
            label={provinceName?.charAt(0)?.toUpperCase() || 'P'}
            size={40}
            style={styles.headerAvatar}
          />
          
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>{provinceName}</Text>
            <Text style={styles.headerSubtitle}>
              {isOnline ? 'Active Now' : 'Provincial Chat Room'}
            </Text>
          </View>
          
          <IconButton
            icon="dots-vertical"
            size={24}
            onPress={showHeaderMenu}
            iconColor={theme.colors.onSurface}
          />
        </View>
      </Surface>

      {/* Chat Messages */}
      <KeyboardAvoidingView 
        style={[styles.keyboardAvoidingView, { backgroundColor: theme.colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Error State */}
        {error && !loadingInitial && (
          <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
            <Text style={{ color: theme.colors.error, marginBottom: 16 }}>{error}</Text>
            <Button mode="contained" onPress={fetchInitialMessages}>
              Try Again
            </Button>
          </View>
        )}
        
        {/* Loading State */}
        {loadingInitial && (
          <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
        
        {/* Empty State */}
        {!loadingInitial && !error && messages.length === 0 && (
          <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
            <MaterialCommunityIcons
              name="message-text-outline"
              size={56}
              color={theme.colors.onSurfaceVariant}
              style={{marginBottom: 16}}
            />
            <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              No messages yet. Be the first to send a message!
            </Text>
          </View>
        )}
        
        {/* Messages List */}
        {!loadingInitial && !error && messages.length > 0 && (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
            inverted={false} // Keep chronological (oldest to newest)
            onEndReached={loadOlderMessages}
            onEndReachedThreshold={0.3}
            style={{ backgroundColor: theme.colors.background }}
            ListHeaderComponent={loadingOlder ? (
              <ActivityIndicator 
                size="small" 
                color={theme.colors.primary}
                style={{margin: 8}} 
              />
            ) : null}
          />
        )}
        
        {/* Message Input */}
        <Surface style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]} elevation={4}>
          <TextInput
            mode="outlined"
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            right={
              <TextInput.Icon 
                icon="send" 
                onPress={handleSend}
                disabled={sending || !newMessage.trim()}
                color={theme.colors.primary}
              />
            }
            style={styles.input}
            outlineStyle={styles.inputOutline}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            disabled={sending || !provinceChatId}
          />
        </Surface>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  avatarLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    marginRight: 4,
  },
  centerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
  },
  header: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    elevation: 0,
    paddingVertical: 10,
  },
  headerAvatar: {
    marginHorizontal: 8,
  },
  headerContent: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: 'transparent',
  },
  inputContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 8,
  },
  inputOutline: {
    borderRadius: 25,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messageAvatar: {
    alignSelf: 'flex-end',
    marginRight: 8,
  },
  messageBubble: {
    borderRadius: 18,
    maxWidth: '100%',
    padding: 12,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 6,
    maxWidth: '85%',
    paddingHorizontal: 8,
  },
  messageImage: {
    borderRadius: 12,
    height: 180,
    marginTop: 8,
    width: '100%',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    alignSelf: 'flex-end',
    fontSize: 12,
    marginTop: 4,
  },
  messageUsername: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  messagesList: {
    paddingHorizontal: 10,
    paddingVertical: 16,
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
  },
  safeArea: {
    flex: 1,
  },
});

export default ProvinceChatRoomScreen;