/**
 * Background command poller — fallback for when Socket.io is disconnected.
 * Uses expo-background-fetch to poll pending commands every 30 seconds.
 * This ensures commands are delivered even when the app is fully killed.
 */
import * as BackgroundFetch from 'expo-background-fetch'
import * as TaskManager     from 'expo-task-manager'
import * as SecureStore     from 'expo-secure-store'
import axios                from 'axios'
import { handleCommand }    from './commandHandler'

export const POLL_TASK = 'infallible-command-poll'

TaskManager.defineTask(POLL_TASK, async () => {
  try {
    const deviceToken = await SecureStore.getItemAsync('deviceToken')
    const serverUrl   = await SecureStore.getItemAsync('serverUrl')

    if (!deviceToken || !serverUrl) {
      return BackgroundFetch.BackgroundFetchResult.NoData
    }

    // Fetch pending commands that haven't been acknowledged yet
    const res = await axios.get(
      `${serverUrl}/api/commands/pending/${deviceToken}`,
      { timeout: 8_000 }
    )

    const commands = res.data?.commands ?? []
    if (commands.length === 0) {
      return BackgroundFetch.BackgroundFetchResult.NoData
    }

    console.log(`[Poller] Found ${commands.length} pending command(s)`)

    for (const cmd of commands) {
      try {
        await handleCommand({
          type:      cmd.type,
          commandId: cmd.id,
          payload:   cmd.payload || {},
        })
      } catch (err) {
        console.error('[Poller] Command failed:', err.message)
        // Acknowledge as failed so it doesn't re-queue
        await axios.post(`${serverUrl}/api/commands/ack/${cmd.id}`, {
          deviceToken,
          status: 'failed',
          errorMessage: err.message,
        }, { timeout: 5_000 }).catch(() => {})
      }
    }

    return BackgroundFetch.BackgroundFetchResult.NewData
  } catch (err) {
    console.error('[Poller] Background fetch error:', err.message)
    return BackgroundFetch.BackgroundFetchResult.Failed
  }
})

export async function startCommandPoller() {
  try {
    await BackgroundFetch.registerTaskAsync(POLL_TASK, {
      minimumInterval: 30,       // poll every 30 seconds minimum
      stopOnTerminate:  false,   // keep running after app is killed
      startOnBoot:      true,    // restart after phone reboot
    })
    console.log('[Poller] Background command poller registered')
  } catch (err) {
    console.warn('[Poller] Could not register background fetch:', err.message)
  }
}

export async function stopCommandPoller() {
  try {
    await BackgroundFetch.unregisterTaskAsync(POLL_TASK)
  } catch {}
}
