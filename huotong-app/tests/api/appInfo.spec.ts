import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { isNativePlatformMock, getInfoMock } = vi.hoisted(() => ({
  isNativePlatformMock: vi.fn<() => boolean>(() => false),
  getInfoMock: vi.fn(),
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: isNativePlatformMock,
  },
}))

vi.mock('@capacitor/app', () => ({
  App: {
    getInfo: getInfoMock,
  },
}))

import { getAppVersionInfo } from '../../src/lib/appInfo'

describe('getAppVersionInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isNativePlatformMock.mockReturnValue(false)
    getInfoMock.mockResolvedValue({
      version: '1.0.1',
      build: '2',
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('Web 环境返回稳定降级版本信息', async () => {
    const info = await getAppVersionInfo()

    expect(info.version).toBe('Web')
    expect(info.build).toBe('-')
    expect(info.label).toContain('Web')
    expect(info.source).toBe('web')
    expect(getInfoMock).not.toHaveBeenCalled()
  })

  it('Native 环境返回 App.getInfo 版本信息', async () => {
    isNativePlatformMock.mockReturnValue(true)
    getInfoMock.mockResolvedValue({
      version: '1.2.0',
      build: '7',
    })

    const info = await getAppVersionInfo()

    expect(info.version).toBe('1.2.0')
    expect(info.build).toBe('7')
    expect(info.label).toContain('1.2.0')
    expect(info.label).toContain('7')
    expect(info.source).toBe('native')
  })

  it('Native 读取失败时返回未知版本兜底值', async () => {
    isNativePlatformMock.mockReturnValue(true)
    getInfoMock.mockRejectedValue(new Error('native failed'))

    const info = await getAppVersionInfo()

    expect(info.version).toBe('未知版本')
    expect(info.build).toBe('-')
    expect(info.source).toBe('fallback')
  })

  it('Native 读取超时时返回未知版本兜底值', async () => {
    vi.useFakeTimers()
    isNativePlatformMock.mockReturnValue(true)
    getInfoMock.mockImplementation(() => new Promise(() => {}))

    const infoPromise = getAppVersionInfo(10)
    await vi.advanceTimersByTimeAsync(10)
    const info = await infoPromise

    expect(info.version).toBe('未知版本')
    expect(info.build).toBe('-')
    expect(info.label).toBe('未知版本')
    expect(info.source).toBe('fallback')
  })
})
