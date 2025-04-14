import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Text, Card, Avatar, Divider, Searchbar, Badge, useTheme, Surface, Appbar, List } from 'react-native-paper';
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

// Define local data types
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
  regions: { // Assuming relation returns an object, not array
    name: string;
  };
}

interface UserGroup {
  group_id: string;
  group_chats: GroupChat; // Assuming relation returns a single object
}

// Type for props passed to left/right in Card.Title
type CardItemProps = {
    size: number;
    color: string;
    style?: any; // Allow optional style prop
};

const ChatScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();
  const { user } = useAuth();
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [groupChats, setGroupChats] = useState<GroupChat[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);

  // Move styles definition inside the component
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    contentContainer: { // Added container for list content
        flex: 1,
    },
    searchbar: {
      margin: 8,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContent: {
      paddingHorizontal: 8,
      paddingBottom: 16,
    },
    card: {
      marginVertical: 4,
      marginHorizontal: 8, // Consistent margin
    },
    cardRightContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingRight: 8, // Add padding if needed
    },
    joinedBadge: {
      marginRight: 8,
      backgroundColor: theme.colors.primary, // Now theme is accessible
      color: theme.colors.onPrimary, // Now theme is accessible
    },
    listSubheader: {
      paddingHorizontal: 16,
      paddingTop: 8,
      fontWeight: 'bold',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: theme.colors.onSurfaceVariant, // Now theme is accessible
    }
  });

  useEffect(() => {
    const loadRegions = async () => {
      try {
        setLoading(true);
        const { data, error } = await getRegions();
        if (error) throw error;
        if (data) {
          setRegions(data as Region[]);
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
          // Ensure the structure matches UserGroup, especially group_chats
          const validUserGroups = (data as any[])
            .filter(item => item.group_chats && item.group_chats.id) // Basic validation
            .map(item => ({
              group_id: item.group_id,
              // Ensure group_chats is an object, not array, and has necessary fields
              group_chats: {
                  id: item.group_chats.id,
                  name: item.group_chats.name || 'Unknown Chat',
                  description: item.group_chats.description || '',
                  region_id: item.group_chats.region_id,
                  regions: { // Ensure regions structure
                      name: item.group_chats.regions?.name || 'Unknown Region'
                  }
              } as GroupChat
            })) as UserGroup[];
          setUserGroups(validUserGroups);
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
    setSearchQuery('');
    setSearchVisible(false);
    try {
      const { data, error } = await getGroupChatsByRegion(region.id);
      if (error) throw error;
      if (data) {
         // Ensure data matches GroupChat structure
         const validGroupChats = (data as any[])
           .filter(item => item.id && item.regions) // Basic validation
           .map(item => ({
                id: item.id,
                name: item.name || 'Unnamed Chat',
                description: item.description || '',
                region_id: item.region_id,
                regions: { // Ensure regions structure
                    name: item.regions?.name || 'Unknown Region'
                }
            })) as GroupChat[];
        setGroupChats(validGroupChats);
      } else {
        setGroupChats([]);
      }
    } catch (error) {
      console.error('Error loading group chats:', error);
      setGroupChats([]);
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

  const filteredRegions = regions.filter(region =>
    region.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroupChats = groupChats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderRegionItem = ({ item }: { item: Region }) => (
    <Card
      style={styles.card}
      onPress={() => handleRegionSelect(item)}
    >
      <Card.Title
        title={item.name}
        subtitle={item.description}
        titleVariant="titleMedium"
        subtitleVariant="bodySmall"
        left={(props: CardItemProps) => (
          <Avatar.Text
            {...props}
            label={item.name.charAt(0).toUpperCase()}
            color={theme.colors.onPrimary}
            style={[{ backgroundColor: theme.colors.primary }, props.style]}
            size={40}
          />
        )}
        right={(props: CardItemProps) => (
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={theme.colors.onSurfaceVariant}
            style={props.style} // Pass style if needed
          />
        )}
      />
    </Card>
  );

  const renderGroupChatItem = ({ item }: { item: GroupChat }) => (
    <Card
      style={styles.card}
      onPress={() => handleChatSelect(item)}
    >
      <Card.Title
        title={item.name}
        subtitle={item.description}
        titleVariant="titleMedium"
        subtitleVariant="bodySmall"
        left={(props: CardItemProps) => (
          <Avatar.Text
            {...props}
            label={item.name.charAt(0).toUpperCase()}
            color={theme.colors.onSecondaryContainer}
            style={[{ backgroundColor: theme.colors.secondaryContainer }, props.style]}
            size={40}
          />
        )}
        right={(props: CardItemProps) => (
          <View style={styles.cardRightContainer}>
            {isUserInGroup(item.id) && (
              <Badge style={styles.joinedBadge} theme={theme} size={16}>Joined</Badge>
            )}
            <MaterialCommunityIcons
              name="chat-processing-outline"
              size={24}
              color={theme.colors.onSurfaceVariant}
              style={props.style}
            />
          </View>
        )}
      />
    </Card>
  );

  const renderYourChatsItem = ({ item }: { item: UserGroup }) => (
    <Card
      style={styles.card}
      onPress={() => handleChatSelect(item.group_chats)}
    >
      <Card.Title
        title={item.group_chats.name}
        subtitle={`${item.group_chats.regions.name} - ${item.group_chats.description}`}
        titleVariant="titleMedium"
        subtitleVariant="bodySmall"
        left={(props: CardItemProps) => (
          <Avatar.Text
            {...props}
            label={item.group_chats.name.charAt(0).toUpperCase()}
            color={theme.colors.onSecondaryContainer}
            style={[{ backgroundColor: theme.colors.secondaryContainer }, props.style]}
            size={40}
          />
        )}
        right={(props: CardItemProps) => (
          <MaterialCommunityIcons
            name="chat-processing-outline"
            size={24}
            color={theme.colors.onSurfaceVariant}
            style={[{ marginRight: 0 }, props.style]}
          />
        )}
      />
    </Card>
  );

    // Function to determine which list content to render
  const renderListContent = () => {
    if (loading && !selectedRegion && regions.length === 0 && userGroups.length === 0) {
      return <View style={styles.centerContainer}><ActivityIndicator size="large" /></View>;
    }

    // 1. Display Group Chats if a region is selected
    if (selectedRegion) {
      return (
        <FlatList<GroupChat>
          data={filteredGroupChats}
          renderItem={renderGroupChatItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={<List.Subheader style={styles.listSubheader}>{selectedRegion.name} Chats</List.Subheader>}
          ListEmptyComponent={
            !loadingGroups ? <Text style={styles.emptyText}>No chats found in this region.</Text> : <ActivityIndicator style={{ marginTop: 20 }} />
          }
          contentContainerStyle={styles.listContent}
        />
      );
    }

    // 2. Display Search Results (Regions) if searching
    if (searchQuery) {
       return (
        <FlatList<Region>
          data={filteredRegions}
          renderItem={renderRegionItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={<List.Subheader style={styles.listSubheader}>Regions Found</List.Subheader>}
          ListEmptyComponent={<Text style={styles.emptyText}>No regions match your search.</Text>}
          contentContainerStyle={styles.listContent}
        />
      );
    }

    // 3. Display User's Chats and All Regions
    return (
        <View style={{ flex: 1 }}>
            {userGroups.length > 0 && (
                <>
                    <List.Subheader style={styles.listSubheader}>Your Chats</List.Subheader>
                    <FlatList<UserGroup>
                        data={userGroups}
                        renderItem={renderYourChatsItem}
                        keyExtractor={(item) => item.group_id}
                        contentContainerStyle={{ paddingBottom: 0 }} // Adjust padding if needed
                        scrollEnabled={false} // Disable scroll if nested or manage height
                    />
                    <Divider style={{ marginVertical: 8 }}/>
                </>
            )}
             <List.Subheader style={styles.listSubheader}>All Regions</List.Subheader>
             <FlatList<Region>
                data={regions} // Show all regions
                renderItem={renderRegionItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }} // Ensure padding at bottom
                ListEmptyComponent={!loading ? <Text style={styles.emptyText}>No regions available.</Text> : null}
            />
        </View>
    );
  };

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        {selectedRegion && <Appbar.BackAction onPress={() => setSelectedRegion(null)} />}
        <Appbar.Content title={selectedRegion ? selectedRegion.name : "Chat Regions"} />
        <Appbar.Action icon={searchVisible ? "close" : "magnify"} onPress={() => setSearchVisible(!searchVisible)} />
      </Appbar.Header>
      {searchVisible && (
        <Searchbar
          placeholder={selectedRegion ? "Search chats..." : "Search regions..."}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      )}
      <View style={styles.contentContainer}>
        {renderListContent()}
      </View>
    </Surface>
  );
};

export default ChatScreen; 