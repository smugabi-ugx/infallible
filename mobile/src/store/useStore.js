import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

export const useStore = create((set, get) => ({
  // Auth
  deviceToken: null,
  deviceId: null,
  serverUrl: null,
  isRegistered: false,

  // Status
  isStolen: false,
  isStealthMode: false,
  trackingMode: 'balanced',   // 'high' | 'balanced' | 'low' | 'off'
  isOnline: false,

  // Live data
  lastLocation: null,
  lastSyncAt: null,
  batteryLevel: null,

  // UI
  loading: false,
  error: null,

  // ── Actions ─────────────────────────────────────────────────
  setRegistered: async ({ deviceToken, deviceId, serverUrl }) => {
    await SecureStore.setItemAsync('deviceToken', String(deviceToken))
    await SecureStore.setItemAsync('deviceId', String(deviceId))
    await SecureStore.setItemAsync('serverUrl', serverUrl)
    set({ deviceToken: String(deviceToken), deviceId: String(deviceId), serverUrl, isRegistered: true })
  },

  loadFromStorage: async () => {
    try {
      const deviceToken = await SecureStore.getItemAsync('deviceToken')
      const deviceId    = await SecureStore.getItemAsync('deviceId')
      const serverUrl   = await SecureStore.getItemAsync('serverUrl')
      if (deviceToken && deviceId && serverUrl) {
        set({ deviceToken, deviceId, serverUrl, isRegistered: true })
        return true
      }
    } catch (err) {
      console.warn('[Store] loadFromStorage error:', err)
    }
    return false
  },

  clearRegistration: async () => {
    await SecureStore.deleteItemAsync('deviceToken')
    await SecureStore.deleteItemAsync('deviceId')
    await SecureStore.deleteItemAsync('serverUrl')
    set({ deviceToken: null, deviceId: null, serverUrl: null, isRegistered: false })
  },

  updateStatus: (patch) => set(patch),
  setLastLocation: (loc) => set({ lastLocation: loc, lastSyncAt: new Date().toISOString() }),
  setBattery: (level) => set({ batteryLevel: level }),
  setOnline: (v) => set({ isOnline: v }),
  setLoading: (v) => set({ loading: v }),
  setError: (e) => set({ error: e }),
}))
