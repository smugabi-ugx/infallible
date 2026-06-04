const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// socket.io-client uses private class fields (#field) which older Hermes builds
// don't support. Force Babel to transform these packages.
config.transformer.transformIgnorePatterns = [
  'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|socket\\.io-client|engine\\.io-client|@socket\\.io|xmlhttprequest-ssl|component-emitter)',
]

module.exports = config
