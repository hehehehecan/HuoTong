import { ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ComponentPublicInstance } from 'vue'

const { showToast, adjustStock, getStockLogs, fetchAll, search, routerPush } = vi.hoisted(() => ({
  showToast: vi.fn(),
  adjustStock: vi.fn(),
  getStockLogs: vi.fn(),
  fetchAll: vi.fn(),
  search: vi.fn(),
  routerPush: vi.fn(),
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
  getStockLogs,
}))

vi.mock('../../src/composables/useProducts', () => ({
  useProducts: () => ({
    products,
    loading,
    fetchAll,
    search,
  }),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: routerPush,
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

function getVm(wrapper: ReturnType<typeof mount>) {
  return wrapper.vm as ComponentPublicInstance & Record<string, any>
}

describe('库存调整流程', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getStockLogs.mockResolvedValue([])
  })

  it('缺少调整原因时阻止提交并提示错误', async () => {
    const wrapper = mountPage()
    await flushPromises()
    const vm = getVm(wrapper)

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
    const vm = getVm(wrapper)

    vm.openAdjust(products.value[0])
    vm.adjustNewStock = 12
    vm.adjustReason = '盘点修正'

    await vm.submitAdjust()

    expect(adjustStock).toHaveBeenCalledWith('p-1', 12, '盘点修正')
    expect(showToast).toHaveBeenCalledWith({ type: 'success', message: '调整成功' })
    expect(fetchAll).toHaveBeenCalled()
  })

  it('打开变动记录时拉取日志并支持跳转单据详情', async () => {
    getStockLogs.mockResolvedValue([
      {
        id: 'l-1',
        product_id: 'p-1',
        change: -2,
        reason: 'sale_order',
        reference_id: 'so-1',
        balance: 3,
        created_at: '2026-03-10T10:00:00.000Z',
        orderNo: 'SO-001',
      },
    ])
    const wrapper = mountPage()
    await flushPromises()
    const vm = getVm(wrapper)

    vm.openLogs(products.value[0])
    await flushPromises()

    expect(getStockLogs).toHaveBeenCalledWith('p-1')
    expect(vm.logsList).toHaveLength(1)

    vm.goToOrder(vm.logsList[0])
    expect(routerPush).toHaveBeenCalledWith({
      name: 'sale-order-detail',
      params: { id: 'so-1' },
    })
  })
})
