import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import { useDeviceStore } from '../store/devices'
import { subscribeToDevice, unsubscribeFromDevice } from '../lib/socket'
import { formatDistanceToNow, format } from 'date-fns'
import { toast } from 'sonner'
import L from 'leaflet'
import {
  ArrowLeft, Volume2, Lock, Camera, MapPin, AlertTriangle,
  CheckCircle, Battery, Wifi, WifiOff, X, Loader2, Shield
} from 'lucide-react'

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
})
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
})

function DeviceDetail() {
  const { deviceId } = useParams()
  const navigate = useNavigate()
  const { selectedDevice: device, locations, fetchDevice, fetchLocations, markAsStolen, markAsRecovered, sendCommand } = useDeviceStore()

  const [loading, setLoading] = useState(true)
  const [cmdLoading, setCmdLoading] = useState('')
  const [modal, setModal] = useState(null)

  useEffect(() => {
    const load = async () => {
      await fetchDevice(deviceId)
      await fetchLocations(deviceId, { limit: 100 })
      setLoading(false)
    }
    load()
    subscribeToDevice(deviceId)
    return () => unsubscribeFromDevice(deviceId)
  }, [deviceId])

  const handleCommand = async (type, label) => {
    setCmdLoading(type)
    try {
      await sendCommand(deviceId, type)
      toast.success(`${label} command sent to device`)
    } catch {
      toast.error(`Failed to send ${label} command`)
    } finally {
      setCmdLoading('')
    }
  }

  const openModal = (config) => setModal(config)
  const closeModal = () => setModal(null)

  const handleStolenToggle = () => {
    if (device.isStolen) {
      openModal({
        title: 'Mark as Recovered?',
        body: 'This will deactivate theft mode and return the device to normal tracking.',
        confirmText: 'Mark Recovered',
        variant: 'success',
        onConfirm: async () => {
          await markAsRecovered(deviceId)
          toast.success('Device marked as recovered. Normal tracking resumed.')
        }
      })
    } else {
      openModal({
        title: 'Report Device Stolen?',
        body: 'This activates high-frequency GPS tracking, stealth mode, and sends you real-time location alerts.',
        confirmText: 'Report Stolen',
        variant: 'danger',
        onConfirm: async () => {
          await markAsStolen(deviceId)
          toast.success('Theft mode activated. Tracking at maximum frequency.')
        }
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading device…</p>
        </div>
      </div>
    )
  }

  if (!device) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Device not found.</p>
        <button onClick={() => navigate('/dashboard')} className="btn-secondary mt-4">Back to Devices</button>
      </div>
    )
  }

  const online = device.lastSeenAt && new Date() - new Date(device.lastSeenAt) < 15 * 60 * 1000
  const center = device.lastLatitude && device.lastLongitude
    ? [parseFloat(device.lastLatitude), parseFloat(device.lastLongitude)]
    : [0.3476, 32.5825]
  const pathCoords = locations.filter(l => l.latitude && l.longitude).map(l => [parseFloat(l.latitude), parseFloat(l.longitude)])

  const batteryColor = !device.lastBatteryLevel ? 'text-slate-400'
    : device.lastBatteryLevel <= 15 ? 'text-rose-500'
    : device.lastBatteryLevel <= 30 ? 'text-amber-500'
    : 'text-emerald-500'

  return (
    <div className="space-y-6">
      {/* Stolen banner */}
      {device.isStolen && (
        <div className="flex items-center gap-3 p-4 bg-rose-600 rounded-xl">
          <div className="relative flex h-3 w-3">
            <span className="ping absolute inline-flex h-full w-full rounded-full bg-rose-200 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">THEFT MODE ACTIVE</p>
            <p className="text-rose-200 text-xs">
              High-frequency tracking · Stealth mode · Reported {device.stolenAt && format(new Date(device.stolenAt), 'PPp')}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 truncate">{device.name}</h1>
            <p className="text-sm text-slate-500">{device.model || 'Unknown model'}{device.imei ? ` · IMEI ${device.imei}` : ''}</p>
          </div>
        </div>
        <button
          onClick={handleStolenToggle}
          className={`flex-shrink-0 ${device.isStolen ? 'btn-secondary' : 'btn-danger'}`}
        >
          {device.isStolen
            ? <><CheckCircle className="h-4 w-4" />Mark Recovered</>
            : <><AlertTriangle className="h-4 w-4" />Report Stolen</>
          }
        </button>
      </div>

      {/* Status tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatusTile
          label="Connection"
          value={online ? 'Online' : 'Offline'}
          icon={online ? Wifi : WifiOff}
          iconClass={online ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'}
          valueClass={online ? 'text-emerald-700' : 'text-slate-500'}
        />
        <StatusTile
          label="Battery"
          value={device.lastBatteryLevel != null ? `${device.lastBatteryLevel}%` : '—'}
          icon={Battery}
          iconClass={`${batteryColor} bg-slate-50`}
          valueClass={batteryColor}
        />
        <StatusTile
          label="Tracking Mode"
          value={device.trackingMode?.toUpperCase() || 'BALANCED'}
          icon={Shield}
          iconClass="text-indigo-600 bg-indigo-50"
          valueClass="text-indigo-700"
        />
        <StatusTile
          label="Last Seen"
          value={device.lastSeenAt ? formatDistanceToNow(new Date(device.lastSeenAt), { addSuffix: true }) : 'Never'}
          icon={MapPin}
          iconClass="text-slate-500 bg-slate-100"
          valueClass="text-slate-700"
        />
      </div>

      {/* Map */}
      <div className="card overflow-hidden" style={{ height: 380 }}>
        <MapContainer center={center} zoom={15} className="h-full w-full">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com">CARTO</a>'
          />
          {device.lastLatitude && device.lastLongitude && (
            <Marker position={center} icon={device.isStolen ? redIcon : blueIcon}>
              <Popup>
                <strong>{device.name}</strong><br />
                {device.lastSeenAt && `Last seen ${formatDistanceToNow(new Date(device.lastSeenAt), { addSuffix: true })}`}
              </Popup>
            </Marker>
          )}
          {pathCoords.length > 1 && (
            <Polyline positions={pathCoords} color={device.isStolen ? '#f43f5e' : '#6366f1'} weight={3} opacity={0.7} />
          )}
        </MapContainer>
      </div>

      {/* Remote Commands */}
      <div className="card p-6">
        <h2 className="section-title mb-4">Remote Commands</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <CmdButton icon={Volume2} label="Ring Alarm" type="ring" cmdLoading={cmdLoading} onClick={handleCommand} color="indigo" />
          <CmdButton icon={Lock} label="Lock Device" type="lock" cmdLoading={cmdLoading} onClick={handleCommand} color="amber" />
          <CmdButton icon={Camera} label="Take Photo" type="photo" cmdLoading={cmdLoading} onClick={handleCommand} color="violet" />
          <CmdButton icon={MapPin} label="Request Location" type="locate" cmdLoading={cmdLoading} onClick={handleCommand} color="emerald" />
        </div>
      </div>

      {/* Info + Status */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="section-title mb-4">Device Information</h2>
          <dl className="space-y-2.5">
            {[
              ['Name', device.name],
              ['Model', device.model],
              ['Manufacturer', device.manufacturer],
              ['IMEI', device.imei],
              ['IMEI 2', device.imei2],
              ['Android Version', device.androidVersion],
              ['Phone Number', device.phoneNumber],
              ['SIM Operator', device.simOperator],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                <dt className="text-sm text-slate-500">{label}</dt>
                <dd className="text-sm font-medium text-slate-900">{value || <span className="text-slate-300">—</span>}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="card p-6">
          <h2 className="section-title mb-4">Live Status</h2>
          <dl className="space-y-2.5">
            {[
              ['Status', online ? '🟢 Online' : '⚫ Offline'],
              ['Battery', device.lastBatteryLevel != null ? `${device.lastBatteryLevel}%` : null],
              ['Theft Mode', device.isStolen ? '🔴 Active' : '✅ Inactive'],
              ['Stealth Mode', device.isStealthMode ? 'Enabled' : 'Disabled'],
              ['Tracking', device.trackingMode?.toUpperCase() || 'BALANCED'],
              ['Coordinates', device.lastLatitude ? `${parseFloat(device.lastLatitude).toFixed(6)}, ${parseFloat(device.lastLongitude).toFixed(6)}` : null],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                <dt className="text-sm text-slate-500">{label}</dt>
                <dd className="text-sm font-medium text-slate-900">{value || <span className="text-slate-300">—</span>}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Location History */}
      <div className="card p-6">
        <h2 className="section-title mb-4">Location History</h2>
        {locations.length === 0 ? (
          <div className="text-center py-10">
            <MapPin className="h-8 w-8 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No location data recorded yet.</p>
            <p className="text-xs text-slate-300 mt-1">Install the Android app to start reporting locations.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  {['Time', 'Coordinates', 'Accuracy', 'Battery', 'Network'].map(h => (
                    <th key={h} className="text-left py-2 px-3 stat-label border-b border-slate-100 first:pl-0 last:pr-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {locations.slice(0, 20).map(loc => (
                  <tr key={loc.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-3 text-slate-600 first:pl-0 whitespace-nowrap">
                      {format(new Date(loc.recordedAt), 'MMM d, HH:mm:ss')}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs text-slate-700">
                      {parseFloat(loc.latitude).toFixed(6)}, {parseFloat(loc.longitude).toFixed(6)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {loc.accuracy ? `±${Math.round(loc.accuracy)}m` : '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      {loc.batteryLevel != null
                        ? <span className={loc.batteryLevel <= 15 ? 'text-rose-500 font-medium' : 'text-slate-500'}>{loc.batteryLevel}%</span>
                        : <span className="text-slate-300">—</span>
                      }
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 last:pr-0 capitalize">{loc.networkType || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {modal && <ConfirmModal {...modal} onClose={closeModal} />}
    </div>
  )
}

function StatusTile({ label, value, icon: Icon, iconClass, valueClass }) {
  return (
    <div className="card p-4">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${iconClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="stat-label mb-0.5">{label}</p>
      <p className={`text-sm font-semibold ${valueClass}`}>{value}</p>
    </div>
  )
}

const cmdColors = {
  indigo: 'hover:border-indigo-200 hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:bg-indigo-100',
  amber: 'hover:border-amber-200 hover:bg-amber-50 group-hover:text-amber-600 group-hover:bg-amber-100',
  violet: 'hover:border-violet-200 hover:bg-violet-50 group-hover:text-violet-600 group-hover:bg-violet-100',
  emerald: 'hover:border-emerald-200 hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:bg-emerald-100',
}

function CmdButton({ icon: Icon, label, type, cmdLoading, onClick, color }) {
  const busy = cmdLoading === type
  return (
    <button
      onClick={() => onClick(type, label)}
      disabled={!!cmdLoading}
      className={`group flex flex-col items-center gap-2.5 p-4 border border-slate-200 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed ${cmdColors[color]}`}
    >
      <div className={`w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center transition-colors ${cmdColors[color]}`}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin text-slate-500" /> : <Icon className="h-5 w-5 text-slate-500 group-hover:text-current transition-colors" />}
      </div>
      <span className="text-xs font-medium text-slate-600 group-hover:text-current transition-colors">{label}</span>
    </button>
  )
}

function ConfirmModal({ title, body, confirmText, variant, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false)
  const handleConfirm = async () => {
    setLoading(true)
    try { await onConfirm() } catch { toast.error('Operation failed') }
    finally { setLoading(false); onClose() }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${variant === 'danger' ? 'bg-rose-100' : 'bg-emerald-100'}`}>
            {variant === 'danger'
              ? <AlertTriangle className="h-5 w-5 text-rose-600" />
              : <CheckCircle className="h-5 w-5 text-emerald-600" />
            }
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">{body}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeviceDetail
