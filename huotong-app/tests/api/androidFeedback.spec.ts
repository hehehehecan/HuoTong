import { describe, expect, it } from 'vitest'
import {
  androidFeedbackTemplate,
  getAndroidFeedbackMessage,
} from '../../src/lib/androidFeedback'

describe('androidFeedback 模板', () => {
  it('默认模板包含回归定位必填字段', () => {
    expect(androidFeedbackTemplate.requiredFields).toEqual(
      expect.arrayContaining(['版本号', '手机机型', '问题复现步骤'])
    )
    expect(
      androidFeedbackTemplate.requiredFields.some((field) => field.includes('网络环境'))
    ).toBe(true)
  })

  it('消息文本包含反馈结构和发版决策提示', () => {
    const message = getAndroidFeedbackMessage()

    expect(message).toContain('问题反馈建议模板')
    expect(message).toContain('可直接复制以下反馈模板')
    expect(message).toContain('【货通问题反馈】')
    expect(message).toContain('版本号')
    expect(message).toContain('手机机型')
    expect(message).toContain('网络环境')
    expect(message).toContain('问题复现步骤')
    expect(message).toContain('问题现象描述')
    expect(message).toContain('是否可通过重试恢复')
    expect(message).toContain('是否阻断核心流程')
    expect(message).toContain('是否需要重新发版')
  })
})
