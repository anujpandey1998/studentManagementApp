module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        allowUndefined: true,
        safe: false,
        allowlist: ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'SENTRY_DSN'],
      },
    ],
  ],
};
