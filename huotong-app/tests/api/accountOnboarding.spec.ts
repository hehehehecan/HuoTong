import { describe, expect, it } from 'vitest'

import { getFamilyOnboardingMessage } from '../../src/lib/accountOnboarding'

describe('accountOnboarding', () => {
  it('生成家庭安装与登录指引，包含关键模块', () => {
    const message = getFamilyOnboardingMessage()

    expect(message).toContain('安装步骤：')
    expect(message).toContain('登录方式：')
    expect(message).toContain('忘记密码：')
    expect(message).toContain('常见问题：')
    expect(message).toContain('联系维护者：')
  })

  it('区分首次安装与已安装升级，并包含关键排障信息', () => {
    const message = getFamilyOnboardingMessage()

    expect(message).toContain('首次安装请使用维护者单独发送的 APK 下载链接')
    expect(message).toContain('已安装旧版本，也可在“更多”页点击“下载更新包”获取新包')
    expect(message).toContain('未知来源')
    expect(message).toContain('联系维护者')
    expect(message).toContain('网络异常：切换 Wi-Fi/移动网络后重试登录')
    expect(message).toContain('升级后异常：反馈版本号、机型、网络环境和复现步骤给维护者')
    expect(message).toContain('版本号、机型、网络环境和复现步骤')
  })
})
