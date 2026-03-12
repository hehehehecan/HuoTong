const envFlagEnabled = (value: string | undefined, defaultValue = true): boolean => {
  if (value === undefined || value === '') return defaultValue
  return value.toLowerCase() !== 'false'
}

export const platformConfig = {
  realtimeEnabled: envFlagEnabled(import.meta.env.VITE_REALTIME_ENABLED, true),
  receiptRecognitionEnabled: envFlagEnabled(
    import.meta.env.VITE_RECEIPT_RECOGNITION_ENABLED,
    true
  ),
}
