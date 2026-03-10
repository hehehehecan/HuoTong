import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}))

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}))

import { getStockLogs } from '../../src/composables/useInventory'

type StockLogRow = {
  id: string
  product_id: string
  change: number
  reason: 'sale_order' | 'purchase_order' | 'manual'
  reference_id: string | null
  balance: number
  created_at: string
}

function mockStockLogs(rows: StockLogRow[], error: Error | null = null) {
  const order = vi.fn().mockResolvedValue({ data: rows, error })
  const eq = vi.fn(() => ({ order }))
  const select = vi.fn(() => ({ eq }))
  fromMock.mockImplementationOnce((table: string) => {
    if (table !== 'stock_logs') throw new Error(`unexpected table: ${table}`)
    return { select }
  })
}

function mockOrderTable(
  table: 'sale_orders' | 'purchase_orders',
  rows: Array<{ id: string; order_no: string }>,
  error: Error | null = null
) {
  const inMock = vi.fn().mockResolvedValue({ data: rows, error })
  const select = vi.fn(() => ({ in: inMock }))
  fromMock.mockImplementationOnce((name: string) => {
    if (name !== table) throw new Error(`unexpected table: ${name}`)
    return { select }
  })
}

describe('getStockLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('按商品查询并映射关联单据号', async () => {
    mockStockLogs([
      {
        id: 'l-1',
        product_id: 'p-1',
        change: -2,
        reason: 'sale_order',
        reference_id: 's-1',
        balance: 8,
        created_at: '2026-03-10T10:00:00.000Z',
      },
      {
        id: 'l-2',
        product_id: 'p-1',
        change: 3,
        reason: 'purchase_order',
        reference_id: 'po-1',
        balance: 10,
        created_at: '2026-03-10T09:00:00.000Z',
      },
      {
        id: 'l-3',
        product_id: 'p-1',
        change: 1,
        reason: 'manual',
        reference_id: null,
        balance: 7,
        created_at: '2026-03-10T08:00:00.000Z',
      },
    ])
    mockOrderTable('sale_orders', [{ id: 's-1', order_no: 'SO-001' }])
    mockOrderTable('purchase_orders', [{ id: 'po-1', order_no: 'PO-001' }])

    const rows = await getStockLogs('p-1')

    expect(rows).toHaveLength(3)
    expect(rows[0].orderNo).toBe('SO-001')
    expect(rows[1].orderNo).toBe('PO-001')
    expect(rows[2].orderNo).toBe('—')
  })

  it('无记录时直接返回空数组', async () => {
    mockStockLogs([])

    const rows = await getStockLogs('p-empty')

    expect(rows).toEqual([])
    expect(fromMock).toHaveBeenCalledTimes(1)
  })

  it('关联单据查询失败时抛出错误', async () => {
    mockStockLogs([
      {
        id: 'l-1',
        product_id: 'p-1',
        change: -1,
        reason: 'sale_order',
        reference_id: 's-1',
        balance: 9,
        created_at: '2026-03-10T10:00:00.000Z',
      },
    ])
    mockOrderTable('sale_orders', [], new Error('query sale failed'))

    await expect(getStockLogs('p-1')).rejects.toThrow('query sale failed')
  })
})
