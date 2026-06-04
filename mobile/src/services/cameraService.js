/**
 * Shared camera ref — set by HomeScreen, used by commandHandler + theftMode
 */
let _ref = null

export const setCameraRef = (ref) => { _ref = ref }
export const getCameraRef = () => _ref

export async function capturePhoto({ quality = 0.5, trigger = 'remote' } = {}) {
  if (!_ref) throw new Error('Camera not mounted — open the app')
  const photo = await _ref.takePictureAsync({
    quality,
    base64:         true,
    skipProcessing: true,
    flashMode:      'off',
  })
  return photo
}
