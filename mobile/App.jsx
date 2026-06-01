/**
 * CRITICAL: Background task files must be imported before the React tree mounts.
 * expo-task-manager requires tasks to be defined at module load time.
 */
import './src/services/locationTask'
import './src/services/commandPoller'

import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, AppState } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import * as Notifications from 'expo-notifications'

import { useStore } from './src/store/useStore'
import { connectSocket, disconnectSocket } from './src/services/socketService'
import { startCommandPoller } from './src/services/commandPoller'

import OnboardingScreen from './src/screens/OnboardingScreen'
import HomeScreen       from './src/screens/HomeScreen'
import SettingsScreen   from './src/screens/SettingsScreen'

const Stack = createNativeStackNavigator()

// Keep notifications quiet for stealth commands — no popup shown
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge:  false,
  }),
})

export default function App() {
  const [booting, setBooting] = useState(true)
  const { isRegistered, loadFromStorage } = useStore()
  const appState = useRef(AppState.currentState)

  // ── Boot: restore credentials from secure storage ────────────
  useEffect(() => {
    loadFromStorage().finally(() => setBooting(false))
  }, [])

  // ── Connect socket + start poller when registered ────────────
  useEffect(() => {
    if (!isRegistered) return

    let mounted = true

    const init = async () => {
      // Real-time Socket.io connection (instant commands)
      await connectSocket()

      // Background polling fallback (catches commands when socket is dead)
      await startCommandPoller()
    }

    init()

    // Reconnect socket when app comes back to foreground
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        console.log('[App] Foregrounded — reconnecting socket')
        if (mounted) await connectSocket()
      }
      appState.current = nextState
    })

    return () => {
      mounted = false
      sub.remove()
      disconnectSocket()
    }
  }, [isRegistered])

  if (booting) {
    return (
      <View style={styles.boot}>
        <StatusBar style="light" />
        <Text style={styles.bootLogo}>🛡</Text>
        <Text style={styles.bootName}>Infallible</Text>
        <ActivityIndicator color="#6366f1" size="small" style={{ marginTop: 24 }} />
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer theme={NAV_THEME}>
          <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
            {!isRegistered ? (
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            ) : (
              <>
                <Stack.Screen name="Home"     component={HomeScreen} />
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

const NAV_THEME = {
  dark: true,
  colors: {
    primary:      '#6366f1',
    background:   '#030712',
    card:         '#0b1120',
    text:         '#ffffff',
    border:       'rgba(255,255,255,0.06)',
    notification: '#f43f5e',
  },
}

const styles = StyleSheet.create({
  boot: {
    flex: 1, backgroundColor: '#030712',
    alignItems: 'center', justifyContent: 'center',
  },
  bootLogo: { fontSize: 56, marginBottom: 12 },
  bootName: { fontSize: 24, fontWeight: '700', color: '#ffffff', letterSpacing: -0.5 },
})
