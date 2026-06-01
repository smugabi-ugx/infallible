import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

// Returns an axios instance pointed at the stored server URL
export async function getApi() {
  const serverUrl = await SecureStore.getItemAsync('serverUrl')
  const deviceToken = await SecureStore.getItemAsync('deviceToken')

  const instance = axios.create({
    baseURL: serverUrl || 'http://localhost:3000/api',
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      ...(deviceToken ? { 'x-device-token': deviceToken } : {}),
    },
  })

  return instance
}

// Shorthand for one-off calls (used in background tasks)
export async function apiPost(path, data) {
  const api = await getApi()
  return api.post(path, data)
}

export async function apiGet(path) {
  const api = await getApi()
  return api.get(path)
}
