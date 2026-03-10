import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}))

vi.mock('../../src/lib/supabase', () => ({
  supabase: { from: fromMock },
}))

import { exportDataAsJson } from '../../src/composables/useExportData'

function mockTable(table: string, rows: unknown[] = []) {
  const range = vi.fn().mockResolvedValue({ data: rows, error: null })
  const select = vi.fn(() => ({ range }))
  fromMock.mockImplementationOnce((t: string) => {
    if (t !== table) throw new Error(`unexpected table: ${t}`)
    return { select }
  })
}

describe('exportDataAsJson', () => {
  let createObjectURL: ReturnType<typeof vi.fn>
  let revokeObjectURL: ReturnType<typeof vi.fn>
  let createElement: ReturnType<typeof vi.fn>
  let clickMock: ReturnType<typeof vi.fn>
  let anchor: { href: string; download: string; click: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    createObjectURL = vi.fn(() => 'blob:mock-url')
    revokeObjectURL = vi.fn()
    clickMock = vi.fn()
    anchor = { href: '', download: '', click: clickMock }
    createElement = vi.fn((tag: string) => {
      if (tag === 'a') return anchor
      return document.createElement(tag)
    })
    vi.stubGlobal('URL', {
      createObjectURL,
      revokeObjectURL,
    })
    vi.stubGlobal('document', { ...document, createElement })
    const tables = [
      'products',
      'customers',
      'suppliers',
      'sale_orders',
      'sale_order_items',
      'purchase_orders',
      'purchase_order_items',
      'receivables',
      'payables',
      'stock_logs',
    ]
    tables.forEach((t) => mockTable(t, t === 'products' ? [{ id: 'p1', name: '商品1' }] : []))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('查询 10 张表并组装 JSON 触发下载', async () => {
    await exportDataAsJson()
    vi.runAllTimers()

    expect(fromMock).toHaveBeenCalledTimes(10)
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    const blob = createObjectURL.mock.calls[0][0]
    expect(blob).toBeInstanceOf(Blob)
    expect((blob as Blob).type).toBe('application/json')
    expect(clickMock).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    expect(anchor.download).toMatch(/^huotong-export-\d{8}-\d{6}\.json$/)
  })

  it('某表查询失败时抛出错误', async () => {
    fromMock.mockReset()
    fromMock.mockImplementation((table: string) => {
      if (table === 'sale_order_items') {
        return { select: () => ({ range: vi.fn().mockRejectedValue(new Error('network')) }) }
      }
      const range = vi.fn().mockResolvedValue({ data: [], error: null })
      const select = vi.fn(() => ({ range }))
      return { select }
    })

    await expect(exportDataAsJson()).rejects.toThrow('network')
  })
})
