import { apiPost } from './api'

export const INTERVALS = { high: 10_000, balanced: 60_000, low: 300_000 }

let reportInterval = null

export async function startTracking(mode = 'balanced') {
  const Location = require('expo-location')
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
    } catch (e) {
      console.warn('[Location] report failed:', e.message)
    }
  }, interval)

  console.log(`[Location] Tracking started — ${mode} every ${interval / 1000}s`)
}

export function stopTracking() {
  if (reportInterval) { clearInterval(reportInterval); reportInterval = null }
}

export async function reportLocation(loc) {
  // Include battery level with every location report
  let batteryLevel = null
  try {
    const Battery = require('expo-battery')
    const level = await Battery.getBatteryLevelAsync()
    batteryLevel = Math.round(level * 100)
  } catch {}

  await apiPost('/locations/report', {
    latitude:     loc.coords.latitude,
    longitude:    loc.coords.longitude,
    accuracy:     loc.coords.accuracy,
    altitude:     loc.coords.altitude,
    speed:        loc.coords.speed,
    bearing:      loc.coords.heading,
    recordedAt:   new Date(loc.timestamp).toISOString(),
    batteryLevel,
  })
}

export function isTracking() { return reportInterval !== null }
