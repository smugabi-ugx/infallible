let admin = null

function initializeFirebase() {
  if (admin) return admin

  if (!process.env.FIREBASE_PROJECT_ID) {
    console.warn('[Firebase] Not configured — push notifications disabled.')
    return null
  }

  try {
    const firebaseAdmin = require('firebase-admin')

    // Avoid re-initializing if already done (e.g. hot reload)
    if (firebaseAdmin.apps.length) {
      admin = firebaseAdmin
      return admin
    }

    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    })

    admin = firebaseAdmin
    console.log('[Firebase] Initialized — project:', process.env.FIREBASE_PROJECT_ID)
    return admin
  } catch (error) {
    console.error('[Firebase] Initialization failed:', error.message)
    return null
  }
}

/**
 * Build a label for the notification so Android shows something useful.
 */
function commandLabel(type) {
  const labels = {
    ring:         'Alarm triggered',
    lock:         'Device locked remotely',
    wipe:         'Remote wipe initiated',
    locate:       'Location requested',
    photo:        'Photo capture requested',
    message:      'New message on your device',
    stealth_on:   'Stealth mode enabled',
    stealth_off:  'Stealth mode disabled',
    tracking_high:'Tracking set to high frequency',
    tracking_low: 'Tracking set to low frequency',
    tracking_off: 'Tracking disabled',
    theft_mode:   'Theft mode updated',
  }
  return labels[type] || 'Infallible command received'
}

/**
 * Send a command or status push to a single device.
 *
 * @param {string} fcmToken   Device FCM registration token
 * @param {object} data       Payload — all values are stringified for FCM data field
 */
async function sendNotification(fcmToken, data) {
  const app = initializeFirebase()
  if (!app) {
    console.warn('[Firebase] Skipping — not configured.')
    return null
  }

  // FCM data fields must all be strings
  const stringifiedData = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [
      k,
      typeof v === 'object' ? JSON.stringify(v) : String(v),
    ])
  )

  const isStealth = ['locate', 'photo', 'stealth_on', 'stealth_off'].includes(data.commandType)

  const message = {
    token: fcmToken,

    // data payload — always present, handled by the app
    data: stringifiedData,

    // notification block — required for Android to deliver when app is killed
    // Stealth commands omit the visible notification title/body
    ...(isStealth ? {} : {
      notification: {
        title: 'Infallible',
        body:  commandLabel(data.commandType || data.type),
      },
    }),

    android: {
      priority: 'high',
      ttl:      3_600_000, // 1 hour
      ...(isStealth ? {} : {
        notification: {
          channelId:     'infallible_commands',
          sound:         'default',
          defaultSound:  true,
          defaultVibrateTimings: true,
          notificationCount: 1,
        },
      }),
    },
  }

  try {
    const response = await app.messaging().send(message)
    console.log('[Firebase] Sent:', response)
    return response
  } catch (error) {
    console.error('[Firebase] Send failed:', error.message)
    throw error
  }
}

/**
 * Send to multiple devices (multicast).
 */
async function sendMulticastNotification(fcmTokens, data) {
  const app = initializeFirebase()
  if (!app || fcmTokens.length === 0) return null

  const stringifiedData = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [
      k,
      typeof v === 'object' ? JSON.stringify(v) : String(v),
    ])
  )

  const message = {
    tokens: fcmTokens,
    data:   stringifiedData,
    android: { priority: 'high' },
  }

  try {
    const response = await app.messaging().sendEachForMulticast(message)
    console.log(`[Firebase] Multicast: ${response.successCount} ok, ${response.failureCount} failed`)
    return response
  } catch (error) {
    console.error('[Firebase] Multicast failed:', error.message)
    throw error
  }
}

module.exports = { sendNotification, sendMulticastNotification }
