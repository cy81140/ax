import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, TextInput, Pressable } from 'react-native';
import { Button, useTheme, Surface, Avatar, IconButton } from 'react-native-paper'; // Using react-native-paper
import { useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { provinceChatService } from '../../services/provinceChatService'; // Remove ProvinceMessage import
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth
import { formatDistanceToNow } from 'date-fns'; // For message timestamps
// Import Realtime types
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import * as Haptics from 'expo-haptics'; // Import haptics for feedback

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

// Define route param list
type ChatStackParamList = {
  ProvinceChatRoom: { provinceChatId: string; provinceName: string };
};

// Define route prop type
type ProvinceChatRoomRouteProp = RouteProp<ChatStackParamList, 'ProvinceChatRoom'>;

const ProvinceChatRoomScreen = () => {
  const route = useRoute<ProvinceChatRoomRouteProp>(); // Use typed route
  const { user } = useAuth(); // Get current user
  const theme = useTheme();
  const flatListRef = useRef<FlatList<ChatMessage>>(null); // Fixed ref type

  // Extract params safely
  const provinceChatId = route.params?.provinceChatId;
  const provinceName = route.params?.provinceName; // Used for title or context

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false); // Add sending state
  const [loadingOlder, setLoadingOlder] = useState(false); // State for loading older messages
  const [canLoadMore, setCanLoadMore] = useState(true); // State to track if more messages exist

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
      setError(fetchError.message || 'Failed to load messages.');
      Alert.alert('Error', fetchError.message || 'Could not load messages.');
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
  }, [provinceChatId]); // Dependency: provinceChatId

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

    if (provinceChatId) {
      fetchInitialMessages();
      
      // Define the callback for handling incoming realtime messages
      const handleRealtimeMessage = (payload: any) => {
        if (!isMounted) return; // Don't update state if unmounted
        console.log('Realtime Message Received:', payload);

        if (payload.eventType === 'INSERT') {
          const newMessagePayload = payload.new;
          // Ensure created_at is a string
          const typedMessage = ensureValidMessage(newMessagePayload);
          
          // Add message only if it's not already in the list
          setMessages(prev => {
            if (prev.some(msg => msg.id === typedMessage.id)) {
              return prev; // Already exists
            }
            
            // Provide haptic feedback for new messages from others
            if (typedMessage.user_id !== user?.id) {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
            }
            
            return [...prev, typedMessage]; 
          });
          
          // Auto-scroll to bottom on new message
          if (flatListRef.current) {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
          
          // Removed markAsRead from here
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
      console.log(`Subscribed to province chat ${provinceChatId}`);
    } else {
        Alert.alert('Error', 'Province Chat ID missing.');
        setError('Missing Province Chat ID');
        setLoadingInitial(false);
    }
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (subscription && provinceChatId) {
        console.log(`Unsubscribing from province chat ${provinceChatId}`);
        provinceChatService.unsubscribeFromProvinceChat(provinceChatId);
        subscription = null;
      }
    };
  }, [provinceChatId, fetchInitialMessages, user?.id]); // Added user?.id as dependency

  // --- Send Message --- 
  const handleSend = async () => {
    if (!user || !newMessage.trim() || !provinceChatId || sending) return;

    // Provide haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const contentToSend = newMessage.trim();
    setNewMessage(''); // Clear input immediately
    setSending(true);

    // --- Optimistic UI Update ---
    const tempId = `temp_${Date.now()}`;
    const optimisticMessage: ChatMessage = {
        id: tempId,
        province_chat_id: provinceChatId,
        user_id: user.id,
        content: contentToSend,
        created_at: new Date().toISOString(),
        users: { // Use logged-in user's info from AuthContext
            username: user.username || 'You', // Assuming username is in User type from AuthContext
            profile_picture: user.profile_picture // Assuming profile_picture is in User type
        }
    };
    setMessages(prev => [...prev, optimisticMessage]);
    
    // Auto-scroll to bottom
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
    
    try {
      const { data: sentMessage, error: sendError } = await provinceChatService.sendProvinceMessage(
        provinceChatId,
        user.id,
        contentToSend
      );

      if (sendError) throw sendError; // Throw error to be caught by catch block

      if (sentMessage) {
        console.log('Message sent successfully');
        // Replace optimistic message with real one from DB
        const typedMessage = ensureValidMessage(sentMessage);
        setMessages(prev => 
            prev.map(msg => msg.id === tempId ? typedMessage : msg)
        );
        // Removed markAsRead from here
      } else {
          // Handle case where insert succeeded but didn't return data
          console.warn('Message sent but no data returned');
          setMessages(prev => prev.filter(msg => msg.id !== tempId)); // Remove optimistic
          setNewMessage(contentToSend); // Restore input content
      }
    } catch (error: any) {
        console.error('Error sending message:', error);
        Alert.alert('Error', error?.message || 'Could not send message.');
        // Remove optimistic message on failure
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        setNewMessage(contentToSend); // Restore input content
    } finally {
        setSending(false);
    }
  };

  // --- Mark as read on focus --- 
  useFocusEffect(
    useCallback(() => {
      let isEffectActive = true;

      const markRead = () => {
          // Mark as read only if provinceChatId and user are available, and there are messages
          if (isEffectActive && provinceChatId && user?.id && messages.length > 0) {
            // Get the ID of the latest message currently displayed
            const latestMessageId = messages[messages.length - 1]?.id;
            if (latestMessageId) {
              console.log('Marking messages as read on focus up to:', latestMessageId);
              provinceChatService.markProvinceMessagesAsRead(provinceChatId, user.id, latestMessageId)
                  .then(({ error }) => {
                      if (error && isEffectActive) {
                         console.warn("Failed to mark messages as read on focus:", error); 
                      }
                  })
                  .catch(err => {
                      if (isEffectActive) console.warn("Exception marking messages as read:", err);
                  });
            }
          }
      };

      // Run markRead after a short delay to allow messages state to potentially update
      const timerId = setTimeout(markRead, 300); 

      return () => {
        isEffectActive = false;
        clearTimeout(timerId);
      };
    }, [provinceChatId, user?.id, messages]) // Dependencies: Re-run if chat/user/messages change
  );

  // Long press message handler
  const handleLongPressMessage = (message: ChatMessage) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Could show options menu for reply, delete, etc.
    Alert.alert(
      "Message Options",
      "What would you like to do with this message?",
      [
        { text: "Copy Text", onPress: () => {/* implement copy */} },
        { 
          text: "Delete", 
          onPress: () => {
            if (message.user_id === user?.id) {
              Alert.alert(
                "Delete Message",
                "Are you sure you want to delete this message?",
                [
                  { text: "Cancel", style: "cancel" },
                  { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: () => {
                      // Implement deletion here
                      if (message.id) {
                        provinceChatService.deleteProvinceMessage(message.id);
                      }
                    }
                  }
                ]
              );
            } else {
              Alert.alert("Cannot Delete", "You can only delete your own messages");
            }
          },
          style: "destructive"
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  // --- Render Message Item ---
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    if (!user) return null; 
    const isSent = item.user_id === user.id;
    const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });

    return (
      <Pressable 
        onLongPress={() => handleLongPressMessage(item)}
        style={[
          styles.messageRow,
          isSent ? styles.sentRow : styles.receivedRow
        ]}
      >
         {!isSent && (
            <View style={styles.avatarContainer}>
              {item.users?.profile_picture
                ? <Avatar.Image source={{ uri: item.users.profile_picture }} size={32} style={styles.avatar} />
                : <Avatar.Text 
                    label={item.users?.username?.charAt(0).toUpperCase() || 'U'} 
                    size={32} 
                    style={styles.avatar} 
                    labelStyle={styles.avatarLabel}
                  />
              }
            </View>
         )}
         <Surface 
           style={[
              styles.messageContainer,
              isSent ? styles.sentMessage : styles.receivedMessage,
              { 
                backgroundColor: isSent 
                  ? theme.colors.primaryContainer 
                  : theme.colors.surfaceVariant,
                borderBottomLeftRadius: isSent ? theme.roundness * 2 : 0,
                borderBottomRightRadius: isSent ? 0 : theme.roundness * 2,
              }
           ]}
           elevation={1}
         >
            {!isSent && (
                <Text 
                  style={[
                    styles.username, 
                    { color: theme.colors.primary }
                  ]}
                >
                    {item.users?.username || 'Unknown User'}
                </Text>
            )}
            <Text 
              style={[
                styles.messageText, 
                { color: isSent ? theme.colors.onPrimaryContainer : theme.colors.onSurface }
              ]}
            >
                {item.content}
            </Text>
            <Text 
              style={[
                styles.timestamp, 
                { color: isSent 
                  ? `${theme.colors.onPrimaryContainer}80` 
                  : `${theme.colors.onSurfaceVariant}80` 
                }
              ]}
            >
                {timeAgo}
            </Text>
         </Surface>
      </Pressable>
    );
  }
  
  // --- Render Component --- 
  if (!provinceChatId && !loadingInitial) { // Show error if ID missing and not loading
      return (
        <View style={[styles.container, styles.center]}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            Error: Province Chat ID is missing.
          </Text>
        </View>
      );
  }

  if (loadingInitial && messages.length === 0) { // Show loading indicator only if messages are empty
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
          Loading Messages...
        </Text>
      </View>
    );
  }

  if (error && messages.length === 0) { // Show full screen error only if no messages loaded
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          Error: {error}
        </Text>
      </View>
    );
  }

  return (
    <Surface style={[styles.surfaceContainer, { backgroundColor: theme.colors.background }]}>
        <KeyboardAvoidingView 
            style={styles.keyboardAvoidingContainer}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} 
        >
            <FlatList
                ref={flatListRef}
                data={messages} 
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                style={styles.messageList}
                contentContainerStyle={styles.messageListContent}
                onEndReached={loadOlderMessages}
                onEndReachedThreshold={0.3}
                initialNumToRender={20}
                maxToRenderPerBatch={10}
                windowSize={15}
                ListHeaderComponent={
                    loadingOlder ? (
                      <View style={styles.loadingOlderContainer}>
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                        <Text style={{ color: theme.colors.onSurfaceVariant, marginLeft: 8 }}>
                          Loading older messages...
                        </Text>
                      </View>
                    ) : null
                }
                ListEmptyComponent={!loadingInitial ? (
                    <View style={styles.emptyContainer}>
                      <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                        No messages yet. Start the conversation!
                      </Text>
                    </View>
                ) : null}
                // Set inverted={true} if you implement a "date header" UI design
            />

            <Surface 
              style={[
                styles.inputContainer, 
                { 
                  backgroundColor: theme.colors.surface,
                  borderTopColor: theme.colors.outline,
                }
              ]} 
              elevation={3}
            >
                <TextInput
                    style={[
                      styles.input,
                      { 
                        backgroundColor: theme.colors.surfaceVariant,
                        color: theme.colors.onSurface,
                        borderColor: theme.colors.outline,
                      }
                    ]}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    placeholder="Type a message..."
                    placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
                    editable={!sending}
                    multiline
                    maxLength={500}
                    numberOfLines={4}
                />
                <IconButton 
                    icon="send"
                    mode="contained"
                    size={24}
                    onPress={handleSend}
                    disabled={!newMessage.trim() || sending}
                    loading={sending}
                    style={styles.sendButton}
                    iconColor={theme.colors.onPrimary}
                    containerColor={theme.colors.primary}
                />
            </Surface>
        </KeyboardAvoidingView>
    </Surface>
  );
};

// --- Enhanced Styles --- 
const styles = StyleSheet.create({
  surfaceContainer: {
      flex: 1,
  },
  keyboardAvoidingContainer: {
      flex: 1,
  },
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
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
      textAlign: 'center',
      padding: 20,
      fontSize: 16,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      flexGrow: 1, 
  },
  messageRow: {
      flexDirection: 'row',
      marginVertical: 6,
      alignItems: 'flex-end',
  },
  sentRow: {
      justifyContent: 'flex-end',
  },
  receivedRow: {
      justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    marginBottom: 0,
  },
  avatar: {
    marginRight: 0,
    marginBottom: 6,
  },
  avatarLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageContainer: {
    maxWidth: '80%',
    minWidth: 60,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
  },
  sentMessage: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    marginLeft: 40, // Space for user avatar on the other side
  },
  receivedMessage: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
  },
  username: {
    marginBottom: 4,
    fontWeight: 'bold',
    fontSize: 13,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 0.5,
  },
  input: {
    flex: 1,
    marginRight: 8,
    maxHeight: 120,
    minHeight: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: 8,
    paddingRight: 16,
    fontSize: 16,
  },
  sendButton: {
    marginBottom: 0,
    borderRadius: 24,
  },
  loadingOlderContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    height: 100,
  },
});

export default ProvinceChatRoomScreen;