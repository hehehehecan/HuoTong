import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  routeState,
  routerPushMock,
  showFailToastMock,
  showLoadingToastMock,
  showSuccessToastMock,
  closeToastMock,
  showConfirmDialogMock,
  getAppVersionInfoMock,
  openApkDownloadEntryMock,
  getApkUpdateMessageMock,
  apkDistributionConfig,
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
  showConfirmDialogMock: vi.fn(),
  getAppVersionInfoMock: vi.fn(),
  openApkDownloadEntryMock: vi.fn(),
  getApkUpdateMessageMock: vi.fn(() => '测试更新说明'),
  apkDistributionConfig: {
    latestVersion: '1.0.2',
    downloadUrl: 'https://example.com/huotong.apk',
  },
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
  showConfirmDialog: showConfirmDialogMock,
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

vi.mock('../../src/lib/apkDistribution', () => ({
  apkDistributionConfig,
  openApkDownloadEntry: openApkDownloadEntryMock,
  getApkUpdateMessage: getApkUpdateMessageMock,
}))

import PlaceholderView from '../../src/views/PlaceholderView.vue'

const vanCellStub = {
  props: ['title', 'label', 'value'],
  template:
    '<button class="van-cell-stub" @click="$emit(\'click\')"><span class="title">{{ title }}</span><span class="value">{{ value }}</span><span class="label">{{ label }}</span></button>',
}

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
    openApkDownloadEntryMock.mockReturnValue(true)
    showConfirmDialogMock.mockResolvedValue(undefined)
  })

  it('在更多页展示当前版本信息', async () => {
    const wrapper = mount(PlaceholderView, {
      global: {
        stubs: {
          'van-cell': vanCellStub,
        },
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('当前版本')
    expect(wrapper.text()).toContain('1.0.0 (build 1)')
    expect(wrapper.text()).toContain('下载更新包')
    expect(wrapper.text()).toContain('推荐 1.0.2')
    expect(wrapper.text()).toContain('更新说明')
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
          'van-cell': vanCellStub,
        },
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('当前版本')
    expect(wrapper.text()).toContain('未知版本')
  })

  it('点击下载更新包时调用固定下载入口', async () => {
    const wrapper = mount(PlaceholderView, {
      global: {
        stubs: {
          'van-cell': vanCellStub,
        },
      },
    })

    await flushPromises()
    const cells = wrapper.findAll('.van-cell-stub')
    await cells[2]?.trigger('click')

    expect(openApkDownloadEntryMock).toHaveBeenCalled()
    expect(showFailToastMock).not.toHaveBeenCalled()
  })

  it('下载入口未配置时提示用户联系维护者', async () => {
    openApkDownloadEntryMock.mockReturnValue(false)
    const wrapper = mount(PlaceholderView, {
      global: {
        stubs: {
          'van-cell': vanCellStub,
        },
      },
    })

    await flushPromises()
    const cells = wrapper.findAll('.van-cell-stub')
    await cells[2]?.trigger('click')

    expect(showFailToastMock).toHaveBeenCalledWith('下载入口暂未配置，请联系维护者')
  })

  it('点击更新说明会弹出安装步骤对话框', async () => {
    const wrapper = mount(PlaceholderView, {
      global: {
        stubs: {
          'van-cell': vanCellStub,
        },
      },
    })

    await flushPromises()
    const cells = wrapper.findAll('.van-cell-stub')
    await cells[3]?.trigger('click')

    expect(getApkUpdateMessageMock).toHaveBeenCalled()
    expect(showConfirmDialogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '更新说明与安装步骤',
        message: '测试更新说明',
        showCancelButton: false,
      })
    )
  })
})
