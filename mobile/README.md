# Infallible Android Client

This is the Android client for the Infallible device tracking system.

## Features

- Background location tracking (GPS + Network)
- Battery-efficient operation
- IMEI and device info collection
- SIM change detection
- Remote commands (ring, lock, wipe, locate)
- Stealth mode (hide app icon)
- Camera capture on wrong PIN
- Offline location queue
- FCM push notifications

## Setup

### Prerequisites
- Android Studio Arctic Fox or newer
- Android SDK 24+ (Android 7.0)
- Firebase project for FCM

### Configuration

1. Create `app/google-services.json` with your Firebase config
2. Update `app/src/main/res/values/strings.xml`:
   ```xml
   <string name="server_url">https://your-server.com</string>
   ```

### Build

```bash
# Debug build
./gradlew assembleDebug

# Release build (requires signing config)
./gradlew assembleRelease
```

## Project Structure

```
app/
├── src/main/
│   ├── java/com/infallible/tracker/
│   │   ├── MainActivity.kt
│   │   ├── services/
│   │   │   ├── LocationService.kt      # Background location
│   │   │   ├── CommandService.kt       # Remote command handler
│   │   │   └── FCMService.kt          # Firebase messaging
│   │   ├── receivers/
│   │   │   ├── BootReceiver.kt        # Start on boot
│   │   │   ├── SimChangeReceiver.kt   # Detect SIM swap
│   │   │   └── DeviceAdminReceiver.kt # Anti-uninstall
│   │   ├── data/
│   │   │   ├── ApiClient.kt           # Server communication
│   │   │   ├── LocationDatabase.kt    # Offline queue
│   │   │   └── Preferences.kt         # Settings
│   │   └── utils/
│   │       ├── DeviceInfo.kt          # IMEI, model, etc.
│   │       ├── Permissions.kt         # Runtime permissions
│   │       └── Stealth.kt             # Hide app icon
│   └── res/
│       └── ...
└── build.gradle
```

## Permissions Required

```xml
<!-- Location -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />

<!-- Device info -->
<uses-permission android:name="android.permission.READ_PHONE_STATE" />

<!-- Network -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Background -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.WAKE_LOCK" />

<!-- Camera (for evidence) -->
<uses-permission android:name="android.permission.CAMERA" />
```

## Key Components

### LocationService
Foreground service that tracks location continuously:
- Uses FusedLocationProviderClient
- Switches accuracy based on tracking mode
- Queues locations when offline
- Reports battery level with each update

### DeviceAdminReceiver
Prevents unauthorized uninstall:
- Prompts for admin rights on setup
- Can remotely lock/wipe device
- Detects wrong password attempts

### Stealth Mode
When activated:
- Hides app icon from launcher
- Keeps running in background
- Can only be opened via secret code (*#*#INFALLIBLE#*#*)

## Testing

Use Android emulator with location simulation:
```bash
adb emu geo fix <longitude> <latitude>
```

## Release Notes

### v1.0.0
- Initial release
- Basic location tracking
- Remote commands
- Stealth mode
