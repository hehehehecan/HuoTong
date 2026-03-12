const DEFAULT_REQUIRED_FIELDS = [
  '版本号',
  '手机机型',
  '网络环境（Wi-Fi / 4G / 5G）',
  '问题复现步骤',
  '问题现象描述',
]

const DEFAULT_TRIAGE_CHECKLIST = [
  '是否阻断核心流程（登录、开单、库存、账款）',
  '是否稳定复现（每次都出现 / 偶发）',
  '是否可通过重试、切网或重启临时恢复',
  '是否需要重新发版（按影响范围和可恢复性判断）',
]

export interface AndroidFeedbackTemplate {
  requiredFields: string[]
  triageChecklist: string[]
}

export const androidFeedbackTemplate: AndroidFeedbackTemplate = {
  requiredFields: DEFAULT_REQUIRED_FIELDS,
  triageChecklist: DEFAULT_TRIAGE_CHECKLIST,
}

function toNumberedBlock(title: string, lines: string[]): string {
  const numbered = lines.map((line, index) => `${index + 1}. ${line}`).join('\n')
  return `${title}\n${numbered}`
}

function toFeedbackForm(fields: string[]): string {
  return [
    '可直接复制以下反馈模板：',
    '【货通问题反馈】',
    `- ${fields[0]}：`,
    `- ${fields[1]}：`,
    `- ${fields[2]}：`,
    `- ${fields[3]}：`,
    '  1.',
    '  2.',
    '  3.',
    `- ${fields[4]}：`,
    '- 是否可通过重试恢复（是/否）：',
  ].join('\n')
}

export function getAndroidFeedbackMessage(
  template: AndroidFeedbackTemplate = androidFeedbackTemplate
): string {
  return [
    toNumberedBlock('问题反馈建议模板（家人提交）：', template.requiredFields),
    '',
    toFeedbackForm(template.requiredFields),
    '',
    toNumberedBlock('维护者收到反馈后的快速判断：', template.triageChecklist),
  ].join('\n')
}
