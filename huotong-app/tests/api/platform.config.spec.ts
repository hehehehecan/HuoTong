import { describe, expect, it } from 'vitest'
import { resolvePlatformConfig } from '../../src/lib/platform'

describe('resolvePlatformConfig', () => {
  it('Web 环境默认保留增强能力', () => {
    const config = resolvePlatformConfig({}, false)

    expect(config.androidFirstReleaseMode).toBe(false)
    expect(config.realtimeEnabled).toBe(true)
    expect(config.receiptRecognitionEnabled).toBe(true)
    expect(config.webExportDownloadEnabled).toBe(true)
    expect(config.desktopBatchImportEnabled).toBe(true)
  })

  it('Android 原生环境默认启用首版降级', () => {
    const config = resolvePlatformConfig({}, true)

    expect(config.androidFirstReleaseMode).toBe(true)
    expect(config.realtimeEnabled).toBe(false)
    expect(config.receiptRecognitionEnabled).toBe(false)
    expect(config.webExportDownloadEnabled).toBe(false)
    expect(config.desktopBatchImportEnabled).toBe(false)
  })

  it('可通过环境变量按需覆盖默认降级策略', () => {
    const config = resolvePlatformConfig(
      {
        VITE_ANDROID_FIRST_RELEASE_MODE: 'true',
        VITE_REALTIME_ENABLED: 'true',
        VITE_RECEIPT_RECOGNITION_ENABLED: 'true',
        VITE_WEB_EXPORT_DOWNLOAD_ENABLED: 'true',
        VITE_DESKTOP_BATCH_IMPORT_ENABLED: 'true',
      },
      true
    )

    expect(config.androidFirstReleaseMode).toBe(true)
    expect(config.realtimeEnabled).toBe(true)
    expect(config.receiptRecognitionEnabled).toBe(true)
    expect(config.webExportDownloadEnabled).toBe(true)
    expect(config.desktopBatchImportEnabled).toBe(true)
  })
})
