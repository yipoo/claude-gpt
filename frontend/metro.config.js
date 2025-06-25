const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for react-native-vector-icons fonts
config.resolver.assetExts.push('ttf');

// Enhanced configuration for stability
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Improve transformer stability
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: false,
    },
  }),
};

// Add watchman configuration for better file watching
config.watchFolders = [];

// Improve memory management
config.maxWorkers = 2;

// Add error handling
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;