import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'

type ResumeListener = () => void | Promise<void>

const listeners = new Set<ResumeListener>()
const DEDUPE_MS = 300
let initialized = false
let removeVisibilityListener: (() => void) | null = null
let removeNativeListener: (() => void) | null = null
let lastResumeAt = 0

function notifyResume(): void {
  const now = Date.now()
  if (now - lastResumeAt < DEDUPE_MS) return
  lastResumeAt = now

  listeners.forEach((listener) => {
    void Promise.resolve()
      .then(() => listener())
      .catch((error) => {
      console.warn('[appLifecycle] resume listener failed', error)
      })
  })
}

function ensureInitialized(): void {
  if (initialized) return
  initialized = true

  if (typeof document !== 'undefined') {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        notifyResume()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    removeVisibilityListener = () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }

  if (Capacitor.isNativePlatform()) {
    void CapacitorApp.addListener('resume', () => {
      notifyResume()
    }).then((handle) => {
      removeNativeListener = () => {
        void handle.remove()
      }
    }).catch((error) => {
      // Keep web fallback even if native listener is unavailable.
      console.warn('[appLifecycle] failed to register native resume listener', error)
    })
  }
}

export function onAppResume(listener: ResumeListener): () => void {
  ensureInitialized()
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function __resetAppLifecycleForTests(): void {
  listeners.clear()
  if (removeVisibilityListener) {
    removeVisibilityListener()
    removeVisibilityListener = null
  }
  if (removeNativeListener) {
    removeNativeListener()
    removeNativeListener = null
  }
  initialized = false
  lastResumeAt = 0
}
