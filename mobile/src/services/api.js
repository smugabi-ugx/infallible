import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import { SERVER_URL } from '../config'

export async function getApi() {
  const serverUrl    = await SecureStore.getItemAsync('serverUrl') || SERVER_URL
  const deviceToken  = await SecureStore.getItemAsync('deviceToken')

  return axios.create({
    baseURL: `${serverUrl}/api`,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      ...(deviceToken ? { 'x-device-token': deviceToken } : {}),
    },
  })
}

export async function apiPost(path, data) {
  const api = await getApi()
  return api.post(path, data)
}

export async function apiGet(path) {
  const api = await getApi()
  return api.get(path)
}
