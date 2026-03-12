<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  showLoadingToast,
  showSuccessToast,
  showFailToast,
  closeToast,
  showConfirmDialog,
} from 'vant'
import { exportDataAsJson } from '../composables/useExportData'
import { platformConfig } from '../lib/platform'
import { getAppVersionInfo } from '../lib/appInfo'
import {
  apkDistributionConfig,
  getApkUpdateMessage,
  openApkDownloadEntry,
} from '../lib/apkDistribution'
import { getFamilyOnboardingMessage } from '../lib/accountOnboarding'
import { getAndroidFeedbackMessage } from '../lib/androidFeedback'

const route = useRoute()
const router = useRouter()
const title = computed(() => (route.meta.title as string) ?? '')
const message = computed(() => (route.meta.message as string) ?? '功能开发中，敬请期待')
const isMorePage = computed(() => route.path === '/more')
const exporting = ref(false)
const appVersionLabel = ref('读取中...')
const apkVersionLabel = computed(() => `推荐 ${apkDistributionConfig.latestVersion}`)
const downloadUrlLabel = computed(() =>
  apkDistributionConfig.downloadUrl ? apkDistributionConfig.downloadUrl : '未配置下载链接'
)

function goToStock() {
  router.push('/stock')
}

async function handleExportData() {
  if (!platformConfig.webExportDownloadEnabled) {
    showFailToast(platformConfig.featureTips.exportDownload)
    return
  }
  if (exporting.value) return
  exporting.value = true
  showLoadingToast({ message: '正在导出…', duration: 0 })
  try {
    await exportDataAsJson()
    closeToast()
    showSuccessToast('导出成功')
  } catch {
    closeToast()
    showFailToast('导出失败，请重试')
  } finally {
    exporting.value = false
  }
}

function handleDownloadApk() {
  const opened = openApkDownloadEntry()
  if (!opened) {
    showFailToast('下载入口暂未配置，请联系维护者')
  }
}

async function handleShowUpdateNotes() {
  await showConfirmDialog({
    title: '更新说明与安装步骤',
    message: getApkUpdateMessage(),
    confirmButtonText: '我知道了',
    showCancelButton: false,
    closeOnClickOverlay: true,
  })
}

async function handleShowFamilyOnboarding() {
  await showConfirmDialog({
    title: '首次安装与登录指引',
    message: getFamilyOnboardingMessage(),
    confirmButtonText: '我知道了',
    showCancelButton: false,
    closeOnClickOverlay: true,
  })
}

async function handleShowFeedbackTemplate() {
  await showConfirmDialog({
    title: '问题反馈模板',
    message: getAndroidFeedbackMessage(),
    confirmButtonText: '我知道了',
    showCancelButton: false,
    closeOnClickOverlay: true,
  })
}

onMounted(async () => {
  if (!isMorePage.value) return
  const info = await getAppVersionInfo()
  appVersionLabel.value = info.label
})
</script>

<template>
  <div class="placeholder">
    <p class="placeholder-title">{{ title }}</p>
    <p class="placeholder-message">{{ message }}</p>
    <div v-if="isMorePage" class="shortcuts">
      <van-cell title="库存总览" is-link @click="goToStock" />
      <van-cell title="当前版本" :value="appVersionLabel" />
      <van-cell
        title="下载更新包"
        is-link
        :value="apkVersionLabel"
        :label="downloadUrlLabel"
        @click="handleDownloadApk"
      />
      <van-cell
        title="更新说明"
        is-link
        label="查看本次更新内容与安装步骤"
        @click="handleShowUpdateNotes"
      />
      <van-cell
        title="首次安装与登录指引"
        is-link
        label="安装步骤、登录方式、忘记密码与常见问题"
        @click="handleShowFamilyOnboarding"
      />
      <van-cell
        title="问题反馈模板"
        is-link
        label="反馈请包含版本号、机型、网络环境和复现步骤"
        @click="handleShowFeedbackTemplate"
      />
      <van-cell
        v-if="platformConfig.webExportDownloadEnabled"
        title="导出数据"
        is-link
        :disabled="exporting"
        @click="handleExportData"
      />
      <van-cell
        v-else
        title="导出数据（暂不开放）"
        :label="platformConfig.featureTips.exportDownload"
      />
    </div>
  </div>
</template>

<style scoped>
.placeholder {
  padding: 2rem 1rem;
  text-align: center;
  font-size: 16px;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.placeholder-title {
  font-weight: 600;
  font-size: 1.125rem;
}
.placeholder-message {
  color: var(--van-gray-6, #969799);
}

.shortcuts {
  margin-top: 1.5rem;
  width: 100%;
  max-width: 400px;
}
</style>
