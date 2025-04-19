import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, ActivityIndicator, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MainStackParamList } from '../../navigation/types';
import { provinceChatService } from '../../services/provinceChatService';
import { Card, Button, Searchbar, Avatar, Paragraph, useTheme, Surface, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Animated, { FadeInDown, FadeIn, SlideInRight } from 'react-native-reanimated';
import { LottieWrapper } from '../../components/animations/LottieWrapper';

type ProvinceListRouteProp = RouteProp<MainStackParamList, 'ProvinceList'>;
type ProvinceListNavigationProp = NativeStackNavigationProp<MainStackParamList, 'ProvinceList'>;

// Define ProvinceExtended interface that explicitly includes optional properties
interface ProvinceData {
  id: string;
  name: string;
  region_id: string;
  description?: string;
}

// Create animated component with proper typing to avoid TS errors
const AnimatedCard = Animated.createAnimatedComponent(Card) as any;

// Custom component for screen header
const ScreenHeader = ({ title, onBackPress, onFilterPress }: { 
  title: string; 
  onBackPress: () => void;
  onFilterPress?: () => void;
}) => {
  const theme = useTheme();
  return (
    <LinearGradient
      colors={['#5D3FD3', '#7355DD']}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 0}}
      style={styles.headerSurface}
    >
      <IconButton
        icon="arrow-left"
        iconColor={theme.colors.onPrimary}
        size={24}
        onPress={onBackPress}
        style={styles.backButton}
      />
      <Text style={[styles.headerTitle, { color: '#fff' }]}>{title}</Text>
      {onFilterPress && (
        <IconButton
          icon="tune"
          iconColor={theme.colors.onPrimary}
          size={24}
          onPress={onFilterPress}
          style={styles.filterButton}
        />
      )}
    </LinearGradient>
  );
};

const ProvinceListScreen = () => {
  const navigation = useNavigation<ProvinceListNavigationProp>();
  const route = useRoute<ProvinceListRouteProp>();
  const theme = useTheme();
  
  // Extract regionId and regionName from route params
  const { regionId, regionName } = route.params;
  
  // State variables
  const [provinces, setProvinces] = useState<ProvinceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    if (!regionId) {
      setError('Region ID is missing.');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await provinceChatService.getProvincesByRegion(regionId);
      
      if (fetchError) {
        console.error('Error fetching provinces:', fetchError);
        setError(fetchError.message || 'Failed to load provinces.');
      } else if (!data || data.length === 0) {
        setProvinces([]);
        // Set a friendly empty message instead of error
      } else {
        // Update the mapping to use the new interface
        const typedProvinces: ProvinceData[] = data.map(item => ({
          id: item.id || '',
          name: item.name || '',
          region_id: item.region_id || '',
          description: item.description || undefined
        }));
        setProvinces(typedProvinces);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [regionId]);
  
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // --- Navigation Handlers ---
  const handleBackPress = () => {
    navigation.goBack();
  };
  
  const handleProvincePress = (province: ProvinceData) => {
    // Generate a predictable chat ID based on the province ID if needed
    const chatId = province.id; // Or use another strategy to determine chat ID
    
    // Navigate to the chat room with province details
    // Use type assertion to prevent TypeScript error with the updated navigation params
    navigation.navigate('ProvinceChatRoom', {
      provinceChatId: chatId,
      provinceName: province.name,
      provinceId: province.id // Pass the province ID for proper chat room creation
    } as any); // Type assertion needed until TypeScript recognizes the updated navigation type
  };
  
  // Filter provinces based on search query
  const filteredProvinces = useMemo(() => {
    return provinces.filter(province => 
      province.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      province.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [provinces, searchQuery]);
  
  // --- Render Loading State ---
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <StatusBar backgroundColor="#5D3FD3" barStyle="light-content" />
        <ScreenHeader title={regionName || 'Provinces'} onBackPress={handleBackPress} />
        <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
          <LottieWrapper
            source={require('../../../assets/animations/map-loading.json')}
            icon="loading"
            text="Discovering provinces..."
            style={styles.lottieAnimation}
          />
        </View>
      </SafeAreaView>
    );
  }
  
  // --- Render Error State ---
  if (error && !loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <StatusBar backgroundColor="#5D3FD3" barStyle="light-content" />
        <ScreenHeader title={regionName || 'Provinces'} onBackPress={handleBackPress} />
        <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
          <MaterialCommunityIcons 
            name="map-marker-alert" 
            size={80} 
            color={theme.colors.error} 
          />
          <Text style={[styles.errorTitle, { color: theme.colors.error }]}>
            Oops!
          </Text>
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
  
  // --- Render Province Item ---
  const renderProvinceItem = ({ item, index }: { item: ProvinceData, index: number }) => {
    // Generate dynamic color based on name
    const hue = (item.name.length * 25) % 360;
    const cardColor = `hsl(${hue}, 70%, 45%)`;
    
    // Get first letter of province name for avatar
    const provinceFirstLetter = item.name.charAt(0).toUpperCase();
    
    return (
      <AnimatedCard 
        style={styles.card}
        entering={FadeInDown.delay(index * 100).duration(400)}
      >
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => handleProvincePress(item)}
          style={styles.cardTouchable}
          accessibilityRole="button"
          accessibilityLabel={`${item.name} province`}
          accessibilityHint={`Double tap to enter chat room for ${item.name}`}
        >
          <LinearGradient
            colors={[cardColor, `${cardColor}99`]} 
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.cardHeader}
          >
            <View style={styles.cardHeaderContent}>
              <Avatar.Text 
                label={provinceFirstLetter} 
                size={40} 
                style={styles.avatar}
                labelStyle={styles.avatarText}
              />
              <Text style={styles.provinceName} numberOfLines={1}>
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
                Chat with people from {item.name} province
              </Paragraph>
            )}
          </Card.Content>
          
          <Card.Actions style={styles.cardActions}>
            <Button 
              mode="contained-tonal" 
              icon="chat" 
              onPress={() => handleProvincePress(item)}
              style={styles.chatButton}
              labelStyle={styles.buttonLabel}
            >
              Join Chat
            </Button>
          </Card.Actions>
        </TouchableOpacity>
      </AnimatedCard>
    );
  };
  
  // --- Render Province List ---
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <StatusBar backgroundColor="#5D3FD3" barStyle="light-content" />
      
      {/* Header */}
      <Animated.View entering={FadeIn.duration(300)}>
        <ScreenHeader 
          title={regionName || 'Provinces'} 
          onBackPress={handleBackPress} 
          onFilterPress={() => {/* Add filter functionality */}}
        />
      </Animated.View>
      
      {/* Search bar */}
      <Animated.View entering={SlideInRight.delay(200).duration(400)}>
        <Searchbar
          placeholder="Search provinces..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          iconColor={theme.colors.primary}
          clearIcon="close-circle"
        />
      </Animated.View>
      
      {/* Province List */}
      <FlatList
        data={filteredProvinces}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContentContainer}
        renderItem={renderProvinceItem}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        ListEmptyComponent={() => (
          <View style={[styles.center, { paddingTop: 50, backgroundColor: theme.colors.background }]}>
            <MaterialCommunityIcons 
              name="map-search" 
              size={80} 
              color={theme.colors.onSurfaceVariant} 
            />
            <Paragraph style={{ color: theme.colors.onSurfaceVariant, marginTop: 16, textAlign: 'center' }}>
              {searchQuery 
                ? `No provinces match "${searchQuery}"`
                : 'No provinces available for this region'}
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
  backButton: {
    position: 'absolute',
    left: 8,
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
  chatButton: {
    borderRadius: 8,
  },
  container: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
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
  filterButton: {
    position: 'absolute',
    right: 8,
  },
  headerSurface: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  listContentContainer: {
    padding: 16,
    paddingBottom: 100, // Extra padding at bottom for better scrolling
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 20,
  },
  lottieAnimation: {
    height: 200,
    width: 200,
  },
  populationContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 6,
  },
  populationText: {
    marginLeft: 5,
  },
  provinceName: {
    color: '#fff',
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
  },
  searchbar: {
    borderRadius: 12,
    elevation: 2,
    margin: 16,
    marginBottom: 8,
    marginTop: 8,
  },
  webLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProvinceListScreen;