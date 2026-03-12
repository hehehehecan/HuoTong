/**
 * Supabase Realtime 订阅封装（Story 7-4）
 * 单一 channel 订阅 products、sale_orders、purchase_orders、receivables、payables，
 * 支持按表注册 onInvalidate 回调，断线自动重连后触发一次全表刷新。
 */
import { supabase } from './supabase'
import { platformConfig } from './platform'
import type { RealtimeChannel } from '@supabase/supabase-js'

const REALTIME_TABLES = [
  'products',
  'sale_orders',
  'purchase_orders',
  'receivables',
  'payables',
] as const

type RealtimeTable = (typeof REALTIME_TABLES)[number]

const tableCallbacks = new Map<RealtimeTable, Set<() => void>>()
let channel: RealtimeChannel | null = null
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
const RECONNECT_DELAY_MS = 2000
const NOOP_UNSUBSCRIBE = () => {}

function notifyTable(table: RealtimeTable): void {
  tableCallbacks.get(table)?.forEach((cb) => {
    try {
      cb()
    } catch (e) {
      console.warn('[realtime] callback error for table', table, e)
    }
  })
}

function notifyAll(): void {
  REALTIME_TABLES.forEach((t) => notifyTable(t))
}

function subscribeChannel(): RealtimeChannel {
  if (channel) return channel

  const ch = supabase
    .channel('business-tables-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'products' },
      () => notifyTable('products')
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sale_orders' },
      () => notifyTable('sale_orders')
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'purchase_orders' },
      () => notifyTable('purchase_orders')
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'receivables' },
      () => notifyTable('receivables')
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'payables' },
      () => notifyTable('payables')
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
        channel = null
        if (reconnectTimeout) clearTimeout(reconnectTimeout)
        reconnectTimeout = setTimeout(() => {
          reconnectTimeout = null
          subscribeChannel()
          notifyAll()
        }, RECONNECT_DELAY_MS)
      }
    })

  channel = ch
  return ch
}

/**
 * 订阅指定表的 Realtime 变更，收到变更时调用 onInvalidate（通常用于 refetch）。
 * 返回取消订阅函数，组件 onUnmounted / onScopeDispose 时调用。
 */
export function subscribeTable(
  table: RealtimeTable,
  onInvalidate: () => void
): () => void {
  if (!platformConfig.realtimeEnabled) {
    // Android 首版默认关闭 Realtime 时统一 no-op，调用方无需感知分支。
    return NOOP_UNSUBSCRIBE
  }

  if (!tableCallbacks.has(table)) {
    tableCallbacks.set(table, new Set())
  }
  tableCallbacks.get(table)!.add(onInvalidate)
  subscribeChannel()

  return () => {
    tableCallbacks.get(table)?.delete(onInvalidate)
  }
}
