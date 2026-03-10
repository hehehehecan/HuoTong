# Story 6.2: 应付账款列表与汇总

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 家人（用户），
I want 查看所有供应商的应付账款，按供应商汇总欠款金额，
so that 供应商来结账时能快速查看应付明细。

## Acceptance Criteria

1. **Given** 系统中已有进货单确认后自动生成的应付记录
   **When** 用户进入「应付账款」页面
   **Then** 显示按供应商汇总的欠款列表，每条显示供应商名、总欠款金额、未付单据数量
   **And** 按总欠款金额降序排列

2. **Given** 用户点击某供应商的欠款汇总
   **When** 展开该供应商的详细列表
   **Then** 显示该供应商所有未付/部分付的应付记录，每条显示关联进货单号、金额、已付金额、状态、日期

## Tasks / Subtasks

- [x] Task 1 (AC: #1 前置) — 确认 payables 表已存在
  - [x] 1.1 确认 Supabase 中 payables 表已在 Story 5.2 中创建（id, purchase_order_id, supplier_id, amount, paid_amount, status, created_at, updated_at）
  - [x] 1.2 确认 RLS 策略已配置，允许已登录用户读取 payables 数据

- [x] Task 2 (AC: #1) — 创建 usePayables composable
  - [x] 2.1 在 `huotong-app/src/composables/` 创建 `usePayables.ts`
  - [x] 2.2 定义 Payable 接口（id, purchase_order_id, supplier_id, amount, paid_amount, status, created_at, updated_at）
  - [x] 2.3 定义 SupplierPayableSummary 接口（supplier_id, supplier_name, total_amount, total_paid, unpaid_count）
  - [x] 2.4 实现 `listGroupedBySupplier()` 方法：查询 payables 表，按 supplier_id 分组汇总，返回按总欠款降序排列的供应商汇总列表
  - [x] 2.5 实现 `listBySupplier(supplierId: string)` 方法：查询指定供应商的所有未付/部分付应付记录，按日期倒序

- [x] Task 3 (AC: #1, #2) — 创建应付账款页面 PayablesView
  - [x] 3.1 在 `huotong-app/src/views/` 创建 `PayablesView.vue`
  - [x] 3.2 页面顶部显示标题「应付账款」
  - [x] 3.3 使用 van-collapse 或 van-cell-group 展示按供应商汇总的列表，每条显示：供应商名、总欠款金额（amount - paid_amount 之和）、未付单据数量
  - [x] 3.4 点击某供应商行展开详细列表，显示该供应商的每条应付记录：进货单号（关联 purchase_orders.order_no）、金额、已付金额、状态（unpaid/partial/paid）、日期
  - [x] 3.5 支持下拉刷新（van-pull-refresh）
  - [x] 3.6 空状态：若无应付记录，显示「暂无应付账款」

- [x] Task 4 — 路由配置与导航
  - [x] 4.1 在 `router/index.ts` 添加 `/payables` 路由，component 为 PayablesView，meta title 为「应付账款」
  - [x] 4.2 在首页 HomeView 添加快捷入口「查应付」，点击跳转 `/payables`

## Dev Notes

- **本 Story 范围**：应付账款列表页（按供应商汇总 + 展开详情），不含付款操作（Story 6.3）、不含跳转原始单据（Story 6.4）。
- **数据来源**：payables 表已在 Story 5.2 通过 `confirm_purchase_order` RPC 自动生成记录；本 Story 仅做读取展示。
- **汇总逻辑**：按 supplier_id 分组，计算每个供应商的：
  - 总欠款 = SUM(amount - paid_amount) WHERE status IN ('unpaid', 'partial')
  - 未付单据数 = COUNT(*) WHERE status IN ('unpaid', 'partial')
- **展开详情**：显示该供应商所有 status IN ('unpaid', 'partial') 的 payables 记录，关联 purchase_orders 获取 order_no。
- **UI 组件**：与 6.1 应收账款一致，使用 Vant 的 van-collapse + van-collapse-item；每个 collapse-item 的 title 显示供应商汇总信息，展开后显示该供应商的应付明细列表。
- **手风琴行为**：仅在展开某供应商时请求该供应商的明细（`listBySupplier(supplierId)`）；折叠关闭时 `activeName` 会变为空，**不要**用空 supplierId 调用 `listBySupplier`，避免无效请求与错误提示（与 6.1 CR 修复一致，参见 6-1 的 onCollapseChange 中 `if (!customerId) return`）。
- **金额格式化**：所有金额显示保留两位小数，使用 `toFixed(2)` 或封装的格式化函数。
- **空状态处理**：若 payables 表无任何记录或所有记录 status='paid'，显示「暂无应付账款」或「所有账款已结清」（可选）。

### Project Structure Notes

- **Composable**：`huotong-app/src/composables/usePayables.ts` — 新建
- **View**：`huotong-app/src/views/PayablesView.vue` — 新建
- **Router**：`huotong-app/src/router/index.ts` — 修改（新增 /payables 路由）
- **HomeView**：`huotong-app/src/views/HomeView.vue` — 修改（新增「查应付」快捷入口）
- **数据库**：无需新建表或 migration，payables 表已存在

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 6 - Story 6.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture - payables 表结构]
- [Source: _bmad-output/implementation-artifacts/5-2-purchase-order-confirm.md#confirm_purchase_order RPC 自动生成 payables 记录]
- [Source: _bmad-output/implementation-artifacts/6-1-receivables-list.md#同模式实现参考]

---

## Developer Context (Guardrails)

### Technical Requirements

- **payables 表结构**（已存在，Story 5.2）：
  - id: uuid (PK)
  - purchase_order_id: uuid (FK → purchase_orders)
  - supplier_id: uuid (FK → suppliers)
  - amount: decimal（应付金额）
  - paid_amount: decimal（已付金额，默认 0）
  - status: text（unpaid/partial/paid）
  - created_at: timestamptz
  - updated_at: timestamptz

- **汇总查询**：与 useReceivables 一致，推荐前端汇总：
  1. 查询所有 status IN ('unpaid', 'partial') 的 payables，join suppliers 获取供应商名
  2. 前端按 supplier_id 分组，计算每组的 total_unpaid 和 count
  3. 按 total_unpaid 降序排序后渲染

- **关联查询**：获取 order_no 需 join purchase_orders 表；获取 supplier_name 需 join suppliers 表。

### Architecture Compliance

- 前端：Vue 3 + Vite + TypeScript，Vant 4
- 仅从 `src/lib/supabase.ts` 导入 supabase 实例
- Composable 在 `src/composables/`，视图在 `src/views/`
- 错误处理：统一 Toast 中文；网络错误可重试 1 次

### Library & Framework Requirements

| 依赖 | 用途 |
|------|------|
| @supabase/supabase-js | 查询 payables、purchase_orders、suppliers |
| vant | Collapse、CollapseItem、Cell、CellGroup、PullRefresh、Empty、Toast |

### File Structure Requirements

- `huotong-app/src/composables/usePayables.ts` — 新建：Payable 接口、SupplierPayableSummary 接口、listGroupedBySupplier、listBySupplier
- `huotong-app/src/views/PayablesView.vue` — 新建：应付账款列表页
- `huotong-app/src/router/index.ts` — 修改：新增 /payables 路由指向 PayablesView
- `huotong-app/src/views/HomeView.vue` — 修改：新增「查应付」按钮跳转 /payables
- `huotong-app/src/main.ts` — 若尚未注册 Collapse/CollapseItem/Empty，需注册（与 6.1 共用，可能已注册）

### Testing Requirements

- 进入 `/payables` 页面，显示按供应商汇总的应付列表（供应商名、总欠款、未付单据数），按总欠款降序排列
- 点击某供应商行，展开显示该供应商的应付明细（进货单号、金额、已付金额、状态、日期）
- 金额显示保留两位小数
- 下拉刷新后数据更新
- 无应付记录时显示空状态「暂无应付账款」
- `npm run build` 无错误
- 首页「查应付」快捷入口点击后正确跳转到 `/payables`

---

## Previous Story Intelligence

- **6.1 应收账款**：已实现 useReceivables（listGroupedByCustomer、listByCustomer）、ReceivablesView（van-collapse 按客户汇总+展开明细）、/receivables 路由、首页「查应收」。本 Story 完全镜像该模式，将「客户→供应商」「receivables→payables」「sale_orders→purchase_orders」「order_no 来自 sale_orders→来自 purchase_orders」替换即可。
- **5.2 进货单确认**：confirm_purchase_order RPC 在确认进货单时自动在 payables 表生成一条记录（amount = 进货单总金额，paid_amount = 0，status = 'unpaid'）。
- **现有 Composables**：useReceivables 可作 usePayables 的参考模板（withRetry、loading、错误处理、分组汇总逻辑）。
- **路由**：当前无 /payables 路由，需新增并挂载 PayablesView。
- **6.1 CR 修复**：ReceivablesView 在 onCollapseChange 中若 `name` 为空（折叠关闭）则直接 return，不请求 listByCustomer。PayablesView 实现时应对 listBySupplier 做同样防护（仅当 activeName 为有效 supplierId 时才请求明细）。

---

## Project Context Reference

- [Source: _bmad-output/project-context.md] — Vue 3.5+、Vite 7.x、Vant 4.9+、Pinia、Vue Router、Supabase 单例从 `src/lib/supabase.ts` 导入；Toast 中文；网络错误重试 1 次；新 Vant 组件需在 main.ts 注册（Collapse 等若 6.1 已注册则无需重复）；路由默认需登录。

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

(无)

### Completion Notes List

- usePayables.ts：新建 composable，含 Payable、PayableWithOrder、PayableWithSupplier、SupplierPayableSummary 接口；listGroupedBySupplier() 查询未付/部分付应付并按供应商分组汇总、按总欠款降序；listBySupplier(supplierId) 查询指定供应商的应付明细并关联 purchase_orders 获取 order_no。
- PayablesView.vue：新建应付账款页面，使用 van-collapse 展示按供应商汇总列表，展开显示该供应商的应付明细（进货单号、金额、已付、状态、日期）；下拉刷新；空状态「暂无应付账款」；onCollapseChange 仅在有 supplierId 时请求明细（与 6.1 一致）。
- router/index.ts：新增 /payables 路由指向 PayablesView。
- HomeView.vue：新增「查应付」按钮跳转 /payables。
- 自测：npm run build 通过；未登录访问会重定向到登录页；登录后访问 /payables 可看到空状态或列表。
- CR 结论：未发现 High/Medium/Low 级问题；构建与类型检查通过，按流程收口并同步状态。

### File List

- huotong-app/src/composables/usePayables.ts（新建）
- huotong-app/src/views/PayablesView.vue（新建）
- huotong-app/src/router/index.ts（修改）
- huotong-app/src/views/HomeView.vue（修改）

### Change Log

- 2026-03-10：完成 Story 6.2 实现；新建 usePayables、PayablesView；新增 /payables 路由与首页「查应付」入口；状态更新为 review。
- 2026-03-10：完成 Code Review；未发现需修复问题；状态更新为 done。
