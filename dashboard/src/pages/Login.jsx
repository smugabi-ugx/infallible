import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { Shield, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-500/20 border border-indigo-500/30 rounded-xl flex items-center justify-center">
            <Shield className="h-5 w-5 text-indigo-400" />
          </div>
          <span className="text-white font-semibold text-lg">Infallible</span>
        </div>

        <div>
          <div className="space-y-6 mb-10">
            {[
              { title: 'Real-time GPS Tracking', desc: 'Monitor device location live, with full history and trail.' },
              { title: 'Theft Mode Activation', desc: 'Instantly trigger stealth mode, alarms, and camera capture.' },
              { title: 'Remote Command Center', desc: 'Lock, wipe, ring, or photograph from anywhere in the world.' },
            ].map(f => (
              <div key={f.title} className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{f.title}</p>
                  <p className="text-slate-400 text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-slate-500 text-xs">
            Protecting devices across East Africa — built for speed, reliability, and stealth.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">Infallible</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
              <p className="text-slate-500 text-sm mt-1">Welcome back. Enter your credentials to continue.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-700">Password</label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input pr-10"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? <Spinner /> : <ArrowRight className="h-4 w-4" />}
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-indigo-600 font-medium hover:text-indigo-500 transition-colors">
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Spinner() {
  return <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
}

export default Login
