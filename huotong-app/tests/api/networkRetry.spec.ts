import { beforeEach, describe, expect, it, vi } from 'vitest'

const { showConfirmDialogMock } = vi.hoisted(() => ({
  showConfirmDialogMock: vi.fn(),
}))

vi.mock('vant', () => ({
  showConfirmDialog: showConfirmDialogMock,
}))

import {
  isNetworkError,
  requestRetryOnNetworkError,
  withNetworkRetry,
} from '../../src/lib/networkRetry'

describe('networkRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('能识别常见网络异常文本', () => {
    expect(isNetworkError(new Error('Failed to fetch'))).toBe(true)
    expect(isNetworkError(new Error('request timeout after 5000ms'))).toBe(true)
    expect(isNetworkError(new Error('NetworkError when attempting to fetch resource.'))).toBe(true)
    expect(isNetworkError(new Error('invalid login credentials'))).toBe(false)
  })

  it('网络错误时自动重试 1 次后成功', async () => {
    const run = vi.fn()
      .mockRejectedValueOnce(new Error('Failed to fetch'))
      .mockResolvedValueOnce('ok')

    const result = await withNetworkRetry(run, 1)

    expect(result).toBe('ok')
    expect(run).toHaveBeenCalledTimes(2)
  })

  it('非网络错误不会自动重试', async () => {
    const run = vi.fn().mockRejectedValue(new Error('permission denied'))

    await expect(withNetworkRetry(run, 1)).rejects.toThrow('permission denied')
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('网络错误时可触发显式重试确认', async () => {
    showConfirmDialogMock.mockResolvedValue(undefined)

    const shouldRetry = await requestRetryOnNetworkError(
      new Error('network timeout'),
      {
        title: '网络异常',
        message: '加载失败，请重试',
        confirmButtonText: '重试',
      }
    )

    expect(shouldRetry).toBe(true)
    expect(showConfirmDialogMock).toHaveBeenCalledTimes(1)
  })

  it('非网络错误不弹重试确认', async () => {
    const shouldRetry = await requestRetryOnNetworkError(
      new Error('invalid login credentials'),
      {
        title: '网络异常',
        message: '加载失败，请重试',
        confirmButtonText: '重试',
      }
    )

    expect(shouldRetry).toBe(false)
    expect(showConfirmDialogMock).not.toHaveBeenCalled()
  })
})
