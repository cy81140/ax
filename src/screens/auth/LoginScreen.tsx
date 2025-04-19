import React, { useState } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, Image, View } from 'react-native';
import { TextInput, Button, Text, useTheme, Surface, HelperText, Avatar } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { LottieWrapper } from '../../components/animations/LottieWrapper';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginError {
  message: string;
  field?: keyof LoginFormData;
}

export const LoginScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { signIn } = useAuth();
  
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    let isValid = true;
    setEmailError(null);
    setPasswordError(null);
    setGeneralError(null);

    if (!formData.email) {
      setEmailError('Email is required');
      isValid = false;
    }

    if (!formData.password) {
      setPasswordError('Password is required');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      setGeneralError(null);
      setLoading(true);
      await signIn(formData.email, formData.password);
    } catch (err) {
      console.error('Login error:', err);
      setGeneralError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}
      >
        <Surface style={[styles.content, { backgroundColor: theme.colors.background }]}> 
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.lottieContainer}>
              <LottieWrapper
                source={require('../../../assets/animations/lottieflow-background-05-000000-easey.json')}
                icon="account-circle-outline"
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
              Welcome Back
            </Text>
            <TextInput
              mode="outlined"
              label="Email"
              value={formData.email}
              onChangeText={(text: string) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              error={!!emailError}
            />
            <HelperText type="error" visible={!!emailError}>
              {emailError}
            </HelperText>
            <TextInput
              mode="outlined"
              label="Password"
              value={formData.password}
              onChangeText={(text: string) => setFormData({ ...formData, password: text })}
              secureTextEntry
              style={styles.input}
              error={!!passwordError}
            />
            <HelperText type="error" visible={!!passwordError}>
              {passwordError}
            </HelperText>
            <HelperText type="error" visible={!!generalError} style={styles.generalError}>
              {generalError}
            </HelperText>
            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Log In
            </Button>
            <Button
              mode="text"
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotPasswordButton}
            >
              Forgot Password?
            </Button>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Register')}
              style={styles.button}
            >
              Don't have an account? Sign up
            </Button>
          </ScrollView>
        </Surface>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  forgotPasswordButton: {
    marginTop: 8,
  },
  generalError: {
    marginBottom: 8,
    textAlign: 'center',
  },
  input: {
    marginBottom: 4,
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 100,
  },
  title: {
    marginBottom: 32,
    textAlign: 'center',
  },
  webLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 