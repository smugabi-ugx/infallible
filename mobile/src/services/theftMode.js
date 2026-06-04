/**
 * Theft Mode Service — commercial-grade auto-evidence collection
 *
 * When device is marked stolen:
 * - GPS every 10 seconds (vs 60s normal)
 * - Front-camera photo silently every 2 minutes
 * - All evidence uploaded to server with timestamps
 * - Dashboard gets real-time trail + evidence gallery
 */
import { apiPost } from './api'
import { capturePhoto } from './cameraService'
import { startTracking } from './locationTask'

let photoInterval = null

export async function startTheftMode() {
  console.log('[TheftMode] ACTIVATED — photo every 2 min, GPS every 10s')

  // Aggressive GPS tracking
  await startTracking('high').catch(e => console.warn('[TheftMode] tracking:', e.message))

  // Stop any existing photo interval
  stopTheftMode()

  // Capture first photo immediately
  captureEvidencePhoto()

  // Then every 2 minutes automatically
  photoInterval = setInterval(captureEvidencePhoto, 2 * 60 * 1000)
}

export function stopTheftMode() {
  if (photoInterval) {
    clearInterval(photoInterval)
    photoInterval = null
  }
}

export function isTheftModeActive() {
  return photoInterval !== null
}

async function captureEvidencePhoto() {
  try {
    const photo = await capturePhoto({ quality: 0.5, trigger: 'theft_mode_auto' })
    await apiPost('/evidence/photo', {
      imageBase64: photo.base64,
      trigger: 'theft_mode_auto',
    })
    console.log('[TheftMode] Evidence photo uploaded')
  } catch (e) {
    console.warn('[TheftMode] Photo failed:', e.message)
  }
}
