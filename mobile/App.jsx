import { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, AppState, Image } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useStore } from './src/store/useStore'
import { connectSocket, disconnectSocket } from './src/services/socketService'
import { startCommandPoller, stopCommandPoller } from './src/services/commandPoller'
import OnboardingScreen from './src/screens/OnboardingScreen'
import HomeScreen from './src/screens/HomeScreen'
import SettingsScreen from './src/screens/SettingsScreen'

const Stack = createNativeStackNavigator()

export default function App() {
  const [appReady, setAppReady] = useState(false)
  const { isRegistered, loadFromStorage } = useStore()
  const appState = useRef(AppState.currentState)

  useEffect(() => {
    loadFromStorage()
      .catch(e => console.warn('[App] loadFromStorage:', e))
      .finally(() => setAppReady(true))
  }, [])

  // Hide splash as soon as appReady flips — separate effect so it always fires
  useEffect(() => {
    if (!appReady) return
    SplashScreen.hideAsync().catch(e => console.warn('[App] hideAsync:', e))
  }, [appReady])

  useEffect(() => {
    if (!isRegistered) return
    connectSocket()
    startCommandPoller()
    const sub = AppState.addEventListener('change', next => {
      if (appState.current.match(/inactive|background/) && next === 'active') connectSocket()
      appState.current = next
    })
    return () => { sub.remove(); disconnectSocket(); stopCommandPoller() }
  }, [isRegistered])

  if (!appReady) {
    return (
      <View style={s.boot}>
        <StatusBar style="light" />
        <Image source={require('./assets/icon.png')} style={s.bootIcon} resizeMode="cover" />
        <Text style={s.name}>Infallible</Text>
        <Text style={s.tagline}>Silent device protection</Text>
        <ActivityIndicator color="#6366f1" size="small" style={{ marginTop: 28 }} />
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#030712' }}>
      <SafeAreaProvider>
        <NavigationContainer theme={THEME}>
          <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
            {!isRegistered ? (
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            ) : (
              <>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Settings" component={SettingsScreen}
                  options={{ animation: 'slide_from_right' }} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const THEME = {
  dark: true,
  colors: {
    primary: '#6366f1', background: '#030712', card: '#0b1120',
    text: '#ffffff', border: 'rgba(255,255,255,0.06)', notification: '#f43f5e',
  },
}

const s = StyleSheet.create({
  boot:     { flex: 1, backgroundColor: '#030712', alignItems: 'center', justifyContent: 'center' },
  bootIcon: { width: 96, height: 96, borderRadius: 24, marginBottom: 20 },
  name:     { fontSize: 28, fontWeight: '800', color: '#ffffff', letterSpacing: -0.5 },
  tagline:  { fontSize: 13, color: '#6366f1', marginTop: 6, letterSpacing: 0.3 },
})
