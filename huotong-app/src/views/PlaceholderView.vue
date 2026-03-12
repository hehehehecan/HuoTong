<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showLoadingToast, showSuccessToast, showFailToast, closeToast } from 'vant'
import { exportDataAsJson } from '../composables/useExportData'
import { platformConfig } from '../lib/platform'

const route = useRoute()
const router = useRouter()
const title = computed(() => (route.meta.title as string) ?? '')
const message = computed(() => (route.meta.message as string) ?? '功能开发中，敬请期待')
const isMorePage = computed(() => route.path === '/more')
const exporting = ref(false)

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
</script>

<template>
  <div class="placeholder">
    <p class="placeholder-title">{{ title }}</p>
    <p class="placeholder-message">{{ message }}</p>
    <div v-if="isMorePage" class="shortcuts">
      <van-cell title="库存总览" is-link @click="goToStock" />
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
