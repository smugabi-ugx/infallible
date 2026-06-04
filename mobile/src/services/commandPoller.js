import * as SecureStore from 'expo-secure-store'
import axios from 'axios'
import { handleCommand } from './commandHandler'

let pollInterval = null

export async function startCommandPoller() {
  if (pollInterval) return
  pollInterval = setInterval(async () => {
    try {
      const deviceToken = await SecureStore.getItemAsync('deviceToken')
      const serverUrl   = await SecureStore.getItemAsync('serverUrl')
      if (!deviceToken || !serverUrl) return

      const res = await axios.get(
        `${serverUrl}/api/commands/pending/${deviceToken}`,
        { timeout: 8_000 }
      )
      const commands = res.data?.commands ?? []
      for (const cmd of commands) {
        await handleCommand({ type: cmd.type, commandId: cmd.id, payload: cmd.payload || {} })
      }
    } catch (err) {
      // 401 = stale token — device re-registered with a new token
      // Log only, don't crash the interval
      if (err.response?.status === 401) {
        console.warn('[Poller] Token rejected by server — device may need re-registration')
      }
    }
  }, 15_000)
  console.log('[Poller] Command polling started (15s interval)')
}

export function stopCommandPoller() {
  if (pollInterval) { clearInterval(pollInterval); pollInterval = null }
}
