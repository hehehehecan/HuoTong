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

import {
  __dispatchBackButtonForTests,
  __resetBackButtonForTests,
  closeActiveDialog,
  configureBackButtonFallback,
  registerBackButtonHandler,
  resolveInAppBackTarget,
} from '../../src/lib/backButton'

describe('backButton service', () => {
  beforeEach(() => {
    __resetBackButtonForTests()
    vi.clearAllMocks()
    isNativePlatformMock.mockReturnValue(false)
  })

  it('优先关闭弹层处理器', async () => {
    const closePopup = vi.fn().mockReturnValue(true)
    const navigateBack = vi.fn()

    registerBackButtonHandler(closePopup, 300)
    configureBackButtonFallback({
      canNavigateBack: () => true,
      navigateBack,
      isExitRoute: () => false,
      goHome: vi.fn(),
      confirmExit: vi.fn().mockResolvedValue(true),
    })

    await __dispatchBackButtonForTests()

    expect(closePopup).toHaveBeenCalledTimes(1)
    expect(navigateBack).not.toHaveBeenCalled()
  })

  it('无弹层时回退路由', async () => {
    const navigateBack = vi.fn()
    const goHome = vi.fn()

    configureBackButtonFallback({
      canNavigateBack: () => true,
      navigateBack,
      isExitRoute: () => false,
      goHome,
      confirmExit: vi.fn().mockResolvedValue(true),
    })

    await __dispatchBackButtonForTests()

    expect(navigateBack).toHaveBeenCalledTimes(1)
    expect(goHome).not.toHaveBeenCalled()
  })

  it('位于首页时走退出确认分支', async () => {
    const confirmExit = vi.fn().mockResolvedValue(true)
    const navigateBack = vi.fn()

    configureBackButtonFallback({
      canNavigateBack: () => true,
      navigateBack,
      isExitRoute: () => true,
      goHome: vi.fn(),
      confirmExit,
    })

    await __dispatchBackButtonForTests()

    expect(confirmExit).toHaveBeenCalledTimes(1)
    expect(navigateBack).not.toHaveBeenCalled()
  })

  it('为二级页面解析稳定的应用内返回目标', () => {
    expect(resolveInAppBackTarget('/sale-orders/123')).toBe('/sale-orders')
    expect(resolveInAppBackTarget('/purchase-orders/new')).toBe('/purchase-orders')
    expect(resolveInAppBackTarget('/products')).toBeNull()
  })

  it('检测到 Vant Dialog 时优先关闭弹层', () => {
    document.body.innerHTML = '<div class="van-dialog"></div>'
    const close = vi.fn()

    const handled = closeActiveDialog(close)

    expect(handled).toBe(true)
    expect(close).toHaveBeenCalledTimes(1)

    document.body.innerHTML = ''
  })
})
