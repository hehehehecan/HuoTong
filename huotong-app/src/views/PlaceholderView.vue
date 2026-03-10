<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const title = computed(() => (route.meta.title as string) ?? '')
const message = computed(() => (route.meta.message as string) ?? '功能开发中，敬请期待')
</script>

<template>
  <div class="placeholder">
    <p class="placeholder-title">{{ title }}</p>
    <p class="placeholder-message">{{ message }}</p>
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
</style>
