import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { TextInput, Button, Text, useTheme, Avatar } from 'react-native-paper';
import { supabase, logSupabaseError } from '../../lib/supabase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen = ({ navigation }: Props) => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'amino-app://reset-password',
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.iconContainer}>
        <Avatar.Icon 
          size={120} 
          icon="lock-reset" 
          color={theme.colors.onPrimary}
          style={{ backgroundColor: theme.colors.primary }}
        />
      </View>
      <Text style={[styles.title, { color: theme.colors.onBackground }]}>Reset Password</Text>
      
      {error && (
        <Text style={[styles.error, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}

      {success ? (
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <MaterialCommunityIcons 
              name="check-circle" 
              size={64} 
              color={theme.colors.primary} 
            />
          </View>
          <Text style={[styles.successText, { color: theme.colors.primary }]}>
            Password reset instructions have been sent to your email.
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Login')}
            style={styles.button}
          >
            Return to Login
          </Button>
        </View>
      ) : (
        <>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleResetPassword}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Send Reset Instructions
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Login')}
            style={styles.button}
          >
            Back to Login
          </Button>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    marginTop: 10,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  error: {
    marginBottom: 15,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'center',
  },
  input: {
    marginBottom: 15,
  },
  successContainer: {
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successText: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default ForgotPasswordScreen; 