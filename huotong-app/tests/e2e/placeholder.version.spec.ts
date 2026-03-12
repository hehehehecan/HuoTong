import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  routeState,
  routerPushMock,
  showFailToastMock,
  showLoadingToastMock,
  showSuccessToastMock,
  closeToastMock,
  getAppVersionInfoMock,
  platformConfig,
} = vi.hoisted(() => ({
  routeState: {
    path: '/more',
    meta: {
      title: '更多',
      message: '功能开发中，敬请期待',
    },
  },
  routerPushMock: vi.fn(),
  showFailToastMock: vi.fn(),
  showLoadingToastMock: vi.fn(),
  showSuccessToastMock: vi.fn(),
  closeToastMock: vi.fn(),
  getAppVersionInfoMock: vi.fn(),
  platformConfig: {
    webExportDownloadEnabled: false,
    featureTips: {
      exportDownload: 'Android 首版暂不开放导出下载，请先使用核心业务功能',
    },
  },
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
  useRouter: () => ({
    push: routerPushMock,
  }),
}))

vi.mock('vant', () => ({
  showFailToast: showFailToastMock,
  showLoadingToast: showLoadingToastMock,
  showSuccessToast: showSuccessToastMock,
  closeToast: closeToastMock,
}))

vi.mock('../../src/lib/platform', () => ({
  platformConfig,
}))

vi.mock('../../src/composables/useExportData', () => ({
  exportDataAsJson: vi.fn(),
}))

vi.mock('../../src/lib/appInfo', () => ({
  getAppVersionInfo: getAppVersionInfoMock,
}))

import PlaceholderView from '../../src/views/PlaceholderView.vue'

describe('PlaceholderView 版本展示', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routeState.path = '/more'
    routeState.meta = {
      title: '更多',
      message: '功能开发中，敬请期待',
    }
    getAppVersionInfoMock.mockResolvedValue({
      version: '1.0.0',
      build: '1',
      label: '1.0.0 (build 1)',
      source: 'native',
    })
  })

  it('在更多页展示当前版本信息', async () => {
    const wrapper = mount(PlaceholderView, {
      global: {
        stubs: {
          'van-cell': {
            props: ['title', 'label', 'value'],
            template:
              '<div class="van-cell-stub"><span class="title">{{ title }}</span><span class="value">{{ value }}</span><span class="label">{{ label }}</span></div>',
          },
        },
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('当前版本')
    expect(wrapper.text()).toContain('1.0.0 (build 1)')
  })

  it('版本读取失败时展示未知版本兜底文案', async () => {
    getAppVersionInfoMock.mockResolvedValue({
      version: '未知版本',
      build: '-',
      label: '未知版本',
      source: 'fallback',
    })

    const wrapper = mount(PlaceholderView, {
      global: {
        stubs: {
          'van-cell': {
            props: ['title', 'label', 'value'],
            template:
              '<div class="van-cell-stub"><span class="title">{{ title }}</span><span class="value">{{ value }}</span><span class="label">{{ label }}</span></div>',
          },
        },
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('当前版本')
    expect(wrapper.text()).toContain('未知版本')
  })
})
