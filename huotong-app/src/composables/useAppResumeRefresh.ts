import { onScopeDispose } from 'vue'
import { onAppResume } from '../lib/appLifecycle'

export function useAppResumeRefresh(
  refresh: () => Promise<void>,
  onError?: () => void
): void {
  onScopeDispose(
    onAppResume(() => {
      void refresh().catch(() => {
        onError?.()
      })
    })
  )
}
