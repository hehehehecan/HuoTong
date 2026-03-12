import { ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  createBatchMock,
  fetchCustomersMock,
  fetchProductsMock,
  loadProductsMock,
  routerPushMock,
  routerReplaceMock,
  routeState,
  searchCustomersMock,
  searchProductsMock,
  showFailToastMock,
  showLoadingToastMock,
  showSuccessToastMock,
  showToastMock,
  closeToastMock,
  platformConfig,
} = vi.hoisted(() => ({
  createBatchMock: vi.fn(),
  fetchCustomersMock: vi.fn(),
  fetchProductsMock: vi.fn(),
  loadProductsMock: vi.fn(),
  routerPushMock: vi.fn(),
  routerReplaceMock: vi.fn(),
  routeState: {
    path: '/more',
    meta: {
      title: '更多',
      message: '功能开发中，敬请期待',
    },
  },
  searchCustomersMock: vi.fn(),
  searchProductsMock: vi.fn(),
  showFailToastMock: vi.fn(),
  showLoadingToastMock: vi.fn(),
  showSuccessToastMock: vi.fn(),
  showToastMock: vi.fn(),
  closeToastMock: vi.fn(),
  platformConfig: {
    desktopBatchImportEnabled: false,
    receiptRecognitionEnabled: false,
    webExportDownloadEnabled: false,
    featureTips: {
      receiptRecognition: 'Android 首版暂不开放拍照识别，请先手动录入',
      exportDownload: 'Android 首版暂不开放导出下载，请先使用核心业务功能',
      batchImport: 'Android 首版暂不开放批量录入，请使用新增商品逐条录入',
    },
  },
}))

const products = ref([
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
])
const loading = ref(false)
const saleOrderLoading = ref(false)

vi.mock('vant', () => ({
  Button: {
    name: 'VanButton',
    template: '<button><slot /></button>',
  },
  closeToast: closeToastMock,
  showFailToast: showFailToastMock,
  showLoadingToast: showLoadingToastMock,
  showSuccessToast: showSuccessToastMock,
  showToast: showToastMock,
}))

vi.mock('../../src/lib/platform', () => ({
  platformConfig,
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
  useRouter: () => ({
    push: routerPushMock,
    replace: routerReplaceMock,
  }),
}))

vi.mock('../../src/composables/useProducts', () => ({
  useProducts: () => ({
    products,
    loading,
    fetchAll: fetchProductsMock,
    search: searchProductsMock,
    createBatch: createBatchMock,
  }),
}))

vi.mock('../../src/composables/useCustomers', () => ({
  useCustomers: () => ({
    fetchAll: fetchCustomersMock,
    search: searchCustomersMock,
  }),
}))

vi.mock('../../src/composables/useSaleOrders', () => ({
  useSaleOrders: () => ({
    createDraft: vi.fn(),
    loading: saleOrderLoading,
    recognizeFromImage: vi.fn(),
  }),
}))

vi.mock('../../src/composables/useBackButtonPopup', () => ({
  useBackButtonPopup: vi.fn(),
}))

vi.mock('../../src/composables/useAppResumeRefresh', () => ({
  useAppResumeRefresh: vi.fn(),
}))

import PlaceholderView from '../../src/views/PlaceholderView.vue'
import ProductBatchImportView from '../../src/views/ProductBatchImportView.vue'
import ProductListView from '../../src/views/ProductListView.vue'
import SaleOrderCreateView from '../../src/views/SaleOrderCreateView.vue'

const globalStubs = {
  'van-button': { template: '<button><slot /></button>' },
  'van-cell': {
    props: ['title', 'label', 'value', 'isLink', 'disabled'],
    template: `
      <div class="van-cell-stub" :data-title="title" :data-label="label" :data-value="value">
        <slot name="title">{{ title }}</slot>
        <slot />
        <slot name="value">{{ value }}</slot>
        <span v-if="label">{{ label }}</span>
      </div>
    `,
  },
  'van-cell-group': { template: '<div><slot /></div>' },
  'van-field': { template: '<input />' },
  'van-list': { template: '<div><slot /></div>' },
  'van-loading': { template: '<div><slot /></div>' },
  'van-overlay': { template: '<div><slot /></div>' },
  'van-popup': { template: '<div><slot /></div>' },
  'van-pull-refresh': { template: '<div><slot /></div>' },
  'van-search': { template: '<input />' },
}

function installMatchMedia(matches = true) {
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

describe('Android 首版入口整形', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    installMatchMedia(true)
    fetchProductsMock.mockResolvedValue(products.value)
    searchProductsMock.mockResolvedValue(products.value)
    fetchCustomersMock.mockResolvedValue([])
    searchCustomersMock.mockResolvedValue([])
    routeState.path = '/more'
    routeState.meta = {
      title: '更多',
      message: '功能开发中，敬请期待',
    }
    platformConfig.desktopBatchImportEnabled = false
    platformConfig.receiptRecognitionEnabled = false
    platformConfig.webExportDownloadEnabled = false
  })

  it('Android 下商品页隐藏批量录入，但保留核心新增入口', async () => {
    const wrapper = mount(ProductListView, {
      global: {
        stubs: globalStubs,
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('新增商品')
    expect(wrapper.text()).not.toContain('批量录入')
  })

  it('Android 手动访问批量录入页时会提示并回退到商品列表', async () => {
    mount(ProductBatchImportView, {
      global: {
        stubs: globalStubs,
      },
    })

    await flushPromises()

    expect(showToastMock).toHaveBeenCalledWith(platformConfig.featureTips.batchImport)
    expect(routerReplaceMock).toHaveBeenCalledWith('/products')
  })

  it('Android 下更多页将导出入口替换为说明文案', () => {
    const wrapper = mount(PlaceholderView, {
      global: {
        stubs: globalStubs,
      },
    })

    expect(wrapper.text()).toContain('导出数据（暂不开放）')
    expect(wrapper.text()).toContain(platformConfig.featureTips.exportDownload)
  })

  it('Android 下新建出货单不再渲染拍照识别入口', async () => {
    const wrapper = mount(SaleOrderCreateView, {
      global: {
        stubs: globalStubs,
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain(platformConfig.featureTips.receiptRecognition)
    expect(wrapper.find('input[type="file"]').exists()).toBe(false)
    expect(
      wrapper
        .findAll('button')
        .map((button) => button.text())
        .includes('拍照识别')
    ).toBe(false)
  })
})
