import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, StatusBar, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { provinceChatService } from '../../services/provinceChatService'; // Adjust path if needed
import { Card, Button, useTheme, Paragraph, Title, Surface, Avatar, Divider, Searchbar, IconButton } from 'react-native-paper'; // Import Card, Button etc.
import { MaterialCommunityIcons } from '@expo/vector-icons'; // For icons
import { NativeStackNavigationProp } from '@react-navigation/native-stack'; // For stronger navigation typing
import { MainStackParamList } from '../../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, SlideInRight } from 'react-native-reanimated';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { LottieWrapper } from '../../components/animations/LottieWrapper';

// Define proper navigation type based on the app's navigation structure
type RegionListNavigationProp = NativeStackNavigationProp<MainStackParamList, 'MainTabs'>;

// Define type for Region based on service
interface Region { id: string; name: string; description?: string; }

// Create animated card component with proper type
const AnimatedCard = Animated.createAnimatedComponent(Card) as React.ComponentType<
  React.ComponentProps<typeof Card> & { entering?: any }
>;

const RegionListScreen = () => {
  const navigation = useNavigation<RegionListNavigationProp>(); // Use specific type
  const theme = useTheme(); // Get theme
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await provinceChatService.getRegions();

      if (fetchError) {
        console.error('Error fetching regions:', fetchError);
        setError(fetchError.message || 'Failed to load regions.');
      } else {
        setRegions(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Handle Region Press ---
  const handleRegionPress = (region: Region) => {
    navigation.navigate('ProvinceList', { 
      regionId: region.id, 
      regionName: region.name // Pass name for the title
    });
  };

  // Filter regions based on search query
  const filteredRegions = regions.filter(region => 
    region.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    region.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Render Loading State ---
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
        <Surface style={styles.headerSurface}>
          <Text style={styles.headerTitle}>Regions</Text>
        </Surface>
        <View style={[styles.center, {backgroundColor: theme.colors.background}]}>
          <LottieWrapper
            source={require('../../../assets/animations/map-loading.json')}
            icon="loading"
            text="Discovering regions..."
            style={styles.lottieAnimation}
          />
        </View>
      </SafeAreaView>
    );
  }

  // --- Render Error State ---
  if (error && !loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
        <Surface style={styles.headerSurface}>
          <Text style={styles.headerTitle}>Regions</Text>
        </Surface>
        <View style={[styles.center, {backgroundColor: theme.colors.background}]}>
          <MaterialCommunityIcons 
            name="map-marker-alert" 
            size={80} 
            color={theme.colors.error} 
          />
          <Title style={[styles.errorTitle, { color: theme.colors.error }]}>
            Oops!
          </Title>
          <Paragraph style={[styles.errorText, { color: theme.colors.onSurfaceVariant }]}>
            {error}
          </Paragraph>
          <Button 
            mode="contained" 
            onPress={fetchData}
            icon="reload"
            style={styles.retryButton}
          >
            Try Again
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // --- Render Region Card ---
  const renderRegionItem = ({ item, index }: { item: Region, index: number }) => {
    // Generate dynamic color based on name
    const hue = (item.name.length * 25) % 360;
    const cardColor = `hsl(${hue}, 70%, 45%)`;
    
    // Get first letter of region name
    const regionFirstLetter = item.name.charAt(0).toUpperCase();

    return (
      <AnimatedCard 
        style={styles.card}
        entering={FadeInDown.delay(index * 100).duration(400)}
        mode="elevated"
      >
        <Card.Content>
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => handleRegionPress(item)}
            style={styles.cardTouchable}
            accessibilityRole="button"
            accessibilityLabel={`${item.name} region`}
            accessibilityHint={`Double tap to explore provinces in ${item.name}`}
          >
            <LinearGradient
              colors={[cardColor, `${cardColor}99`]} 
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.cardHeader}
            >
              <View style={styles.cardHeaderContent}>
                <Avatar.Text 
                  label={regionFirstLetter} 
                  size={40} 
                  style={styles.avatar}
                  labelStyle={styles.avatarText}
                />
                <Text style={styles.regionName} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
            </LinearGradient>
            
            <Card.Content style={styles.cardContent}>
              {item.description ? (
                <Paragraph style={styles.description}>
                  {item.description}
                </Paragraph>
              ) : (
                <Paragraph style={styles.description}>
                  Explore provinces and chat rooms in {item.name}
                </Paragraph>
              )}
            </Card.Content>
            
            <Card.Actions style={styles.cardActions}>
              <Button 
                mode="contained-tonal" 
                icon="arrow-right" 
                onPress={() => handleRegionPress(item)}
                style={styles.exploreButton}
                labelStyle={styles.buttonLabel}
              >
                Explore
              </Button>
            </Card.Actions>
          </TouchableOpacity>
        </Card.Content>
      </AnimatedCard>
    );
  };

  // --- Render Region List ---
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      
      {/* Header */}
      <Animated.View entering={FadeIn.duration(300)}>
        <Surface style={styles.headerSurface}>
          <Text style={styles.headerTitle}>Regions</Text>
          <IconButton 
            icon="tune" 
            size={24} 
            iconColor={theme.colors.onPrimary}
            style={styles.filterButton}
            onPress={() => {/* Add filter functionality */}}
          />
        </Surface>
      </Animated.View>
      
      {/* Search bar */}
      <Animated.View entering={SlideInRight.delay(200).duration(400)}>
        <Searchbar
          placeholder="Search regions..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          iconColor={theme.colors.primary}
          clearIcon="close-circle"
        />
      </Animated.View>
      
      {/* Region List */}
      <FlatList
        data={filteredRegions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContentContainer}
        renderItem={renderRegionItem}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        ListEmptyComponent={() => (
          <View style={[styles.center, { paddingTop: 50 }]}>
            <MaterialCommunityIcons 
              name="map-search" 
              size={80} 
              color={theme.colors.onSurfaceVariant} 
            />
            <Paragraph style={{ color: theme.colors.onSurfaceVariant, marginTop: 16, textAlign: 'center' }}>
              {searchQuery 
                ? `No regions match "${searchQuery}"`
                : 'No regions available'}
            </Paragraph>
            <Button 
              mode="outlined"
              style={{ marginTop: 16 }}
              icon="refresh"
              onPress={fetchData}
            >
              Refresh
            </Button>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

// --- Enhanced Styles ---
const styles = StyleSheet.create({
  avatar: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginRight: 12,
  },
  avatarText: {
    fontWeight: 'bold',
  },
  buttonLabel: {
    fontWeight: 'bold',
  },
  card: {
    borderRadius: 16,
    elevation: 3,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardActions: {
    justifyContent: 'flex-end',
    paddingBottom: 16,
    paddingRight: 16,
  },
  cardContent: {
    paddingBottom: 8,
    paddingTop: 16,
  },
  cardHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  cardHeaderContent: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  cardTouchable: {
    overflow: 'hidden',
  },
  center: {
    alignItems: 'center', 
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 20,
    marginTop: 8,
    maxWidth: 300,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  exploreButton: {
    borderRadius: 8,
  },
  filterButton: {
    position: 'absolute',
    right: 8,
  },
  headerSurface: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#5D3FD3', // Rich purple color
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  listContentContainer: {
    padding: 16,
    paddingBottom: 100, // Extra padding at bottom for better scrolling
  },
  lottieAnimation: {
    height: 200,
    width: 200,
  },
  regionName: {
    color: '#fff',
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
  },
  retryButton: {
    paddingHorizontal: 24,
  },
  searchbar: {
    borderRadius: 12,
    elevation: 2,
    margin: 16,
    marginBottom: 8,
    marginTop: 8,
  },
});

export default RegionListScreen; 