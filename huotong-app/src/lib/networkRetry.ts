import { showConfirmDialog } from 'vant'

const NETWORK_ERROR_PATTERNS = [
  'fetch',
  'network',
  'failed to fetch',
  'networkerror',
  'timeout',
  'timed out',
  'etimedout',
  'abort',
]

function toErrorText(error: unknown): string {
  if (!error) return ''
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message ?? ''
  if (typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message ?? '')
  }
  return String(error)
}

export function isNetworkError(error: unknown): boolean {
  const msg = toErrorText(error).toLowerCase()
  return NETWORK_ERROR_PATTERNS.some((pattern) => msg.includes(pattern))
}

export async function withNetworkRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (!isNetworkError(error) || attempt >= retries) {
        throw error
      }
    }
  }
  throw lastError
}

export interface RetryDialogOptions {
  title: string
  message: string
  confirmButtonText: string
  cancelButtonText?: string
}

export async function requestRetryOnNetworkError(
  error: unknown,
  options: RetryDialogOptions
): Promise<boolean> {
  if (!isNetworkError(error)) return false
  try {
    await showConfirmDialog({
      title: options.title,
      message: options.message,
      confirmButtonText: options.confirmButtonText,
      cancelButtonText: options.cancelButtonText ?? '取消',
    })
    return true
  } catch {
    return false
  }
}
