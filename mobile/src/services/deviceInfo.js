import * as Device from 'expo-device'

// Lazy-load native modules that can crash on init in some Expo Go versions
const getNetwork  = () => require('expo-network')
const getBattery  = () => require('expo-battery')

export async function collectDeviceInfo() {
  let batteryLevel = 0
  let networkType  = 'unknown'

  try {
    const Battery = getBattery()
    batteryLevel = await Battery.getBatteryLevelAsync()
  } catch {}

  try {
    const Network = getNetwork()
    const state = await Network.getNetworkStateAsync()
    networkType = state.type
  } catch {}

  return {
    model:          Device.modelName    || 'Unknown',
    manufacturer:   Device.manufacturer || 'Unknown',
    androidVersion: Device.osVersion    || 'Unknown',
    deviceName:     Device.deviceName   || 'Android Device',
    batteryLevel:   Math.round((batteryLevel || 0) * 100),
    networkType,
  }
}

export function getNetworkLabel(type) {
  return type === 'WIFI' ? 'WiFi'
       : type === 'CELLULAR' ? 'Mobile Data'
       : type === 'NONE' ? 'Offline'
       : 'Unknown'
}
