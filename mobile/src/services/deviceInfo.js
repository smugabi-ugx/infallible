import * as Device from 'expo-device'
import * as Network from 'expo-network'
import * as Battery from 'expo-battery'

export async function collectDeviceInfo() {
  const [networkState, batteryLevel] = await Promise.all([
    Network.getNetworkStateAsync(),
    Battery.getBatteryLevelAsync(),
  ])

  return {
    model: Device.modelName || 'Unknown',
    manufacturer: Device.manufacturer || 'Unknown',
    androidVersion: Device.osVersion || 'Unknown',
    deviceName: Device.deviceName || 'Android Device',
    batteryLevel: Math.round(batteryLevel * 100),
    networkType: networkState.type,
  }
}

export function getNetworkLabel(type) {
  switch (type) {
    case Network.NetworkStateType.WIFI: return 'WiFi'
    case Network.NetworkStateType.CELLULAR: return 'Mobile Data'
    case Network.NetworkStateType.NONE: return 'Offline'
    default: return 'Unknown'
  }
}
