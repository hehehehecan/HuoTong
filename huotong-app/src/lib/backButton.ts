import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { closeDialog } from 'vant'

type MaybePromise<T> = T | Promise<T>

export type BackButtonHandler = () => MaybePromise<boolean>

interface RegisteredHandler {
  id: number
  priority: number
  handler: BackButtonHandler
}

export interface BackButtonFallbackOptions {
  canNavigateBack: () => boolean
  navigateBack: () => MaybePromise<void>
  isExitRoute: () => boolean
  goHome: () => MaybePromise<void>
  confirmExit: () => MaybePromise<boolean>
}

const handlers: RegisteredHandler[] = []
let nextId = 1
let initialized = false
let removeNativeListener: (() => void) | null = null
let fallbackOptions: BackButtonFallbackOptions | null = null

const inAppBackTargets: Array<[RegExp, string]> = [
  [/^\/products\/new$/, '/products'],
  [/^\/products\/[^/]+$/, '/products'],
  [/^\/customers\/new$/, '/customers'],
  [/^\/customers\/[^/]+$/, '/customers'],
  [/^\/suppliers\/new$/, '/suppliers'],
  [/^\/suppliers\/[^/]+$/, '/suppliers'],
  [/^\/sale-orders\/new$/, '/sale-orders'],
  [/^\/sale-orders\/[^/]+$/, '/sale-orders'],
  [/^\/purchase-orders\/new$/, '/purchase-orders'],
  [/^\/purchase-orders\/[^/]+$/, '/purchase-orders'],
]

function sortHandlers(): void {
  handlers.sort((a, b) => b.priority - a.priority || b.id - a.id)
}

async function runFallback(): Promise<boolean> {
  if (!fallbackOptions) return false

  if (fallbackOptions.isExitRoute()) {
    return fallbackOptions.confirmExit()
  }

  if (fallbackOptions.canNavigateBack()) {
    await fallbackOptions.navigateBack()
    return true
  }

  await fallbackOptions.goHome()
  return true
}

async function handleBackButton(): Promise<void> {
  for (const item of handlers) {
    try {
      const handled = await item.handler()
      if (handled) return
    } catch (error) {
      console.warn('[backButton] handler failed', error)
    }
  }

  await runFallback()
}

function ensureInitialized(): void {
  if (initialized || !Capacitor.isNativePlatform()) return
  initialized = true

  void CapacitorApp.addListener('backButton', () => {
    void handleBackButton()
  }).then((listener) => {
    removeNativeListener = () => {
      void listener.remove()
    }
  }).catch((error) => {
    console.warn('[backButton] failed to register native listener', error)
  })
}

export function configureBackButtonFallback(options: BackButtonFallbackOptions): void {
  fallbackOptions = options
  ensureInitialized()
}

export function registerBackButtonHandler(handler: BackButtonHandler, priority = 100): () => void {
  ensureInitialized()
  const id = nextId++
  handlers.push({ id, priority, handler })
  sortHandlers()

  return () => {
    const index = handlers.findIndex((item) => item.id === id)
    if (index >= 0) handlers.splice(index, 1)
  }
}

export function resolveInAppBackTarget(path: string): string | null {
  for (const [pattern, target] of inAppBackTargets) {
    if (pattern.test(path)) {
      return target
    }
  }
  return null
}

export function closeActiveDialog(close: () => void = closeDialog): boolean {
  if (typeof document === 'undefined') return false
  if (!document.querySelector('.van-dialog')) return false
  close()
  return true
}

export async function __dispatchBackButtonForTests(): Promise<void> {
  await handleBackButton()
}

export function __resetBackButtonForTests(): void {
  handlers.splice(0, handlers.length)
  fallbackOptions = null
  nextId = 1
  if (removeNativeListener) {
    removeNativeListener()
    removeNativeListener = null
  }
  initialized = false
}
