import * as Location from 'expo-location'
import { apiPost } from './api'

export const INTERVALS = {
  high:     10_000,
  balanced: 60_000,
  low:      300_000,
}

let reportInterval = null

export async function startTracking(mode = 'balanced') {
  // Only request if not already granted
  const { status } = await Location.getForegroundPermissionsAsync()
  if (status !== 'granted') {
    const { status: req } = await Location.requestForegroundPermissionsAsync()
    if (req !== 'granted') throw new Error('Location permission denied')
  }

  stopTracking()

  const interval = INTERVALS[mode] ?? INTERVALS.balanced
  const accuracy = mode === 'high'
    ? Location.Accuracy.BestForNavigation
    : Location.Accuracy.Balanced

  reportInterval = setInterval(async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy })
      await reportLocation(loc)
    } catch {}
  }, interval)

  console.log(`[Location] Tracking started — mode: ${mode}, interval: ${interval / 1000}s`)
}

export function stopTracking() {
  if (reportInterval) { clearInterval(reportInterval); reportInterval = null }
}

export async function reportLocation(loc) {
  await apiPost('/locations/report', {
    latitude:   loc.coords.latitude,
    longitude:  loc.coords.longitude,
    accuracy:   loc.coords.accuracy,
    altitude:   loc.coords.altitude,
    speed:      loc.coords.speed,
    bearing:    loc.coords.heading,
    recordedAt: new Date(loc.timestamp).toISOString(),
  })
}

export function isTracking() {
  return reportInterval !== null
}
