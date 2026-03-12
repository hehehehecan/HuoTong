import { onScopeDispose, watch, type Ref } from 'vue'
import { registerBackButtonHandler } from '../lib/backButton'

export function useBackButtonPopup(showRef: Ref<boolean>, close: () => void, priority = 300): void {
  let unregister: (() => void) | null = null

  const stop = watch(
    showRef,
    (visible) => {
      if (visible && !unregister) {
        unregister = registerBackButtonHandler(() => {
          if (!showRef.value) return false
          close()
          return true
        }, priority)
        return
      }

      if (!visible && unregister) {
        unregister()
        unregister = null
      }
    },
    { immediate: true }
  )

  onScopeDispose(() => {
    stop()
    if (unregister) {
      unregister()
      unregister = null
    }
  })
}
