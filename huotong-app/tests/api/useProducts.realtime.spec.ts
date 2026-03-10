import { effectScope } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock, subscribeTableMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  subscribeTableMock: vi.fn(),
}))

let realtimeCallback: (() => void) | null = null

vi.mock('../../src/lib/realtime', () => ({
  subscribeTable: subscribeTableMock,
}))

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}))

import { useProducts } from '../../src/composables/useProducts'

const allRows = [
  {
    id: 'p-1',
    name: '苹果',
    spec: '500g',
    sell_price: 10,
    buy_price: 6,
    stock: 10,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'p-2',
    name: '香蕉',
    spec: '500g',
    sell_price: 8,
    buy_price: 4,
    stock: 20,
    created_at: '',
    updated_at: '',
  },
]

function installProductsMock() {
  fromMock.mockImplementation((table: string) => {
    if (table !== 'products') throw new Error(`unexpected table: ${table}`)
    let searchExpr = ''
    const query = {
      select: vi.fn(() => query),
      or: vi.fn((expr: string) => {
        searchExpr = expr
        return query
      }),
      order: vi.fn(async () => {
        const data = searchExpr ? allRows.filter((r) => r.name.includes('苹果')) : allRows
        return { data, error: null }
      }),
    }
    return query
  })
}

describe('useProducts realtime refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    realtimeCallback = null
    subscribeTableMock.mockImplementation((_table: string, cb: () => void) => {
      realtimeCallback = cb
      return () => {}
    })
    installProductsMock()
  })

  it('有搜索词时，实时刷新保持当前搜索结果', async () => {
    const scope = effectScope()
    const api = scope.run(() => useProducts())!

    await api.search('苹果')
    expect(api.products.value.map((p) => p.name)).toEqual(['苹果'])

    realtimeCallback?.()
    await Promise.resolve()

    expect(api.products.value.map((p) => p.name)).toEqual(['苹果'])
    scope.stop()
  })

  it('无搜索词时，实时刷新走全量拉取', async () => {
    const scope = effectScope()
    const api = scope.run(() => useProducts())!

    await api.fetchAll()
    expect(api.products.value).toHaveLength(2)

    realtimeCallback?.()
    await Promise.resolve()

    expect(api.products.value).toHaveLength(2)
    scope.stop()
  })
})
