import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, useTheme, Surface, Avatar } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Message } from '../../types/services';
import { ChatStackScreenProps } from '../../types/navigation';
import { formatDistanceToNow } from 'date-fns';

type Props = ChatStackScreenProps<'ChatRoom'>;

export const ChatRoomScreen: React.FC<Props> = ({ route, navigation }) => {
  const { chatId } = route.params;
  const { user } = useAuth();
  const theme = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchMessages();
    const channel = supabase.channel('realtime-chat-room-' + chatId)
      .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${chatId}` }, 
          async (payload) => {
              const newMsgId = (payload.new as any).id;
              if (!newMsgId) return;
              try {
                const { data: newMsgData, error } = await supabase
                    .from('group_messages')
                    .select('*, user:users!user_id(username, profile_picture)')
                    .eq('id', newMsgId)
                    .single();
                if (error) throw error;
                if (newMsgData && newMsgData.user_id !== user?.id) {
                     setMessages(prev => prev.find(m => m.id === newMsgId) ? prev : [newMsgData as Message, ...prev]);
                }
              } catch (error) {
                  console.error("Error fetching new message details:", error);
              }
          }
      )
      .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
              console.log('Subscribed to chat room:', chatId);
          } else if (err) {
              console.error('Subscription error:', err);
          }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, user?.id]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('group_messages')
        .select('*, user:users!user_id(username, profile_picture)')
        .eq('group_id', chatId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMessages((data as Message[]) || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!user || !newMessage.trim()) return;

    try {
      setSending(true);
      const messageToSend = {
          group_id: chatId,
          user_id: user.id,
          content: newMessage.trim(),
      };
      const { data: insertedData, error } = await supabase
        .from('group_messages')
        .insert(messageToSend)
        .select('*, user:users!user_id(username, profile_picture)')
        .single();

      if (error) throw error;

      if (insertedData) {
           setMessages(prev => prev.find(m => m.id === insertedData.id) ? prev : [insertedData as Message, ...prev]);
      }
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isSent = item.user_id === user?.id;
    const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });

    return (
      <View style={[
          styles.messageRow,
          isSent ? styles.sentRow : styles.receivedRow
      ]}>
         {!isSent && (
            item.user?.profile_picture
            ? <Avatar.Image source={{ uri: item.user.profile_picture }} size={28} style={styles.avatar} />
            : <Avatar.Icon icon="account" size={28} style={styles.avatar} />
         )}
         <Surface style={[
            styles.messageContainer,
            isSent ? styles.sentMessage : styles.receivedMessage,
            { borderRadius: theme.roundness * 2 }
         ]}>
            {!isSent && (
                <Text variant="labelSmall" style={[styles.username, { color: theme.colors.primary }]}>
                    {item.user?.username || 'Unknown'}
                </Text>
            )}
            <Text variant="bodyMedium" style={{
                color: isSent ? theme.colors.onPrimaryContainer : theme.colors.onSurface
            }}>
                {item.content}
            </Text>
            <Text variant="labelSmall" style={[styles.timestamp, {
                 color: isSent ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant
            }]}>
                {timeAgo}
            </Text>
         </Surface>
      </View>
    );
  }

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <KeyboardAvoidingView
            style={styles.flexContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                inverted
                style={styles.messageList}
                contentContainerStyle={styles.messageListContent}
                ListEmptyComponent={!loading ? (
                    <View style={styles.emptyContainer}>
                         <Text style={{color: theme.colors.onSurfaceVariant}}>No messages yet. Start the conversation!</Text>
                    </View>
                ) : null}
            />
            <Surface style={[styles.inputContainer, { backgroundColor: theme.colors.elevation.level2 }]}>
                <TextInput
                    mode="outlined"
                    value={newMessage}
                    onChangeText={setNewMessage}
                    placeholder="Type a message..."
                    style={styles.input}
                    maxLength={500}
                    multiline
                    disabled={sending}
                />
                <Button
                    mode="contained"
                    compact
                    icon="send"
                    onPress={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    loading={sending}
                    style={styles.sendButton}
                >
                    Send
                </Button>
            </Surface>
        </KeyboardAvoidingView>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flexContainer: {
      flex: 1,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  messageRow: {
      flexDirection: 'row',
      marginVertical: 4,
  },
  sentRow: {
      justifyContent: 'flex-end',
  },
  receivedRow: {
      justifyContent: 'flex-start',
  },
  avatar: {
      marginRight: 8,
      alignSelf: 'flex-end',
  },
  messageContainer: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sentMessage: {
  },
  receivedMessage: {
  },
  username: {
    marginBottom: 2,
  },
  timestamp: {
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    marginRight: 8,
  },
  sendButton: {
  },
  emptyContainer: {
      padding: 16,
      alignItems: 'center',
  }
});

export default ChatRoomScreen; 