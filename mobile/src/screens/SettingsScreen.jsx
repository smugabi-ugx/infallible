import React, { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Switch,
  ScrollView, Alert, Platform,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as SecureStore from 'expo-secure-store'
import { useStore } from '../store/useStore'
import { startTracking, stopTracking, isTracking, INTERVALS } from '../services/locationTask'

const C = {
  bg: '#030712', card: '#0b1120', border: 'rgba(255,255,255,0.06)',
  primary: '#6366f1', danger: '#f43f5e', success: '#10b981',
  text: '#ffffff', sub: '#71717a', dim: '#3f3f46',
}

const TRACKING_OPTIONS = [
  { key: 'high',     label: 'High',     desc: 'Every 10 seconds — theft mode', interval: '10s'  },
  { key: 'balanced', label: 'Balanced', desc: 'Every 60 seconds — recommended', interval: '60s'  },
  { key: 'low',      label: 'Low',      desc: 'Every 5 minutes — battery saver', interval: '5m'  },
  { key: 'off',      label: 'Off',      desc: 'No background tracking', interval: '—'   },
]

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { trackingMode, isStealthMode, serverUrl, clearRegistration, updateStatus } = useStore()
  const [activeMode, setActiveMode] = useState(trackingMode)
  const [stealthEnabled, setStealthEnabled] = useState(isStealthMode)
  const [tracking, setTracking] = useState(false)

  useEffect(() => {
    isTracking().then(setTracking)
  }, [])

  const handleTrackingChange = async (mode) => {
    setActiveMode(mode)
    if (mode === 'off') {
      await stopTracking()
      setTracking(false)
    } else {
      await startTracking(mode)
      setTracking(true)
    }
    updateStatus({ trackingMode: mode })
    await SecureStore.setItemAsync('trackingMode', mode)
  }

  const handleStealthToggle = async (val) => {
    setStealthEnabled(val)
    updateStatus({ isStealthMode: val })
    await SecureStore.setItemAsync('stealthMode', val ? 'true' : 'false')
  }

  const handleSignOut = () => {
    Alert.alert(
      'Remove Device',
      'This will unlink this device from your Infallible account. Location tracking will stop.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove & Sign Out', style: 'destructive',
          onPress: async () => {
            await stopTracking()
            await clearRegistration()
          },
        },
      ]
    )
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Server info */}
        <Section label="CONNECTION">
          <InfoRow label="Server" value={serverUrl || '—'} mono />
          <InfoRow label="Status" value={tracking ? 'Active' : 'Inactive'} valueColor={tracking ? C.success : C.dim} />
        </Section>

        {/* Tracking frequency */}
        <Section label="TRACKING FREQUENCY">
          {TRACKING_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.optionRow, activeMode === opt.key && styles.optionRowActive]}
              onPress={() => handleTrackingChange(opt.key)}
              activeOpacity={0.75}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.optionLabel}>{opt.label}</Text>
                <Text style={styles.optionDesc}>{opt.desc}</Text>
              </View>
              <View style={styles.optionRight}>
                <Text style={styles.intervalBadge}>{opt.interval}</Text>
                <View style={[styles.radioOuter, activeMode === opt.key && styles.radioOuterActive]}>
                  {activeMode === opt.key && <View style={styles.radioInner} />}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </Section>

        {/* Stealth mode */}
        <Section label="PRIVACY">
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Stealth Mode</Text>
              <Text style={styles.switchDesc}>Hide the Infallible app from the app drawer and recent apps.</Text>
            </View>
            <Switch
              value={stealthEnabled}
              onValueChange={handleStealthToggle}
              trackColor={{ false: C.dim, true: C.primary }}
              thumbColor="#fff"
            />
          </View>
        </Section>

        {/* About */}
        <Section label="ABOUT">
          <InfoRow label="App Version" value="1.0.0" />
          <InfoRow label="Agent" value="Infallible Mobile Agent" />
          <InfoRow label="Expo SDK" value="51" />
        </Section>

        {/* Danger zone */}
        <Section label="DANGER ZONE">
          <TouchableOpacity style={styles.dangerBtn} onPress={handleSignOut} activeOpacity={0.8}>
            <Text style={styles.dangerBtnText}>Remove This Device</Text>
          </TouchableOpacity>
        </Section>

      </ScrollView>
    </View>
  )
}

function Section({ label, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  )
}

function InfoRow({ label, value, mono, valueColor }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, mono && styles.infoMono, valueColor && { color: valueColor }]}
        numberOfLines={1} ellipsizeMode="middle">
        {value}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 48, gap: 24, paddingTop: 8 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 22, color: C.sub },
  headerTitle: { fontSize: 17, fontWeight: '600', color: C.text },

  section: { gap: 10 },
  sectionLabel: { fontSize: 10, color: C.sub, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase', paddingLeft: 4 },
  sectionCard: {
    backgroundColor: C.card, borderRadius: 18,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },

  infoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  infoLabel: { fontSize: 14, color: C.sub },
  infoValue: { fontSize: 13, color: C.text, fontWeight: '500', maxWidth: '55%', textAlign: 'right' },
  infoMono:  { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11 },

  optionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  optionRowActive: { backgroundColor: 'rgba(99,102,241,0.06)' },
  optionLabel: { fontSize: 14, color: C.text, fontWeight: '500', marginBottom: 2 },
  optionDesc:  { fontSize: 12, color: C.sub, lineHeight: 17 },
  optionRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  intervalBadge: {
    fontSize: 11, fontWeight: '600', color: C.sub,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99,
  },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: C.dim,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOuterActive: { borderColor: C.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary },

  switchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 16,
  },
  switchLabel: { fontSize: 14, color: C.text, fontWeight: '500', marginBottom: 3 },
  switchDesc:  { fontSize: 12, color: C.sub, lineHeight: 17, maxWidth: '85%' },

  dangerBtn: {
    marginHorizontal: 16, marginVertical: 14,
    paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(244,63,94,0.3)',
    alignItems: 'center',
    backgroundColor: 'rgba(244,63,94,0.08)',
  },
  dangerBtnText: { color: '#f43f5e', fontWeight: '600', fontSize: 14 },
})
