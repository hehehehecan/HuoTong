import { ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { showToast, adjustStock, fetchAll, search } = vi.hoisted(() => ({
  showToast: vi.fn(),
  adjustStock: vi.fn(),
  fetchAll: vi.fn(),
  search: vi.fn(),
}))

const products = ref([
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
])
const loading = ref(false)
fetchAll.mockImplementation(async () => products.value)
search.mockImplementation(async () => products.value)

vi.mock('vant', () => ({
  showToast,
}))

vi.mock('../../src/composables/useInventory', () => ({
  adjustStock,
}))

vi.mock('../../src/composables/useProducts', () => ({
  useProducts: () => ({
    products,
    loading,
    fetchAll,
    search,
  }),
}))

import InventoryView from '../../src/views/InventoryView.vue'

function mountPage() {
  return mount(InventoryView, {
    global: {
      stubs: [
        'van-search',
        'van-pull-refresh',
        'van-loading',
        'van-empty',
        'van-cell-group',
        'van-cell',
        'van-tag',
        'van-popup',
        'van-field',
        'van-button',
      ],
    },
  })
}

describe('库存调整流程', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('缺少调整原因时阻止提交并提示错误', async () => {
    const wrapper = mountPage()
    await flushPromises()
    const vm = wrapper.vm as any

    vm.openAdjust(products.value[0])
    vm.adjustNewStock = 3
    vm.adjustReason = '   '

    await vm.submitAdjust()

    expect(adjustStock).not.toHaveBeenCalled()
    expect(showToast).toHaveBeenCalledWith({ type: 'fail', message: '请填写调整原因' })
  })

  it('提交成功时调用库存 RPC 并刷新列表', async () => {
    adjustStock.mockResolvedValue(undefined)
    const wrapper = mountPage()
    await flushPromises()
    const vm = wrapper.vm as any

    vm.openAdjust(products.value[0])
    vm.adjustNewStock = 12
    vm.adjustReason = '盘点修正'

    await vm.submitAdjust()

    expect(adjustStock).toHaveBeenCalledWith('p-1', 12, '盘点修正')
    expect(showToast).toHaveBeenCalledWith({ type: 'success', message: '调整成功' })
    expect(fetchAll).toHaveBeenCalled()
  })
})
