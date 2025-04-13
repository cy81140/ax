import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { supabase } from '../../services/supabase';
import { theme } from '../../constants/theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen = ({ navigation }: Props) => {
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
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      
      {error && (
        <Text style={styles.error}>{error}</Text>
      )}

      {success ? (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>
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
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: theme.colors.text,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
  },
  error: {
    color: theme.colors.error,
    marginBottom: 15,
  },
  successContainer: {
    alignItems: 'center',
  },
  successText: {
    textAlign: 'center',
    marginBottom: 20,
    color: theme.colors.success,
  },
});

export default ForgotPasswordScreen; 