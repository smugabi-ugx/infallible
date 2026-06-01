/**
 * Test FCM push notification end-to-end.
 *
 * Usage:
 *   node scripts/test-fcm.js <fcm-token> [command-type]
 *
 * Examples:
 *   node scripts/test-fcm.js f7Xk...abc ring
 *   node scripts/test-fcm.js f7Xk...abc locate
 *   node scripts/test-fcm.js f7Xk...abc photo
 *
 * Or test via device registered in the database:
 *   node scripts/test-fcm.js --db ring
 *   (picks the first device in the DB that has an FCM token)
 */
require('dotenv').config({ path: require('path').join(__dirname, '../server/.env') })

const { sendNotification } = require('../server/src/services/firebase')

async function main() {
  const args = process.argv.slice(2)
  let fcmToken = args[0]
  const commandType = args[1] || 'ring'

  // --db flag: look up a token from the database
  if (fcmToken === '--db') {
    const db = require('../server/src/models')
    await db.sequelize.authenticate()
    const device = await db.Device.findOne({
      where: { fcmToken: { [db.Sequelize.Op.ne]: null } },
      order: [['updatedAt', 'DESC']],
    })
    if (!device || !device.fcmToken) {
      console.error('❌ No device with an FCM token found in the database.')
      console.error('   Open the app on your phone first so it registers its token.')
      process.exit(1)
    }
    fcmToken = device.fcmToken
    console.log(`📱 Using device: ${device.name} (${device.id})`)
  }

  if (!fcmToken) {
    console.error('Usage: node scripts/test-fcm.js <fcm-token|--db> [command-type]')
    process.exit(1)
  }

  const commandId = `test-${Date.now()}`

  console.log(`\n🚀 Sending "${commandType}" command to device...`)
  console.log(`   FCM token: ${fcmToken.slice(0, 20)}...`)

  try {
    await sendNotification(fcmToken, {
      type:        'command',
      commandId,
      commandType,
      payload:     JSON.stringify(commandType === 'ring' ? { duration: 10 } : {}),
    })
    console.log('\n✅ FCM notification sent successfully!')
    console.log('   Watch your phone — the command should execute within 2-3 seconds.')
    if (commandType === 'ring') {
      console.log('   Your phone should ring for 10 seconds.')
    } else if (commandType === 'locate') {
      console.log('   Check the dashboard — a new location should appear shortly.')
    }
  } catch (err) {
    console.error('\n❌ FCM send failed:', err.message)
    if (err.code === 'messaging/registration-token-not-registered') {
      console.error('   The FCM token is invalid or the app was uninstalled.')
    } else if (err.message.includes('project_id')) {
      console.error('   Check FIREBASE_PROJECT_ID in server/.env')
    } else if (err.message.includes('private_key')) {
      console.error('   Check FIREBASE_PRIVATE_KEY in server/.env — ensure \\n sequences are correct.')
    }
    process.exit(1)
  }

  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
