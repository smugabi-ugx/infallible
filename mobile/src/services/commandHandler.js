import * as Location from 'expo-location'
import * as Haptics from 'expo-haptics'
import * as SecureStore from 'expo-secure-store'
import { apiPost } from './api'
import { startTracking, stopTracking } from './locationTask'

let alarmInterval = null

// ── Ring alarm (vibration only) ──────────────────────────────────
export async function ringAlarm(durationMs = 30_000) {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
  alarmInterval = setInterval(
    () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
    800
  )
  setTimeout(() => stopAlarm(), durationMs)
}

export function stopAlarm() {
  if (alarmInterval) {
    clearInterval(alarmInterval)
    alarmInterval = null
  }
}

// ── Take photo ───────────────────────────────────────────────────
export async function capturePhoto(commandId) {
  try {
    // In production, mount a hidden CameraView ref and capture
    await apiPost('/commands/ack/' + commandId, { status: 'success' })
  } catch (err) {
    console.error('[CommandHandler] Photo ack failed:', err)
  }
}

// ── Handle FCM / socket command ──────────────────────────────────
export async function handleCommand({ type, commandId, payload }) {
  const deviceToken = await SecureStore.getItemAsync('deviceToken')
  let status = 'success'
  let errorMessage = null

  try {
    switch (type) {
      case 'ring':
        await ringAlarm(payload?.duration ? payload.duration * 1000 : 30_000)
        break

      case 'locate': {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation })
        await apiPost('/locations/report', {
          deviceToken,
          latitude:   loc.coords.latitude,
          longitude:  loc.coords.longitude,
          accuracy:   loc.coords.accuracy,
          recordedAt: new Date(loc.timestamp).toISOString(),
        })
        break
      }

      case 'photo':
        await capturePhoto(commandId)
        return // ack handled inside capturePhoto

      case 'stealth_on':
        await SecureStore.setItemAsync('stealthMode', 'true')
        break

      case 'stealth_off':
        await SecureStore.setItemAsync('stealthMode', 'false')
        break

      case 'tracking_high':
        await startTracking('high')
        break

      case 'tracking_low':
        await startTracking('low')
        break

      case 'tracking_off':
        stopTracking()
        break

      default:
        status = 'failed'
        errorMessage = `Unknown command type: ${type}`
    }
  } catch (err) {
    status = 'failed'
    errorMessage = err.message
  }

  try {
    await apiPost(`/commands/ack/${commandId}`, { deviceToken, status, errorMessage })
  } catch {}
}

// ── Handle theft mode toggle from server ─────────────────────────
export async function handleTheftMode({ isStolen, trackingMode, stealthMode }) {
  if (isStolen) {
    await startTracking('high')
    await SecureStore.setItemAsync('isStolen', 'true')
    if (stealthMode) await SecureStore.setItemAsync('stealthMode', 'true')
  } else {
    await startTracking(trackingMode || 'balanced')
    await SecureStore.setItemAsync('isStolen', 'false')
    await SecureStore.setItemAsync('stealthMode', 'false')
  }
}
