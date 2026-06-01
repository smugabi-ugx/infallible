import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { ArrowRight, Shield, Check, MapPin, Camera, Lock, Bell, Wifi, Zap, Star } from 'lucide-react'

/* ─────────────────────────────────────────────────────────────── */
export default function Landing() {
  const { isAuthenticated } = useAuthStore()
  const cta = isAuthenticated ? '/dashboard' : '/register'

  return (
    <div className="bg-[#030712] text-white overflow-x-hidden">
      <Nav isAuthenticated={isAuthenticated} />
      <Hero cta={cta} />
      <LiveTicker />
      <Features />
      <Stats />
      <HowItWorks cta={cta} />
      <Testimonials />
      <Pricing cta={cta} />
      <FinalCTA cta={cta} />
      <Footer />
    </div>
  )
}

/* ── Nav ──────────────────────────────────────────────────────── */
function Nav({ isAuthenticated }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <nav className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#030712]/90 backdrop-blur-xl border-b border-white/5' : ''}`}>
      <div className="max-w-6xl mx-auto px-6 h-[68px] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center">
            <Shield className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight">Infallible</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
          {['Features', 'How It Works', 'Pricing'].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, '-')}`}
              className="hover:text-white transition-colors duration-150">{l}</a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {!isAuthenticated && (
            <Link to="/login" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">
              Sign in
            </Link>
          )}
          <Link to={isAuthenticated ? '/dashboard' : '/register'}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[#030712] text-sm font-semibold rounded-full hover:bg-zinc-100 transition-colors">
            {isAuthenticated ? 'Dashboard' : 'Get started'}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  )
}

/* ── Hero ─────────────────────────────────────────────────────── */
function Hero({ cta }) {
  return (
    <section className="relative min-h-screen flex items-center grain">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(79,70,229,0.12) 0%, transparent 70%)' }} />
        <div className="absolute top-20 right-20 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(244,63,94,0.06) 0%, transparent 70%)' }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 pt-32 pb-20 w-full">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Left */}
          <div>
            {/* Live pill */}
            <div className="inline-flex items-center gap-2 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
              <span className="text-xs font-medium text-zinc-400">Live tracking in 12 countries</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-[68px] font-bold tracking-[-0.03em] leading-[1.04] mb-6">
              Your thief is<br />
              walking around<br />
              <span style={{ background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #e879f9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                right now.
              </span>
            </h1>

            <p className="text-lg text-zinc-400 leading-relaxed mb-10 max-w-md">
              Infallible photographs them, tracks every step, and sends you the evidence —
              all from your stolen device. In complete silence.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to={cta}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-full transition-all duration-150 text-[15px]"
                style={{ boxShadow: '0 0 0 1px rgba(99,102,241,0.5), 0 8px 32px rgba(99,102,241,0.3)' }}>
                Start free — no card needed
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-zinc-300 hover:text-white text-[15px] font-medium transition-colors">
                See how it works
              </a>
            </div>

            <p className="mt-6 text-xs text-zinc-600">
              Free for 1 device · Android · Setup in 3 minutes
            </p>
          </div>

          {/* Right — phone mockup */}
          <div className="flex justify-center lg:justify-end">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Phone Mockup ─────────────────────────────────────────────── */
function PhoneMockup() {
  return (
    <div className="relative">
      {/* Glow behind phone */}
      <div className="absolute inset-0 -m-8 rounded-full opacity-40"
        style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.3) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      {/* Phone frame */}
      <div className="relative w-[280px] h-[580px] rounded-[48px] p-[2.5px]"
        style={{ background: 'linear-gradient(145deg, #3f3f46 0%, #18181b 60%, #27272a 100%)' }}>
        <div className="w-full h-full rounded-[46px] bg-[#09090b] overflow-hidden flex flex-col"
          style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>

          {/* Status bar */}
          <div className="flex items-center justify-between px-7 pt-5 pb-1">
            <span className="text-white text-[12px] font-semibold">9:41</span>
            <div className="flex items-center gap-1.5">
              {[3,4,5].map(h => <div key={h} className="w-1 bg-white rounded-sm" style={{ height: `${h}px` }} />)}
              <div className="w-3.5 h-2 rounded-sm border border-white/40 flex items-center p-0.5 ml-1">
                <div className="h-full w-2/3 bg-white rounded-sm" />
              </div>
            </div>
          </div>

          {/* Pill notch */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#09090b] rounded-full" />

          {/* App header */}
          <div className="px-5 py-3 flex items-center justify-between border-b border-white/[0.04]">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-indigo-600 rounded-md flex items-center justify-center">
                <Shield className="h-2.5 w-2.5 text-white" />
              </div>
              <span className="text-[13px] font-semibold text-white">Infallible</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-medium">● Live</span>
          </div>

          {/* Stolen alert */}
          <div className="mx-3 mt-3 px-3 py-2.5 rounded-xl flex items-start gap-2.5"
            style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.25)' }}>
            <span className="relative flex h-2 w-2 mt-0.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-rose-300">THEFT MODE ACTIVE</p>
              <p className="text-[10px] text-rose-400/70 mt-0.5">Samsung Galaxy A54 · 2 min ago</p>
            </div>
          </div>

          {/* Mini map */}
          <div className="mx-3 mt-2.5 rounded-xl overflow-hidden relative" style={{ height: 140 }}>
            <div className="absolute inset-0"
              style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }} />
            {/* Grid lines */}
            <div className="absolute inset-0"
              style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.08) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            {/* Route line */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 280 140" preserveAspectRatio="none">
              <polyline points="40,100 80,80 120,90 160,60 200,70 230,50" fill="none" stroke="rgba(99,102,241,0.4)" strokeWidth="1.5" strokeDasharray="4 2" />
            </svg>
            {/* Live dot */}
            <div className="absolute" style={{ top: 42, left: 222 }}>
              <div className="relative">
                <div className="absolute -inset-3 rounded-full bg-rose-500/20 animate-ping" />
                <div className="w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center"
                  style={{ boxShadow: '0 0 16px rgba(244,63,94,0.8)' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              </div>
            </div>
            <div className="absolute bottom-2 left-3 text-[9px] text-indigo-300/60">Kampala Central, Uganda</div>
            <div className="absolute bottom-2 right-3 text-[9px] text-indigo-300/40">© OSM</div>
          </div>

          {/* Evidence photos */}
          <div className="mx-3 mt-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-zinc-300">Evidence Photos</span>
              <span className="text-[10px] text-indigo-400">3 new</span>
            </div>
            <div className="flex gap-2">
              {['bg-zinc-700', 'bg-zinc-800', 'bg-zinc-700'].map((bg, i) => (
                <div key={i} className={`flex-1 h-14 rounded-lg ${bg} flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }} />
                  <Camera className="h-4 w-4 text-white/40 relative z-10" />
                  {i === 0 && <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500" />}
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="mx-3 mt-3 grid grid-cols-4 gap-1.5">
            {[
              { icon: '🔔', label: 'Ring' },
              { icon: '🔒', label: 'Lock' },
              { icon: '📷', label: 'Photo' },
              { icon: '🗑', label: 'Wipe' },
            ].map(a => (
              <div key={a.label} className="flex flex-col items-center py-2 rounded-xl gap-1"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-sm">{a.icon}</span>
                <span className="text-[9px] text-zinc-500">{a.label}</span>
              </div>
            ))}
          </div>

          {/* Home indicator */}
          <div className="mt-auto mb-2 flex justify-center">
            <div className="w-24 h-1 rounded-full bg-white/20" />
          </div>
        </div>
      </div>

      {/* Floating cards */}
      <div className="absolute -left-16 top-24 px-3 py-2.5 rounded-2xl hidden lg:flex items-center gap-2.5"
        style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <MapPin className="h-3.5 w-3.5 text-emerald-400" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-white">Location updated</p>
          <p className="text-[10px] text-zinc-500">10 seconds ago</p>
        </div>
      </div>

      <div className="absolute -right-14 bottom-32 px-3 py-2.5 rounded-2xl hidden lg:flex items-center gap-2.5"
        style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center">
          <Camera className="h-3.5 w-3.5 text-violet-400" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-white">Thief photographed</p>
          <p className="text-[10px] text-zinc-500">Front camera · Stealth</p>
        </div>
      </div>
    </div>
  )
}

/* ── Live Ticker ──────────────────────────────────────────────── */
function LiveTicker() {
  const events = [
    '📍 Device located · Kampala, Uganda',
    '📷 Thief photographed · Nairobi, Kenya',
    '🔒 Remote lock triggered · Dar es Salaam',
    '📱 SIM change detected · Kigali, Rwanda',
    '✅ Device recovered · Lagos, Nigeria',
    '📍 Device located · Accra, Ghana',
    '🔔 Ring alarm sent · Mombasa, Kenya',
    '📷 Thief photographed · Kampala, Uganda',
    '📍 Device located · Entebbe, Uganda',
  ]

  return (
    <div className="border-y border-white/[0.05] py-4 overflow-hidden" style={{ background: 'rgba(255,255,255,0.01)' }}>
      <div className="flex gap-12 animate-[ticker_30s_linear_infinite] whitespace-nowrap w-max">
        {[...events, ...events].map((e, i) => (
          <span key={i} className="text-xs text-zinc-500 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" />
            {e}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── Features ─────────────────────────────────────────────────── */
function Features() {
  return (
    <section id="features" className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16">
          <p className="text-indigo-400 text-xs font-semibold uppercase tracking-[0.15em] mb-4">Capabilities</p>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight max-w-xl">
            Built for the moment<br />
            <span className="text-zinc-500">every second counts.</span>
          </h2>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[180px]">
          {/* GPS — large */}
          <BentoCard className="md:col-span-4 md:row-span-2" accent="indigo">
            <div className="h-full flex flex-col justify-between p-7">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  <span className="text-[11px] font-medium text-indigo-400">Live GPS</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Updates every 10 seconds.</h3>
                <p className="text-zinc-400 text-sm leading-relaxed max-w-sm">
                  In theft mode, we track your device every 10 seconds. Full route history.
                  Coordinates accurate to 3 metres.
                </p>
              </div>
              {/* Mini map vis */}
              <div className="relative h-24 rounded-xl overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #0f172a, #1e1b4b)', border: '1px solid rgba(99,102,241,0.15)' }}>
                <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.07) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 96" preserveAspectRatio="none">
                  <polyline points="20,70 80,55 140,65 200,40 260,50 320,30 380,38" fill="none" stroke="rgba(99,102,241,0.5)" strokeWidth="2" />
                  <circle cx="380" cy="38" r="4" fill="#6366f1" />
                  <circle cx="380" cy="38" r="8" fill="rgba(99,102,241,0.2)" />
                </svg>
                <div className="absolute bottom-2 left-3 text-[9px] text-indigo-300/50">0.3476° N, 32.5825° E · Kampala</div>
              </div>
            </div>
          </BentoCard>

          {/* Photo capture */}
          <BentoCard className="md:col-span-2 md:row-span-2" accent="violet">
            <div className="h-full flex flex-col p-6">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center mb-4">
                <Camera className="h-5 w-5 text-violet-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Thief photos.<br />Automatically.</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Every unlock attempt silently triggers the front camera. Uploaded instantly to your vault.
              </p>
              <div className="mt-auto grid grid-cols-3 gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="aspect-square rounded-lg bg-zinc-800 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-zinc-700/50" style={{ backdropFilter: 'blur(6px)' }} />
                    <Camera className="h-4 w-4 text-zinc-600 relative z-10" />
                    {i === 0 && <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500 z-20" />}
                  </div>
                ))}
              </div>
            </div>
          </BentoCard>

          {/* SIM Detection */}
          <BentoCard className="md:col-span-2" accent="cyan">
            <div className="h-full flex flex-col justify-between p-6">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Wifi className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1">SIM swapped?</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">You get the new number within 10 seconds. Tracking continues uninterrupted.</p>
              </div>
            </div>
          </BentoCard>

          {/* Remote Lock */}
          <BentoCard className="md:col-span-2" accent="amber">
            <div className="h-full flex flex-col justify-between p-6">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Lock className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1">Lock. Wipe. Anywhere.</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">One tap to lock with a custom message or trigger a full data wipe remotely.</p>
              </div>
            </div>
          </BentoCard>

          {/* Geofence */}
          <BentoCard className="md:col-span-2" accent="rose">
            <div className="h-full flex flex-col justify-between p-6">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Bell className="h-4 w-4 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1">Geofence alerts.</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">Draw a safe zone. Get alerted the instant the device leaves home, work, or school.</p>
              </div>
            </div>
          </BentoCard>
        </div>
      </div>
    </section>
  )
}

function BentoCard({ children, className = '', accent = 'indigo' }) {
  const accents = {
    indigo: 'hover:border-indigo-500/20',
    violet: 'hover:border-violet-500/20',
    cyan: 'hover:border-cyan-500/20',
    amber: 'hover:border-amber-500/20',
    rose: 'hover:border-rose-500/20',
  }
  return (
    <div className={`rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-200 overflow-hidden ${accents[accent]} ${className}`}>
      {children}
    </div>
  )
}

/* ── Stats ────────────────────────────────────────────────────── */
function Stats() {
  const stats = [
    { val: '2,400+', label: 'devices protected' },
    { val: '87%', label: 'recovery rate' },
    { val: '10s', label: 'GPS update interval' },
    { val: '3 min', label: 'average setup time' },
  ]
  return (
    <div className="border-y border-white/[0.05] py-16 px-6" style={{ background: 'rgba(255,255,255,0.01)' }}>
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map(({ val, label }) => (
          <div key={label} className="text-center">
            <p className="text-4xl font-bold tracking-tight text-white mb-1">{val}</p>
            <p className="text-sm text-zinc-500">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── How It Works ─────────────────────────────────────────────── */
function HowItWorks({ cta }) {
  const steps = [
    {
      n: '1',
      title: 'Register your device',
      body: 'Add your device with its IMEI. Takes under 2 minutes. No payment needed to start.',
      detail: 'We store your IMEI, model, and SIM info as a baseline to detect any changes.',
    },
    {
      n: '2',
      title: 'Install the silent agent',
      body: 'Install the Infallible app on your Android device. It runs invisibly, uses under 1% battery.',
      detail: 'The app is designed to be invisible. No icon in the app drawer in stealth mode.',
    },
    {
      n: '3',
      title: 'If stolen — activate',
      body: 'Log in from any browser. Mark as stolen. Theft mode activates instantly.',
      detail: 'GPS shifts to 10-second updates. Camera captures begin. You get live location alerts.',
    },
  ]

  return (
    <section id="how-it-works" className="py-32 px-6 grain" style={{ background: 'rgba(255,255,255,0.01)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-16">
          <p className="text-indigo-400 text-xs font-semibold uppercase tracking-[0.15em] mb-4">Setup</p>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Protected in 3 minutes.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map(({ n, title, body, detail }) => (
            <div key={n} className="relative p-7 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <div className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center mb-6">
                <span className="text-lg font-bold text-zinc-400">{n}</span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">{title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-3">{body}</p>
              <p className="text-zinc-600 text-xs leading-relaxed border-t border-white/5 pt-3">{detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link to={cta}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-full transition-all text-[15px]"
            style={{ boxShadow: '0 0 0 1px rgba(99,102,241,0.5), 0 8px 32px rgba(99,102,241,0.25)' }}>
            Start protecting now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ── Testimonials ─────────────────────────────────────────────── */
function Testimonials() {
  const reviews = [
    {
      stars: 5,
      text: 'I had a live photo of the thief within 8 minutes of the theft. Forwarded it to police. My phone was back that evening.',
      name: 'James K.',
      role: 'Kampala, Uganda',
    },
    {
      stars: 5,
      text: 'The SIM change alert fired before I even noticed the phone was gone. Had the new number, location, and a photo. Done.',
      name: 'Amara N.',
      role: 'Nairobi, Kenya',
    },
    {
      stars: 5,
      text: 'Sent a lock message offering a small reward. No police, no drama. The phone was at my door the next morning.',
      name: 'David O.',
      role: 'Dar es Salaam, Tanzania',
    },
  ]

  return (
    <section className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16">
          <p className="text-indigo-400 text-xs font-semibold uppercase tracking-[0.15em] mb-4">Recovery Stories</p>
          <h2 className="text-4xl font-bold tracking-tight">
            They got their<br />phones back.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {reviews.map(({ stars, text, name, role }) => (
            <div key={name} className="p-7 rounded-2xl border border-white/[0.07] bg-white/[0.025] flex flex-col gap-5">
              <div className="flex gap-1">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-zinc-200 text-[15px] leading-relaxed flex-1">"{text}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                <div className="w-8 h-8 rounded-full bg-indigo-900/60 border border-indigo-700/50 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-indigo-300">{name[0]}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{name}</p>
                  <p className="text-xs text-zinc-500">{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Pricing ──────────────────────────────────────────────────── */
function Pricing({ cta }) {
  const plans = [
    {
      name: 'Free',
      price: '0',
      unit: '',
      sub: 'UGX · forever',
      desc: 'One device, real protection.',
      features: ['1 device', 'GPS every 60 seconds', 'Email alerts', 'Remote ring & locate', '7-day location history'],
      cta: 'Get started free',
      href: cta,
      hot: false,
    },
    {
      name: 'Pro',
      price: '15,000',
      unit: 'UGX',
      sub: 'per month',
      desc: 'For anyone serious about recovery.',
      features: ['Up to 5 devices', 'GPS every 10 seconds', 'Automatic thief photos', 'Remote lock, wipe & message', 'SIM change alerts', 'Geofence zones', '90-day history', 'Priority support'],
      cta: 'Start free 14-day trial',
      href: cta,
      hot: true,
    },
    {
      name: 'Family',
      price: '35,000',
      unit: 'UGX',
      sub: 'per month',
      desc: 'Every device in your household.',
      features: ['Up to 15 devices', 'Everything in Pro', 'Shared dashboard', '1-year history', 'Evidence vault', 'WhatsApp alerts', 'Dedicated support'],
      cta: 'Contact us',
      href: 'mailto:support@infallible.ug',
      hot: false,
    },
  ]

  return (
    <section id="pricing" className="py-32 px-6 border-t border-white/[0.05]">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16 text-center">
          <p className="text-indigo-400 text-xs font-semibold uppercase tracking-[0.15em] mb-4">Pricing</p>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">Simple, honest pricing.</h2>
          <p className="text-zinc-500 text-base">Start free. Upgrade only when you see the value.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 items-start">
          {plans.map(plan => (
            <div key={plan.name} className={`relative rounded-2xl p-7 transition-all ${
              plan.hot
                ? 'bg-indigo-600 border border-indigo-500'
                : 'bg-white/[0.025] border border-white/[0.07] hover:border-white/[0.12]'
            }`}
              style={plan.hot ? { boxShadow: '0 0 0 1px rgba(99,102,241,0.5), 0 24px 80px rgba(99,102,241,0.25)' } : {}}>

              {plan.hot && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-400 text-black text-[11px] font-bold rounded-full tracking-wide">
                  MOST POPULAR
                </div>
              )}

              <p className={`text-sm font-semibold mb-5 ${plan.hot ? 'text-indigo-200' : 'text-zinc-400'}`}>{plan.name}</p>

              <div className="flex items-start gap-1 mb-1">
                {plan.unit && <span className={`text-sm mt-3 ${plan.hot ? 'text-indigo-200' : 'text-zinc-400'}`}>{plan.unit}</span>}
                <span className="text-5xl font-bold tracking-tight">{plan.price}</span>
              </div>
              <p className={`text-sm mb-2 ${plan.hot ? 'text-indigo-200' : 'text-zinc-500'}`}>{plan.sub}</p>
              <p className={`text-sm mb-7 ${plan.hot ? 'text-indigo-200' : 'text-zinc-400'}`}>{plan.desc}</p>

              <a href={plan.href.startsWith('/') ? undefined : plan.href}
                {...(plan.href.startsWith('/') ? {} : { href: plan.href })}
                onClick={plan.href.startsWith('/') ? undefined : undefined}>
                <Link to={plan.href.startsWith('/') ? plan.href : '#'}
                  onClick={plan.href.startsWith('mailto') ? (e) => { e.preventDefault(); window.location.href = plan.href } : undefined}
                  className={`block text-center py-3 rounded-xl font-semibold text-sm mb-7 transition-colors ${
                    plan.hot ? 'bg-white text-indigo-700 hover:bg-indigo-50' : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'
                  }`}>
                  {plan.cta}
                </Link>
              </a>

              <ul className="space-y-2.5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <Check className={`h-4 w-4 flex-shrink-0 ${plan.hot ? 'text-indigo-200' : 'text-indigo-400'}`} />
                    <span className={plan.hot ? 'text-indigo-100' : 'text-zinc-300'}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Final CTA ────────────────────────────────────────────────── */
function FinalCTA({ cta }) {
  return (
    <section className="py-32 px-6 relative overflow-hidden grain border-t border-white/[0.04]">
      <div className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, rgba(79,70,229,0.15) 0%, transparent 70%)' }} />
      <div className="relative max-w-3xl mx-auto text-center">
        <h2 className="text-5xl sm:text-6xl font-bold tracking-[-0.025em] leading-tight mb-5">
          The next 5 minutes<br />
          <span className="text-zinc-500">could save your phone.</span>
        </h2>
        <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
          Register your device now — before it's too late.
        </p>
        <Link to={cta}
          className="inline-flex items-center gap-2 px-10 py-4 bg-white text-[#030712] font-bold rounded-full text-base hover:bg-zinc-100 transition-all"
          style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.15), 0 20px 60px rgba(255,255,255,0.08)' }}>
          Protect my device — it's free
          <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="text-zinc-600 text-sm mt-5">No credit card · Android · 3-minute setup</p>
      </div>
    </section>
  )
}

/* ── Footer ───────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-white/[0.05] py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-indigo-600/70 rounded-md flex items-center justify-center">
            <Shield className="h-3 w-3 text-white" />
          </div>
          <span className="text-sm font-semibold text-zinc-400">Infallible</span>
          <span className="text-zinc-700 text-sm">· Device Protection Platform · Uganda</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-zinc-600">
          <a href="#" className="hover:text-zinc-400 transition-colors">Privacy</a>
          <a href="#" className="hover:text-zinc-400 transition-colors">Terms</a>
          <a href="mailto:support@infallible.ug" className="hover:text-zinc-400 transition-colors">support@infallible.ug</a>
        </div>
        <p className="text-xs text-zinc-700">© 2026 Infallible. All rights reserved.</p>
      </div>
    </footer>
  )
}
