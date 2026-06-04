import Constants from 'expo-constants'

// All app-wide config read from app.config.js extra field.
// Never hardcode URLs or secrets directly in component files.
export const SERVER_URL = Constants.expoConfig?.extra?.apiUrl ?? 'https://infallible.onrender.com'
