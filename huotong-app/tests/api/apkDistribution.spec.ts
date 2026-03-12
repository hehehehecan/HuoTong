import { describe, expect, it, vi } from 'vitest'

import { getApkUpdateMessage, openApkDownloadEntry } from '../../src/lib/apkDistribution'

describe('apkDistribution', () => {
  it('在下载入口存在时调用 opener 打开链接', () => {
    const opener = vi.fn(() => ({ closed: false } as Window))

    const opened = openApkDownloadEntry(
      {
        latestVersion: '1.0.2',
        downloadUrl: 'https://example.com/huotong.apk',
        releaseNotes: ['优化升级入口'],
        installSteps: ['直接安装新版 APK'],
        troubleshooting: ['确保签名一致'],
      },
      opener
    )

    expect(opened).toBe(true)
    expect(opener).toHaveBeenCalledWith('https://example.com/huotong.apk', '_blank', 'noopener')
  })

  it('在 opener 未真正打开窗口时返回 false', () => {
    const opener = vi.fn(() => null)

    const opened = openApkDownloadEntry(
      {
        latestVersion: '1.0.2',
        downloadUrl: 'https://example.com/huotong.apk',
        releaseNotes: ['优化升级入口'],
        installSteps: ['直接安装新版 APK'],
        troubleshooting: ['确保签名一致'],
      },
      opener
    )

    expect(opened).toBe(false)
    expect(opener).toHaveBeenCalledWith('https://example.com/huotong.apk', '_blank', 'noopener')
  })

  it('在下载入口缺失时返回 false 且不调用 opener', () => {
    const opener = vi.fn()

    const opened = openApkDownloadEntry(
      {
        latestVersion: '1.0.2',
        downloadUrl: '',
        releaseNotes: ['优化升级入口'],
        installSteps: ['直接安装新版 APK'],
        troubleshooting: ['确保签名一致'],
      },
      opener
    )

    expect(opened).toBe(false)
    expect(opener).not.toHaveBeenCalled()
  })

  it('在 opener 抛错时返回 false', () => {
    const opener = vi.fn(() => {
      throw new Error('open failed')
    })

    const opened = openApkDownloadEntry(
      {
        latestVersion: '1.0.2',
        downloadUrl: 'https://example.com/huotong.apk',
        releaseNotes: ['优化升级入口'],
        installSteps: ['直接安装新版 APK'],
        troubleshooting: ['确保签名一致'],
      },
      opener
    )

    expect(opened).toBe(false)
  })

  it('生成更新说明文案，包含版本、安装步骤和排查提示', () => {
    const message = getApkUpdateMessage({
      latestVersion: '1.0.2',
      downloadUrl: 'https://example.com/huotong.apk',
      releaseNotes: ['优化升级入口', '修复安装文案'],
      installSteps: ['下载 APK', '覆盖安装'],
      troubleshooting: ['确认包名一致'],
    })

    expect(message).toContain('推荐版本：1.0.2')
    expect(message).toContain('更新内容：')
    expect(message).toContain('安装步骤：')
    expect(message).toContain('安装失败排查：')
  })
})
