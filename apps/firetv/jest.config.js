module.exports = {
  displayName: 'firetv',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setup.ts'],
  testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.test.tsx'],
  moduleFileExtensions: ['android.tsx', 'android.ts', 'android.js', 'tsx', 'ts', 'jsx', 'js', 'json', 'node'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg))'
  ],
  moduleNameMapper: {
    '^expo-speech$': '<rootDir>/tests/__mocks__/expo-speech.js',
    '^expo-av$': '<rootDir>/tests/__mocks__/expo-av.js',
    '^react-native-video$': '<rootDir>/tests/__mocks__/react-native-video.js',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/tests/__mocks__/fileMock.js'
  }
};
