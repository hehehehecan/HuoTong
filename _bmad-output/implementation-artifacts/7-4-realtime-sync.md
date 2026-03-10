# Story 7.4: 实时数据同步

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 家人（用户）,
I want 当其他家人修改了数据后，我的页面能实时更新,
so that 多人同时使用时不会看到过期数据或产生操作冲突。

## Acceptance Criteria

1. **Given** 多个用户同时在线使用系统 **When** 用户 A 确认了一笔出货单 **Then** 用户 B 正在查看的商品库存、应收列表自动刷新为最新数据 **And** 无需用户 B 手动刷新页面。
2. **Given** Supabase Realtime 订阅已配置 **When** products、sale_orders、purchase_orders、receivables、payables 表发生变更 **Then** 所有在线用户的相关页面自动接收并展示最新数据。
3. **Given** 实时同步连接断开（网络不稳定） **When** 网络恢复 **Then** 自动重新建立 Realtime 连接，拉取最新数据。

## Tasks / Subtasks

- [x] Task 1：Supabase Realtime 启用与前端订阅基础设施 (AC: #2, #3)
  - [x] 1.1 确认或配置 Supabase 项目中表 products、sale_orders、purchase_orders、receivables、payables 已加入 Realtime publication（Dashboard → Database → Replication 或 SQL：`ALTER PUBLICATION supabase_realtime ADD TABLE ...`）；若项目已启用则仅做确认并记录。
  - [x] 1.2 在 `huotong-app/src/lib/` 下新增 `realtime.ts`（或扩展现有 supabase 相关模块），封装：创建单一 channel 订阅上述五张表的 `postgres_changes`（event: INSERT/UPDATE/DELETE），提供 `subscribeRealtimeTables(callback: () => void)` 或按表分别订阅并在变更时触发传入的 onInvalidate 回调；返回 unsubscribe 函数便于组件卸载时清理。
  - [x] 1.3 实现断线重连：Supabase Realtime 的 channel 状态为 CHANNEL_ERROR 或 CLOSED 时，自动重新 subscribe；重连成功后执行一次「拉取最新数据」的回调（如各 composable 的 refetch），确保页面数据与服务器一致。
- [x] Task 2：各业务 Composable 接入 Realtime 刷新 (AC: #1, #2)
  - [x] 2.1 在 `useProducts`（库存总览列表数据来源）、`useSaleOrders`、`usePurchaseOrders`、`useReceivables`、`usePayables` 中，在 fetch 数据后注册对对应表的 Realtime 订阅（products / sale_orders / purchase_orders / receivables / payables）；当收到 postgres_changes 时触发当前列表/详情的重新拉取（如调用现有 fetchAll、list、getById 等方法），使 ref 数据更新，视图自动响应。
  - [x] 2.2 确保订阅在 composable 的 onScopeDispose 或组件 onUnmounted 时取消，避免重复订阅与内存泄漏；若使用单一全局 channel，可在 App 或 MainLayout 层挂载一次，通过回调通知各 composable 刷新。
- [x] Task 3：库存、应收等关键页面验证 (AC: #1)
  - [x] 3.1 库存总览页（InventoryView）：当其他端修改了 products（或库存调整导致 stock 变化）时，当前端列表自动更新，无需下拉刷新。
  - [x] 3.2 应收/应付列表页：当其他端确认出货/进货或标记付款导致 receivables/payables 变更时，当前端列表自动更新。
  - [x] 3.3 出货单/进货单列表与详情：sale_orders/purchase_orders 变更时，列表与打开的详情自动反映最新状态。
- [x] Task 4：自测与验收 (AC: #1, #2, #3)
  - [x] 4.1 本地 `npm run build` 通过；未登录访问受保护路由被重定向到登录页。
  - [x] 4.2 已登录下打开库存总览（或应收列表），在另一浏览器/隐身窗口同账号或另一账号修改数据（如确认出货单、调整库存），确认本窗口列表在数秒内自动更新，无需手动刷新。
  - [x] 4.3 可选：断网后恢复，确认 Realtime 重连且数据再次拉取正确（可手动物理断网或 DevTools 限流模拟）。

## Dev Notes

- **架构依据**：Architecture 明确「实时同步使用 Supabase Realtime 订阅关键表变更」「订阅关键表：products, sale_orders, purchase_orders, receivables, payables」「使用 Supabase Realtime 的 Postgres Changes 功能」。本项目业务数据通过 Composables 从 Supabase 获取，不做全局缓存，Realtime 触发 refetch 即可保持数据新鲜。
- **与 7.1–7.3 关系**：7.1 库存总览、7.2 调整库存、7.3 变动记录均依赖 products/stock_logs 等表；本 Story 不改变现有接口，仅在这些 composable 使用的表发生服务端变更时触发重新拉取，保证多端一致。
- **Supabase Realtime**：需使用 `supabase.channel('unique-name').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, payload => { ... }).subscribe()`；多表可共用一个 channel 多次 `.on()` 或分 channel。RLS 已存在时，Realtime 会遵守同一 RLS 策略，仅推送当前用户有权看到的变化。
- **重连策略**：Supabase JS 客户端部分版本支持自动重连，若文档建议依赖客户端重连则可在重连后统一触发一次全量 refetch；否则在 channel 的 ERROR/CLOSED 回调里手动重新创建 channel 并 subscribe。

### Project Structure Notes

- 新建：`huotong-app/src/lib/realtime.ts`（或与 supabase 同目录）— Realtime 订阅封装与重连逻辑。
- 修改：`huotong-app/src/composables/useInventory.ts`、`useSaleOrders`、`usePurchaseOrders`、`useReceivables`、`usePayables`（或项目中等价 composable 名）— 在合适生命周期内注册/注销 Realtime 并 on 变更时 refetch。
- 若采用「根组件挂载单例 channel + 全局 onInvalidate」模式，可在 `MainLayout.vue` 或 `App.vue` 中调用 `subscribeRealtimeTables`，再通过 provide/inject 或 store 通知各 composable 执行 refetch。
- 视图层无需改结构，仅依赖现有 composable 的 ref 响应式更新即可。

### References

- [Source: _bmad-output/planning-artifacts/epics.md] Epic 7, Story 7.4 用户故事与 AC。
- [Source: _bmad-output/planning-artifacts/architecture.md] 实时同步策略、API 与 Communication 节；Realtime 使用 Postgres Changes。
- [Source: _bmad-output/implementation-artifacts/7-3-stock-logs.md] 前序 Story 7.3 的 composable 与视图约定、RLS 与路由。
- [Source: _bmad-output/project-context.md] Supabase 单例、composables 目录、Pinia 与路由约定；bootstrap 顺序勿破坏。
- [Source: Supabase Realtime 文档] Postgres Changes 订阅与 channel 生命周期、重连行为。

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

- Migration `enable_realtime_for_business_tables` 已应用；`npm run build` 与 `npm run test -- --run` 通过。
- CR 回归验证：`npm run test -- --run`（11 tests）与 `npm run build` 通过。

### Completion Notes List

- realtime.ts：单一 channel 订阅五表 postgres_changes，subscribeTable(table, onInvalidate) 供 composable 注册；CHANNEL_ERROR/CLOSED 时 2s 后重连并 notifyAll()。
- useProducts：onScopeDispose(subscribeTable('products', () => void refreshByCurrentQuery()))，表变更时自动刷新 products ref；有搜索词时保持当前搜索条件。
- useSaleOrders/usePurchaseOrders/useReceivables/usePayables：每实例维护 invalidateFns Set，subscribeTable 回调中 forEach(invalidateFns)；暴露 onInvalidate(fn)，列表页在 onScopeDispose(onInvalidate(loadList/loadData)) 中注册 refetch。
- SaleOrderListView、PurchaseOrderListView、ReceivablesView、PayablesView：增加 onInvalidate(loadList/loadData) 与 onScopeDispose 清理。
- CR 修复：`useProducts` 实时回调改为“按当前查询条件刷新”（有搜索词走 `search`，无搜索词走 `fetchAll`），避免实时更新打断用户搜索筛选。
- QA 补测：新增 `useProducts` 实时刷新回归测试，覆盖“搜索态保持过滤结果”与“非搜索态全量刷新”。

### File List

- huotong-app/src/lib/realtime.ts（新增）
- huotong-app/src/composables/useProducts.ts（修改：Realtime 订阅 + onScopeDispose）
- huotong-app/src/composables/useSaleOrders.ts（修改：subscribeTable + onInvalidate）
- huotong-app/src/composables/usePurchaseOrders.ts（修改：subscribeTable + onInvalidate）
- huotong-app/src/composables/useReceivables.ts（修改：subscribeTable + onInvalidate）
- huotong-app/src/composables/usePayables.ts（修改：subscribeTable + onInvalidate）
- huotong-app/src/views/SaleOrderListView.vue（修改：onInvalidate(loadList) + onScopeDispose）
- huotong-app/src/views/PurchaseOrderListView.vue（修改：onInvalidate(loadList) + onScopeDispose）
- huotong-app/src/views/ReceivablesView.vue（修改：onInvalidate(loadData) + onScopeDispose）
- huotong-app/src/views/PayablesView.vue（修改：onInvalidate(loadData) + onScopeDispose）
- supabase/migrations/*_enable_realtime_for_business_tables.sql（Supabase 项目内已应用）
- huotong-app/tests/api/useProducts.realtime.spec.ts（新增：实时刷新在搜索/非搜索场景的回归测试）

## Review Results

### Code Review Summary (2026-03-10)

- Reviewer: AI CR Agent
- Scope: Story 7.4 Realtime 订阅基础设施 + 相关 composable/view 接入 + 回归测试

### Findings

1. **Medium**：库存页在搜索状态下接收到 products Realtime 事件会直接 `fetchAll()`，导致搜索结果被重置，影响交互一致性。
   - 处理结果：已修复（改为按当前查询条件刷新）。
2. **Medium**：缺少 Realtime 核心行为自动化回归（尤其是搜索态刷新策略），后续重构存在回归风险。
   - 处理结果：已修复（新增 `useProducts.realtime` 单测覆盖关键路径）。
3. **Low**：Story 文档未包含本轮 CR 发现与修复记录。
   - 处理结果：已补充 Review Results、修复说明与测试记录。
