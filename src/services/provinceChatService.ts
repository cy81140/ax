import { supabase } from './supabase';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
// Define interfaces based on your new schema (or use Supabase generated types)
// Example placeholder types:
interface UserProfile { // Assuming you have a public users/profiles table
  id: string;
  username: string;
  profile_picture?: string;
}
interface Region { id: string; name: string; description?: string; created_at?: string; updated_at?: string; }
interface Province { id: string; name: string; region_id?: string; description?: string; created_at?: string; updated_at?: string; }
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
interface ProvinceChatMember { province_chat_id: string; user_id: string; joined_at?: string; last_read_message_id?: string; }
interface ProvinceMessage {
    id: string; 
    province_chat_id: string; 
    user_id: string; 
    content: string; 
    image_url?: string; 
    created_at?: string; 
    users?: Pick<UserProfile, 'username' | 'profile_picture'>; // Joined user info
}
// Define a more specific type for the result of getUserProvinceChats
interface UserProvinceChat {
    province_chat_id: string;
    province_chats: ProvinceChat | null; // Joined chat details
    // Add other fields from province_chat_members if needed
}

// Reusable helper for handling Supabase queries (similar to before)
// Update this function to accept both Promise and Postgrest query builders
async function handleSupabaseQuery<T>(query: any): Promise<{ data: T | null; error: any }> {
  try {
    const { data, error } = await query;
    if (error) {
        // Log the specific Supabase error code and details if available
        console.error(`Supabase query error: Code: ${error.code}, Details: ${error.details}, Message: ${error.message}`);
        throw error; // Re-throw the original error object
    }
    return { data, error: null };
  } catch (error: any) {
    // Ensure a consistent error structure is returned
    return { 
        data: null, 
        error: { 
            message: error.message || 'An unexpected database error occurred', 
            details: error 
        } 
    };
  }
}

// TODO: Implement subscription management (similar to manageSubscription in old chatService)
const activeProvinceChannels = new Map<string, RealtimeChannel>();

// Generic subscription helper (adapt from previous chat service)
// Add constraint to T to ensure it's an object type
function manageProvinceSubscription<T extends { [key: string]: any }>(
  channelKeyPrefix: string,
  provinceChatId: string,
  tableName: string, // e.g., 'province_messages', 'province_chat_members'
  callback: (payload: RealtimePostgresChangesPayload<T>) => void
): RealtimeChannel | undefined {
    const channelKey = `${channelKeyPrefix}:${provinceChatId}`;
    if (activeProvinceChannels.has(channelKey)) {
        console.log(`Already subscribed to ${tableName} for: ${channelKey}`);
        return activeProvinceChannels.get(channelKey);
    }

    console.log(`Subscribing to ${tableName} for: ${channelKey}`);
    const channel = supabase
        .channel(channelKey)
        .on<T>(
            'postgres_changes',
            {
                event: '*', // Listen to INSERT, UPDATE, DELETE
                schema: 'public',
                table: tableName,
                filter: `province_chat_id=eq.${provinceChatId}` // Filter by chat ID
            },
            (payload: RealtimePostgresChangesPayload<T>) => { // Add explicit type here
                // Basic payload check 
                if (payload.new || payload.old) { // Check if there's data
                    callback(payload);
                } else {
                    console.warn(`Received event without data for ${tableName} (${channelKey}):`, payload);
                }
            }
        )
        .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
                 console.log(`Successfully subscribed to ${tableName} for ${channelKey}`);
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || err) {
                console.error(`Subscription error for ${tableName} (${channelKey}): ${status}`, err || 'Unknown error');
                // Optionally: Implement retry logic or notify UI
                activeProvinceChannels.delete(channelKey); // Remove from active channels on error
            } else {
                console.log(`Subscription status for ${tableName} (${channelKey}): ${status}`);
                 if (status === 'CLOSED') {
                     activeProvinceChannels.delete(channelKey);
                 }
            }
        });

    activeProvinceChannels.set(channelKey, channel);
    return channel;
}

export const provinceChatService = {

  async getRegions(): Promise<{ data: Region[] | null; error: any }> {
    console.log('getRegions called');
    // Fetch regions, order by name for display
    return handleSupabaseQuery<Region[]>(
        supabase.from('regions').select('*').order('name')
    );
  },

  async getProvinceChatsByRegion(regionId: string): Promise<{ data: ProvinceChat[] | null; error: any }> {
    console.log('getProvinceChatsByRegion called for region:', regionId);
    if (!regionId) return { data: null, error: { message: 'Region ID is required' } };
    // Fetch provinces for the region, order by name
    return handleSupabaseQuery<ProvinceChat[]>(
        supabase.from('province_chats').select('*').eq('region_id', regionId).order('name')
    );
  },

  async getProvinces(): Promise<{ data: Province[] | null; error: any }> {
    console.log('getProvinces called');
    // Fetch all provinces, order by name
    return handleSupabaseQuery<Province[]>(
        supabase.from('provinces').select('*').order('name')
    );
  },

  async getProvincesByRegion(regionId: string): Promise<{ data: Province[] | null; error: any }> {
    console.log('getProvincesByRegion called for region:', regionId);
    if (!regionId) return { data: null, error: { message: 'Region ID is required' } };
    // Fetch provinces for the region, order by name
    return handleSupabaseQuery<Province[]>(
        supabase.from('provinces').select('*').eq('region_id', regionId).order('name')
    );
  },

  async joinProvinceChat(provinceChatId: string, userId: string): Promise<{ data: ProvinceChatMember | null; error: any }> {
    console.log('joinProvinceChat called for:', provinceChatId, userId);
    if (!provinceChatId || !userId) return { data: null, error: { message: 'Province Chat ID and User ID are required' } };
    // Direct insert relies on RLS allowing self-insert
    return handleSupabaseQuery<ProvinceChatMember>(
      supabase.from('province_chat_members')
              .insert({ province_chat_id: provinceChatId, user_id: userId })
              .select()
              .single()
    );
  },

  async leaveProvinceChat(provinceChatId: string, userId: string): Promise<{ data: any | null; error: any }> {
    console.log('leaveProvinceChat called for:', provinceChatId, userId);
    if (!provinceChatId || !userId) return { data: null, error: { message: 'Province Chat ID and User ID are required' } };
    // Direct delete relies on RLS allowing self-delete
     return handleSupabaseQuery<any>(
       supabase.from('province_chat_members')
               .delete()
               .match({ province_chat_id: provinceChatId, user_id: userId })
     );
  },

  async getUserProvinceChats(userId: string): Promise<{ data: UserProvinceChat[] | null; error: any }> {
    console.log('getUserProvinceChats called for:', userId);
    if (!userId) return { data: null, error: { message: 'User ID is required' } };
    // Join province_chats details. Order by last message time for display.
    return handleSupabaseQuery<UserProvinceChat[]>(
      supabase.from('province_chat_members')
              .select(`
                province_chat_id,
                province_chats (
                  id, 
                  name, 
                  description, 
                  region_id, 
                  last_message_at, 
                  province_id, 
                  message_count, 
                  is_active, 
                  chat_type
                )
              `)
              .eq('user_id', userId)
              // Ensure the joined province_chats table exists and is accessible via RLS
              .order('last_message_at', { referencedTable: 'province_chats', ascending: false, nullsFirst: false })
    );
  },

  async getProvinceMessages(provinceChatId: string, limit = 30, cursor?: string): Promise<{ data: ProvinceMessage[] | null; error: any }> {
    console.log('getProvinceMessages called for:', provinceChatId, 'cursor:', cursor);
    if (!provinceChatId) return { data: null, error: { message: 'Province Chat ID is required' } };
    
    let query = supabase
        .from('province_messages')
        // Join user details for display
        .select('*, users:user_id (username, profile_picture)') 
        .eq('province_chat_id', provinceChatId)
        .order('created_at', { ascending: false });

    // Cursor pagination based on the created_at timestamp
    if (cursor) {
      console.log('Applying cursor:', cursor);
      query = query.lt('created_at', cursor);
    }
    
    query = query.limit(limit);

    const result = await handleSupabaseQuery<ProvinceMessage[]>(query);
    // Messages are fetched newest first, reverse for typical chat display (oldest at top)
    if (result.data && Array.isArray(result.data)) {
        result.data.reverse();
    }
    return result;
  },

  async sendProvinceMessage(provinceChatId: string, userId: string, content: string): Promise<{ data: ProvinceMessage | null; error: any }> {
    console.log('sendProvinceMessage called for:', provinceChatId, userId);
    const trimmedContent = content.trim();
    if (!provinceChatId || !userId || !trimmedContent) {
         return { data: null, error: { message: 'Province Chat ID, User ID, and content are required.' } };
    }
    
    const messageToInsert = { 
        province_chat_id: provinceChatId, 
        user_id: userId, 
        content: trimmedContent 
    };

    // Insert and select the newly created message with user details
    return handleSupabaseQuery<ProvinceMessage>(
        supabase.from('province_messages')
                .insert(messageToInsert)
                .select('*, users:user_id (username, profile_picture)')
                .single()
    );
  },

  async deleteProvinceMessage(messageId: string): Promise<{ data: any | null; error: any }> {
    console.log('deleteProvinceMessage called for:', messageId);
     if (!messageId) return { data: null, error: { message: 'Message ID is required' } };
     
     return handleSupabaseQuery<any>(
        supabase.from('province_messages').delete().eq('id', messageId)
     );
  },

  async markProvinceMessagesAsRead(provinceChatId: string, userId: string, lastMessageId: string): Promise<{ data: Pick<ProvinceChatMember, 'last_read_message_id'>[] | null; error: any }> {
    console.log('markProvinceMessagesAsRead called for:', provinceChatId, userId, lastMessageId);
     if (!provinceChatId || !userId || !lastMessageId) {
        return { data: null, error: { message: 'Province Chat ID, User ID, and Last Message ID are required' } };
    }
    
    // Update only the last_read_message_id
    return handleSupabaseQuery<Pick<ProvinceChatMember, 'last_read_message_id'>[]>(
        supabase.from('province_chat_members')
            .update({ last_read_message_id: lastMessageId })
            .match({ province_chat_id: provinceChatId, user_id: userId })
            // Optionally select only the updated field to confirm
            .select('last_read_message_id') 
    );
  },

  // --- Realtime Subscriptions (Placeholders) ---
  subscribeToNewProvinceMessages(provinceChatId: string, callback: (payload: RealtimePostgresChangesPayload<ProvinceMessage>) => void): RealtimeChannel | undefined {
    console.log('Setting up subscription for new messages in:', provinceChatId);
    // We need to enhance the payload with user details if the insert doesn't include it
    // For simplicity now, the callback might need to fetch user details separately if not included in initial select of sendMessage
    return manageProvinceSubscription<ProvinceMessage>('province-messages', provinceChatId, 'province_messages', callback);
  },

  subscribeToMembershipUpdates(provinceChatId: string, callback: (payload: RealtimePostgresChangesPayload<ProvinceChatMember>) => void): RealtimeChannel | undefined {
    console.log('Setting up subscription for membership updates in:', provinceChatId);
    return manageProvinceSubscription<ProvinceChatMember>('province-members', provinceChatId, 'province_chat_members', callback);
  },

  async unsubscribeFromProvinceChat(provinceChatId: string): Promise<void> {
    console.log(`Unsubscribing from all channels for province chat: ${provinceChatId}`);
    // Loop through channel keys looking for any related to this chat ID
    const channelsToRemove: string[] = [];
    
    activeProvinceChannels.forEach((channel, key) => {
        // Key format is like "prefix:provinceChatId"
        if (key.endsWith(`:${provinceChatId}`)) {
            channelsToRemove.push(key);
            try {
                channel.unsubscribe();
                console.log(`Unsubscribed from channel: ${key}`);
            } catch (error) {
                console.error(`Error unsubscribing from channel ${key}:`, error);
            }
        }
    });

    // Remove the channels from the active map
    channelsToRemove.forEach(key => {
        activeProvinceChannels.delete(key);
    });
  },

  // New function to unsubscribe from all active province chat channels
  async unsubscribeFromAllProvinceChats(): Promise<void> {
    console.log(`Unsubscribing from all active province chat channels (${activeProvinceChannels.size})...`);
    
    activeProvinceChannels.forEach((channel, key) => {
      try {
          channel.unsubscribe();
          console.log(`Unsubscribed from channel: ${key}`);
      } catch (error) {
          console.error(`Error unsubscribing from channel ${key}:`, error);
      }
    });

    // Clear the map after attempting to unsubscribe from all
    activeProvinceChannels.clear();
    console.log('Cleared all active province chat channels.');
  },

  // Example usage in AuthContext or similar on logout:
  // await provinceChatService.unsubscribeFromAllProvinceChats();
};