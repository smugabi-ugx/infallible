import { create } from 'zustand'
import api from '../lib/api'

export const useDeviceStore = create((set, get) => ({
  devices: [],
  selectedDevice: null,
  locations: [],
  loading: false,
  error: null,

  fetchDevices: async () => {
    set({ loading: true, error: null })
    try {
      const response = await api.get('/devices')
      set({ devices: response.data.devices, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  fetchDevice: async (deviceId) => {
    set({ loading: true, error: null })
    try {
      const response = await api.get(`/devices/${deviceId}`)
      set({ selectedDevice: response.data.device, loading: false })
      return response.data.device
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  fetchLocations: async (deviceId, params = {}) => {
    try {
      const response = await api.get(`/locations/${deviceId}`, { params })
      set({ locations: response.data.locations })
      return response.data.locations
    } catch (error) {
      console.error('Failed to fetch locations:', error)
    }
  },

  markAsStolen: async (deviceId) => {
    try {
      const response = await api.post(`/devices/${deviceId}/stolen`)
      // Update local state
      set(state => ({
        devices: state.devices.map(d =>
          d.id === deviceId ? { ...d, isStolen: true, stolenAt: new Date() } : d
        ),
        selectedDevice: state.selectedDevice?.id === deviceId
          ? { ...state.selectedDevice, isStolen: true, stolenAt: new Date() }
          : state.selectedDevice
      }))
      return response.data
    } catch (error) {
      console.error('Failed to mark as stolen:', error)
      throw error
    }
  },

  markAsRecovered: async (deviceId) => {
    try {
      const response = await api.post(`/devices/${deviceId}/recovered`)
      set(state => ({
        devices: state.devices.map(d =>
          d.id === deviceId ? { ...d, isStolen: false, stolenAt: null } : d
        ),
        selectedDevice: state.selectedDevice?.id === deviceId
          ? { ...state.selectedDevice, isStolen: false, stolenAt: null }
          : state.selectedDevice
      }))
      return response.data
    } catch (error) {
      console.error('Failed to mark as recovered:', error)
      throw error
    }
  },

  sendCommand: async (deviceId, type, payload = {}) => {
    try {
      const response = await api.post(`/commands/${deviceId}`, { type, payload })
      return response.data
    } catch (error) {
      console.error('Failed to send command:', error)
      throw error
    }
  },

  updateDeviceLocation: (deviceId, location) => {
    set(state => ({
      devices: state.devices.map(d =>
        d.id === deviceId
          ? {
              ...d,
              lastLatitude: location.latitude,
              lastLongitude: location.longitude,
              lastSeenAt: location.recordedAt
            }
          : d
      ),
      selectedDevice: state.selectedDevice?.id === deviceId
        ? {
            ...state.selectedDevice,
            lastLatitude: location.latitude,
            lastLongitude: location.longitude,
            lastSeenAt: location.recordedAt
          }
        : state.selectedDevice,
      locations: state.selectedDevice?.id === deviceId
        ? [location, ...state.locations]
        : state.locations
    }))
  }
}))
