import { io } from 'socket.io-client'
import { useDeviceStore } from '../store/devices'

// In dev: connect to same origin (proxied by Vite)
// In prod: VITE_SERVER_URL = https://your-server.railway.app
const SERVER_URL = import.meta.env.VITE_SERVER_URL || window.location.origin

let socket = null

export function initSocket() {
  if (socket?.connected) return socket

  socket = io(SERVER_URL, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 3000,
  })

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id)
  })

  socket.on('disconnect', () => {
    console.log('Socket disconnected')
  })

  socket.on('location:update', (data) => {
    useDeviceStore.getState().updateDeviceLocation(data.deviceId, data.location)
  })

  socket.on('device:stolen', (data) => {
    console.log('Device theft mode updated:', data)
  })

  socket.on('command:ack', (data) => {
    console.log('Command acknowledged:', data)
  })

  return socket
}

export function subscribeToDevice(deviceId) {
  if (!socket) initSocket()
  socket.emit('subscribe', deviceId)
}

export function unsubscribeFromDevice(deviceId) {
  if (!socket) return
  socket.emit('unsubscribe', deviceId)
}

export function getSocket() {
  return socket
}
