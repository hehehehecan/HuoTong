const DEFAULT_INSTALL_STEPS = [
  '首次安装请使用维护者单独发送的 APK 下载链接；若手机里已安装旧版本，也可在“更多”页点击“下载更新包”获取新包。',
  '下载 APK 后点击安装；若系统提示“来自未知来源”，按系统引导临时允许后继续。',
  '安装完成后打开货通 App，确认可进入登录页。',
]

const DEFAULT_LOGIN_METHOD = [
  '使用维护者分发的家庭测试账号（邮箱 + 密码）登录。',
  '登录成功后会进入首页；若提示“邮箱或密码错误”，请先核对账号信息再重试。',
]

const DEFAULT_FORGOT_PASSWORD = [
  '当前版本不提供自助找回密码入口。',
  '若忘记密码，请联系维护者重置或重新分发临时密码。',
]

const DEFAULT_FAQ = [
  '安装失败：优先确认使用同一包名（applicationId）和同一签名证书。',
  '登录失败：先确认网络可用，再核对邮箱/密码是否与分发信息一致。',
  '网络异常：切换 Wi-Fi/移动网络后重试登录。',
  '升级后异常：反馈版本号、机型、网络环境和复现步骤给维护者。',
  '仍无法解决：直接联系维护者，并附上截图或录屏帮助定位。',
]

const DEFAULT_CONTACT_ADVICE = [
  '遇到安装、登录或升级问题时，请直接联系维护者，并一并提供版本号、机型、网络环境和复现步骤。',
]

export interface AccountOnboardingGuide {
  installSteps: string[]
  loginMethod: string[]
  forgotPassword: string[]
  faq: string[]
  contactAdvice: string[]
}

export const accountOnboardingGuide: AccountOnboardingGuide = {
  installSteps: DEFAULT_INSTALL_STEPS,
  loginMethod: DEFAULT_LOGIN_METHOD,
  forgotPassword: DEFAULT_FORGOT_PASSWORD,
  faq: DEFAULT_FAQ,
  contactAdvice: DEFAULT_CONTACT_ADVICE,
}

function toNumberedBlock(title: string, lines: string[]): string {
  const numbered = lines.map((line, index) => `${index + 1}. ${line}`).join('\n')
  return `${title}\n${numbered}`
}

export function getFamilyOnboardingMessage(guide = accountOnboardingGuide): string {
  return [
    toNumberedBlock('安装步骤：', guide.installSteps),
    '',
    toNumberedBlock('登录方式：', guide.loginMethod),
    '',
    toNumberedBlock('忘记密码：', guide.forgotPassword),
    '',
    toNumberedBlock('常见问题：', guide.faq),
    '',
    toNumberedBlock('联系维护者：', guide.contactAdvice),
  ].join('\n')
}
