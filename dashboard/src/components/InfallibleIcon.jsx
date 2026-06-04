// Precision targeting reticle — Infallible brand icon
export default function InfallibleIcon({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <radialGradient id="bg" cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor="#0d0f2b" />
          <stop offset="100%" stopColor="#030712" />
        </radialGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ring" x1="12" y1="12" x2="88" y2="88">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="innerRing" x1="28" y1="28" x2="72" y2="72">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.5" />
        </linearGradient>
        <radialGradient id="dot" cx="40%" cy="38%" r="60%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#67e8f9" />
          <stop offset="100%" stopColor="#6366f1" />
        </radialGradient>
        <filter id="dotGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width="100" height="100" fill="url(#bg)" rx={size > 24 ? '16' : '8'} />

      {/* Ambient glow */}
      <circle cx="50" cy="50" r="50" fill="url(#glow)" />

      {/* Outer dashed ring */}
      <circle cx="50" cy="50" r="44" stroke="#8b5cf6" strokeOpacity="0.2"
        strokeWidth="0.8" strokeDasharray="3.5 2.5" fill="none" />

      {/* Main ring */}
      <circle cx="50" cy="50" r="38" stroke="url(#ring)" strokeWidth="2" fill="none" />

      {/* Tick marks at N/E/S/W */}
      <line x1="50" y1="7"  x2="50" y2="17" stroke="#06b6d4" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="50" y1="83" x2="50" y2="93" stroke="#06b6d4" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="7"  y1="50" x2="17" y2="50" stroke="#06b6d4" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="83" y1="50" x2="93" y2="50" stroke="#06b6d4" strokeWidth="1.8" strokeLinecap="round" />

      {/* Inner ring */}
      <circle cx="50" cy="50" r="22" stroke="url(#innerRing)" strokeWidth="1.2" fill="none" />

      {/* Crosshair lines */}
      <line x1="50" y1="36" x2="50" y2="29" stroke="#6366f1" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.9" />
      <line x1="50" y1="64" x2="50" y2="71" stroke="#6366f1" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6" />
      <line x1="36" y1="50" x2="29" y2="50" stroke="#6366f1" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.9" />
      <line x1="64" y1="50" x2="71" y2="50" stroke="#6366f1" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6" />

      {/* Glow halo behind center dot */}
      <circle cx="50" cy="50" r="9" fill="#06b6d4" fillOpacity="0.18" />

      {/* Center dot */}
      <circle cx="50" cy="50" r="5" fill="url(#dot)" filter="url(#dotGlow)" />

      {/* Corner accent dots on main ring */}
      <circle cx="76.9" cy="23.1" r="1.8" fill="#06b6d4" fillOpacity="0.8" />
      <circle cx="23.1" cy="76.9" r="1.8" fill="#06b6d4" fillOpacity="0.8" />
      <circle cx="76.9" cy="76.9" r="1.8" fill="#06b6d4" fillOpacity="0.6" />
      <circle cx="23.1" cy="23.1" r="1.8" fill="#06b6d4" fillOpacity="0.6" />
    </svg>
  )
}
