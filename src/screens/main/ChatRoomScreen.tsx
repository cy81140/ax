import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Avatar, Card, Chip } from 'react-native-paper';
import { theme } from '../../constants/theme';
import { RouteProp } from '@react-navigation/native';
import { ChatStackParamList } from '../../navigation/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { 
  getMessages, 
  sendMessage, 
  subscribeToMessages, 
  setTypingIndicator, 
  clearTypingIndicator, 
  subscribeToTypingIndicators, 
  getTypingIndicators, 
  markMessagesAsRead, 
  subscribeToReadReceipts, 
  getReadReceipts 
} from '../../services/chat';
import { registerForPushNotifications } from '../../services/notifications';

// Define route prop type
type ChatRoomScreenRouteProp = RouteProp<ChatStackParamList, 'ChatRoom'>;

// Define props
interface ChatRoomScreenProps {
  route: ChatRoomScreenRouteProp;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  image_url: string | null;
  users: {
    username: string;
    profile_picture: string | null;
  };
}

interface TypingUser {
  id: string;
  username: string;
}

const ChatRoomScreen: React.FC<ChatRoomScreenProps> = ({ route }) => {
  const { roomId, roomName, roomDescription, regionName } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [readReceipts, setReadReceipts] = useState<{[key: string]: string[]}>({});
  
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const messageEndRef = useRef<FlatList>(null);

  useEffect(() => {
    // Register for push notifications when component mounts
    if (user) {
      registerForPushNotifications(user.id)
        .then(result => {
          if (result.error) {
            console.log('Error registering for push notifications:', result.error);
          } else {
            console.log('Successfully registered for push notifications');
          }
        });
    }

    const loadMessages = async () => {
      if (!roomId) return;
      
      try {
        const { data, error } = await getMessages(roomId);
        if (error) throw error;
        
        if (data) {
          setMessages(data);
          
          // Mark the latest message as read
          if (data.length > 0 && user) {
            markMessagesAsRead(roomId, user.id, data[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };

    // Load initial typing indicators
    const loadTypingIndicators = async () => {
      try {
        const { data } = await getTypingIndicators(roomId);
        if (data) {
          const typingUsersList = data
            .filter(item => item.user_id !== user?.id)
            .map(item => ({
              id: item.user_id,
              username: item.users.username
            }));
          setTypingUsers(typingUsersList);
        }
      } catch (error) {
        console.error('Error loading typing indicators:', error);
      }
    };

    loadMessages();
    loadTypingIndicators();

    // Subscribe to real-time updates
    const messageSubscription = subscribeToMessages(roomId, (payload) => {
      if (payload.eventType === 'INSERT') {
        // Add new message to the list
        const newMessage = payload.new as Message;
        setMessages(prev => [newMessage, ...prev]);
        
        // Mark message as read if current user didn't send it
        if (user && newMessage.sender_id !== user.id) {
          markMessagesAsRead(roomId, user.id, newMessage.id);
        }
      } else if (payload.eventType === 'DELETE') {
        // Remove deleted message from the list
        setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
      }
    });

    // Subscribe to typing indicators
    const typingSubscription = subscribeToTypingIndicators(roomId, (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        // Only show typing for other users
        if (payload.new.user_id !== user?.id) {
          setTypingUsers(prev => {
            // Add user to typing users if not already there
            const exists = prev.some(u => u.id === payload.new.user_id);
            if (!exists) {
              return [...prev, {
                id: payload.new.user_id,
                username: payload.new.users.username
              }];
            }
            return prev;
          });
        }
      } else if (payload.eventType === 'DELETE') {
        // Remove user from typing users
        setTypingUsers(prev => prev.filter(u => u.id !== payload.old.user_id));
      }
    });

    // Subscribe to read receipts
    const readReceiptSubscription = subscribeToReadReceipts(roomId, async (payload) => {
      if (payload.eventType === 'UPDATE' && payload.new.last_read_message_id) {
        console.log('Read receipt update:', payload.new);
        // We'll implement this properly later
      }
    });

    // Clean up subscriptions on unmount
    return () => {
      messageSubscription.unsubscribe();
      typingSubscription.unsubscribe();
      readReceiptSubscription.unsubscribe();
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
        clearTypingIndicator(roomId, user?.id || '');
      }
    };
  }, [roomId, user]);

  // Let's just use a simplified version for now
  const updateReadReceipts = async (messageId: string) => {
    console.log('Will implement read receipts properly later');
    // We'll implement this properly after debugging the data structure
  };

  const handleTyping = () => {
    if (!user) return;

    // Set typing indicator
    setTypingIndicator(roomId, user.id);

    // Clear previous timeout
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    // Set new timeout to clear typing indicator after 3 seconds
    typingTimeout.current = setTimeout(() => {
      clearTypingIndicator(roomId, user.id);
    }, 3000);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !user) return;
    
    setSending(true);
    try {
      // Clear typing indicator
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
      await clearTypingIndicator(roomId, user.id);

      await sendMessage(roomId, user.id, messageInput.trim());
      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isCurrentUser = user?.id === item.sender_id;
    const hasReadReceipts = readReceipts[item.id] && readReceipts[item.id].length > 0;
    
    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
      ]}>
        {!isCurrentUser && (
          <Avatar.Text
            size={32}
            label={item.users.username.charAt(0).toUpperCase()}
            color="white"
            style={styles.avatar}
          />
        )}
        <View style={styles.messageWrapper}>
          <View style={[
            styles.messageBubble,
            isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
          ]}>
            {!isCurrentUser && (
              <Text style={styles.username}>{item.users.username}</Text>
            )}
            <Text style={[
              styles.messageText,
              isCurrentUser ? styles.currentUserText : styles.otherUserText
            ]}>
              {item.content}
            </Text>
            <Text style={[
              styles.timestamp,
              isCurrentUser ? styles.currentUserTimestamp : styles.otherUserTimestamp
            ]}>
              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          
          {isCurrentUser && hasReadReceipts && (
            <View style={styles.readReceiptsContainer}>
              <Text style={styles.readReceiptsText}>
                Read by {readReceipts[item.id].join(', ')}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.chatInfo}>
        <Text style={styles.chatInfoText}>
          {regionName} • {roomDescription}
        </Text>
      </View>
      
      <FlatList
        ref={messageEndRef}
        inverted
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessageItem}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={(
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="chat-processing"
              size={64}
              color={theme.colors.primary}
            />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text>Be the first to start the conversation!</Text>
          </View>
        )}
      />
      
      {typingUsers.length > 0 && (
        <View style={styles.typingContainer}>
          <Text style={styles.typingText}>
            {typingUsers.length === 1 
              ? `${typingUsers[0].username} is typing...`
              : `${typingUsers.length} people are typing...`}
          </Text>
        </View>
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={messageInput}
          onChangeText={(text) => {
            setMessageInput(text);
            handleTyping();
          }}
          placeholder="Type a message..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!messageInput.trim() || sending) ? styles.disabledButton : null
          ]}
          onPress={handleSendMessage}
          disabled={!messageInput.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <MaterialCommunityIcons name="send" size={24} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatInfo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.backdrop,
  },
  chatInfoText: {
    color: theme.colors.text,
    opacity: 0.8,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  messageWrapper: {
    maxWidth: '80%',
    flexDirection: 'column',
  },
  currentUserMessage: {
    justifyContent: 'flex-end',
  },
  otherUserMessage: {
    justifyContent: 'flex-start',
  },
  avatar: {
    marginRight: 8,
    backgroundColor: theme.colors.primary,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  currentUserBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: theme.colors.surfaceVariant,
    borderBottomLeftRadius: 4,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 4,
    color: theme.colors.onSurfaceVariant,
  },
  messageText: {
    fontSize: 14,
  },
  currentUserText: {
    color: 'white',
  },
  otherUserText: {
    color: theme.colors.onSurfaceVariant,
  },
  timestamp: {
    fontSize: 10,
    opacity: 0.7,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  currentUserTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherUserTimestamp: {
    color: theme.colors.onSurfaceVariant,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.backdrop,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 24,
    width: 48,
    height: 48,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  emptyContainer: {
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  typingContainer: {
    padding: 8,
    backgroundColor: 'transparent',
  },
  typingText: {
    color: theme.colors.text,
    opacity: 0.7,
    fontStyle: 'italic',
    fontSize: 12,
  },
  readReceiptsContainer: {
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  readReceiptsText: {
    fontSize: 10,
    color: theme.colors.text,
    opacity: 0.5,
  },
});

export default ChatRoomScreen; 