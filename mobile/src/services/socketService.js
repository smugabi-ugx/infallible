/**
 * Persistent Socket.io connection to the Infallible server.
 * Handles real-time command delivery when the app is open or backgrounded.
 */
import { io } from 'socket.io-client'
import * as SecureStore from 'expo-secure-store'
import { handleCommand, handleTheftMode } from './commandHandler'
import { useStore } from '../store/useStore'

let socket = null
let reconnectTimer = null

export async function connectSocket() {
  const serverUrl   = await SecureStore.getItemAsync('serverUrl')
  const deviceToken = await SecureStore.getItemAsync('deviceToken')

  if (!serverUrl || !deviceToken) return
  if (socket?.connected) return

  // Clean up any existing socket
  if (socket) { socket.removeAllListeners(); socket.disconnect() }

  console.log('[Socket] Connecting to', serverUrl)

  socket = io(serverUrl, {
    transports:           ['polling'], // Render free tier drops WebSocket upgrades — polling is stable
    reconnection:         true,
    reconnectionDelay:    5000,
    reconnectionAttempts: 999,
    timeout:              20_000,
  })

  socket.on('connect', () => {
    console.log('[Socket] Connected —', socket.id)
    // Register this device so server can target it by token
    socket.emit('device:register', { deviceToken })
    useStore.getState().setOnline(true)
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
  })

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected —', reason)
    useStore.getState().setOnline(false)
  })

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message)
    useStore.getState().setOnline(false)
  })

  // ── Incoming command from dashboard ──────────────────────────
  socket.on('command', async (data) => {
    console.log('[Socket] Command received:', data.commandType)
    try {
      await handleCommand({
        type:      data.commandType,
        commandId: data.commandId,
        payload:   data.payload || {},
      })
    } catch (err) {
      console.error('[Socket] Command handler error:', err.message)
    }
  })

  // ── Theft mode toggle from dashboard ─────────────────────────
  socket.on('device:stolen', async (data) => {
    console.log('[Socket] Theft mode update:', data)
    await handleTheftMode({
      isStolen:     data.isStolen,
      trackingMode: data.isStolen ? 'high' : 'balanced',
      stealthMode:  data.isStolen,
    })
    useStore.getState().updateStatus({
      isStolen:     data.isStolen,
      trackingMode: data.isStolen ? 'high' : 'balanced',
    })
  })

  // ── Location update echo (so UI refreshes) ───────────────────
  socket.on('location:update', (data) => {
    if (data.location) {
      useStore.getState().setLastLocation(data.location)
    }
  })

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
}

export function getSocket() {
  return socket
}

export function isSocketConnected() {
  return socket?.connected ?? false
}
