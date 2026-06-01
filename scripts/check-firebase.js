/**
 * Validates Firebase credentials in server/.env without sending any message.
 * Run: node scripts/check-firebase.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../server/.env') })

const required = ['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL']

console.log('\n🔍 Checking Firebase credentials...\n')

let allGood = true

for (const key of required) {
  const val = process.env[key]
  if (!val || val.startsWith('your-')) {
    console.error(`❌  ${key} — MISSING or placeholder`)
    allGood = false
  } else {
    const preview = key === 'FIREBASE_PRIVATE_KEY'
      ? val.slice(0, 40).replace(/\n/g, '↵') + '...'
      : val
    console.log(`✅  ${key} = ${preview}`)
  }
}

if (!allGood) {
  console.log('\n❌  Some credentials are missing. Follow FIREBASE_SETUP.md to set them up.\n')
  process.exit(1)
}

console.log('\n✅  All credentials present — testing Firebase initialization...\n')

try {
  const admin = require('firebase-admin')
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    })
  }
  console.log('✅  Firebase Admin SDK initialized successfully!')
  console.log(`   Project: ${process.env.FIREBASE_PROJECT_ID}`)
  console.log(`   Email:   ${process.env.FIREBASE_CLIENT_EMAIL}`)
  console.log('\n🎉  Firebase is configured correctly. Ready to send push notifications!\n')
} catch (err) {
  console.error('❌  Firebase initialization failed:', err.message)
  console.error('\n   Check that your private key is correctly formatted.')
  console.error('   In .env the key should look like:')
  console.error('   FIREBASE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\\nMIIE...\\n-----END RSA PRIVATE KEY-----\\n"\n')
  process.exit(1)
}
