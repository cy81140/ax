import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Avatar, List, ActivityIndicator, Button, Divider, Surface, useTheme, Portal, Dialog, HelperText } from 'react-native-paper';
import { userService } from '../../services/user';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../types/services';

interface MutedUser {
  muted_user_id: string;
  muted_users: {
    id: string;
    username: string;
    profile_picture: string | null | undefined;
  };
}

const MutedUsersScreen = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [mutedUsers, setMutedUsers] = useState<MutedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [userToUnmute, setUserToUnmute] = useState<{ id: string; username: string } | null>(null);

  const loadMutedUsers = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const data = await userService.getMutedUsers(user.id);
      
      // Convert the userService response to match our MutedUser interface
      const convertedData: MutedUser[] = data.map(item => ({
        muted_user_id: item.muted_user_id,
        muted_users: {
          id: item.muted_users.id,
          username: item.muted_users.username,
          profile_picture: item.muted_users.profile_picture || null
        }
      }));
      
      setMutedUsers(convertedData);
    } catch (err: any) {
      console.error('Error loading muted users:', err);
      setError(err?.message || 'Unable to load muted users. Please try again.');
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

  const showUnmuteDialog = (mutedUserId: string, username: string) => {
    setUserToUnmute({ id: mutedUserId, username });
    setDialogVisible(true);
  };

  const hideDialog = () => {
    setDialogVisible(false);
    setUserToUnmute(null);
  };

  const confirmUnmute = async () => {
    if (!user || !userToUnmute) return;

    const { id: mutedUserId, username } = userToUnmute;
    hideDialog();

    try {
      await userService.unmuteUser(user.id, mutedUserId);
      setMutedUsers(prev => prev.filter(m => m.muted_user_id !== mutedUserId));
    } catch (err: any) {
      console.error('Error unmuting user:', err);
      setError(err?.message || 'Failed to unmute user. Please try again.');
    }
  };

  const renderMutedUserItem = ({ item }: { item: MutedUser }) => {
    const { muted_users: mutedUser } = item;
    if (!mutedUser) return null;

    return (
      <List.Item
        title={mutedUser.username}
        titleStyle={{ fontWeight: 'bold' }}
        left={(props: any) => (
          mutedUser.profile_picture ? (
            <Avatar.Image {...props} size={40} source={{ uri: mutedUser.profile_picture }} />
          ) : (
            <Avatar.Text
              {...props}
              size={40}
              label={mutedUser.username?.charAt(0).toUpperCase() || ''}
            />
          )
        )}
        right={(props: any) => (
          <Button
            {...props}
            mode="outlined"
            onPress={() => showUnmuteDialog(item.muted_user_id, mutedUser.username)}
            textColor={theme.colors.primary}
            compact
          >
            Unmute
          </Button>
        )}
      />
    );
  };

  if (loading && !refreshing) {
    return (
      <Surface style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator animating={true} color={theme.colors.primary} size="large"/>
      </Surface>
    );
  }

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {error && (
        <HelperText type="error" visible={!!error} style={styles.errorText}>
          {error}
        </HelperText>
      )}

      <FlatList
        data={mutedUsers}
        keyExtractor={(item) => item.muted_user_id}
        renderItem={renderMutedUserItem}
        ItemSeparatorComponent={() => <Divider />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
             refreshing={refreshing}
             onRefresh={onRefresh}
             colors={[theme.colors.primary]}
             tintColor={theme.colors.primary}
           />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    You haven't muted any users yet.
                </Text>
            </View>
          ) : null
        }
      />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={hideDialog}>
          <Dialog.Title>Unmute User</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to unmute {userToUnmute?.username}?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDialog}>Cancel</Button>
            <Button onPress={confirmUnmute} textColor={theme.colors.primary}>Unmute</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Surface>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 200,
    padding: 32,
  },
  errorText: {
    margin: 16,
    textAlign: 'center',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
});

export default MutedUsersScreen;