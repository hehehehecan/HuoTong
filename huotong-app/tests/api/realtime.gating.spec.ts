import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  channelFactoryMock,
  platformConfig,
} = vi.hoisted(() => ({
  channelFactoryMock: vi.fn(),
  platformConfig: {
    realtimeEnabled: true,
  },
}))

type ChangeHandler = () => void
type StatusHandler = (status: string) => void

let handlers: Record<string, ChangeHandler>
let statusHandler: StatusHandler | null

vi.mock('../../src/lib/platform', () => ({
  platformConfig,
}))

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    channel: channelFactoryMock,
  },
}))

import { subscribeTable } from '../../src/lib/realtime'

describe('subscribeTable Android 首版降级', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    platformConfig.realtimeEnabled = true
    handlers = {}
    statusHandler = null

    channelFactoryMock.mockImplementation(() => {
      const channel = {
        on: vi.fn((_event: string, filter: { table: string }, callback: ChangeHandler) => {
          handlers[filter.table] = callback
          return channel
        }),
        subscribe: vi.fn((callback: StatusHandler) => {
          statusHandler = callback
          return channel
        }),
      }
      return channel
    })
  })

  it('降级关闭时返回可安全调用的 no-op 取消函数，且不会建立订阅', () => {
    platformConfig.realtimeEnabled = false
    const onInvalidate = vi.fn()

    const unsubscribe = subscribeTable('products', onInvalidate)

    expect(channelFactoryMock).not.toHaveBeenCalled()
    expect(() => unsubscribe()).not.toThrow()
    expect(onInvalidate).not.toHaveBeenCalled()
  })

  it('启用时仍会建立订阅，并在取消订阅后停止回调', () => {
    const onInvalidate = vi.fn()

    const unsubscribe = subscribeTable('products', onInvalidate)
    handlers.products?.()
    unsubscribe()
    handlers.products?.()

    expect(channelFactoryMock).toHaveBeenCalledWith('business-tables-realtime')
    expect(statusHandler).toEqual(expect.any(Function))
    expect(onInvalidate).toHaveBeenCalledTimes(1)
  })
})
