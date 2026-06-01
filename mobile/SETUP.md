# Infallible Mobile — Setup Guide

## Prerequisites
- Node.js 18+ (already installed)
- Expo CLI: `npm install -g expo-cli eas-cli`
- Android phone with USB debugging OR the Expo Go app

## 1. Install dependencies
```bash
cd mobile
npm install
```

## 2. Start development server
```bash
npx expo start
```
Then:
- Press `a` to open on a connected Android device
- Or scan the QR code with **Expo Go** app (Android/iOS)

## 3. Find your computer's IP address
The mobile app needs to connect to the server running on your computer.

**Windows:**
```
ipconfig
```
Look for "IPv4 Address" under your WiFi adapter — e.g. `192.168.1.105`

Your server URL will be: `http://192.168.1.105:3000`

Both your phone and computer must be on the **same WiFi network**.

## 4. Onboarding
1. Open the app → enter `http://192.168.x.x:3000` as server URL
2. Register a device in the web dashboard → copy the Device Token
3. Paste the token in the app → verify
4. Grant location and notification permissions
5. Done — protection is active

## 5. Build APK (no Android Studio needed)

### Install EAS CLI
```bash
npm install -g eas-cli
eas login
```

### Create EAS project
```bash
eas build:configure
```

### Build APK (preview)
```bash
eas build --platform android --profile preview
```
This builds in the cloud — no local Android SDK needed.
The APK download link is emailed to you when done (~10 minutes).

## 6. Firebase setup (for push commands)
1. Go to https://console.firebase.google.com
2. Create project → Add Android app → package: `ug.infallible.app`
3. Download `google-services.json` → place in `mobile/` folder
4. Copy your Project ID to `server/.env` → `FIREBASE_PROJECT_ID=...`
5. Generate a service account key → add `FIREBASE_PRIVATE_KEY` and `FIREBASE_CLIENT_EMAIL`

## File structure
```
mobile/
├── App.jsx                          # Root — FCM setup, navigation
├── app.json                         # Expo config (permissions, package name)
├── eas.json                         # Build profiles
├── src/
│   ├── screens/
│   │   ├── OnboardingScreen.jsx     # Token entry + permission grants
│   │   ├── HomeScreen.jsx           # Protection status + quick actions
│   │   └── SettingsScreen.jsx       # Tracking mode, stealth, sign out
│   ├── services/
│   │   ├── locationTask.js          # Background GPS task (defined at module level)
│   │   ├── commandHandler.js        # Executes ring/lock/photo/locate commands
│   │   ├── api.js                   # Axios client (reads token from SecureStore)
│   │   └── deviceInfo.js            # Collects device metadata
│   ├── store/
│   │   └── useStore.js              # Zustand state (token, status, location)
│   └── utils/
│       └── time.js                  # formatDistanceToNow helper
```
