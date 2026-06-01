import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { toast } from 'sonner'
import { Smartphone, Copy, ArrowRight, CheckCircle, Info } from 'lucide-react'

function AddDevice() {
  const [form, setForm] = useState({ name: '', imei: '', model: '', manufacturer: '' })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const navigate = useNavigate()

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/devices', form)
      setResult(res.data)
      toast.success('Device registered successfully!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to register device')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(result.deviceToken)
    setCopied(true)
    toast.success('Device token copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (result) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-1">Device Registered!</h1>
          <p className="text-slate-500 text-sm mb-6">
            Install the Infallible Android app and enter the token below to link your device.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-left">
            <p className="stat-label mb-2">Device Token — save this!</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-slate-800 break-all leading-relaxed">
                {result.deviceToken}
              </code>
              <button
                onClick={handleCopy}
                className={`flex-shrink-0 p-2 rounded-lg border transition-colors ${
                  copied
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                    : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="text-left mb-8">
            <p className="text-sm font-semibold text-slate-900 mb-3">Next steps</p>
            <ol className="space-y-2.5">
              {[
                'Download the Infallible Android app',
                'Open the app and enter the device token above',
                'Grant location and notification permissions',
                'Enable Device Administrator for full theft protection',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-sm text-slate-600">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex gap-3">
            <button onClick={handleCopy} className="btn-secondary flex-1">
              <Copy className="h-4 w-4" />
              Copy Token
            </button>
            <button onClick={() => navigate('/dashboard')} className="btn-primary flex-1">
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Register a Device</h1>
        <p className="text-slate-500 text-sm mt-1">
          Add a device to start tracking and theft protection.
        </p>
      </div>

      <div className="card p-6 mb-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Device Name <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              className="input"
              placeholder="e.g. My Samsung Phone"
              required
            />
          </div>

          <div>
            <label className="label">IMEI Number</label>
            <input
              type="text"
              value={form.imei}
              onChange={set('imei')}
              className="input font-mono"
              placeholder="Dial *#06# to find your IMEI"
              maxLength={15}
            />
            <p className="text-xs text-slate-400 mt-1.5">
              The IMEI helps identify your device even after a factory reset or SIM change.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Model</label>
              <input
                type="text"
                value={form.model}
                onChange={set('model')}
                className="input"
                placeholder="e.g. Galaxy A54"
              />
            </div>
            <div>
              <label className="label">Manufacturer</label>
              <input
                type="text"
                value={form.manufacturer}
                onChange={set('manufacturer')}
                className="input"
                placeholder="e.g. Samsung"
              />
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Registering…</>
                : <><Smartphone className="h-4 w-4" /> Register Device</>
              }
            </button>
          </div>
        </form>
      </div>

      <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
        <Info className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-indigo-700">
          After registering, you'll receive a device token. Install the Infallible Android app
          on the target device and enter this token to begin tracking.
        </p>
      </div>
    </div>
  )
}

export default AddDevice
