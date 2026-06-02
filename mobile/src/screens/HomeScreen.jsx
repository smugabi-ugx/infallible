import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  ScrollView, RefreshControl, Platform, Dimensions, Alert,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Location from 'expo-location'
import * as Haptics from 'expo-haptics'
const getBattery = () => require('expo-battery')
const getNetwork  = () => require('expo-network')
import { useStore } from '../store/useStore'
import { apiPost, apiGet } from '../services/api'
import { startTracking, stopTracking, isTracking } from '../services/locationTask'
import { ringAlarm, stopAlarm } from '../services/commandHandler'
import { formatDistanceToNow } from '../utils/time'

const { width } = Dimensions.get('window')

const C = {
  bg:       '#030712',
  card:     '#0b1120',
  border:   'rgba(255,255,255,0.06)',
  primary:  '#6366f1',
  danger:   '#f43f5e',
  success:  '#10b981',
  warning:  '#f59e0b',
  text:     '#ffffff',
  sub:      '#71717a',
  dim:      '#3f3f46',
}

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const {
    deviceId, isStolen, isStealthMode, trackingMode,
    lastLocation, lastSyncAt, batteryLevel,
    updateStatus, setLastLocation, setBattery,
  } = useStore()

  const [refreshing, setRefreshing] = useState(false)
  const [tracking, setTracking] = useState(false)
  const [ringing, setRinging] = useState(false)

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current
  const glowAnim  = useRef(new Animated.Value(0)).current

  useEffect(() => {
    loadStatus()
    startPulse()
    return () => { if (ringing) stopAlarm() }
  }, [])

  useEffect(() => {
    let sub
    try {
      sub = getBattery().addBatteryLevelListener(({ batteryLevel }) => {
        setBattery(Math.round(batteryLevel * 100))
      })
    } catch {}
    return () => { try { sub?.remove() } catch {} }
  }, [])

  function startPulse() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1600, useNativeDriver: true }),
      ])
    ).start()

    if (isStolen) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 900, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0, duration: 900, useNativeDriver: false }),
        ])
      ).start()
    }
  }

  const loadStatus = useCallback(async () => {
    try {
      const [bat, net, tracking_] = await Promise.all([
        getBattery().getBatteryLevelAsync().catch(() => 0),
        getNetwork().getNetworkStateAsync().catch(() => ({ isConnected: false })),
        Promise.resolve(isTracking()),
      ])
      setBattery(Math.round(bat * 100))
      setTracking(tracking_)
      updateStatus({ isOnline: net.isConnected })

      if (deviceId) {
        const res = await apiGet(`/devices/${deviceId}`)
        if (res.data.success) {
          const d = res.data.device
          updateStatus({ isStolen: d.isStolen, trackingMode: d.trackingMode, isStealthMode: d.isStealthMode })
        }
      }
    } catch {}
  }, [deviceId])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadStatus()
    setRefreshing(false)
  }

  const handleRing = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    if (ringing) { await stopAlarm(); setRinging(false) }
    else { await ringAlarm(30_000); setRinging(true); setTimeout(() => setRinging(false), 30_000) }
  }

  const handleMarkStolen = () => {
    Alert.alert(
      'Mark as Stolen?',
      'This will activate high-frequency tracking and stealth mode on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report Stolen',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiPost(`/devices/${deviceId}/stolen`, {})
              await startTracking('high')
              updateStatus({ isStolen: true, trackingMode: 'high' })
              setTracking(true)
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
            } catch (e) {
              Alert.alert('Error', 'Could not activate theft mode. Check your connection.')
            }
          },
        },
      ]
    )
  }

  const handleMarkRecovered = () => {
    Alert.alert(
      'Mark as Recovered?',
      'This will deactivate theft mode and return to normal tracking.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Recovered',
          onPress: async () => {
            try {
              await apiPost(`/devices/${deviceId}/recovered`, {})
              await startTracking('balanced')
              updateStatus({ isStolen: false, trackingMode: 'balanced' })
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            } catch {
              Alert.alert('Error', 'Could not deactivate theft mode.')
            }
          },
        },
      ]
    )
  }

  const statusColor = isStolen ? C.danger : C.success
  const statusLabel = isStolen ? 'THEFT MODE ACTIVE' : 'PROTECTED'
  const statusIcon  = isStolen ? '⚡' : '✓'

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoEmoji}>🛡</Text>
          </View>
          <Text style={styles.logoText}>Infallible</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsBtn}>
          <Text style={styles.settingsIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Status Ring ── */}
        <View style={styles.ringSection}>
          {isStolen && (
            <Animated.View style={[styles.ringGlow, {
              opacity: glowAnim,
              backgroundColor: C.danger,
            }]} />
          )}
          <Animated.View style={[styles.ring, { transform: [{ scale: pulseAnim }], borderColor: statusColor + '33' }]}>
            <View style={[styles.ringInner, { borderColor: statusColor + '66' }]}>
              <View style={[styles.ringCore, { backgroundColor: statusColor + '15' }]}>
                <Text style={[styles.ringIcon, { color: statusColor }]}>{statusIcon}</Text>
                <Text style={[styles.ringLabel, { color: statusColor }]}>{statusLabel}</Text>
                <Text style={styles.ringSub}>
                  {isStolen ? `Tracking every 10s` : `Tracking every 60s`}
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* ── Stats grid ── */}
        <View style={styles.statsGrid}>
          <StatTile icon="🔋" label="Battery" value={batteryLevel != null ? `${batteryLevel}%` : '—'}
            color={batteryLevel != null && batteryLevel <= 15 ? C.danger : batteryLevel != null && batteryLevel <= 30 ? C.warning : C.success} />
          <StatTile icon="📡" label="Mode" value={trackingMode?.toUpperCase() || 'BALANCED'} color={C.primary} />
          <StatTile icon="🕐" label="Last Sync"
            value={lastSyncAt ? formatDistanceToNow(lastSyncAt) : 'Never'} color={C.sub} />
          <StatTile icon="📍" label="GPS"
            value={tracking ? 'Active' : 'Idle'}
            color={tracking ? C.success : C.dim} />
        </View>

        {/* ── Last Location ── */}
        {lastLocation && (
          <View style={styles.locCard}>
            <Text style={styles.locLabel}>LAST KNOWN LOCATION</Text>
            <Text style={styles.locCoords}>
              {lastLocation.latitude.toFixed(6)}, {lastLocation.longitude.toFixed(6)}
            </Text>
            {lastLocation.accuracy && (
              <Text style={styles.locAccuracy}>Accuracy ±{Math.round(lastLocation.accuracy)}m</Text>
            )}
          </View>
        )}

        {/* ── Stolen alert banner ── */}
        {isStolen && (
          <View style={styles.stolenBanner}>
            <View style={styles.stolenDot} />
            <View>
              <Text style={styles.stolenTitle}>Theft mode active</Text>
              <Text style={styles.stolenSub}>High-frequency tracking · Camera ready · Silent alerts sending</Text>
            </View>
          </View>
        )}

        {/* ── Quick Actions ── */}
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
        <View style={styles.actionsGrid}>
          <ActionButton
            icon="🔔"
            label={ringing ? 'Stop Ring' : 'Ring Alarm'}
            onPress={handleRing}
            active={ringing}
            color={C.warning}
          />
          <ActionButton
            icon={isStolen ? '✅' : '🚨'}
            label={isStolen ? 'Mark Recovered' : 'Report Stolen'}
            onPress={isStolen ? handleMarkRecovered : handleMarkStolen}
            color={isStolen ? C.success : C.danger}
            danger={!isStolen}
          />
        </View>

        {/* ── Status Footer ── */}
        <View style={styles.footer}>
          <View style={[styles.footerDot, { backgroundColor: tracking ? C.success : C.dim }]} />
          <Text style={styles.footerText}>
            {tracking ? 'Protection running in background' : 'Background tracking inactive'}
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

function StatTile({ icon, label, value, color }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function ActionButton({ icon, label, onPress, color, danger, active }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.actionBtn,
        danger && styles.actionBtnDanger,
        active && styles.actionBtnActive,
        { borderColor: color + '30' },
      ]}
    >
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 48, gap: 16 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  logoEmoji: { fontSize: 16 },
  logoText: { fontSize: 18, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  settingsBtn: { padding: 8 },
  settingsIcon: { fontSize: 20, color: C.sub },

  // Ring
  ringSection: { alignItems: 'center', paddingVertical: 32, position: 'relative' },
  ringGlow: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    top: 32, alignSelf: 'center', filter: 'blur(40px)', opacity: 0.3,
  },
  ring: {
    width: 200, height: 200, borderRadius: 100,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  ringInner: {
    width: 170, height: 170, borderRadius: 85,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  ringCore: {
    width: 140, height: 140, borderRadius: 70,
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  ringIcon:  { fontSize: 36, marginBottom: 2 },
  ringLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  ringSub:   { fontSize: 11, color: C.sub, marginTop: 2 },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statTile: {
    flex: 1, minWidth: (width - 60) / 2,
    backgroundColor: C.card, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    padding: 16, gap: 4,
  },
  statIcon:  { fontSize: 20, marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  statLabel: { fontSize: 11, color: C.sub, fontWeight: '500', letterSpacing: 0.5, textTransform: 'uppercase' },

  // Location
  locCard: {
    backgroundColor: C.card, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    padding: 16, gap: 4,
  },
  locLabel:    { fontSize: 10, color: C.sub, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  locCoords:   { fontSize: 14, color: C.text, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  locAccuracy: { fontSize: 12, color: C.sub },

  // Stolen banner
  stolenBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(244,63,94,0.1)',
    borderWidth: 1, borderColor: 'rgba(244,63,94,0.2)',
    borderRadius: 16, padding: 16,
  },
  stolenDot:  { width: 10, height: 10, borderRadius: 5, backgroundColor: C.danger },
  stolenTitle: { fontSize: 13, fontWeight: '700', color: '#fda4af' },
  stolenSub:   { fontSize: 11, color: '#fb7185', lineHeight: 17, marginTop: 2 },

  // Actions
  sectionLabel: { fontSize: 10, color: C.sub, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: -4 },
  actionsGrid: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 20, borderRadius: 18,
    backgroundColor: C.card, borderWidth: 1, gap: 8,
  },
  actionBtnDanger: { backgroundColor: 'rgba(244,63,94,0.08)' },
  actionBtnActive: { backgroundColor: 'rgba(245,158,11,0.08)' },
  actionIcon: { fontSize: 28 },
  actionLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },

  // Footer
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  footerDot: { width: 6, height: 6, borderRadius: 3 },
  footerText: { fontSize: 12, color: C.sub },
})
