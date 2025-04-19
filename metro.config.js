const { getDefaultConfig } = require('@expo/metro-config');
const { mergeConfig } = require("metro-config");

const defaultConfig = getDefaultConfig(__dirname);

/**
 * Metro configuration for web
 * This specifically addresses the issue with lottie-react-native in web bundling
 */
const webConfig = {
  resolver: {
    sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json'],
    // Blacklist lottie-native modules on web to prevent bundling issues
    blockList: [
      /node_modules\/lottie-react-native\/lib\/module\/specs\/.*/,
    ],
    extraNodeModules: {
      // Provide empty modules for native dependencies that cause web bundling errors
      'lottie-react-native': require.resolve('./src/components/animations/web-lottie-stub.js'),
    },
  },
};

module.exports = mergeConfig(defaultConfig, webConfig); 