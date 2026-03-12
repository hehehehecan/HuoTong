import { beforeEach, describe, expect, it, vi } from 'vitest'

const { isNativePlatformMock, addListenerMock } = vi.hoisted(() => ({
  isNativePlatformMock: vi.fn<() => boolean>(() => false),
  addListenerMock: vi.fn(),
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: isNativePlatformMock,
  },
}))

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: addListenerMock,
  },
}))

import { __resetAppLifecycleForTests, onAppResume } from '../../src/lib/appLifecycle'

async function flushResumeCallbacks() {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

describe('appLifecycle onAppResume', () => {
  beforeEach(() => {
    __resetAppLifecycleForTests()
    vi.clearAllMocks()
    isNativePlatformMock.mockReturnValue(false)
    addListenerMock.mockResolvedValue({
      remove: vi.fn(),
    })
  })

  it('在 Web 可见性恢复时触发回调', async () => {
    let called = 0
    onAppResume(() => {
      called += 1
    })

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    })
    document.dispatchEvent(new Event('visibilitychange'))
    await flushResumeCallbacks()

    expect(called).toBe(1)
  })

  it('在 Native resume 事件时触发回调', async () => {
    isNativePlatformMock.mockReturnValue(true)
    let nativeResumeHandler: (() => void) | null = null
    addListenerMock.mockImplementation((_event: string, callback: () => void) => {
      nativeResumeHandler = callback
      return Promise.resolve({ remove: vi.fn() })
    })

    let called = 0
    onAppResume(() => {
      called += 1
    })

    await Promise.resolve()
    nativeResumeHandler?.()
    await flushResumeCallbacks()

    expect(called).toBe(1)
    expect(addListenerMock).toHaveBeenCalledWith('resume', expect.any(Function))
  })

  it('异步回调失败时记录告警而不抛出未处理异常', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    onAppResume(async () => {
      throw new Error('resume failed')
    })

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    })
    document.dispatchEvent(new Event('visibilitychange'))
    await flushResumeCallbacks()

    expect(warnSpy).toHaveBeenCalledWith(
      '[appLifecycle] resume listener failed',
      expect.any(Error)
    )

    warnSpy.mockRestore()
  })
})
