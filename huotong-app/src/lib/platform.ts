import { Capacitor } from '@capacitor/core'

const envFlagEnabled = (value: string | undefined, defaultValue = true): boolean => {
  if (value === undefined || value === '') return defaultValue
  return value.toLowerCase() !== 'false'
}

export interface PlatformFeatureConfig {
  isNative: boolean
  androidFirstReleaseMode: boolean
  realtimeEnabled: boolean
  receiptRecognitionEnabled: boolean
  webExportDownloadEnabled: boolean
  desktopBatchImportEnabled: boolean
  featureTips: {
    receiptRecognition: string
    exportDownload: string
    batchImport: string
  }
}

interface PlatformEnv {
  VITE_ANDROID_FIRST_RELEASE_MODE?: string
  VITE_REALTIME_ENABLED?: string
  VITE_RECEIPT_RECOGNITION_ENABLED?: string
  VITE_WEB_EXPORT_DOWNLOAD_ENABLED?: string
  VITE_DESKTOP_BATCH_IMPORT_ENABLED?: string
}

export function resolvePlatformConfig(
  env: PlatformEnv,
  isNative: boolean
): PlatformFeatureConfig {
  const androidFirstReleaseMode = isNative && envFlagEnabled(env.VITE_ANDROID_FIRST_RELEASE_MODE, true)
  const defaultEnhancedFeatureEnabled = !androidFirstReleaseMode

  return {
    isNative,
    androidFirstReleaseMode,
    realtimeEnabled: envFlagEnabled(env.VITE_REALTIME_ENABLED, defaultEnhancedFeatureEnabled),
    receiptRecognitionEnabled: envFlagEnabled(
      env.VITE_RECEIPT_RECOGNITION_ENABLED,
      defaultEnhancedFeatureEnabled
    ),
    webExportDownloadEnabled: envFlagEnabled(
      env.VITE_WEB_EXPORT_DOWNLOAD_ENABLED,
      defaultEnhancedFeatureEnabled
    ),
    desktopBatchImportEnabled: envFlagEnabled(
      env.VITE_DESKTOP_BATCH_IMPORT_ENABLED,
      defaultEnhancedFeatureEnabled
    ),
    featureTips: {
      receiptRecognition: 'Android 首版暂不开放拍照识别，请先手动录入',
      exportDownload: 'Android 首版暂不开放导出下载，请先使用核心业务功能',
      batchImport: 'Android 首版暂不开放批量录入，请使用新增商品逐条录入',
    },
  }
}

export const platformConfig = {
  ...resolvePlatformConfig(import.meta.env, Capacitor.isNativePlatform()),
}
