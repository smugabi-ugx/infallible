import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDeviceStore } from '../store/devices'
import { initSocket } from '../lib/socket'
import { formatDistanceToNow } from 'date-fns'
import { Smartphone, MapPin, Battery, Wifi, WifiOff, AlertTriangle, Plus, Shield } from 'lucide-react'

const isDeviceOnline = (device) =>
  device.lastSeenAt && new Date() - new Date(device.lastSeenAt) < 15 * 60 * 1000

function Dashboard() {
  const { devices, loading, fetchDevices } = useDeviceStore()

  useEffect(() => {
    fetchDevices()
    initSocket()
  }, [])

  const online = devices.filter(isDeviceOnline).length
  const stolen = devices.filter(d => d.isStolen).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading devices…</p>
        </div>
      </div>
    )
  }

  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-indigo-50 border-2 border-indigo-100 rounded-3xl flex items-center justify-center mb-6">
          <Shield className="h-10 w-10 text-indigo-400" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">No devices yet</h2>
        <p className="text-slate-500 text-sm max-w-xs mb-8">
          Register your first device to start real-time tracking and theft protection.
        </p>
        <Link to="/dashboard/add-device" className="btn-primary">
          <Plus className="h-4 w-4" />
          Register Your First Device
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your Devices</h1>
          <p className="text-sm text-slate-500 mt-0.5">{devices.length} device{devices.length !== 1 ? 's' : ''} registered</p>
        </div>
        <Link to="/dashboard/add-device" className="btn-primary">
          <Plus className="h-4 w-4" />
          Add Device
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total" value={devices.length} icon={Smartphone} color="indigo" />
        <StatCard label="Online" value={online} icon={Wifi} color="emerald" />
        <StatCard label="Stolen" value={stolen} icon={AlertTriangle} color={stolen > 0 ? 'rose' : 'slate'} />
      </div>

      {/* Stolen alert */}
      {stolen > 0 && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl">
          <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-rose-900">
              {stolen} device{stolen !== 1 ? 's' : ''} reported stolen
            </p>
            <p className="text-xs text-rose-600">Theft mode active — tracking at high frequency</p>
          </div>
        </div>
      )}

      {/* Device grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {devices.map(device => <DeviceCard key={device.id} device={device} />)}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    slate: 'bg-slate-100 text-slate-500',
  }
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xl font-bold text-slate-900">{value}</p>
        <p className="stat-label">{label}</p>
      </div>
    </div>
  )
}

function DeviceCard({ device }) {
  const online = isDeviceOnline(device)
  const batteryColor = !device.lastBatteryLevel ? 'text-slate-400'
    : device.lastBatteryLevel <= 15 ? 'text-rose-500'
    : device.lastBatteryLevel <= 30 ? 'text-amber-500'
    : 'text-emerald-500'

  return (
    <Link
      to={`/dashboard/devices/${device.id}`}
      className={`card p-5 hover:shadow-md hover:border-slate-300 transition-all block group ${
        device.isStolen ? 'border-rose-300 bg-rose-50/30' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            device.isStolen ? 'bg-rose-100' : 'bg-indigo-50'
          }`}>
            <Smartphone className={`h-5 w-5 ${device.isStolen ? 'text-rose-600' : 'text-indigo-600'}`} />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 text-sm truncate group-hover:text-indigo-700 transition-colors">
              {device.name}
            </h3>
            <p className="text-xs text-slate-500 truncate">{device.model || 'Unknown model'}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-2">
          {device.isStolen ? (
            <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs font-semibold rounded-full">STOLEN</span>
          ) : (
            <OnlineDot online={online} />
          )}
        </div>
      </div>

      <div className="space-y-2 pt-3 border-t border-slate-100">
        {device.lastLatitude && device.lastLongitude ? (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
            <span className="font-mono">
              {parseFloat(device.lastLatitude).toFixed(4)}, {parseFloat(device.lastLongitude).toFixed(4)}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span>No location data yet</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs">
            {online
              ? <><Wifi className="h-3.5 w-3.5 text-emerald-500" /><span className="text-emerald-600 font-medium">Online</span></>
              : <><WifiOff className="h-3.5 w-3.5 text-slate-400" /><span className="text-slate-400">Offline</span></>
            }
          </div>
          {device.lastBatteryLevel != null && (
            <div className={`flex items-center gap-1 text-xs font-medium ${batteryColor}`}>
              <Battery className="h-3.5 w-3.5" />
              {device.lastBatteryLevel}%
            </div>
          )}
        </div>

        {device.lastSeenAt && (
          <p className="text-xs text-slate-400">
            Last seen {formatDistanceToNow(new Date(device.lastSeenAt), { addSuffix: true })}
          </p>
        )}
      </div>
    </Link>
  )
}

function OnlineDot({ online }) {
  if (online) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
        <span className="relative flex h-2 w-2">
          <span className="ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        Online
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
      <span className="inline-flex h-2 w-2 rounded-full bg-slate-300" />
      Offline
    </span>
  )
}

export default Dashboard
