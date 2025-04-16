import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ForgotPasswordScreen from '../../screens/auth/ForgotPasswordScreen';
import { supabase } from '../__mocks__/supabase';

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation: any = {
  navigate: mockNavigate
};

// Mock supabase
jest.mock('../../services/supabase', () => {
  return {
    supabase: require('../__mocks__/supabase').supabase
  };
});

// Mock theme constants
jest.mock('../../constants/theme', () => ({
  theme: {
    colors: {
      background: '#FFFFFF',
      error: '#FF0000',
      success: '#00FF00',
      text: '#000000',
    }
  }
}));

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByLabelText } = render(
      <ForgotPasswordScreen navigation={mockNavigation} route={{} as any} />
    );

    // Check elements exist
    expect(getByText('Reset Password')).toBeTruthy();
    expect(getByLabelText('Email')).toBeTruthy();
    expect(getByText('Send Reset Instructions')).toBeTruthy();
    expect(getByText('Back to Login')).toBeTruthy();
  });

  it('shows error message when no email is provided', () => {
    const { getByText, queryByText } = render(
      <ForgotPasswordScreen navigation={mockNavigation} route={{} as any} />
    );

    // Initially no error
    expect(queryByText('Please enter your email')).toBeNull();

    // Click button without entering email
    fireEvent.press(getByText('Send Reset Instructions'));

    // Error appears
    expect(getByText('Please enter your email')).toBeTruthy();
  });

  it('calls resetPasswordForEmail and shows success message', async () => {
    // Mock successful resetPasswordForEmail
    supabase.auth.resetPasswordForEmail.mockResolvedValueOnce({ error: null });

    const { getByText, getByLabelText, queryByText } = render(
      <ForgotPasswordScreen navigation={mockNavigation} route={{} as any} />
    );

    // Enter email
    const emailInput = getByLabelText('Email');
    fireEvent.changeText(emailInput, 'test@example.com');

    // Submit form
    fireEvent.press(getByText('Send Reset Instructions'));

    // Wait for success message
    await waitFor(() => {
      expect(getByText('Password reset instructions have been sent to your email.')).toBeTruthy();
    });

    // Check Supabase was called with correct params
    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
      redirectTo: 'amino-app://reset-password',
    });

    // Return to login button appears
    expect(getByText('Return to Login')).toBeTruthy();
  });

  it('shows error message when resetPasswordForEmail fails', async () => {
    // Mock failed resetPasswordForEmail
    const mockError = new Error('Invalid email');
    supabase.auth.resetPasswordForEmail.mockResolvedValueOnce({ error: mockError });

    const { getByText, getByLabelText } = render(
      <ForgotPasswordScreen navigation={mockNavigation} route={{} as any} />
    );

    // Enter email
    const emailInput = getByLabelText('Email');
    fireEvent.changeText(emailInput, 'invalid@example.com');

    // Submit form
    fireEvent.press(getByText('Send Reset Instructions'));

    // Wait for error message
    await waitFor(() => {
      expect(getByText('Invalid email')).toBeTruthy();
    });

    // Success message should not appear
    expect(() => getByText('Password reset instructions have been sent to your email.')).toThrow();
  });

  it('navigates to Login when clicking back button', () => {
    const { getByText } = render(
      <ForgotPasswordScreen navigation={mockNavigation} route={{} as any} />
    );

    // Click back to login
    fireEvent.press(getByText('Back to Login'));

    // Check navigation
    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });

  it('navigates to Login from success screen', async () => {
    // Mock successful resetPasswordForEmail
    supabase.auth.resetPasswordForEmail.mockResolvedValueOnce({ error: null });

    const { getByText, getByLabelText } = render(
      <ForgotPasswordScreen navigation={mockNavigation} route={{} as any} />
    );

    // Enter email and submit
    const emailInput = getByLabelText('Email');
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.press(getByText('Send Reset Instructions'));

    // Wait for success message
    await waitFor(() => {
      expect(getByText('Password reset instructions have been sent to your email.')).toBeTruthy();
    });

    // Click return to login
    fireEvent.press(getByText('Return to Login'));

    // Check navigation
    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });
}); 