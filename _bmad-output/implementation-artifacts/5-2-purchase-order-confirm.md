# Story 5.2: 进货单确认与级联操作

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 父亲（用户），
I want 确认进货单后系统自动增加库存和生成应付记录，
so that 进货数据自动联动，无需手动更新库存和账款。

## Acceptance Criteria

1. **Given** Supabase 中已创建以下表及 RLS 策略：
   - `payables` 表（id uuid PK, purchase_order_id uuid FK→purchase_orders, supplier_id uuid FK→suppliers, amount decimal, paid_amount decimal DEFAULT 0, status text DEFAULT 'unpaid', created_at timestamptz, updated_at timestamptz）
   - `stock_logs` 表已在 Story 4.2 中创建，可直接使用
   - PostgreSQL Function `confirm_purchase_order(order_id uuid)` 已通过 SQL migration 在 Supabase 中创建，函数在同一事务中：① 更新进货单状态、② 增加库存并写入 stock_logs、③ 在 payables 中生成应付记录
   **When** 开发者确认上述数据库对象均已部署
   **Then** 本 Story 的业务功能可以正确运行

2. **Given** 用户已创建好进货单（选择了供应商、添加了商品条目）
   **When** 点击「确认进货」
   **Then** 弹出二次确认弹窗，显示进货单摘要（供应商、商品数、总金额）

3. **Given** 用户在确认弹窗中点击「确认」
   **When** 系统调用 Supabase Database Function `confirm_purchase_order`
   **Then** 在同一数据库事务中完成：
   - 进货单状态从 draft 更新为 confirmed
   - 相关商品库存自动增加
   - stock_logs 表记录每个商品的库存变动
   - payables 表自动生成一条应付记录（金额=进货单总金额，状态=unpaid）
   **And** 操作成功后显示「进货单已确认」，跳转到进货单详情页
   **And** 从用户点击「确认」到页面显示「进货单已确认」的总耗时 < 3 秒（正常网络条件下）

4. **Given** 确认操作过程中出现网络或数据库错误
   **When** 事务执行失败
   **Then** 所有操作回滚，数据保持一致，显示「操作失败，请重试」

## Tasks / Subtasks

- [x] Task 1 (AC: #1) — 数据库表与 confirm_purchase_order 函数
  - [x] 1.1 在 Supabase 中创建 `payables` 表（id, purchase_order_id FK→purchase_orders, supplier_id FK→suppliers, amount, paid_amount DEFAULT 0, status DEFAULT 'unpaid', created_at, updated_at）；配置 RLS（已认证用户可 CRUD）
  - [x] 1.2 创建 PostgreSQL 函数 `confirm_purchase_order(order_id uuid)`：同一事务内 ① 校验订单存在且 status='draft' ② 更新 purchase_orders.status='confirmed' ③ 对每条 purchase_order_items 增加 products.stock 并 INSERT stock_logs（reason='purchase_order', reference_id=order_id, change 为正数, balance 为变动后余额）④ INSERT payables（purchase_order_id, supplier_id, amount=订单 total_amount, status='unpaid'）；失败时回滚
- [x] Task 2 (AC: #2, #3) — 前端「确认进货」与 RPC 调用
  - [x] 2.1 在进货单详情页提供「确认进货」按钮；仅当订单状态为 draft 且至少一条有效商品条目时可用
  - [x] 2.2 点击「确认进货」时弹出二次确认弹窗（Vant Dialog），显示进货单摘要（供应商名、商品条数、总金额）；用户确认后再调用 RPC
  - [x] 2.3 在 usePurchaseOrders 中新增 confirm(orderId)：调用 supabase.rpc('confirm_purchase_order', { order_id: orderId })；成功时返回，前端 Toast「进货单已确认」并留在详情页刷新状态；网络错误重试 1 次，错误用 Toast 中文提示
  - [x] 2.4 增加 getItemsWithProduct(orderId) 用于详情展示商品明细（商品名、规格、数量、单价、小计）
- [x] Task 3 (AC: #3) — 进货单详情页增强（最小可用）
  - [x] 3.1 在 `PurchaseOrderDetailView.vue` 展示单号、供应商名、商品条目列表、总金额、状态、创建时间；draft 显示「确认进货」，confirmed 状态只读
  - [x] 3.2 确认成功后刷新详情页，用户可见已确认状态；应付记录可在后续 Epic 6 中查看
- [x] Task 4 (AC: #4) — 错误与回滚
  - [x] 4.1 确认操作网络或数据库错误时，Toast「操作失败，请重试」；前端不做本地状态伪更新，由数据库事务保证回滚一致性

## Dev Notes

- **本 Story 范围**：进货单确认、数据库级联（增库存 + 写 stock_logs + 生成应付）、前端确认按钮与二次确认弹窗、最小详情展示增强。
- **依赖**：Story 5.1 已完成（purchase_orders、purchase_order_items、usePurchaseOrders.createDraft、创建页）；本 Story 新增 payables、confirm_purchase_order、详情页确认流程。
- **架构**：级联操作必须在数据库事务中完成（PostgreSQL 函数），前端只调用 RPC，不在前端分别写 products/stock_logs/payables。

### Project Structure Notes

- **Composable**：在 `huotong-app/src/composables/usePurchaseOrders.ts` 新增：
  - `getItemsWithProduct(orderId: string)`（select `purchase_order_items` + `products(name, spec)`）
  - `confirm(orderId: string)`（RPC `confirm_purchase_order`）
  - 可选错误解析辅助（保持与 `useSaleOrders` 风格一致）
- **视图**：`huotong-app/src/views/PurchaseOrderDetailView.vue` 从占位升级为最小可用详情页：草稿态可确认，确认后只读。
- **数据库**：通过 Supabase migration 创建 `payables` 与 `confirm_purchase_order`；`stock_logs` 复用已存在结构。

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.2: 进货单确认与级联操作]
- [Source: _bmad-output/planning-artifacts/architecture.md#单据确认的级联操作]
- [Source: _bmad-output/implementation-artifacts/5-1-purchase-order-create.md#usePurchaseOrders、PurchaseOrderDetailView、路由]
- [Source: _bmad-output/implementation-artifacts/4-2-sale-order-confirm.md#confirm_sale_order、详情页确认交互模式]
- [Source: _bmad-output/project-context.md#Supabase 单例、Toast 中文、网络错误重试、关键操作二次确认]

---

## Developer Context (Guardrails)

### Technical Requirements

- **payables 表**：id (uuid PK), purchase_order_id (uuid FK→purchase_orders), supplier_id (uuid FK→suppliers), amount (numeric), paid_amount (numeric DEFAULT 0), status (text DEFAULT 'unpaid'), created_at, updated_at (timestamptz)。RLS：已认证用户可 SELECT/INSERT/UPDATE/DELETE。
- **confirm_purchase_order(order_id uuid)**：CREATE OR REPLACE FUNCTION，推荐 `SECURITY DEFINER` + `search_path='public'`，逻辑顺序：
  1) 校验订单存在且 status='draft'；
  2) UPDATE purchase_orders 状态为 confirmed；
  3) 遍历 purchase_order_items：UPDATE products.stock = stock + quantity 并记录 stock_logs（change=+quantity, reason='purchase_order', reference_id=order_id, balance=更新后库存）；
  4) INSERT payables（purchase_order_id, supplier_id, amount=total_amount, paid_amount=0, status='unpaid'）。
  整体在单事务内，任一步失败即回滚。
- **前端确认流程**：先弹出确认弹窗，再调用 RPC；成功后 Toast「进货单已确认」并刷新详情，失败 Toast「操作失败，请重试」。
- **性能**：正常网络下确认流程应控制在 3 秒内，避免额外串行请求。

### Architecture Compliance

- 前端：Vue 3 + Vite + TypeScript；UI：Vant 4；仅从 `src/lib/supabase.ts` 导入 supabase。
- Composable 放在 `src/composables/`，视图在 `src/views/`。
- 错误处理统一 Toast 中文提示；网络错误重试 1 次。

### Library & Framework Requirements

| 依赖 | 用途 |
|------|------|
| @supabase/supabase-js | 调用 RPC confirm_purchase_order，查询进货单与明细 |
| vant | Dialog、Toast、Button、Cell、CellGroup、Loading |
| Vue Router | 详情页路由与参数读取 |

### File Structure Requirements

- `huotong-app/src/composables/usePurchaseOrders.ts` — 修改：新增 `getItemsWithProduct`、`confirm`
- `huotong-app/src/views/PurchaseOrderDetailView.vue` — 修改：详情明细展示 + 确认进货流程
- `Supabase migration` — 新建：`payables` 表 + RLS；`confirm_purchase_order` 函数

### Testing Requirements

- 草稿进货单详情页可点击「确认进货」并弹出摘要确认框。
- 确认后订单状态变为 confirmed，商品库存增加，stock_logs 与 payables 产生对应记录。
- 网络或数据库错误时，提示「操作失败，请重试」，且订单状态/库存/应付保持一致（事务回滚）。

---

## Previous Story Intelligence

- **5.1 进货单创建**：`usePurchaseOrders.createDraft` 采用主从写入 + 明细失败回滚主单；详情页路由已存在但当前仅占位。
- **4.2 出货单确认**：`useSaleOrders.confirm` + `SaleOrderDetailView` 已有成熟确认交互，可对称复用到进货单确认。

---

## Project Context Reference

- [Source: _bmad-output/project-context.md] — Supabase 单例、Vant 组件、Toast 中文提示、关键操作二次确认、网络错误重试 1 次。

---

## Dev Agent Record

### Agent Model Used

GPT-5.3 Codex

### Debug Log References

(无)

### Completion Notes List

- Supabase migration `create_payables_and_confirm_purchase_order`：已创建 `payables` 表并开启 RLS，策略为已认证用户可全量 CRUD。
- 新增 `confirm_purchase_order(p_order_id uuid)` 函数：校验 draft、更新进货单状态、增加库存并写入 `stock_logs`、生成 `payables`，全部在同一事务内执行。
- `usePurchaseOrders` 新增 `getItemsWithProduct`、`confirm`、`parseConfirmError`，并实现 RPC 重试后“已确认”状态回查，避免网络抖动误报失败。
- `PurchaseOrderDetailView` 从占位升级为最小可用详情页：展示明细、状态、创建时间；draft 时可「确认进货」，确认成功后刷新当前页显示 confirmed。
- 自测：`npm run build` 通过。

### File List

- huotong-app/src/composables/usePurchaseOrders.ts（修改：新增 getItemsWithProduct、confirm、parseConfirmError）
- huotong-app/src/views/PurchaseOrderDetailView.vue（修改：明细展示、确认进货弹窗与 RPC 调用）
- Supabase migration：create_payables_and_confirm_purchase_order（payables + RLS + confirm_purchase_order）
- _bmad-output/implementation-artifacts/5-2-payables-confirm-purchase-order.sql（新增：payables 与 confirm_purchase_order 可复现 SQL）

### Change Log

- 2026-03-10：完成 Story 5.2 实现；新增 payables 与 confirm_purchase_order，完成进货单详情确认流程，状态更新为 review。
- 2026-03-10：完成代码审查；补充 5-2 数据库可复现 SQL（payables + confirm_purchase_order），状态更新为 done。

### Review Record

- Reviewer: AI Agent
- Date: 2026-03-10
- Findings:
  - High: 0
  - Medium: 1（已修复 1，剩余 0）
  - Low: 0
- Verification:
  - `npm run build`：通过
