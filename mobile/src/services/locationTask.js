/**
 * IMPORTANT: This file must be imported at the top of App.jsx.
 * expo-task-manager requires tasks to be defined before the app renders.
 */
import * as TaskManager from 'expo-task-manager'
import * as Location from 'expo-location'
import * as SecureStore from 'expo-secure-store'
import * as Battery from 'expo-battery'
import * as Network from 'expo-network'
import axios from 'axios'

export const LOCATION_TASK = 'infallible-location-task'

// Tracking intervals (milliseconds)
export const INTERVALS = {
  high:     10_000,   // theft mode — every 10s
  balanced: 60_000,   // normal — every 60s
  low:      300_000,  // battery saver — every 5 min
}

TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error) { console.error('[LocationTask]', error.message); return }
  if (!data) return

  const { locations } = data
  const loc = locations?.[0]
  if (!loc) return

  try {
    const [deviceToken, serverUrl, batteryRaw, network] = await Promise.all([
      SecureStore.getItemAsync('deviceToken'),
      SecureStore.getItemAsync('serverUrl'),
      Battery.getBatteryLevelAsync(),
      Network.getNetworkStateAsync(),
    ])

    if (!deviceToken || !serverUrl) return

    await axios.post(`${serverUrl}/api/locations/report`, {
      deviceToken,
      latitude:    loc.coords.latitude,
      longitude:   loc.coords.longitude,
      accuracy:    loc.coords.accuracy,
      altitude:    loc.coords.altitude,
      speed:       loc.coords.speed,
      bearing:     loc.coords.heading,
      batteryLevel: Math.round(batteryRaw * 100),
      networkType:  network.type,
      recordedAt:   new Date(loc.timestamp).toISOString(),
    }, { timeout: 10_000 })
  } catch {
    // Silent — never crash the background task
  }
})

export async function startTracking(mode = 'balanced') {
  const { status } = await Location.requestBackgroundPermissionsAsync()
  if (status !== 'granted') throw new Error('Background location permission denied')

  const interval = INTERVALS[mode] ?? INTERVALS.balanced

  const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)
  if (isRunning) await Location.stopLocationUpdatesAsync(LOCATION_TASK)

  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: mode === 'high'
      ? Location.Accuracy.BestForNavigation
      : Location.Accuracy.Balanced,
    timeInterval: interval,
    distanceInterval: mode === 'high' ? 10 : 50,
    showsBackgroundLocationIndicator: false,
    foregroundService: {
      notificationTitle: 'Infallible Protection Active',
      notificationBody:  'Your device is being monitored for theft.',
      notificationColor: '#6366f1',
    },
    pausesUpdatesAutomatically: false,
    activityType: Location.ActivityType.Other,
  })
}

export async function stopTracking() {
  const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)
  if (isRunning) await Location.stopLocationUpdatesAsync(LOCATION_TASK)
}

export async function isTracking() {
  return Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)
}
