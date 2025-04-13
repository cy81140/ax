import { supabase } from './supabase';
import { uploadImage } from './database';
import { ChatMessage, ChatRoom } from '../types/services';
import { RealtimeChannel } from '@supabase/supabase-js';

// Regions
export const getRegions = async () => {
  try {
    const { data, error } = await supabase
      .from('regions')
      .select('*')
      .order('name');

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Group chats (provinces)
export const getGroupChatsByRegion = async (regionId: string) => {
  try {
    const { data, error } = await supabase
      .from('group_chats')
      .select(`
        *,
        regions:region_id (name)
      `)
      .eq('region_id', regionId)
      .order('name');

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getGroupChatById = async (groupId: string) => {
  try {
    const { data, error } = await supabase
      .from('group_chats')
      .select(`
        *,
        regions:region_id (name)
      `)
      .eq('id', groupId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Group membership
export const joinGroup = async (groupId: string, userId: string) => {
  try {
    // Check if already a member
    const { data: existingMember, error: checkError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 means no rows returned, which is expected if not a member
      throw checkError;
    }

    // If already a member, return
    if (existingMember) {
      return { data: existingMember, error: null };
    }

    // Join the group
    const { data, error } = await supabase
      .from('group_members')
      .insert([
        {
          group_id: groupId,
          user_id: userId,
        },
      ])
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const leaveGroup = async (groupId: string, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getUserGroups = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        group_id,
        group_chats:group_id (
          id,
          name,
          description,
          regions:region_id (name)
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Messages
export const getMessages = async (groupId: string, limit = 20, offset = 0) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        users:sender_id (username, profile_picture)
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const sendMessage = async (groupId: string, userId: string, content: string, imageUri?: string) => {
  try {
    let imageUrl;
    
    // Upload image if provided
    if (imageUri) {
      const uriParts = imageUri.split('.');
      const fileExtension = uriParts[uriParts.length - 1];
      
      const filePath = `messages/${userId}/${Date.now()}.${fileExtension}`;
      
      // Convert uri to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const { data: uploadData, error: uploadError } = await uploadImage(filePath, blob);
      if (uploadError) throw uploadError;
      
      imageUrl = uploadData?.publicUrl;
    }

    // Send message with or without image
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          group_id: groupId,
          sender_id: userId,
          content,
          image_url: imageUrl,
        },
      ])
      .select(`
        *,
        users:sender_id (username, profile_picture)
      `);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const deleteMessage = async (messageId: string, userId: string) => {
  try {
    // Verify the user is the sender
    const { data: message, error: checkError } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('id', messageId)
      .single();

    if (checkError) throw checkError;
    
    if (message && message.sender_id !== userId) {
      throw new Error('You can only delete your own messages');
    }

    // Delete the message
    const { data, error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Typing indicators
export const setTypingIndicator = async (groupId: string, userId: string) => {
  try {
    // Insert or update typing indicator with TTL of 5 seconds
    const { data, error } = await supabase
      .from('typing_indicators')
      .upsert(
        {
          group_id: groupId,
          user_id: userId,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'group_id,user_id' }
      )
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const clearTypingIndicator = async (groupId: string, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('typing_indicators')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getTypingIndicators = async (groupId: string) => {
  try {
    const { data, error } = await supabase
      .from('typing_indicators')
      .select(`
        *,
        users:user_id (username)
      `)
      .eq('group_id', groupId)
      // Only show typing indicators from the last 5 seconds
      .gt('created_at', new Date(Date.now() - 5000).toISOString());

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Read receipts
export const markMessagesAsRead = async (groupId: string, userId: string, lastMessageId: string) => {
  try {
    const { data, error } = await supabase
      .from('group_members')
      .update({ last_read_message_id: lastMessageId })
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getReadReceipts = async (groupId: string, messageId: string) => {
  try {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        user_id,
        users:user_id (username, profile_picture),
        last_read_message_id
      `)
      .eq('group_id', groupId)
      .gte('last_read_message_id', messageId);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Realtime subscriptions
export const subscribeToMessages = (groupId: string, callback: (payload: { new: ChatMessage }) => void) => {
  return supabase
    .channel(`room:${groupId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${groupId}`
      },
      callback
    )
    .subscribe();
};

export const subscribeToTypingIndicators = (groupId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`typing:${groupId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'typing_indicators',
        filter: `group_id=eq.${groupId}`,
      },
      callback
    )
    .subscribe();
};

export const subscribeToReadReceipts = (groupId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`read_receipts:${groupId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'group_members',
        filter: `group_id=eq.${groupId}`,
      },
      callback
    )
    .subscribe();
};

export const chatService = {
  async getRooms(userId: string): Promise<ChatRoom[]> {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getMessages(roomId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async sendMessage(message: Omit<ChatMessage, 'id' | 'created_at'>): Promise<ChatMessage> {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([message])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createRoom(room: Omit<ChatRoom, 'id' | 'created_at'>): Promise<ChatRoom> {
    const { data, error } = await supabase
      .from('chat_rooms')
      .insert([room])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async markMessagesAsRead(roomId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_messages')
      .update({ read: true })
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
  },

  subscribeToMessages(roomId: string, callback: (payload: { new: ChatMessage }) => void): RealtimeChannel {
    return supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        callback
      )
      .subscribe();
  }
}; 