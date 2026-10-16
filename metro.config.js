const path = require('node:path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const nonJavaScriptDirectories = [
  'android',
  'ios',
  '.git',
  'supabase',
  'docs',
  'scripts',
].map(directory => {
  const absolutePath = escapeRegExp(path.resolve(__dirname, directory));
  return new RegExp(`^${absolutePath}(?:[/\\\\]|$)`);
});

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    blockList: [defaultConfig.resolver.blockList, ...nonJavaScriptDirectories],
  },
};

module.exports = mergeConfig(defaultConfig, config);
