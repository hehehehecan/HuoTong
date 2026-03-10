import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}))

import { supabase } from '../../src/lib/supabase'
import { adjustStock } from '../../src/composables/useInventory'

describe('adjustStock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('调用 adjust_stock RPC 并传递规范化参数', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ error: null } as never)

    await adjustStock('p-1', 12, '  盘点修正  ')

    expect(supabase.rpc).toHaveBeenCalledWith('adjust_stock', {
      p_product_id: 'p-1',
      p_new_stock: 12,
      p_reason_note: '盘点修正',
    })
  })

  it('原因为空白时传 null', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ error: null } as never)

    await adjustStock('p-2', 0, '   ')

    expect(supabase.rpc).toHaveBeenCalledWith('adjust_stock', {
      p_product_id: 'p-2',
      p_new_stock: 0,
      p_reason_note: null,
    })
  })

  it('RPC 返回错误时向上抛出', async () => {
    const rpcError = new Error('rpc failed')
    vi.mocked(supabase.rpc).mockResolvedValue({ error: rpcError } as never)

    await expect(adjustStock('p-3', 1, '补货')).rejects.toThrow('rpc failed')
  })
})
