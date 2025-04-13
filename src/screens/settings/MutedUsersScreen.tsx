import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Text, Avatar, List, ActivityIndicator, Button, Divider } from 'react-native-paper';
import { theme } from '../../constants/theme';
import { getMutedUsers, unmuteUser } from '../../services/moderation';
import { useAuth } from '../../hooks/useAuth';

interface MutedUser {
  muted_user_id: string;
  muted_users: {
    id: string;
    username: string;
    profile_picture: string | null;
  };
}

const MutedUsersScreen = () => {
  const { user } = useAuth();
  const [mutedUsers, setMutedUsers] = useState<MutedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMutedUsers = useCallback(async () => {
    if (!user) return;
    
    try {
      setError(null);
      const { data, error } = await getMutedUsers(user.id);
      
      if (error) throw error;
      
      if (data) {
        // Transform the data to match our expected format
        const formattedData = data.map((item: any) => {
          return {
            muted_user_id: item.muted_user_id,
            muted_users: Array.isArray(item.muted_users) 
              ? item.muted_users[0] 
              : item.muted_users,
          };
        });
        setMutedUsers(formattedData);
      }
    } catch (err) {
      console.error('Error loading muted users:', err);
      setError('Unable to load muted users. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadMutedUsers();
  }, [loadMutedUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMutedUsers();
  };

  const handleUnmute = async (mutedUserId: string, username: string) => {
    if (!user) return;
    
    Alert.alert(
      'Unmute User',
      `Are you sure you want to unmute ${username}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Unmute',
          onPress: async () => {
            try {
              const { error } = await unmuteUser(user.id, mutedUserId);
              
              if (error) throw error;
              
              // Remove user from the list
              setMutedUsers(prev => prev.filter(m => m.muted_user_id !== mutedUserId));
              Alert.alert('Success', `${username} has been unmuted.`);
            } catch (err) {
              console.error('Error unmuting user:', err);
              Alert.alert('Error', 'Failed to unmute user. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderMutedUserItem = ({ item }: { item: MutedUser }) => {
    const { muted_users: mutedUser } = item;
    
    return (
      <List.Item
        title={mutedUser.username}
        left={(props: any) => (
          mutedUser.profile_picture ? (
            <Avatar.Image {...props} size={48} source={{ uri: mutedUser.profile_picture }} />
          ) : (
            <Avatar.Text
              {...props}
              size={48}
              label={mutedUser.username.charAt(0).toUpperCase()}
            />
          )
        )}
        right={(props: any) => (
          <Button
            {...props}
            mode="text"
            onPress={() => handleUnmute(item.muted_user_id, mutedUser.username)}
          >
            Unmute
          </Button>
        )}
      />
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading muted users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Muted Users</Text>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <FlatList
        data={mutedUsers}
        keyExtractor={(item) => item.muted_user_id}
        renderItem={renderMutedUserItem}
        ItemSeparatorComponent={() => <Divider />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No muted users</Text>
            <Text>You haven't muted any users yet.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: 4,
    marginBottom: 10,
    padding: 10,
  },
  errorText: {
    color: '#c62828',
  },
  listContent: {
    paddingBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: theme.colors.primary,
    marginTop: 8,
  },
  title: {
    color: theme.colors.primary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

export default MutedUsersScreen; 