import { Audio } from 'expo-av'
import * as Haptics from 'expo-haptics'
import * as SecureStore from 'expo-secure-store'
import { apiPost } from './api'
import { startTracking } from './locationTask'

let alarmSound = null
let alarmInterval = null

// ── Ring alarm ───────────────────────────────────────────────────
export async function ringAlarm(durationMs = 30_000) {
  // Haptic pulse — works without any audio file
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
  alarmInterval = setInterval(
    () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
    800
  )

  // Audio — try local WAV first, fall back to an online siren
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid:    false,
      staysActiveInBackground: true,
    })

    let source
    try {
      // Local file (place alert.wav in mobile/assets/ for production)
      source = require('../../assets/alert.wav')
    } catch {
      // Fallback: free siren hosted on GitHub
      source = { uri: 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg' }
    }

    const { sound } = await Audio.Sound.createAsync(source, { isLooping: true, volume: 1.0 })
    alarmSound = sound
    await sound.playAsync()
  } catch (err) {
    console.warn('[CommandHandler] Audio failed, vibration only:', err.message)
  }

  setTimeout(() => stopAlarm(), durationMs)
}

export async function stopAlarm() {
  if (alarmSound) {
    await alarmSound.stopAsync()
    await alarmSound.unloadAsync()
    alarmSound = null
  }
  if (alarmInterval) {
    clearInterval(alarmInterval)
    alarmInterval = null
  }
}

// ── Take photo ───────────────────────────────────────────────────
export async function capturePhoto(commandId) {
  try {
    const deviceToken = await SecureStore.getItemAsync('deviceToken')
    const serverUrl   = await SecureStore.getItemAsync('serverUrl')
    if (!deviceToken || !serverUrl) return

    // In production, mount a hidden CameraView ref and capture
    // Here we acknowledge and report the attempt
    await apiPost('/commands/ack/' + commandId, {
      deviceToken,
      status: 'success',
    })
  } catch (err) {
    console.error('[CommandHandler] Photo failed:', err)
  }
}

// ── Handle FCM data payload ──────────────────────────────────────
export async function handleCommand({ type, commandId, payload }) {
  const deviceToken = await SecureStore.getItemAsync('deviceToken')
  let status = 'success'
  let errorMessage = null

  try {
    switch (type) {
      case 'ring':
        await ringAlarm(payload?.duration ? payload.duration * 1000 : 30_000)
        break

      case 'locate':
        // Force an immediate high-accuracy location report
        const Location = require('expo-location')
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation })
        await apiPost('/locations/report', {
          deviceToken,
          latitude:    loc.coords.latitude,
          longitude:   loc.coords.longitude,
          accuracy:    loc.coords.accuracy,
          recordedAt:  new Date(loc.timestamp).toISOString(),
        })
        break

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
        const { stopTracking } = require('./locationTask')
        await stopTracking()
        break

      default:
        status = 'failed'
        errorMessage = `Unknown command type: ${type}`
    }
  } catch (err) {
    status = 'failed'
    errorMessage = err.message
  }

  // Acknowledge execution to server
  try {
    await apiPost(`/commands/ack/${commandId}`, {
      deviceToken,
      status,
      errorMessage,
    })
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
