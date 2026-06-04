import { View, Image, Text, StyleSheet } from 'react-native'

const LOGO = require('../../assets/icon.png')

/**
 * Infallible brand logo — icon + optional wordmark
 * size: icon size in px (default 40)
 * showName: show "Infallible" text beside the icon (default false)
 * style: extra style for wrapper View
 */
export default function InfallibleLogo({ size = 40, showName = false, style }) {
  return (
    <View style={[styles.row, style]}>
      <Image
        source={LOGO}
        style={{ width: size, height: size, borderRadius: size * 0.22 }}
        resizeMode="cover"
      />
      {showName && (
        <Text style={[styles.name, { fontSize: size * 0.5 }]}>Infallible</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { color: '#ffffff', fontWeight: '800', letterSpacing: -0.5 },
})
