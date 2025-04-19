import { supabase, logSupabaseError, checkSession } from '../lib/supabase';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
// Remove invalid imports
// import { Region } from './regionService'; 
// import { Province } from './provinceService'; 

// Define interfaces based on your new schema (or use Supabase generated types)
// Export the main definitions used throughout the file
export interface UserProfile { // Assuming you have a public users/profiles table
  id: string;
  username: string;
  profile_picture?: string;
}
export interface Region { id: string; name: string; description?: string; created_at?: string; updated_at?: string; }
export interface Province { id: string; name: string; region_id?: string; description?: string; created_at?: string; updated_at?: string; }
export interface ProvinceChat { 
  id: string; 
  province_id: string;
  name?: string;
  description?: string;
  last_message_at?: string;
  message_count?: number;
  is_active?: boolean;
  chat_type?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}
export interface ProvinceChatMember { province_chat_id: string; user_id: string; joined_at?: string; last_read_message_id?: string; }
// Use and export ProvinceMessage consistently
export interface ProvinceMessage {
    id: string; 
    province_chat_id: string; 
    user_id: string; 
    content: string; 
    image_url?: string; 
    created_at?: string; 
    users?: Pick<UserProfile, 'username' | 'profile_picture'>; // Joined user info
}
// Define UserProvinceChat locally if only used here, or export if needed elsewhere
interface UserProvinceChat {
    province_chat_id: string;
    province_chats: ProvinceChat | null; // Joined chat details
}

// Reusable helper for handling Supabase queries
async function handleSupabaseQuery<T>(query: any, operationName: string): Promise<{ data: T | null; error: any }> {
  try {
    console.log(`[provinceChatService] ${operationName} - Starting operation`);
    const { data, error } = await query;
    if (error) {
        console.error(`[provinceChatService] ${operationName} - Error:`, error.code, error.message);
        return { data: null, error };
    }
    console.log(`[provinceChatService] ${operationName} - Success:`, Array.isArray(data) ? `${data.length} items` : data ? 'Data received' : 'No data');
    return { data, error: null };
  } catch (error: any) {
    logSupabaseError(error, `provinceChatService.${operationName}`);
    return { 
        data: null, 
        error: { 
            message: error.message || 'An unexpected database error occurred', 
            details: error 
        } 
    };
  }
}

// Subscription management map and helper function
const activeProvinceChannels = new Map<string, RealtimeChannel>();
function manageProvinceSubscription<T extends { [key: string]: any }>(
  channelKeyPrefix: string,
  provinceChatId: string,
  tableName: string, 
  callback: (payload: RealtimePostgresChangesPayload<T>) => void
): RealtimeChannel | undefined {
    const channelKey = `${channelKeyPrefix}:${provinceChatId}`;
    if (activeProvinceChannels.has(channelKey)) {
        console.log(`[provinceChatService] Already subscribed to ${tableName} for: ${channelKey}`);
        return activeProvinceChannels.get(channelKey);
    }

    console.log(`[provinceChatService] Subscribing to ${tableName} for: ${channelKey}`);
    
    try {
    const channel = supabase
        .channel(channelKey)
        .on<T>(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: tableName,
                filter: `province_chat_id=eq.${provinceChatId}`
            },
            (payload: RealtimePostgresChangesPayload<T>) => { 
                console.log(`[provinceChatService] Received ${tableName} realtime event:`, payload.eventType);
                if (payload.new || payload.old) { 
                    callback(payload);
                } else {
                    console.warn(`[provinceChatService] Received event without data for ${tableName} (${channelKey}):`, payload);
                }
            }
        )
        .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
                console.log(`[provinceChatService] Successfully subscribed to ${tableName} for ${channelKey}`);
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || err) {
                console.error(`[provinceChatService] Subscription error for ${tableName} (${channelKey}): ${status}`, err || 'Unknown error');
                activeProvinceChannels.delete(channelKey); 
                    
                // Try to resubscribe after a delay
                setTimeout(() => {
                    console.log(`[provinceChatService] Attempting to resubscribe to ${channelKey} after error`);
                    manageProvinceSubscription(channelKeyPrefix, provinceChatId, tableName, callback);
                }, 5000);
            } else {
                console.log(`[provinceChatService] Subscription status for ${tableName} (${channelKey}): ${status}`);
                if (status === 'CLOSED') {
                    activeProvinceChannels.delete(channelKey);
                }
            }
        });

    activeProvinceChannels.set(channelKey, channel);
    return channel;
    } catch (error) {
        console.error(`[provinceChatService] Error setting up subscription to ${tableName} for ${channelKey}:`, error);
        return undefined;
    }
}

// Exported service object with all functions
export const provinceChatService = {
  async getRegions(): Promise<{ data: Region[] | null; error: any }> {
    // Get regions with basic ordering
    const result = await handleSupabaseQuery<Region[]>(
        supabase.from('regions').select('*'),
        'getRegions'
    );
    
    // If we have data, sort numerically by the numbers in region names
    if (result.data && Array.isArray(result.data)) {
      result.data.sort((a, b) => {
        // Extract numbers from region names
        const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
        return numA - numB;
      });
    }
    
    return result;
  },

  async getProvinceChatsByRegion(regionId: string): Promise<{ data: ProvinceChat[] | null; error: any }> {
    if (!regionId) return { data: null, error: { message: 'Region ID is required' } };
    return handleSupabaseQuery<ProvinceChat[]>(
        supabase.from('province_chats').select('*').eq('region_id', regionId).order('name'),
        `getProvinceChatsByRegion(${regionId})`
    );
  },

  async getProvinces(): Promise<{ data: Province[] | null; error: any }> {
    // Get provinces without ordering from database
    const result = await handleSupabaseQuery<Province[]>(
        supabase.from('provinces').select('*'),
        'getProvinces'
    );
    
    // Sort numerically if we have data
    if (result.data && Array.isArray(result.data)) {
      result.data.sort((a, b) => {
        // Extract numbers from province names
        const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
        return numA - numB;
      });
    }
    
    return result;
  },

  async getProvincesByRegion(regionId: string): Promise<{ data: Province[] | null; error: any }> {
    if (!regionId) return { data: null, error: { message: 'Region ID is required' } };
    
    // Get provinces for this region without ordering
    const result = await handleSupabaseQuery<Province[]>(
        supabase.from('provinces').select('*').eq('region_id', regionId),
        `getProvincesByRegion(${regionId})`
    );
    
    // Sort numerically if we have data
    if (result.data && Array.isArray(result.data)) {
      result.data.sort((a, b) => {
        // Extract numbers from province names
        const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
        return numA - numB;
      });
    }
    
    return result;
  },

  async joinProvinceChat(provinceChatId: string, userId: string, provinceId?: string): Promise<{ data: null; error: any }> {
    if (!provinceChatId || !userId) {
      console.error('[provinceChatService] joinProvinceChat - Missing required parameters');
      return { data: null, error: { message: 'Missing required parameters' } };
    }

    try {
      console.log(`[provinceChatService] Joining chat ${provinceChatId} for user ${userId}`);
      
      // First check if user is already a member
      const { data: existingMembership, error: membershipCheckError } = await supabase
        .from('province_chat_members')
        .select('*')
        .eq('province_chat_id', provinceChatId)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (membershipCheckError) {
        console.error('[provinceChatService] Error checking membership:', membershipCheckError);
        return { data: null, error: membershipCheckError };
      }
      
      // If already a member, return success
      if (existingMembership) {
        console.log('[provinceChatService] User already a member of this chat');
        return { data: null, error: null };
      }
      
      // Otherwise, add the user as a member
      const { error: joinError } = await supabase
        .from('province_chat_members')
        .insert({
          province_chat_id: provinceChatId,
          user_id: userId,
          joined_at: new Date().toISOString()
        });
      
      if (joinError) {
        console.error('[provinceChatService] Error joining chat:', joinError);
        return { data: null, error: joinError };
      }
      
      console.log('[provinceChatService] Successfully joined chat');
      return { data: null, error: null };
    } catch (error) {
      console.error('[provinceChatService] Unexpected error joining chat:', error);
      return { data: null, error: { message: 'An unexpected error occurred', details: error } };
    }
  },

  async leaveProvinceChat(provinceChatId: string, userId: string): Promise<{ data: any | null; error: any }> {
    if (!provinceChatId || !userId) {
      console.error('[provinceChatService] leaveProvinceChat - Missing required parameters');
      return { data: null, error: { message: 'Missing required parameters' } };
    }

    return handleSupabaseQuery(
      supabase
        .from('province_chat_members')
        .delete()
        .eq('province_chat_id', provinceChatId)
        .eq('user_id', userId),
      `leaveProvinceChat(${provinceChatId}, ${userId})`
    );
  },

  async getUserProvinceChats(userId: string): Promise<{ data: UserProvinceChat[] | null; error: any }> {
    if (!userId) return { data: null, error: { message: 'User ID is required' } };
    
    return handleSupabaseQuery<UserProvinceChat[]>(
      supabase
        .from('province_chat_members')
        .select('province_chat_id, province_chats(*)')
        .eq('user_id', userId),
      `getUserProvinceChats(${userId})`
    );
  },

  async getProvinceMessages(provinceChatId: string, limit = 30, cursor?: string): Promise<{ data: ProvinceMessage[] | null; error: any }> {
    if (!provinceChatId) return { data: null, error: { message: 'Province chat ID is required' } };
    
    let query = supabase
      .from('province_messages')
      .select('*, users(username, profile_picture)')
      .eq('province_chat_id', provinceChatId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (cursor) {
      query = query.lt('created_at', cursor);
    }
    
    return handleSupabaseQuery<ProvinceMessage[]>(query, `getProvinceMessages(${provinceChatId})`);
  },

  async sendProvinceMessage(provinceChatId: string, userId: string, content: string): Promise<{ data: ProvinceMessage | null; error: any }> {
    if (!provinceChatId || !userId || !content) {
      console.error('[provinceChatService] sendProvinceMessage - Missing required parameters');
      return { data: null, error: { message: 'Missing required parameters for sending message' } };
    }

    // Verify session before sending
    const { valid } = await checkSession();
    if (!valid) {
      console.error('[provinceChatService] sendProvinceMessage - No valid session found');
      return { data: null, error: { message: 'Authentication required to send messages' } };
    }

    try {
      console.log(`[provinceChatService] Sending message to chat ${provinceChatId}`);
      
      // Insert the message
      const { data, error } = await supabase
        .from('province_messages')
        .insert({
          province_chat_id: provinceChatId,
          user_id: userId,
          content: content,
          created_at: new Date().toISOString()
        })
        .select('*, users(username, profile_picture)')
        .single();
      
      if (error) {
        console.error('[provinceChatService] Error sending message:', error);
        return { data: null, error };
      }
      
      console.log('[provinceChatService] Message sent successfully:', data?.id);
      return { data, error: null };
    } catch (error) {
      console.error('[provinceChatService] Unexpected error sending message:', error);
      return { data: null, error: { message: 'An unexpected error occurred', details: error } };
    }
  },

  async deleteProvinceMessage(messageId: string): Promise<{ data: any | null; error: any }> {
    if (!messageId) return { data: null, error: { message: 'Message ID is required' } };
    
    // Verify session before deleting
    const { valid } = await checkSession();
    if (!valid) {
      console.error('[provinceChatService] deleteProvinceMessage - No valid session found');
      return { data: null, error: { message: 'Authentication required to delete messages' } };
    }
    
    return handleSupabaseQuery(
      supabase
        .from('province_messages')
        .delete()
        .eq('id', messageId),
      `deleteProvinceMessage(${messageId})`
    );
  },

  subscribeToNewProvinceMessages(provinceChatId: string, callback: (payload: RealtimePostgresChangesPayload<ProvinceMessage>) => void): RealtimeChannel | undefined {
    return manageProvinceSubscription<ProvinceMessage>('province-messages', provinceChatId, 'province_messages', callback);
  },

  subscribeToMembershipUpdates(provinceChatId: string, callback: (payload: RealtimePostgresChangesPayload<ProvinceChatMember>) => void): RealtimeChannel | undefined {
    return manageProvinceSubscription<ProvinceChatMember>('province-members', provinceChatId, 'province_chat_members', callback);
  },

  async unsubscribeFromProvinceChat(provinceChatId: string): Promise<void> {
    try {
      console.log(`[provinceChatService] Unsubscribing from chat ${provinceChatId}`);
      const messageKey = `province-messages:${provinceChatId}`;
      const memberKey = `province-members:${provinceChatId}`;
      
      if (activeProvinceChannels.has(messageKey)) {
        const channel = activeProvinceChannels.get(messageKey);
        await channel?.unsubscribe();
        activeProvinceChannels.delete(messageKey);
        console.log(`[provinceChatService] Unsubscribed from messages for ${provinceChatId}`);
      }
      
      if (activeProvinceChannels.has(memberKey)) {
        const channel = activeProvinceChannels.get(memberKey);
        await channel?.unsubscribe();
        activeProvinceChannels.delete(memberKey);
        console.log(`[provinceChatService] Unsubscribed from membership for ${provinceChatId}`);
      }
    } catch (error) {
      console.error(`[provinceChatService] Error unsubscribing from chat ${provinceChatId}:`, error);
    }
  },

  async unsubscribeFromAllProvinceChats(): Promise<void> {
    try {
      console.log(`[provinceChatService] Unsubscribing from all province chats. Total channels: ${activeProvinceChannels.size}`);
      
      // Create a copy of the keys to avoid modification during iteration
      const channelKeys = Array.from(activeProvinceChannels.keys());
      
      for (const key of channelKeys) {
        try {
          const channel = activeProvinceChannels.get(key);
          if (channel) {
            await channel.unsubscribe();
            console.log(`[provinceChatService] Unsubscribed from channel: ${key}`);
          }
          activeProvinceChannels.delete(key);
        } catch (e) {
          console.error(`[provinceChatService] Error unsubscribing from ${key}:`, e);
        }
      }
      
      console.log('[provinceChatService] Finished unsubscribing from all channels');
    } catch (error) {
      console.error('[provinceChatService] Error in unsubscribeFromAllProvinceChats:', error);
    }
  }
};

// Remove duplicate exports from the end of the file if they existed