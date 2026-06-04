import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Alert, Modal, Image,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import axios from 'axios'
import { useStore } from '../store/useStore'
import { collectDeviceInfo } from '../services/deviceInfo'
import { startTracking } from '../services/locationTask'
import { SERVER_URL } from '../config'

const C = {
  bg: '#030712', card: '#0f172a', border: 'rgba(255,255,255,0.07)',
  primary: '#6366f1', text: '#ffffff', sub: '#71717a',
  muted: '#27272a', success: '#10b981', danger: '#f43f5e',
}

// Steps: 0=Welcome, 1=Token, 2=Permissions, 3=Done
const STEPS = ['Welcome', 'Token', 'Permissions', 'Done']

export default function OnboardingScreen() {
  const [step, setStep]             = useState(0)
  const [token, setToken]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [pendingReg, setPendingReg] = useState(null)
  const [scanning, setScanning]     = useState(false)

  // ── Step 1: Verify token ─────────────────────────────────────
  const handleTokenSubmit = async () => {
    setError('')
    if (!token.trim() || token.trim().length < 10) {
      setError('Enter or scan the device token from your dashboard.')
      return
    }
    setLoading(true)
    try {
      const deviceInfo = await collectDeviceInfo()
      const res = await axios.put(
        `${SERVER_URL}/api/devices/by-token`,
        { deviceToken: token.trim(), ...deviceInfo },
        { timeout: 10000 }
      )
      if (!res.data.success) throw new Error(res.data.error || 'Invalid token')
      setPendingReg({
        deviceToken: token.trim(),
        deviceId:    String(res.data.device.id),
        serverUrl:   SERVER_URL,
      })
      setStep(2)
    } catch (err) {
      const msg = err.response?.data?.error || err.message
      setError(msg.includes('Network') ? 'Cannot reach server. Check your connection.' : `Error: ${msg}`)
    } finally { setLoading(false) }
  }

  // ── QR scanner ───────────────────────────────────────────────
  const openScanner = async () => {
    try {
      const Camera = require('expo-camera')
      const { status } = await Camera.Camera.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Camera needed', 'Allow camera access to scan the QR code.')
        return
      }
      setScanning(true)
    } catch { Alert.alert('Camera unavailable', 'Enter the token manually instead.') }
  }

  const handleBarcode = ({ data }) => {
    setScanning(false)
    if (data) { setToken(data); setError('') }
  }

  // ── Step 2: Permissions ──────────────────────────────────────
  const handlePermissions = async () => {
    setLoading(true)
    try {
      const Location = require('expo-location')
      const { status: fg } = await Location.requestForegroundPermissionsAsync()
      if (fg !== 'granted') {
        Alert.alert('Location Required', 'Infallible needs location access to protect your device.')
        setLoading(false)
        return
      }
      await Location.requestBackgroundPermissionsAsync().catch(() => {})
      try { await require('expo-notifications').requestPermissionsAsync() } catch {}
      // Camera permission — needed for silent photo capture on remote command
      try {
        const { Camera } = require('expo-camera')
        await Camera.requestCameraPermissionsAsync()
      } catch {}
      await startTracking('balanced')
      setStep(3)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  // ── Step 3: Complete ─────────────────────────────────────────
  const handleFinish = () => {
    if (pendingReg) useStore.getState().setRegistered(pendingReg)
  }

  // ── QR Scanner Modal ─────────────────────────────────────────
  const QRScanner = () => {
    try {
      const { CameraView } = require('expo-camera')
      return (
        <Modal visible={scanning} animationType="slide" onRequestClose={() => setScanning(false)}>
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={handleBarcode}
            />
            <View style={s.scanOverlay}>
              <View style={s.scanFrame} />
              <Text style={s.scanHint}>Point at the QR code shown on the dashboard</Text>
              <TouchableOpacity style={s.scanCancel} onPress={() => setScanning(false)}>
                <Text style={s.scanCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )
    } catch { return null }
  }

  const progressDots = STEPS.slice(1) // show 3 dots for steps 1-3

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <QRScanner />

      {/* ── STEP 0: Welcome landing ── */}
      {step === 0 && (
        <View style={s.welcome}>
          <View style={s.welcomeGlow} />
          <Image
            source={require('../../assets/icon.png')}
            style={s.welcomeIcon}
            resizeMode="cover"
          />
          <Text style={s.welcomeTitle}>Infallible</Text>
          <Text style={s.welcomeSub}>
            Silent device protection.{'\n'}Track. Command. Recover.
          </Text>
          <View style={s.welcomeFeatures}>
            {[
              { icon: '📍', text: 'Live GPS tracking' },
              { icon: '📷', text: 'Thief auto-photographed' },
              { icon: '⚡', text: 'Remote commands' },
            ].map(f => (
              <View key={f.text} style={s.featureRow}>
                <Text style={s.featureIcon}>{f.icon}</Text>
                <Text style={s.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={s.getStartedBtn} onPress={() => setStep(1)} activeOpacity={0.85}>
            <Text style={s.getStartedText}>Get Started →</Text>
          </TouchableOpacity>
          <Text style={s.welcomeNote}>Registered on the web dashboard? Tap to connect your device.</Text>
        </View>
      )}

      {/* ── STEPS 1–3: progress bar + content ── */}
      {step > 0 && (
        <>
          <View style={s.progressRow}>
            {progressDots.map((_, i) => (
              <View key={i} style={[
                s.dot,
                (i + 1) <= step && s.dotActive,
                (i + 1) < step  && s.dotDone,
              ]} />
            ))}
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

              {/* ── STEP 1: Token ── */}
              {step === 1 && (
                <Step icon="🔑" title="Connect your device"
                  sub="Scan the QR code from the Infallible dashboard, or paste the token.">

                  <TouchableOpacity style={s.scanBtn} onPress={openScanner} activeOpacity={0.8}>
                    <Text style={s.scanBtnIcon}>📷</Text>
                    <Text style={s.scanBtnText}>Scan QR Code from Dashboard</Text>
                  </TouchableOpacity>

                  <Text style={s.orDivider}>— or enter manually —</Text>

                  <Label>Device Token</Label>
                  <TextInput style={[s.input, s.mono]} value={token} onChangeText={t => { setToken(t); setError('') }}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" placeholderTextColor={C.sub}
                    autoCapitalize="none" autoCorrect={false} selectionColor={C.primary} />
                  <Hint>💡 Dashboard → Add Device → copy or scan the token.</Hint>
                  {error ? <Err text={error} /> : null}
                  <Btn title="Connect Device" onPress={handleTokenSubmit} loading={loading} />
                  <BtnSec title="← Back" onPress={() => setStep(0)} />
                </Step>
              )}

              {/* ── STEP 2: Permissions ── */}
              {step === 2 && (
                <Step icon="🛡️" title="Grant permissions"
                  sub="Required to protect your device silently in the background.">
                  {[
                    { icon: '📍', t: 'Background Location', d: 'Track device even when screen is off.' },
                    { icon: '🔔', t: 'Notifications',       d: 'Receive theft alerts and commands.' },
                    { icon: '📷', t: 'Camera',              d: 'Photograph unauthorised access attempts.' },
                  ].map(p => (
                    <View key={p.t} style={s.permRow}>
                      <Text style={s.permIcon}>{p.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={s.permTitle}>{p.t}</Text>
                        <Text style={s.permDesc}>{p.d}</Text>
                      </View>
                    </View>
                  ))}
                  {error ? <Err text={error} /> : null}
                  <Btn title="Grant Permissions & Activate" onPress={handlePermissions} loading={loading} />
                </Step>
              )}

              {/* ── STEP 3: Done ── */}
              {step === 3 && (
                <Step icon="✅" title="You're protected."
                  sub="Infallible is now running silently in the background.">
                  {[
                    '📍 GPS reporting every 60 seconds',
                    '⚡ Commands delivered via Socket.io',
                    '📷 Camera ready for unauthorised access',
                    '🛡️ Stealth mode — enable from dashboard',
                  ].map(t => (
                    <View key={t} style={s.doneRow}>
                      <View style={s.dot2} />
                      <Text style={s.doneText}>{t}</Text>
                    </View>
                  ))}
                  <View style={{ height: 32 }} />
                  <Btn title="Open Dashboard →" onPress={handleFinish} />
                </Step>
              )}

            </ScrollView>
          </KeyboardAvoidingView>
        </>
      )}
    </View>
  )
}

// ── Sub-components ────────────────────────────────────────────
function Step({ icon, title, sub, children }) {
  return (
    <View style={s.step}>
      <Text style={s.stepIcon}>{icon}</Text>
      <Text style={s.stepTitle}>{title}</Text>
      <Text style={s.stepSub}>{sub}</Text>
      <View style={s.stepBody}>{children}</View>
    </View>
  )
}
function Label({ children }) { return <Text style={s.label}>{children}</Text> }
function Hint({ children })  { return <Text style={s.hint}>{children}</Text> }
function Err({ text })       { return <View style={s.errBox}><Text style={s.errText}>⚠️  {text}</Text></View> }
function Btn({ title, onPress, loading }) {
  return (
    <TouchableOpacity style={s.btn} onPress={onPress} activeOpacity={0.82} disabled={loading}>
      {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnText}>{title}</Text>}
    </TouchableOpacity>
  )
}
function BtnSec({ title, onPress }) {
  return (
    <TouchableOpacity style={s.btnSec} onPress={onPress} activeOpacity={0.8}>
      <Text style={s.btnSecText}>{title}</Text>
    </TouchableOpacity>
  )
}

// ── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 48, paddingTop: 24 },

  // Welcome screen
  welcome: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 40 },
  welcomeGlow: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(99,102,241,0.08)', top: '15%',
  },
  welcomeIcon:  { width: 96, height: 96, borderRadius: 24, marginBottom: 20 },
  welcomeTitle: { fontSize: 42, fontWeight: '800', color: C.text, letterSpacing: -1, marginBottom: 12 },
  welcomeSub:   { fontSize: 16, color: C.sub, textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  welcomeFeatures: { gap: 14, alignSelf: 'stretch', marginBottom: 40 },
  featureRow:   { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIcon:  { fontSize: 22, width: 36, textAlign: 'center' },
  featureText:  { fontSize: 15, color: '#a1a1aa', fontWeight: '500' },
  getStartedBtn: {
    backgroundColor: C.primary, borderRadius: 16, paddingVertical: 18,
    paddingHorizontal: 48, alignSelf: 'stretch', alignItems: 'center',
    marginBottom: 16, elevation: 12,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16,
  },
  getStartedText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
  welcomeNote:    { fontSize: 12, color: C.muted, textAlign: 'center', lineHeight: 18 },

  // Progress
  progressRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 4 },
  dot:         { flex: 1, height: 3, borderRadius: 99, backgroundColor: C.muted },
  dotActive:   { backgroundColor: C.primary },
  dotDone:     { backgroundColor: '#4f46e5' },

  // Steps
  step:     { flex: 1, paddingTop: 36 },
  stepIcon:  { fontSize: 38, marginBottom: 14 },
  stepTitle: { fontSize: 26, fontWeight: '700', color: C.text, marginBottom: 8 },
  stepSub:   { fontSize: 14, color: C.sub, lineHeight: 21, marginBottom: 32 },
  stepBody:  { gap: 14 },
  label:     { fontSize: 13, fontWeight: '500', color: '#a1a1aa' },
  input:     { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: C.text, fontSize: 15 },
  mono:      { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 13 },
  hint:      { fontSize: 12, color: C.sub },
  errBox:    { backgroundColor: 'rgba(244,63,94,0.1)', borderWidth: 1, borderColor: 'rgba(244,63,94,0.25)', borderRadius: 12, padding: 14 },
  errText:   { color: '#fda4af', fontSize: 13, lineHeight: 20 },
  btn:       { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', minHeight: 52, elevation: 8 },
  btnText:   { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnSec:    { borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  btnSecText:{ color: C.sub, fontSize: 14, fontWeight: '500' },

  // Permissions
  permRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 16, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border },
  permIcon:  { fontSize: 22, marginTop: 1 },
  permTitle: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 3 },
  permDesc:  { fontSize: 12, color: C.sub, lineHeight: 17 },

  // Done
  doneRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  dot2:      { width: 8, height: 8, borderRadius: 99, backgroundColor: C.success },
  doneText:  { fontSize: 14, color: '#a1a1aa' },

  // QR scanner
  scanBtn:       { backgroundColor: '#1e1b4b', borderWidth: 1.5, borderColor: C.primary, borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  scanBtnIcon:   { fontSize: 20 },
  scanBtnText:   { color: C.primary, fontSize: 15, fontWeight: '600' },
  orDivider:     { textAlign: 'center', color: C.sub, fontSize: 12, marginVertical: 4 },
  scanOverlay:   { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 20 },
  scanFrame:     { width: 240, height: 240, borderWidth: 2, borderColor: C.primary, borderRadius: 16 },
  scanHint:      { color: '#fff', fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  scanCancel:    { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  scanCancelText:{ color: '#fff', fontSize: 15, fontWeight: '600' },
})
