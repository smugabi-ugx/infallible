// app.config.js replaces app.json — allows env vars to flow into the app bundle
// Set EXPO_PUBLIC_API_URL in your EAS build profile or .env to override
export default {
  expo: {
    name: 'Infallible',
    slug: 'infallible',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'dark',
    icon: './assets/icon.png',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#030712',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#030712',
      },
      package: 'ug.infallible.app',
      versionCode: 1,
    },
    extra: {
      // Override at build time:  EXPO_PUBLIC_API_URL=https://... eas build
      // Override at dev time:    add EXPO_PUBLIC_API_URL to .env
      apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://infallible.onrender.com',
      eas: { projectId: '7e8e44ee-bc35-4e42-90fa-f605203c0532' },
    },
    owner: 'rogersmugabi284',
    plugins: ['expo-secure-store'],
  },
}
