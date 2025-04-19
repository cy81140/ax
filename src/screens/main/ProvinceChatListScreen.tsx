import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, StatusBar } from 'react-native';
import { Text, useTheme, Searchbar, Avatar, Surface, Divider } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { provinceChatService } from '../../services/provinceChatService';
import { useAuth } from '../../contexts/AuthContext';
import { MainStackParamList } from '../../navigation/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Define RegionSummary locally
interface RegionSummary {
  id: string; 
  name: string; 
  description?: string; 
}

// Adjust navigation prop type if needed, MainStack is likely correct
type RegionListNavProp = StackNavigationProp<MainStackParamList, 'MainTabs'>; 

// Rename component for clarity (Optional, but good practice)
const ProvinceChatListScreen = () => { 
  const { user } = useAuth(); // Keep user context if needed for auth checks
  const theme = useTheme();
  const navigation = useNavigation<RegionListNavProp>();

  // State holds RegionSummary now
  const [regions, setRegions] = useState<RegionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Regions instead of Chats
  const fetchRegions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Assume getRegions returns data with id, name, description
      const { data, error: fetchError } = await provinceChatService.getRegions(); 
      
      if (fetchError) throw fetchError;
      
      // Map data using 'any' temporarily, ensure properties exist
      const summaries = (data || []).map((region: any) => ({ 
          id: region.id, 
          name: region.name || 'Unknown Region', 
          description: region.description,
      }));

      setRegions(summaries);
    } catch (err: any) { 
      console.error("Failed to fetch regions:", err);
      setError(err.message || 'Could not load regions.');
      setRegions([]); 
    } finally {
      setLoading(false);
    }
  }, []); // Removed user dependency if not needed for getRegions

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRegions();
    setRefreshing(false);
  }, [fetchRegions]);

  useFocusEffect(
    useCallback(() => {
      fetchRegions();
    }, [fetchRegions])
  );

  // Filter regions based on search query
  const filteredRegions = regions.filter(region => 
    region.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render Region Item (styled like a chat item)
  const renderRegionItem = ({ item, index }: { item: RegionSummary, index: number }) => {
    const regionInitial = item.name?.charAt(0)?.toUpperCase() || 'R';
    // Generate a dynamic color based on the region name for the avatar
    const randomColor = `hsl(${(item.name.length * 15) % 360}, 70%, 45%)`;

    return (
      <>
        <TouchableOpacity 
          activeOpacity={0.7}
          // Navigate to ProvinceList for this region
          onPress={() => navigation.navigate('ProvinceList', { 
            regionId: item.id, 
            regionName: item.name 
          })}
        >
          <Surface style={styles.itemSurface} elevation={0}>
            <View style={styles.itemContainer}>
              <Avatar.Text 
                size={50} 
                label={regionInitial} 
                style={[styles.avatar, { backgroundColor: randomColor }]} 
                labelStyle={styles.avatarLabel} 
              />
              <View style={styles.textContainer}>
                <View style={styles.titleRow}>
                  <Text variant="titleMedium" style={styles.regionName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.statusContainer}>
                    <MaterialCommunityIcons 
                      name="chevron-right" 
                      size={22} 
                      color={theme.colors.onSurfaceVariant} 
                    />
                  </View>
                </View>
                <View style={styles.subtitleRow}>
                  <Text variant="bodyMedium" style={styles.lastMessage} numberOfLines={1}>
                    {item.description || 'Explore provinces in this region'}
                  </Text>
                </View>
              </View>
            </View>
          </Surface>
        </TouchableOpacity>
        {index < filteredRegions.length - 1 && (
          <Divider style={styles.divider} />
        )}
      </>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar backgroundColor={theme.colors.elevation.level2} barStyle="light-content" />
      
      <Surface style={styles.header} elevation={1}>
        <Text variant="headlineMedium" style={styles.headerTitle}>Regions</Text>
        <Searchbar
          placeholder="Search regions"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchbar, { backgroundColor: theme.colors.surfaceVariant }]}
          inputStyle={{ color: theme.colors.onSurface }}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          iconColor={theme.colors.onSurfaceVariant}
          theme={{ colors: { primary: theme.colors.primary } }} 
          elevation={0}
        />
      </Surface>
      
      {loading && !refreshing && regions.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={{ color: theme.colors.error }}>{error}</Text>
        </View>
      ) : filteredRegions.length === 0 ? (
         <View style={styles.centerContainer}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
                {searchQuery ? 'No regions match your search.' : 'No regions found.'} 
            </Text>
         </View>
      ) : (
        <FlatList
          data={filteredRegions}
          renderItem={renderRegionItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor={theme.colors.primary} 
            />
          }
        />
      )}
    </View>
  );
};

// Updated styles to match the UI kit design
const styles = StyleSheet.create({
  avatar: {
    marginRight: 16,
  },
  avatarLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  centerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    flex: 1,
  },
  divider: {
    marginLeft: 82, // To align with the start of the text, not the avatar
    opacity: 0.2,
  },
  header: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  headerTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  itemContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemSurface: {
    backgroundColor: 'transparent', 
  },
  lastMessage: {
    opacity: 0.7,
  },
  listContent: {
    paddingBottom: 16,
  },
  regionName: {
    flex: 1,
    fontWeight: '600',
  },
  searchbar: {
    borderRadius: 25,
    height: 48,
  },
  statusContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  subtitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
});

export default ProvinceChatListScreen; 