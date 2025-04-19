import React, { useState } from 'react';
import { StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image, View } from 'react-native';
import { TextInput, Button, Text, useTheme, Surface, HelperText, Avatar } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { LottieWrapper } from '../../components/animations/LottieWrapper';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const RegisterScreen = ({ navigation }: Props) => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const { signUp } = useAuth();

  const validateForm = (): boolean => {
    let isValid = true;
    setUsernameError(null);
    setEmailError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);
    setGeneralError(null);

    if (!username) {
      setUsernameError('Username is required');
      isValid = false;
    }
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    }
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    }
    if (!confirmPassword) {
      setConfirmPasswordError('Password confirmation is required');
      isValid = false;
    }
    if (password && confirmPassword && password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }
    if (password && password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setGeneralError(null);

    try {
      await signUp(email, password, username);
    } catch (err) {
      console.error("Registration Error:", err);
      let message = 'An error occurred during registration.';
      
      // Clear all previous errors
      setUsernameError(null);
      setEmailError(null);
      setPasswordError(null);
      setConfirmPasswordError(null);
      
      if (err instanceof Error) {
        const errorMessage = err.message.toLowerCase();
        
        // Handle specific error types
        if (errorMessage.includes('username') && 
            (errorMessage.includes('taken') || 
             errorMessage.includes('already') || 
             errorMessage.includes('duplicate') || 
             errorMessage.includes('users_username_key'))) {
          message = 'Username already taken. Please choose another.';
          setUsernameError(message);
        } 
        else if (errorMessage.includes('email') && 
                (errorMessage.includes('taken') || 
                 errorMessage.includes('already') || 
                 errorMessage.includes('duplicate') || 
                 errorMessage.includes('users_email_key'))) {
          message = 'Email already registered. Please log in.';
          setEmailError(message);
        }
        else if (errorMessage.includes('password') && 
                 errorMessage.includes('weak')) {
          message = 'Password is too weak. Please use a stronger password.';
          setPasswordError(message);
        }
        else if (errorMessage.includes('network') || 
                 errorMessage.includes('connect')) {
          message = 'Network error. Please check your internet connection.';
        }
        else if (errorMessage.includes('profile')) {
          message = 'Account created but profile setup failed. Please try logging in or contact support.';
        }
        else {
          // Use the original error message if we don't have a specific handler
          message = err.message;
        }
      } else if (typeof err === 'object' && err !== null) {
        // Handle error objects with code and message properties
        const errorObj = err as any;
        
        if (errorObj.code === 'USERNAME_TAKEN') {
          message = errorObj.message || 'Username already taken. Please choose another.';
          setUsernameError(message);
        }
        else if (errorObj.code === 'EMAIL_TAKEN') {
          message = errorObj.message || 'Email already registered. Please log in.';
          setEmailError(message);
        }
        else if (errorObj.message) {
          message = errorObj.message;
        }
      } else {
        message = String(err);
      }
      
      setGeneralError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Surface style={[styles.content, { backgroundColor: theme.colors.background }]}>
          <View style={styles.lottieContainer}>
            <LottieWrapper
              source={require('../../../assets/animations/lottieflow-multimedia-8-6-000000-easey.json')}
              icon="account-plus-outline"
              style={{ width: 180, height: 180, alignSelf: 'center' }}
            />
          </View>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../../assets/app-logo.png')} 
              style={styles.logo} 
              resizeMode="contain"
            />
          </View>
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
            Create Account
          </Text>

          <TextInput
            mode="outlined"
            label="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            style={styles.input}
            error={!!usernameError}
          />
          <HelperText type="error" visible={!!usernameError}>
            {usernameError}
          </HelperText>

          <TextInput
            mode="outlined"
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            error={!!emailError}
          />
          <HelperText type="error" visible={!!emailError}>
            {emailError}
          </HelperText>

          <TextInput
            mode="outlined"
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            error={!!passwordError}
          />
          <HelperText type="error" visible={!!passwordError}>
            {passwordError}
          </HelperText>

          <TextInput
            mode="outlined"
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={styles.input}
            error={!!confirmPasswordError}
          />
          <HelperText type="error" visible={!!confirmPasswordError}>
            {confirmPasswordError}
          </HelperText>

          <HelperText type="error" visible={!!generalError} style={styles.generalError}>
            {generalError}
          </HelperText>

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Sign Up
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Login')}
            style={styles.linkButton}
          >
            Already have an account? Log in
          </Button>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  button: {
    marginTop: 16,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  generalError: {
    marginBottom: 8,
    textAlign: 'center',
  },
  input: {
    marginBottom: 4,
  },
  linkButton: {
    marginTop: 16,
  },
  logo: {
    height: 100,
    width: 100,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  lottieContainer: {
    marginBottom: 20,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    marginBottom: 24,
    textAlign: 'center',
  },
  webLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RegisterScreen; 