import { effectScope } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock, subscribeTableMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  subscribeTableMock: vi.fn(() => () => {}),
}))

vi.mock('../../src/lib/realtime', () => ({
  subscribeTable: subscribeTableMock,
}))

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}))

import { useProducts } from '../../src/composables/useProducts'

describe('useProducts 网络自动重试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('商品列表首屏加载遇到网络错误时会自动重试 1 次', async () => {
    let attempts = 0
    fromMock.mockImplementation((table: string) => {
      if (table !== 'products') throw new Error(`unexpected table: ${table}`)
      const query = {
        select: vi.fn(() => query),
        order: vi.fn(async () => {
          attempts += 1
          if (attempts === 1) {
            throw new Error('Failed to fetch')
          }
          return {
            data: [
              {
                id: 'p-1',
                name: '苹果',
                spec: '500g',
                sell_price: 10,
                buy_price: 6,
                stock: 5,
                created_at: '',
                updated_at: '',
              },
            ],
            error: null,
          }
        }),
      }
      return query
    })

    const scope = effectScope()
    const api = scope.run(() => useProducts())!

    const result = await api.fetchAll()

    expect(attempts).toBe(2)
    expect(result).toHaveLength(1)
    expect(api.products.value[0]?.name).toBe('苹果')
    scope.stop()
  })
})
