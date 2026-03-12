const DEFAULT_RELEASE_NOTES = ['修复已知问题并提升 Android 首版稳定性。']

const DEFAULT_INSTALL_STEPS = [
  '点击“下载更新包”获取新版 APK。',
  '若系统提示“来自未知来源”，请按系统引导临时允许后继续安装。',
  '不要卸载旧版本，直接安装新包完成覆盖升级。',
  '安装完成后打开 App，在“更多”页确认当前版本已更新。',
]

const DEFAULT_TROUBLESHOOTING = [
  '安装失败时，优先检查是否使用了同一个应用包名（applicationId）。',
  '确认新包与旧包使用同一签名证书，并且 versionCode 已递增。',
  '若仍失败，请联系维护者获取最新下载链接与安装支持。',
]

const trimOrEmpty = (value: string | undefined): string => (value ?? '').trim()

export interface ApkDistributionConfig {
  latestVersion: string
  downloadUrl: string
  releaseNotes: string[]
  installSteps: string[]
  troubleshooting: string[]
}

export const apkDistributionConfig: ApkDistributionConfig = {
  latestVersion: trimOrEmpty(import.meta.env.VITE_ANDROID_APK_LATEST_VERSION) || '未标注',
  downloadUrl: trimOrEmpty(import.meta.env.VITE_ANDROID_APK_DOWNLOAD_URL),
  releaseNotes: DEFAULT_RELEASE_NOTES,
  installSteps: DEFAULT_INSTALL_STEPS,
  troubleshooting: DEFAULT_TROUBLESHOOTING,
}

export function getApkUpdateMessage(config = apkDistributionConfig): string {
  const notes = config.releaseNotes.map((item, index) => `${index + 1}. ${item}`).join('\n')
  const steps = config.installSteps.map((item, index) => `${index + 1}. ${item}`).join('\n')
  const troubleshooting = config.troubleshooting
    .map((item, index) => `${index + 1}. ${item}`)
    .join('\n')

  return [
    `推荐版本：${config.latestVersion}`,
    '',
    '更新内容：',
    notes,
    '',
    '安装步骤：',
    steps,
    '',
    '安装失败排查：',
    troubleshooting,
  ].join('\n')
}

export function openApkDownloadEntry(
  config = apkDistributionConfig,
  opener?: (url?: string, target?: string, features?: string) => Window | null | undefined
): boolean {
  if (!config.downloadUrl) return false

  const openFn =
    opener ?? (typeof window !== 'undefined' ? window.open.bind(window) : undefined)
  if (!openFn) return false

  try {
    const openedWindow = openFn(config.downloadUrl, '_blank', 'noopener')
    return openedWindow != null
  } catch {
    return false
  }
}
