# Firebase Setup — Step by Step

This takes about 10 minutes. You need a Google account.

---

## PART 1 — Firebase Console (browser)

### Step 1: Create a Firebase project
1. Go to https://console.firebase.google.com
2. Click **"Add project"**
3. Name it **"Infallible"** → Continue
4. Disable Google Analytics (not needed) → **Create project**

### Step 2: Add your Android app
1. On the project overview, click the **Android icon** (</> in a circle)
2. **Android package name:** `ug.infallible.app`
3. **App nickname:** Infallible Agent
4. Click **Register app**
5. Click **Download google-services.json**
6. **Move that file to:** `C:\Users\DELL\Desktop\Tracking\mobile\google-services.json`
7. Click **Next** → **Next** → **Continue to console** (skip the SDK steps)

### Step 3: Get the server service account key
1. In Firebase Console, click the ⚙️ gear icon → **Project settings**
2. Click the **"Service accounts"** tab
3. Click **"Generate new private key"** → **Generate key**
4. A JSON file will download — open it in Notepad

It looks like this:
```json
{
  "type": "service_account",
  "project_id": "infallible-xxxxx",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@infallible-xxxxx.iam.gserviceaccount.com",
  ...
}
```

---

## PART 2 — Update server/.env

Open `C:\Users\DELL\Desktop\Tracking\server\.env` and fill in:

```env
FIREBASE_PROJECT_ID=infallible-xxxxx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@infallible-xxxxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEo...(paste full key here)...\n-----END RSA PRIVATE KEY-----\n"
```

⚠️ **IMPORTANT for FIREBASE_PRIVATE_KEY:**
- Copy the entire `"private_key"` value from the JSON file
- Paste it as one line in .env (the `\n` characters stay as `\n`, not actual newlines)
- Wrap in double quotes

---

## PART 3 — Verify credentials

```bash
node scripts/check-firebase.js
```

Expected output:
```
✅  FIREBASE_PROJECT_ID = infallible-xxxxx
✅  FIREBASE_CLIENT_EMAIL = firebase-adminsdk@...
✅  FIREBASE_PRIVATE_KEY = -----BEGIN RSA...
✅  Firebase Admin SDK initialized successfully!
🎉  Firebase is configured correctly.
```

---

## PART 4 — Restart the server

```bash
cd server
node src/index.js
```

---

## PART 5 — Set up the mobile app with Firebase

1. Make sure `google-services.json` is in the `mobile/` folder
2. Run the app: `cd mobile && npx expo start`
3. The app will register its FCM token with the server automatically on launch

---

## PART 6 — Test a command

```bash
# Send a test ring command to whichever device is in the database
node scripts/test-fcm.js --db ring
```

Or with a specific FCM token:
```bash
node scripts/test-fcm.js YOUR_FCM_TOKEN ring
```

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Firebase not configured` | `FIREBASE_PROJECT_ID` missing from `.env` |
| `invalid_grant` or `invalid_signature` | Private key is malformed — check `\n` escaping |
| `registration-token-not-registered` | App was reinstalled — open app again to re-register token |
| `messaging/invalid-argument` | Wrong FCM token format — must be from `getDevicePushTokenAsync()` |
| Commands sent but phone doesn't react | App may be fully killed; ensure battery optimisation is disabled for Infallible |

## Battery optimisation (Android)
Android aggressively kills background apps. After installing:
1. Settings → Apps → Infallible → Battery → **Unrestricted**
2. Settings → Battery → Battery optimisation → Infallible → **Don't optimise**

This ensures FCM messages wake the app even when killed.
