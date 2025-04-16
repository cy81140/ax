// Mock expo modules
jest.mock('expo-constants', () => ({}));
jest.mock('expo-secure-store', () => ({}));
jest.mock('expo-linear-gradient', () => ({}));
jest.mock('expo-image-picker', () => ({}));
jest.mock('expo-status-bar', () => ({}));
jest.mock('expo-notifications', () => ({}));
jest.mock('expo-haptics', () => ({}));

// Mock react-native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Silence console warnings if needed
// jest.spyOn(console, 'warn').mockImplementation(() => {}); 