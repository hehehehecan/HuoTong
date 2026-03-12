import { ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  fetchAllMock,
  searchMock,
  routerPushMock,
  showToastMock,
  platformConfig,
} = vi.hoisted(() => ({
  fetchAllMock: vi.fn(),
  searchMock: vi.fn(),
  routerPushMock: vi.fn(),
  showToastMock: vi.fn(),
  platformConfig: {
    desktopBatchImportEnabled: true,
    featureTips: {
      batchImport: 'Android 首版暂不开放批量录入，请使用新增商品逐条录入',
    },
  },
}))

const products = ref<
  Array<{
    id: string
    name: string
    spec: string
    sell_price: number
    buy_price: number
    stock: number
    created_at: string
    updated_at: string
  }>
>([])
const loading = ref(false)

vi.mock('vant', () => ({
  Button: {
    name: 'VanButton',
    template: '<button @click="$emit(\'click\')"><slot /></button>',
  },
  showToast: showToastMock,
}))

vi.mock('../../src/composables/useProducts', () => ({
  useProducts: () => ({
    products,
    loading,
    fetchAll: fetchAllMock,
    search: searchMock,
  }),
}))

vi.mock('../../src/composables/useAppResumeRefresh', () => ({
  useAppResumeRefresh: vi.fn(),
}))

vi.mock('../../src/lib/platform', () => ({
  platformConfig,
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: routerPushMock,
  }),
}))

import ProductListView from '../../src/views/ProductListView.vue'

function installMatchMedia(matches = false) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches,
      media: '(min-width: 768px)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

describe('ProductListView 重试加载', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    installMatchMedia(false)
    products.value = []
    searchMock.mockResolvedValue([])
  })

  it('首屏加载失败后展示重试按钮，并可在重试成功后恢复列表', async () => {
    fetchAllMock
      .mockRejectedValueOnce(new Error('Failed to fetch'))
      .mockImplementation(async () => {
        products.value = [
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
        ]
        return products.value
      })

    const wrapper = mount(ProductListView, {
      global: {
        stubs: {
          'van-button': { template: '<button @click="$emit(\'click\')"><slot /></button>' },
          'van-cell': { template: '<div><slot />{{ title }}{{ label }}{{ value }}</div>', props: ['title', 'label', 'value'] },
          'van-list': { template: '<div><slot /></div>' },
          'van-pull-refresh': { template: '<div><slot /></div>' },
          'van-search': { template: '<input />' },
        },
      },
    })

    await flushPromises()
    expect(wrapper.text()).toContain('网络异常，加载商品失败')
    expect(wrapper.text()).toContain('重试加载')

    const retryButton = wrapper.findAll('button').find((button) => button.text().includes('重试加载'))
    expect(retryButton).toBeTruthy()
    await retryButton!.trigger('click')
    await flushPromises()

    expect(fetchAllMock.mock.calls.length).toBeGreaterThanOrEqual(2)
    expect(wrapper.text()).toContain('苹果')
    expect(wrapper.text()).not.toContain('网络异常，加载商品失败')
  })
})
