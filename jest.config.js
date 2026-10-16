module.exports = {
  preset: '@react-native/jest-preset',
  // First native component imports can be slow on Windows CI.
  testTimeout: 30000,
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-redux|@reduxjs/toolkit|redux|immer|reselect)/)',
  ],
};
