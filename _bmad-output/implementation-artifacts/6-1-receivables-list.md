# Story 6.1: 应收账款列表与汇总

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 母亲（用户），
I want 查看所有客户的应收账款，按客户汇总欠款金额，
so that 月底对账催款时有清晰的数据依据。

## Acceptance Criteria

1. **Given** 系统中已有出货单确认后自动生成的应收记录
   **When** 用户进入「应收账款」页面
   **Then** 显示按客户汇总的欠款列表，每条显示客户名、总欠款金额、未付单据数量
   **And** 按总欠款金额降序排列

2. **Given** 用户点击某客户的欠款汇总
   **When** 展开该客户的详细列表
   **Then** 显示该客户所有未付/部分付的应收记录，每条显示关联出货单号、金额、已付金额、状态、日期

## Tasks / Subtasks

- [x] Task 1 (AC: #1 前置) — 确认 receivables 表已存在
  - [x] 1.1 确认 Supabase 中 receivables 表已在 Story 4.2 中创建（id, sale_order_id, customer_id, amount, paid_amount, status, created_at, updated_at）
  - [x] 1.2 确认 RLS 策略已配置，允许已登录用户读取 receivables 数据

- [x] Task 2 (AC: #1) — 创建 useReceivables composable
  - [x] 2.1 在 `huotong-app/src/composables/` 创建 `useReceivables.ts`
  - [x] 2.2 定义 Receivable 接口（id, sale_order_id, customer_id, amount, paid_amount, status, created_at, updated_at）
  - [x] 2.3 定义 CustomerReceivableSummary 接口（customer_id, customer_name, total_amount, total_paid, unpaid_count）
  - [x] 2.4 实现 `listGroupedByCustomer()` 方法：查询 receivables 表，按 customer_id 分组汇总，返回按总欠款降序排列的客户汇总列表
  - [x] 2.5 实现 `listByCustomer(customerId: string)` 方法：查询指定客户的所有未付/部分付应收记录，按日期倒序

- [x] Task 3 (AC: #1, #2) — 创建应收账款页面 ReceivablesView
  - [x] 3.1 在 `huotong-app/src/views/` 创建 `ReceivablesView.vue`
  - [x] 3.2 页面顶部显示标题「应收账款」
  - [x] 3.3 使用 van-collapse 或 van-cell-group 展示按客户汇总的列表，每条显示：客户名、总欠款金额（amount - paid_amount 之和）、未付单据数量
  - [x] 3.4 点击某客户行展开详细列表，显示该客户的每条应收记录：出货单号（关联 sale_orders.order_no）、金额、已付金额、状态（unpaid/partial/paid）、日期
  - [x] 3.5 支持下拉刷新（van-pull-refresh）
  - [x] 3.6 空状态：若无应收记录，显示「暂无应收账款」

- [x] Task 4 — 路由配置与导航
  - [x] 4.1 更新 `router/index.ts`，将 `/receivables` 路由的 component 从 PlaceholderView 改为 ReceivablesView
  - [x] 4.2 确认首页「查应收」快捷入口已指向 `/receivables`

## Dev Notes

- **本 Story 范围**：应收账款列表页（按客户汇总 + 展开详情），不含付款操作（Story 6.3）、不含跳转原始单据（Story 6.4）。
- **数据来源**：receivables 表已在 Story 4.2 通过 `confirm_sale_order` RPC 自动生成记录；本 Story 仅做读取展示。
- **汇总逻辑**：按 customer_id 分组，计算每个客户的：
  - 总欠款 = SUM(amount - paid_amount) WHERE status IN ('unpaid', 'partial')
  - 未付单据数 = COUNT(*) WHERE status IN ('unpaid', 'partial')
- **展开详情**：显示该客户所有 status IN ('unpaid', 'partial') 的 receivables 记录，关联 sale_orders 获取 order_no。
- **UI 组件**：使用 Vant 的 van-collapse + van-collapse-item 实现折叠展开效果；每个 collapse-item 的 title 显示客户汇总信息，展开后显示该客户的应收明细列表。
- **金额格式化**：所有金额显示保留两位小数，使用 `toFixed(2)` 或封装的格式化函数。
- **空状态处理**：
  - 若 receivables 表无任何记录 → 显示「暂无应收账款」
  - 若所有记录 status='paid' → 显示「所有账款已结清」（可选优化）

### Project Structure Notes

- **Composable**：`huotong-app/src/composables/useReceivables.ts` — 新建
- **View**：`huotong-app/src/views/ReceivablesView.vue` — 新建
- **Router**：`huotong-app/src/router/index.ts` — 修改（替换 PlaceholderView）
- **数据库**：无需新建表或 migration，receivables 表已存在

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 6 - Story 6.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture - receivables 表结构]
- [Source: _bmad-output/implementation-artifacts/4-2-sale-order-confirm.md#confirm_sale_order RPC 自动生成 receivables 记录]
- [Source: _bmad-output/project-context.md#Supabase 单例、Vant、Toast 中文]

---

## Developer Context (Guardrails)

### Technical Requirements

- **receivables 表结构**（已存在）：
  - id: uuid (PK)
  - sale_order_id: uuid (FK → sale_orders)
  - customer_id: uuid (FK → customers)
  - amount: decimal（应收金额）
  - paid_amount: decimal（已付金额，默认 0）
  - status: text（unpaid/partial/paid）
  - created_at: timestamptz
  - updated_at: timestamptz

- **汇总查询**：考虑到数据量小（数十条 receivables），推荐前端汇总以简化实现：
  1. 查询所有 status IN ('unpaid', 'partial') 的 receivables，join customers 获取客户名
  2. 前端按 customer_id 分组，计算每组的 total_unpaid 和 count
  3. 按 total_unpaid 降序排序后渲染

- **关联查询**：获取 order_no 需 join sale_orders 表；获取 customer_name 需 join customers 表。

### Architecture Compliance

- 前端：Vue 3 + Vite + TypeScript，Vant 4
- 仅从 `src/lib/supabase.ts` 导入 supabase 实例
- Composable 在 `src/composables/`，视图在 `src/views/`
- 错误处理：统一 Toast 中文；网络错误可重试 1 次

### Library & Framework Requirements

| 依赖 | 用途 |
|------|------|
| @supabase/supabase-js | 查询 receivables、sale_orders、customers |
| vant | Collapse、CollapseItem、Cell、CellGroup、PullRefresh、Empty、Toast |

### File Structure Requirements

- `huotong-app/src/composables/useReceivables.ts` — 新建：Receivable 接口、CustomerReceivableSummary 接口、listGroupedByCustomer、listByCustomer
- `huotong-app/src/views/ReceivablesView.vue` — 新建：应收账款列表页
- `huotong-app/src/router/index.ts` — 修改：/receivables 路由指向 ReceivablesView
- `huotong-app/src/main.ts` — 可能修改：若使用新 Vant 组件需注册

### Testing Requirements

- 进入 `/receivables` 页面，显示按客户汇总的应收列表（客户名、总欠款、未付单据数），按总欠款降序排列
- 点击某客户行，展开显示该客户的应收明细（出货单号、金额、已付金额、状态、日期）
- 金额显示保留两位小数
- 下拉刷新后数据更新
- 无应收记录时显示空状态「暂无应收账款」
- `npm run build` 无错误
- 首页「查应收」快捷入口点击后正确跳转到 `/receivables`

---

## Previous Story Intelligence

- **4.2 出货单确认**：confirm_sale_order RPC 在确认出货单时自动在 receivables 表生成一条记录（amount = 出货单总金额，paid_amount = 0，status = 'unpaid'）。
- **5.2 进货单确认**：类似地，confirm_purchase_order 在 payables 表生成应付记录。
- **现有 Composables**：useSaleOrders、usePurchaseOrders、useCustomers、useSuppliers、useProducts 已建立，可参考其模式（loading ref、withRetry、错误处理）。
- **路由**：/receivables 路由已存在但指向 PlaceholderView，需替换为真实页面。

---

## Project Context Reference

- [Source: _bmad-output/project-context.md] — Vue 3.5+、Vite 7.x、Vant 4.9+、Pinia、Vue Router、Supabase 单例从 `src/lib/supabase.ts` 导入；Toast 中文；网络错误重试 1 次；新 Vant 组件需在 main.ts 注册；路由默认需登录。

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

(无)

### Completion Notes List

- useReceivables.ts：新建 composable，包含 Receivable、ReceivableWithOrder、ReceivableWithCustomer、CustomerReceivableSummary 接口；listGroupedByCustomer() 查询未付/部分付应收并按客户分组汇总、按总欠款降序排列；listByCustomer(customerId) 查询指定客户的应收明细并关联 sale_orders 获取 order_no。
- ReceivablesView.vue：新建应收账款页面，使用 van-collapse 展示按客户汇总的列表，点击展开显示该客户的应收明细（出货单号、金额、已付、状态、日期）；支持下拉刷新；空状态显示「暂无应收账款」。
- router/index.ts：将 /receivables 路由从 PlaceholderView 改为 ReceivablesView。
- main.ts：注册 Vant Collapse、CollapseItem、Empty 组件。
- 自测：`npm run build` 通过；浏览器访问 /receivables 正常显示空状态；控制台无错误。
- CR 修复：修正手风琴折叠在关闭场景下可能触发空 customerId 查询的问题，避免无效请求与错误提示。

### File List

- huotong-app/src/composables/useReceivables.ts（新建）
- huotong-app/src/views/ReceivablesView.vue（新建）
- huotong-app/src/router/index.ts（修改）
- huotong-app/src/main.ts（修改）

### Change Log

- 2026-03-10：完成 Story 6.1 实现；新建 useReceivables composable 和 ReceivablesView 页面；状态更新为 review。
- 2026-03-10：完成 Code Review；修复折叠关闭时空 customerId 查询；状态更新为 done。
