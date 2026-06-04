import * as SecureStore from 'expo-secure-store'
import { apiPost } from './api'
import { startTracking, stopTracking } from './locationTask'
import { useStore } from '../store/useStore'
import { capturePhoto } from './cameraService'

let alarmInterval = null

// setCameraRef is now in cameraService — re-exported here so HomeScreen import still works
export { setCameraRef } from './cameraService'

// Remove old internal ref — cameraService handles it now

// ── Notify user on phone when a command is executed ──────────────
async function notifyExecuted(message) {
  try {
    const Notifications = require('expo-notifications')
    await Notifications.scheduleNotificationAsync({
      content: { title: '📡 Infallible Command', body: message, sound: false },
      trigger: null,
    })
  } catch {}
}

// ── Ring alarm ───────────────────────────────────────────────────
export async function ringAlarm(durationMs = 30_000) {
  try {
    const Haptics = require('expo-haptics')
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    alarmInterval = setInterval(
      () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
      800
    )
    setTimeout(() => stopAlarm(), durationMs)
  } catch {}
}

export function stopAlarm() {
  if (alarmInterval) { clearInterval(alarmInterval); alarmInterval = null }
}

// ── Handle command ───────────────────────────────────────────────
export async function handleCommand({ type, commandId, payload }) {
  const deviceToken = await SecureStore.getItemAsync('deviceToken')
  let status = 'success'
  let errorMessage = null

  try {
    switch (type) {

      case 'ring':
        await ringAlarm(payload?.duration ? payload.duration * 1000 : 30_000)
        await notifyExecuted('Ring alarm activated')
        break

      case 'locate': {
        const Location = require('expo-location')
        // Use Balanced accuracy with 15s timeout — BestForNavigation is too slow
        const loc = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Location timeout')), 15_000)),
        ])
        await apiPost('/locations/report', {
          latitude:   loc.coords.latitude,
          longitude:  loc.coords.longitude,
          accuracy:   loc.coords.accuracy,
          altitude:   loc.coords.altitude,
          speed:      loc.coords.speed,
          bearing:    loc.coords.heading,
          recordedAt: new Date(loc.timestamp).toISOString(),
        })
        await notifyExecuted(`📍 Location sent: ${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`)
        break
      }

      case 'photo': {
        try {
          const photo = await capturePhoto({ quality: 0.6, trigger: 'remote_command' })
          await apiPost('/evidence/photo', {
            imageBase64: photo.base64,
            commandId,
            trigger: 'remote_command',
          })
          await notifyExecuted('📷 Photo captured silently')
          await apiPost(`/commands/ack/${commandId}`, { deviceToken, status: 'success' })
          return
        } catch (e) {
          status = 'failed'
          errorMessage = 'Camera: ' + e.message
        }
        break
      }

      case 'stealth_on':
        await SecureStore.setItemAsync('stealthMode', 'true')
        useStore.getState().updateStatus({ isStealthMode: true })
        await notifyExecuted('🕶️ Stealth mode ON')
        break

      case 'stealth_off':
        await SecureStore.setItemAsync('stealthMode', 'false')
        useStore.getState().updateStatus({ isStealthMode: false })
        await notifyExecuted('👁️ Stealth mode OFF')
        break

      case 'tracking_high':
        await startTracking('high')
        useStore.getState().updateStatus({ trackingMode: 'high' })
        await notifyExecuted('⚡ Tracking set to HIGH (every 10s)')
        break

      case 'tracking_low':
        await startTracking('low')
        useStore.getState().updateStatus({ trackingMode: 'low' })
        await notifyExecuted('🔋 Tracking set to LOW (every 5 min)')
        break

      case 'tracking_off':
        stopTracking()
        useStore.getState().updateStatus({ trackingMode: 'off' })
        await notifyExecuted('⏹ Tracking stopped')
        break

      default:
        status = 'failed'
        errorMessage = `Unknown command: ${type}`
    }
  } catch (err) {
    status = 'failed'
    errorMessage = err.message
    console.warn(`[CommandHandler] ${type} failed:`, err.message)
  }

  try {
    await apiPost(`/commands/ack/${commandId}`, { deviceToken, status, errorMessage })
  } catch {}
}

// ── Theft mode from server ───────────────────────────────────────
export async function handleTheftMode({ isStolen, trackingMode, stealthMode }) {
  if (isStolen) {
    await startTracking('high')
    await SecureStore.setItemAsync('isStolen', 'true')
    if (stealthMode) await SecureStore.setItemAsync('stealthMode', 'true')
    await notifyExecuted('🚨 THEFT MODE ACTIVATED — tracking every 10s')
  } else {
    await startTracking(trackingMode || 'balanced')
    await SecureStore.setItemAsync('isStolen', 'false')
    await SecureStore.setItemAsync('stealthMode', 'false')
    await notifyExecuted('✅ Device recovered — normal tracking resumed')
  }
}
