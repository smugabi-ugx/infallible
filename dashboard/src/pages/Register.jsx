import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { Shield, Eye, EyeOff, ArrowRight, Check } from 'lucide-react'
import { toast } from 'sonner'

function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register } = useAuthStore()
  const navigate = useNavigate()

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await register({ name: form.name, email: form.email, phone: form.phone, password: form.password })
      toast.success('Account created! Welcome to Infallible.')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const passStrength = form.password.length === 0 ? null
    : form.password.length < 8 ? 'weak'
    : form.password.match(/[A-Z]/) && form.password.match(/[0-9]/) ? 'strong'
    : 'medium'

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl text-slate-900">Infallible</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
            <p className="text-slate-500 text-sm mt-1">Start protecting your devices today.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="label">Full name</label>
                <input type="text" value={form.name} onChange={set('name')} className="input" placeholder="Sam Ochieng" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="label">Phone number</label>
                <input type="tel" value={form.phone} onChange={set('phone')} className="input" placeholder="+256 7xx xxx xxx" />
              </div>
            </div>

            <div>
              <label className="label">Email address <span className="text-rose-500">*</span></label>
              <input type="email" value={form.email} onChange={set('email')} className="input" placeholder="you@example.com" required />
            </div>

            <div>
              <label className="label">Password <span className="text-rose-500">*</span></label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  className="input pr-10"
                  placeholder="Min. 8 characters"
                  required minLength={8}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passStrength && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-1 flex-1">
                    {['weak', 'medium', 'strong'].map((level, i) => (
                      <div key={level} className={`h-1 flex-1 rounded-full transition-colors ${
                        passStrength === 'weak' && i === 0 ? 'bg-rose-400'
                        : passStrength === 'medium' && i <= 1 ? 'bg-amber-400'
                        : passStrength === 'strong' ? 'bg-emerald-400'
                        : 'bg-slate-200'
                      }`} />
                    ))}
                  </div>
                  <span className={`text-xs font-medium capitalize ${
                    passStrength === 'weak' ? 'text-rose-500'
                    : passStrength === 'medium' ? 'text-amber-500'
                    : 'text-emerald-500'
                  }`}>{passStrength}</span>
                </div>
              )}
            </div>

            <div>
              <label className="label">Confirm password <span className="text-rose-500">*</span></label>
              <div className="relative">
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  className="input pr-10"
                  placeholder="Re-enter password"
                  required
                />
                {form.confirmPassword && (
                  <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                    form.password === form.confirmPassword ? 'text-emerald-500' : 'text-rose-500'
                  }`}>
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? <Spinner /> : <ArrowRight className="h-4 w-4" />}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-medium hover:text-indigo-500 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function Spinner() {
  return <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
}

export default Register
