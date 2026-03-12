import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

const UNKNOWN_VERSION = '未知版本'
const DEFAULT_BUILD = '-'
const DEFAULT_TIMEOUT_MS = 1500

export interface AppVersionInfo {
  version: string
  build: string
  label: string
  source: 'native' | 'web' | 'fallback'
}

function formatVersionLabel(version: string, build: string): string {
  if (build === DEFAULT_BUILD || build === version) return version
  return `${version} (build ${build})`
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('App.getInfo timeout')), timeoutMs)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })
}

export async function getAppVersionInfo(timeoutMs = DEFAULT_TIMEOUT_MS): Promise<AppVersionInfo> {
  if (!Capacitor.isNativePlatform()) {
    return {
      version: 'Web',
      build: DEFAULT_BUILD,
      label: 'Web',
      source: 'web',
    }
  }

  try {
    const appInfo = await withTimeout(CapacitorApp.getInfo(), timeoutMs)
    const version = appInfo.version || UNKNOWN_VERSION
    const build = appInfo.build || DEFAULT_BUILD
    return {
      version,
      build,
      label: formatVersionLabel(version, build),
      source: 'native',
    }
  } catch (error) {
    console.warn('[appInfo] failed to load app version info', error)
    return {
      version: UNKNOWN_VERSION,
      build: DEFAULT_BUILD,
      label: UNKNOWN_VERSION,
      source: 'fallback',
    }
  }
}
