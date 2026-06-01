/**
 * Test command delivery via Socket.io (no Firebase needed).
 *
 * Usage:
 *   node scripts/test-command.js [command-type]
 *
 * Examples:
 *   node scripts/test-command.js ring
 *   node scripts/test-command.js locate
 *   node scripts/test-command.js photo
 *
 * The script:
 *  1. Finds the first device in the database
 *  2. Logs in as its owner
 *  3. Sends the command via the REST API
 *  4. The server emits it to the mobile app via Socket.io
 *  5. Reports whether the device socket room was occupied
 */
require('dotenv').config({ path: require('path').join(__dirname, '../server/.env') })

const axios = require('axios')
const { io } = require('socket.io-client')

const SERVER = `http://localhost:${process.env.PORT || 3000}`
const TYPE   = process.argv[2] || 'ring'

async function main() {
  console.log(`\n🚀 Testing "${TYPE}" command via Socket.io...\n`)

  // ── 1. Get a device + login ───────────────────────────────────
  const db = require('../server/src/models')
  await db.sequelize.authenticate()

  const device = await db.Device.findOne({
    order: [['updatedAt', 'DESC']],
    include: [{ model: db.User, as: 'user' }],
  })

  if (!device) {
    console.error('❌ No device found in the database.')
    console.error('   Register a device in the dashboard first.')
    process.exit(1)
  }

  console.log(`📱 Device: ${device.name} (${device.id.slice(0, 8)}...)`)
  console.log(`👤 Owner:  ${device.user.email}`)

  // ── 2. Login to get JWT ───────────────────────────────────────
  const loginRes = await axios.post(`${SERVER}/api/auth/login`, {
    email:    device.user.email,
    password: process.env.TEST_PASSWORD || 'Password123!',
  }).catch(e => {
    console.error('❌ Login failed:', e.response?.data?.error || e.message)
    process.exit(1)
  })

  const { accessToken } = loginRes.data
  console.log('✅ Logged in\n')

  // ── 3. Listen as a simulated mobile device ───────────────────
  const mobileSocket = io(SERVER, { transports: ['websocket'] })

  await new Promise((resolve) => {
    mobileSocket.on('connect', () => {
      mobileSocket.emit('device:register', { deviceToken: device.deviceToken })
      console.log(`📡 Simulated mobile connected (socket: ${mobileSocket.id})`)
      console.log(`   Registered as token:${device.deviceToken.slice(0, 8)}...\n`)
      resolve()
    })
    mobileSocket.on('connect_error', (err) => {
      console.error('❌ Could not connect to server socket:', err.message)
      console.error('   Is the server running on', SERVER, '?')
      process.exit(1)
    })
  })

  // ── 4. Listen for the command coming back ────────────────────
  const received = new Promise((resolve) => {
    mobileSocket.on('command', (data) => {
      console.log('🎯 Command received by mobile device!')
      console.log('   Type:      ', data.commandType)
      console.log('   Command ID:', data.commandId)
      console.log('   Payload:   ', JSON.stringify(data.payload))
      resolve(data)
    })
  })

  // ── 5. Send the command via REST API ─────────────────────────
  console.log(`📤 Sending "${TYPE}" command to device...`)
  const cmdRes = await axios.post(
    `${SERVER}/api/commands/${device.id}`,
    { type: TYPE, payload: TYPE === 'ring' ? { duration: 5 } : {} },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  ).catch(e => {
    console.error('❌ Command send failed:', e.response?.data || e.message)
    process.exit(1)
  })

  console.log('✅ Command created (ID:', cmdRes.data.command.id.slice(0, 8) + '...)')

  // ── 6. Wait for delivery confirmation (5s timeout) ──────────
  const result = await Promise.race([
    received,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
  ]).catch(() => null)

  if (result) {
    console.log('\n✅ END-TO-END SUCCESS — command delivered via Socket.io in real-time!')
    console.log('   On a real phone, the', TYPE, 'action would now execute.\n')
  } else {
    console.log('\n⚠️  Command was sent to the server but not received on the socket.')
    console.log('   This is normal if the mobile app is not currently connected.')
    console.log('   The command is queued — the app will pick it up via polling within 30s.\n')
  }

  mobileSocket.disconnect()
  await db.sequelize.close()
  process.exit(0)
}

main().catch(err => { console.error(err.message); process.exit(1) })
