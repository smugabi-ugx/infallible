/**
 * Infallible — Production Asset Generator
 * Run: node generate-assets.js
 */
const { createCanvas } = require('canvas')
const fs = require('fs')

/* ─── Icon: Precision targeting eye ───────────────────────────── */
function drawIcon(size, transparent = false) {
  const c = createCanvas(size, size)
  const ctx = c.getContext('2d')
  const cx = size / 2, cy = size / 2
  const u = size / 100   // 1 unit = 1% of size

  /* Background */
  if (!transparent) {
    const bgGrd = ctx.createRadialGradient(cx, cy * 0.85, 0, cx, cy, size * 0.72)
    bgGrd.addColorStop(0, '#0d0f2b')
    bgGrd.addColorStop(0.5, '#080a1e')
    bgGrd.addColorStop(1, '#030712')
    ctx.fillStyle = bgGrd
    ctx.fillRect(0, 0, size, size)
  }

  /* Outer ambient glow */
  const ambientGrd = ctx.createRadialGradient(cx, cy, u * 5, cx, cy, u * 55)
  ambientGrd.addColorStop(0, 'rgba(139,92,246,0.22)')
  ambientGrd.addColorStop(0.5, 'rgba(99,102,241,0.10)')
  ambientGrd.addColorStop(1, 'rgba(6,182,212,0.03)')
  ctx.fillStyle = ambientGrd
  ctx.beginPath()
  ctx.arc(cx, cy, u * 55, 0, Math.PI * 2)
  ctx.fill()

  /* Ring 1 — outer dashed ring */
  ctx.save()
  ctx.strokeStyle = 'rgba(139,92,246,0.25)'
  ctx.lineWidth = u * 0.8
  ctx.setLineDash([u * 3.5, u * 2.5])
  ctx.beginPath()
  ctx.arc(cx, cy, u * 44, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  /* Ring 2 — main glowing ring */
  const ringGrd = ctx.createLinearGradient(cx - u * 38, cy - u * 38, cx + u * 38, cy + u * 38)
  ringGrd.addColorStop(0, 'rgba(139,92,246,0.9)')
  ringGrd.addColorStop(0.35, 'rgba(99,102,241,1)')
  ringGrd.addColorStop(0.65, 'rgba(79,70,229,0.9)')
  ringGrd.addColorStop(1, 'rgba(6,182,212,0.7)')

  ctx.shadowColor = 'rgba(139,92,246,0.6)'
  ctx.shadowBlur = u * 6
  ctx.strokeStyle = ringGrd
  ctx.lineWidth = u * 2
  ctx.beginPath()
  ctx.arc(cx, cy, u * 38, 0, Math.PI * 2)
  ctx.stroke()
  ctx.shadowBlur = 0

  /* 4 tick marks on ring (like a scope) */
  const ticks = [0, Math.PI / 2, Math.PI, Math.PI * 1.5]
  ticks.forEach(angle => {
    const inner = u * 33
    const outer = u * 43
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(angle)
    const tickGrd = ctx.createLinearGradient(0, -outer, 0, -inner)
    tickGrd.addColorStop(0, 'rgba(6,182,212,0.9)')
    tickGrd.addColorStop(1, 'rgba(139,92,246,0.6)')
    ctx.strokeStyle = tickGrd
    ctx.lineWidth = u * 1.8
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(0, -outer)
    ctx.lineTo(0, -inner)
    ctx.stroke()
    ctx.restore()
  })

  /* Ring 3 — inner ring */
  const innerRingGrd = ctx.createLinearGradient(cx - u * 22, cy - u * 22, cx + u * 22, cy + u * 22)
  innerRingGrd.addColorStop(0, 'rgba(6,182,212,0.7)')
  innerRingGrd.addColorStop(1, 'rgba(139,92,246,0.5)')

  ctx.shadowColor = 'rgba(6,182,212,0.4)'
  ctx.shadowBlur = u * 4
  ctx.strokeStyle = innerRingGrd
  ctx.lineWidth = u * 1.2
  ctx.beginPath()
  ctx.arc(cx, cy, u * 22, 0, Math.PI * 2)
  ctx.stroke()
  ctx.shadowBlur = 0

  /* Cross-hair lines */
  const lineLen = u * 14
  const lineGap = u * 5
  ;[[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => {
    const crossGrd = ctx.createLinearGradient(
      cx + dx * lineGap, cy + dy * lineGap,
      cx + dx * (lineGap + lineLen), cy + dy * (lineGap + lineLen)
    )
    crossGrd.addColorStop(0, 'rgba(99,102,241,0.9)')
    crossGrd.addColorStop(1, 'rgba(99,102,241,0)')
    ctx.strokeStyle = crossGrd
    ctx.lineWidth = u * 1.2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(cx + dx * lineGap, cy + dy * lineGap)
    ctx.lineTo(cx + dx * (lineGap + lineLen), cy + dy * (lineGap + lineLen))
    ctx.stroke()
  })

  /* Center dot — bright pulsing core */
  // Outer glow
  const dotGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, u * 10)
  dotGlow.addColorStop(0, 'rgba(6,182,212,0.5)')
  dotGlow.addColorStop(1, 'rgba(6,182,212,0)')
  ctx.fillStyle = dotGlow
  ctx.beginPath()
  ctx.arc(cx, cy, u * 10, 0, Math.PI * 2)
  ctx.fill()

  // Core dot
  const dotGrd = ctx.createRadialGradient(cx - u * 0.8, cy - u * 0.8, 0, cx, cy, u * 5)
  dotGrd.addColorStop(0, '#ffffff')
  dotGrd.addColorStop(0.4, '#67e8f9')
  dotGrd.addColorStop(1, '#6366f1')
  ctx.shadowColor = 'rgba(6,182,212,0.9)'
  ctx.shadowBlur = u * 8
  ctx.fillStyle = dotGrd
  ctx.beginPath()
  ctx.arc(cx, cy, u * 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  /* Small corner accent dots */
  const cornerAngles = [Math.PI / 4, Math.PI * 3 / 4, Math.PI * 5 / 4, Math.PI * 7 / 4]
  cornerAngles.forEach(angle => {
    const r = u * 38
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    ctx.fillStyle = 'rgba(6,182,212,0.8)'
    ctx.shadowColor = 'rgba(6,182,212,0.6)'
    ctx.shadowBlur = u * 3
    ctx.beginPath()
    ctx.arc(x, y, u * 1.8, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  })

  return c
}

/* ─── Splash screen ─────────────────────────────────────────────── */
function drawSplash(w, h) {
  const c = createCanvas(w, h)
  const ctx = c.getContext('2d')
  const cx = w / 2, cy = h / 2

  /* Dark bg */
  ctx.fillStyle = '#030712'
  ctx.fillRect(0, 0, w, h)

  /* Subtle grid lines */
  ctx.strokeStyle = 'rgba(99,102,241,0.04)'
  ctx.lineWidth = 1
  const gridSize = w / 16
  for (let x = 0; x <= w; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
  }
  for (let y = 0; y <= h; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
  }

  /* Ambient glow */
  const grd = ctx.createRadialGradient(cx, cy * 0.85, 0, cx, cy * 0.85, w * 0.45)
  grd.addColorStop(0, 'rgba(99,102,241,0.14)')
  grd.addColorStop(1, 'rgba(99,102,241,0)')
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, w, h)

  /* Icon */
  const iconSize = w * 0.26
  const icon = drawIcon(Math.round(iconSize), true)
  const iconY = cy * 0.75
  ctx.drawImage(icon, cx - iconSize / 2, iconY - iconSize / 2, iconSize, iconSize)

  /* App name */
  const nameSize = Math.round(w * 0.052)
  ctx.font = `700 ${nameSize}px sans-serif`
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.shadowColor = 'rgba(99,102,241,0.5)'
  ctx.shadowBlur = 20
  ctx.fillText('INFALLIBLE', cx, iconY + iconSize / 2 + nameSize * 1.5)
  ctx.shadowBlur = 0

  /* Tagline */
  const tagSize = Math.round(nameSize * 0.42)
  ctx.font = `400 ${tagSize}px sans-serif`
  ctx.fillStyle = 'rgba(148,163,184,0.7)'
  ctx.letterSpacing = `${tagSize * 0.3}px`
  ctx.fillText('DEVICE PROTECTION', cx, iconY + iconSize / 2 + nameSize * 1.5 + tagSize * 1.8)

  return c
}

/* ─── Generate ──────────────────────────────────────────────────── */
if (!fs.existsSync('./assets')) fs.mkdirSync('./assets')

console.log('\nGenerating Infallible production assets...\n')

const icon = drawIcon(1024, false)
fs.writeFileSync('./assets/icon.png', icon.toBuffer('image/png'))
console.log('✓  icon.png         1024×1024')

const adaptive = drawIcon(1024, true)
fs.writeFileSync('./assets/adaptive-icon.png', adaptive.toBuffer('image/png'))
console.log('✓  adaptive-icon.png  1024×1024')

const splash = drawSplash(2048, 2048)
fs.writeFileSync('./assets/splash.png', splash.toBuffer('image/png'))
console.log('✓  splash.png       2048×2048')

console.log('\n✅  All assets generated — ready to build.\n')
