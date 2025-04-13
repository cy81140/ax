import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Card, Avatar, Divider, Searchbar, Badge } from 'react-native-paper';
import { theme } from '../../constants/theme';
import { AvatarTextProps } from '../../types/components';
import { getRegions, getGroupChatsByRegion, getUserGroups } from '../../services/chat';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

// Define navigation types
type RootStackParamList = {
  ChatRoom: {
    roomId: string;
    roomName: string;
    roomDescription: string;
    regionName: string;
  };
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'ChatRoom'>;

interface Region {
  id: string;
  name: string;
  description: string;
}

interface GroupChat {
  id: string;
  name: string;
  description: string;
  region_id: string;
  regions: {
    name: string;
  };
}

interface UserGroup {
  group_id: string;
  group_chats: GroupChat;
}

const ChatScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [groupChats, setGroupChats] = useState<GroupChat[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(false);

  useEffect(() => {
    const loadRegions = async () => {
      try {
        const { data, error } = await getRegions();
        if (error) throw error;
        if (data) {
          setRegions(data);
        }
      } catch (error) {
        console.error('Error loading regions:', error);
      } finally {
        setLoading(false);
      }
    };

    const loadUserGroups = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await getUserGroups(user.id);
        if (error) throw error;
        if (data) {
          // First convert to unknown, then to UserGroup[] to avoid type mismatch errors
          setUserGroups(data as unknown as UserGroup[]);
        }
      } catch (error) {
        console.error('Error loading user groups:', error);
      }
    };

    loadRegions();
    loadUserGroups();
  }, [user]);

  const handleRegionSelect = async (region: Region) => {
    setSelectedRegion(region);
    setLoadingGroups(true);
    
    try {
      const { data, error } = await getGroupChatsByRegion(region.id);
      if (error) throw error;
      if (data) {
        setGroupChats(data);
      }
    } catch (error) {
      console.error('Error loading group chats:', error);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleChatSelect = (chat: GroupChat) => {
    navigation.navigate('ChatRoom', {
      roomId: chat.id,
      roomName: chat.name,
      roomDescription: chat.description,
      regionName: chat.regions.name,
    });
  };

  const isUserInGroup = (groupId: string) => {
    return userGroups.some(group => group.group_id === groupId);
  };

  // Filter regions based on search query
  const filteredRegions = regions.filter(region => 
    region.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    region.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter group chats based on search query
  const filteredGroupChats = groupChats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderRegionItem = ({ item }: { item: Region }) => (
    <TouchableOpacity onPress={() => handleRegionSelect(item)}>
      <Card 
        style={[
          styles.card, 
          selectedRegion?.id === item.id ? styles.selectedCard : null
        ]}
      >
        <Card.Title
          title={item.name}
          subtitle={item.description}
          left={(props: AvatarTextProps) => (
            <Avatar.Text
              {...props}
              label={item.name.charAt(0)}
              color="white"
              style={{ backgroundColor: theme.colors.primary }}
            />
          )}
          right={() => (
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={theme.colors.primary}
              style={{ marginRight: 16 }}
            />
          )}
        />
      </Card>
    </TouchableOpacity>
  );

  const renderGroupChatItem = ({ item }: { item: GroupChat }) => (
    <TouchableOpacity onPress={() => handleChatSelect(item)}>
      <Card style={styles.card}>
        <Card.Title
          title={item.name}
          subtitle={item.description}
          left={(props: AvatarTextProps) => (
            <Avatar.Text
              {...props}
              label={item.name.charAt(0)}
              color="white"
              style={{ backgroundColor: theme.colors.secondary }}
            />
          )}
          right={() => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
              {isUserInGroup(item.id) && (
                <Badge style={{ backgroundColor: theme.colors.primary, marginRight: 8 }}>
                  Joined
                </Badge>
              )}
              <MaterialCommunityIcons
                name="chat"
                size={24}
                color={theme.colors.primary}
              />
            </View>
          )}
        />
      </Card>
    </TouchableOpacity>
  );

  const renderYourChatsItem = ({ item }: { item: UserGroup }) => (
    <TouchableOpacity onPress={() => handleChatSelect(item.group_chats)}>
      <Card style={styles.card}>
        <Card.Title
          title={item.group_chats.name}
          subtitle={`${item.group_chats.regions.name} - ${item.group_chats.description}`}
          left={(props: AvatarTextProps) => (
            <Avatar.Text
              {...props}
              label={item.group_chats.name.charAt(0)}
              color="white"
              style={{ backgroundColor: theme.colors.secondary }}
            />
          )}
          right={() => (
            <MaterialCommunityIcons
              name="chat"
              size={24}
              color={theme.colors.primary}
              style={{ marginRight: 16 }}
            />
          )}
        />
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chat Rooms</Text>
        <Searchbar
          placeholder="Search regions or provinces"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      {userGroups.length > 0 && !selectedRegion && searchQuery === '' && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Chats</Text>
          </View>
          <FlatList
            data={userGroups}
            keyExtractor={(item) => item.group_id}
            renderItem={renderYourChatsItem}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            style={styles.list}
            horizontal={false}
            scrollEnabled={false}
          />
          <Divider style={styles.divider} />
        </>
      )}

      {!selectedRegion ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Regions</Text>
          </View>
          <FlatList
            data={filteredRegions}
            keyExtractor={(item) => item.id}
            renderItem={renderRegionItem}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            style={styles.list}
            contentContainerStyle={styles.listContent}
          />
        </>
      ) : (
        <>
          <View style={styles.sectionHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedRegion(null)}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={styles.backText}>Back to Regions</Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>{selectedRegion.name} Provinces</Text>
          </View>

          {loadingGroups ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <FlatList
              data={filteredGroupChats}
              keyExtractor={(item) => item.id}
              renderItem={renderGroupChatItem}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={(
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons
                    name="chat-remove"
                    size={64}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.emptyText}>No provinces found</Text>
                </View>
              )}
            />
          )}
        </>
      )}
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
  header: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: theme.colors.primary,
  },
  searchBar: {
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 4,
    elevation: 2,
  },
  selectedCard: {
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  separator: {
    height: 4,
  },
  divider: {
    marginVertical: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  backText: {
    color: theme.colors.primary,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 16,
  },
});

export default ChatScreen; 