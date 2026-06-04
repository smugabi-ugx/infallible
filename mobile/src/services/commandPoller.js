/**
 * Command poller — polls server for pending commands every 30s.
 * Uses setInterval (foreground) for v1.0. Background fetch added in v1.1.
 */
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
    } catch {}
  }, 15_000)
  console.log('[Poller] Command polling started (30s interval)')
}

export function stopCommandPoller() {
  if (pollInterval) { clearInterval(pollInterval); pollInterval = null }
}
