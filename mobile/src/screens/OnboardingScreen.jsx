import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Dimensions, Alert,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import * as Location from 'expo-location'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import axios from 'axios'
import { useStore } from '../store/useStore'
import { collectDeviceInfo } from '../services/deviceInfo'
import { startTracking } from '../services/locationTask'

const { width } = Dimensions.get('window')
const C = {
  bg:      '#030712',
  card:    '#0f172a',
  border:  'rgba(255,255,255,0.07)',
  primary: '#6366f1',
  text:    '#ffffff',
  sub:     '#71717a',
  muted:   '#27272a',
  danger:  '#f43f5e',
  success: '#10b981',
}

const STEPS = ['Server', 'Token', 'Permissions', 'Done']

export default function OnboardingScreen() {
  const [step, setStep] = useState(0)
  const [serverUrl, setServerUrl] = useState('http://192.168.1.100:3000')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const setRegistered = useStore(s => s.setRegistered)

  // ── Step 0: Verify server ────────────────────────────────────
  const handleServerCheck = async () => {
    setError('')
    if (!serverUrl.startsWith('http')) {
      setError('Enter a valid URL starting with http:// or https://')
      return
    }
    setLoading(true)
    try {
      const clean = serverUrl.replace(/\/$/, '')
      await axios.get(`${clean}/health`, { timeout: 6000 })
      setServerUrl(clean)
      setStep(1)
    } catch {
      setError("Can't reach that server. Check your IP address and make sure the server is running.")
    } finally {
      setLoading(false)
    }
  }

  // ── Step 1: Validate token & register device ─────────────────
  const handleTokenSubmit = async () => {
    setError('')
    if (!token.trim() || token.trim().length < 10) {
      setError('Enter the device token from your Infallible dashboard.')
      return
    }
    setLoading(true)
    try {
      const deviceInfo = await collectDeviceInfo()

      // Verify token exists and update device info
      const res = await axios.put(
        `${serverUrl}/api/devices/by-token`,
        {
          deviceToken: token.trim(),
          ...deviceInfo,
        },
        { timeout: 8000 }
      )

      if (!res.data.success) throw new Error(res.data.error || 'Invalid token')

      await useStore.getState().setRegistered({
        deviceToken: token.trim(),
        deviceId: res.data.device.id,
        serverUrl,
      })

      setStep(2)
    } catch (err) {
      const msg = err.response?.data?.error || err.message
      setError(msg.includes('Network') ? 'Connection failed. Check your server URL.' : `Token error: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: Request permissions ──────────────────────────────
  const handlePermissions = async () => {
    setLoading(true)
    try {
      // Location (foreground first, then background)
      const { status: fg } = await Location.requestForegroundPermissionsAsync()
      if (fg !== 'granted') {
        Alert.alert('Location Required', 'Infallible needs location access to protect your device.', [{ text: 'OK' }])
        setLoading(false)
        return
      }
      await Location.requestBackgroundPermissionsAsync()

      // Notifications
      if (Device.isDevice) {
        const { status } = await Notifications.requestPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert('Notifications', 'Enable notifications to receive theft alerts and commands.', [{ text: 'OK' }])
        }
      }

      // Start background tracking
      await startTracking('balanced')

      setStep(3)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Progress bar */}
      <View style={styles.progressRow}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.progressDot, i <= step && styles.progressDotActive, i < step && styles.progressDotDone]} />
        ))}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* ── STEP 0: Server ── */}
          {step === 0 && (
            <StepContainer
              icon="🌐"
              title="Connect to your server"
              subtitle="Enter the IP address of the machine running the Infallible server."
            >
              <Field
                label="Server URL"
                value={serverUrl}
                onChangeText={setServerUrl}
                placeholder="http://192.168.x.x:3000"
                autoCapitalize="none"
                keyboardType="url"
              />
              <Hint text="💡 On Windows: run ipconfig in terminal to find your IP address." />
              {error ? <ErrorBanner text={error} /> : null}
              <PrimaryButton title="Check Connection" onPress={handleServerCheck} loading={loading} />
            </StepContainer>
          )}

          {/* ── STEP 1: Token ── */}
          {step === 1 && (
            <StepContainer
              icon="🔑"
              title="Enter your device token"
              subtitle="Paste the token from your Infallible dashboard after registering this device."
            >
              <Field
                label="Device Token"
                value={token}
                onChangeText={setToken}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                autoCapitalize="none"
                autoCorrect={false}
                mono
              />
              <Hint text="💡 Find this in Dashboard → Add Device → Device Token." />
              {error ? <ErrorBanner text={error} /> : null}
              <PrimaryButton title="Verify Token" onPress={handleTokenSubmit} loading={loading} />
              <SecondaryButton title="← Back" onPress={() => setStep(0)} />
            </StepContainer>
          )}

          {/* ── STEP 2: Permissions ── */}
          {step === 2 && (
            <StepContainer
              icon="🛡️"
              title="Grant permissions"
              subtitle="Infallible needs these permissions to protect your device."
            >
              {[
                { icon: '📍', title: 'Background Location', desc: 'Track device position even when screen is off.' },
                { icon: '🔔', title: 'Notifications', desc: 'Receive theft alerts and remote commands.' },
                { icon: '📷', title: 'Camera', desc: 'Photograph unauthorised access attempts.' },
              ].map(p => (
                <View key={p.title} style={styles.permRow}>
                  <Text style={styles.permIcon}>{p.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.permTitle}>{p.title}</Text>
                    <Text style={styles.permDesc}>{p.desc}</Text>
                  </View>
                </View>
              ))}
              {error ? <ErrorBanner text={error} /> : null}
              <PrimaryButton title="Grant Permissions & Activate" onPress={handlePermissions} loading={loading} />
            </StepContainer>
          )}

          {/* ── STEP 3: Done ── */}
          {step === 3 && (
            <StepContainer
              icon="✅"
              title="You're protected."
              subtitle="Infallible is running silently in the background. Your device is now being monitored."
            >
              {[
                '📍 GPS reporting every 60 seconds',
                '🔔 Push commands are active',
                '📷 Camera ready for unauthorised access',
                '🛡️ Stealth mode is off — enable from dashboard',
              ].map(item => (
                <View key={item} style={styles.doneRow}>
                  <View style={styles.checkDot} />
                  <Text style={styles.doneText}>{item}</Text>
                </View>
              ))}
              <View style={styles.spacer} />
              <PrimaryButton
                title="Open Dashboard →"
                onPress={() => useStore.setState({ isRegistered: true })}
              />
            </StepContainer>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

/* ── Sub-components ────────────────────────────────────────────── */
function StepContainer({ icon, title, subtitle, children }) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepIcon}>{icon}</Text>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepSub}>{subtitle}</Text>
      <View style={styles.stepBody}>{children}</View>
    </View>
  )
}

function Field({ label, mono, ...props }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, mono && styles.inputMono]}
        placeholderTextColor={C.sub}
        selectionColor={C.primary}
        {...props}
      />
    </View>
  )
}

function Hint({ text }) {
  return <Text style={styles.hint}>{text}</Text>
}

function ErrorBanner({ text }) {
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorText}>⚠️  {text}</Text>
    </View>
  )
}

function PrimaryButton({ title, onPress, loading }) {
  return (
    <TouchableOpacity style={styles.btnPrimary} onPress={onPress} activeOpacity={0.82} disabled={loading}>
      {loading
        ? <ActivityIndicator color="#fff" size="small" />
        : <Text style={styles.btnPrimaryText}>{title}</Text>}
    </TouchableOpacity>
  )
}

function SecondaryButton({ title, onPress }) {
  return (
    <TouchableOpacity style={styles.btnSecondary} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.btnSecondaryText}>{title}</Text>
    </TouchableOpacity>
  )
}

/* ── Styles ────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 48, paddingTop: 24 },

  progressRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 4 },
  progressDot: { flex: 1, height: 3, borderRadius: 99, backgroundColor: C.muted },
  progressDotActive: { backgroundColor: C.primary },
  progressDotDone: { backgroundColor: '#4f46e5' },

  stepContainer: { flex: 1, paddingTop: 40 },
  stepIcon: { fontSize: 40, marginBottom: 16 },
  stepTitle: { fontSize: 28, fontWeight: '700', color: C.text, letterSpacing: -0.5, marginBottom: 10 },
  stepSub: { fontSize: 15, color: C.sub, lineHeight: 22, marginBottom: 36 },
  stepBody: { gap: 14 },

  fieldWrap: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: '#a1a1aa', letterSpacing: 0.1 },
  input: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: C.text,
    fontSize: 15,
  },
  inputMono: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 13 },

  hint: { fontSize: 12, color: C.sub, lineHeight: 18 },

  errorBanner: {
    backgroundColor: 'rgba(244,63,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.25)',
    borderRadius: 12,
    padding: 14,
  },
  errorText: { color: '#fda4af', fontSize: 13, lineHeight: 20 },

  btnPrimary: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.1 },

  btnSecondary: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  btnSecondaryText: { color: C.sub, fontSize: 14, fontWeight: '500' },

  permRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 16,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  permIcon: { fontSize: 22, marginTop: 1 },
  permTitle: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 3 },
  permDesc: { fontSize: 12, color: C.sub, lineHeight: 17 },

  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  checkDot: { width: 8, height: 8, borderRadius: 99, backgroundColor: C.success },
  doneText: { fontSize: 14, color: '#a1a1aa' },
  spacer: { height: 24 },
})
