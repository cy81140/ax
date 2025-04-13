import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Avatar, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/user';

type EditProfileScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'EditProfile'>;

interface ProfileFormData {
  username: string;
  bio: string;
  profile_picture?: string;
}

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<EditProfileScreenNavigationProp>();
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    bio: '',
  });

  const handleSubmit = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await userService.updateProfile(user.id, formData);
      navigation.goBack();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.avatarContainer}>
          <Avatar.Image
            size={100}
            source={{ uri: formData.profile_picture || 'https://via.placeholder.com/100' }}
          />
        </View>

        <TextInput
          label="Username"
          value={formData.username}
          onChangeText={(text: string) => setFormData(prev => ({ ...prev, username: text }))}
          style={styles.input}
        />

        <TextInput
          label="Bio"
          value={formData.bio}
          onChangeText={(text: string) => setFormData(prev => ({ ...prev, bio: text }))}
          multiline
          numberOfLines={4}
          style={styles.input}
        />
        
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={!formData.username.trim()}
          style={styles.button}
        >
          Save Changes
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  form: {
    padding: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
}); 