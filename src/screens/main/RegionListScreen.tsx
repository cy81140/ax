import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { provinceChatService } from '../../services/provinceChatService'; // Adjust path if needed
import { List, Divider } from 'react-native-paper'; // Using react-native-paper components

// Define proper navigation type
type RootStackParamList = {
  RegionList: undefined;
  ProvinceList: { regionId: string; regionName: string };
};

// Define type for Region based on service
interface Region { id: string; name: string; description?: string; }

const RegionListScreen = () => {
  const navigation = useNavigation<any>(); // Use any for now - in a production app you'd use a proper type
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRegions = async () => {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await provinceChatService.getRegions();

      if (fetchError) {
        console.error('Error fetching regions:', fetchError);
        setError(fetchError.message || 'Failed to load regions.');
        Alert.alert('Error', fetchError.message || 'Could not load regions.');
      } else {
        setRegions(data || []);
      }
      setLoading(false);
    };

    fetchRegions();
  }, []);

  const handleRegionPress = (region: Region) => {
    navigation.navigate('ProvinceList', { 
      regionId: region.id, 
      regionName: region.name 
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading Regions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Error: {error}</Text>
        {/* TODO: Add a retry button? */}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={regions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <List.Item
            title={item.name}
            description={item.description || ''} // Show description if available
            left={(props: any) => <List.Icon {...props} icon="map-marker-radius" />} // Example icon
            right={(props: any) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => handleRegionPress(item)}
            style={styles.listItem}
            titleStyle={styles.listTitle}
          />
        )}
        ItemSeparatorComponent={() => <Divider />}
        ListEmptyComponent={() => (
            <View style={styles.center}>
                <Text>No regions found.</Text>
            </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#f5f5f5', // Example background
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
      marginTop: 10,
  },
  errorText: {
      color: 'red',
      textAlign: 'center',
      padding: 20,
  },
  listItem: {
    backgroundColor: '#ffffff', // Example item background
  },
  listTitle: {
      fontWeight: 'bold',
  }
});

export default RegionListScreen; 