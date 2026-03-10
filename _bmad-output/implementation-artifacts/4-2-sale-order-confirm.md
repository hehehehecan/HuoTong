# Story 4.2: 出货单确认与级联操作

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 父亲（用户），
I want 确认出货单后系统自动扣减库存和生成应收记录，
so that 不需要手动维护库存和账款，减少人为遗漏。

## Acceptance Criteria

1. **Given** Supabase 中已创建以下表及 RLS 策略：
   - `receivables` 表（id uuid PK, sale_order_id uuid FK→sale_orders, customer_id uuid FK→customers, amount decimal, paid_amount decimal DEFAULT 0, status text DEFAULT 'unpaid', created_at timestamptz, updated_at timestamptz）
   - `stock_logs` 表（id uuid PK, product_id uuid FK→products, change integer, reason text, reference_id uuid, balance integer, created_at timestamptz）
   - PostgreSQL Function `confirm_sale_order(order_id uuid)` 已通过 SQL migration 在 Supabase 中创建，函数在同一事务中：① 更新出货单状态、② 扣减库存并写入 stock_logs、③ 在 receivables 中生成应收记录
   **When** 开发者确认上述数据库对象均已部署
   **Then** 本 Story 的业务功能可以正确运行

2. **Given** 用户已创建好出货单（选择了客户、添加了商品条目）
   **When** 点击「确认出货」
   **Then** 弹出二次确认弹窗，显示出货单摘要（客户、商品数、总金额）

3. **Given** 用户在确认弹窗中点击「确认」
   **When** 系统调用 Supabase Database Function `confirm_sale_order`
   **Then** 在同一数据库事务中完成：
   - 出货单状态从 draft 更新为 confirmed
   - 相关商品库存自动扣减
   - stock_logs 表记录每个商品的库存变动
   - receivables 表自动生成一条应收记录（金额=出货单总金额，状态=unpaid）
   **And** 操作成功后显示「出货单已确认」，跳转到出货单详情页
   **And** 从用户点击「确认」到页面显示「出货单已确认」的总耗时 < 3 秒（正常网络条件下）

4. **Given** 某商品库存不足（库存 < 出货数量）
   **When** 用户尝试确认出货单
   **Then** 系统提示「商品 XXX 库存不足（当前 N 件，需要 M 件）」，不执行确认操作

5. **Given** 确认操作过程中出现网络或数据库错误
   **When** 事务执行失败
   **Then** 所有操作回滚，数据保持一致，显示「操作失败，请重试」

## Tasks / Subtasks

- [x] Task 1 (AC: #1) — 数据库表与 confirm_sale_order 函数
  - [x] 1.1 在 Supabase 中创建 `receivables` 表（id, sale_order_id FK→sale_orders, customer_id FK→customers, amount, paid_amount DEFAULT 0, status DEFAULT 'unpaid', created_at, updated_at）；配置 RLS（已认证用户可 CRUD）
  - [x] 1.2 创建 `stock_logs` 表（id, product_id FK→products, change, reason, reference_id, balance, created_at）；配置 RLS；若架构中 balance 为变动后余额则按架构实现
  - [x] 1.3 创建 PostgreSQL 函数 `confirm_sale_order(order_id uuid)`：同一事务内 ① 校验订单状态为 draft、校验各商品库存充足（不足则 RAISE 带商品名与当前/需要数量）② 更新 sale_orders.status = 'confirmed' ③ 扣减 products.stock 并 INSERT stock_logs（reason='sale_order', reference_id=order_id, change 为负数, balance 为变动后余额）④ INSERT receivables（sale_order_id, customer_id, amount=订单 total_amount, status='unpaid'）；函数返回 void 或 JSON（成功/失败信息），失败时回滚
- [x] Task 2 (AC: #2, #3) — 前端「确认出货」与 RPC 调用
  - [x] 2.1 在出货单创建页（及/或草稿详情页）提供「确认出货」按钮；仅当订单状态为 draft 且已选客户、至少一条有效商品条目时可用
  - [x] 2.2 点击「确认出货」时弹出二次确认弹窗（Vant Dialog），显示出货单摘要（客户名、商品条数、总金额）；用户确认后再调用 RPC
  - [x] 2.3 在 useSaleOrders 中新增 confirm(orderId)：调用 supabase.rpc('confirm_sale_order', { order_id: orderId })；成功时 Toast「出货单已确认」并跳转至出货单详情页 /sale-orders/:id；网络错误重试 1 次，错误用 Toast 中文提示
  - [x] 2.4 处理 RPC 返回的库存不足错误：若函数通过 RAISE 或返回 JSON 携带商品名、当前库存、需要数量，前端解析并 Toast「商品 XXX 库存不足（当前 N 件，需要 M 件）」；不执行任何状态更新
- [x] Task 3 (AC: #3) — 出货单详情页（最小可用）
  - [x] 3.1 新增路由 /sale-orders/:id，对应出货单详情视图（如 SaleOrderDetailView.vue）；仅展示单号、客户名、商品条目列表（商品名、数量、单价、小计）、总金额、状态、创建时间；draft 状态可显示「确认出货」入口（与创建页逻辑一致或跳转编辑），confirmed 状态只读
  - [x] 3.2 确认成功后跳转到该详情页，用户可见已确认状态及应收已生成（详情页可后续在 Epic 6 或本 Epic 扩展「查看应收」入口）
- [x] Task 4 (AC: #5) — 错误与回滚
  - [x] 4.1 确认操作网络或数据库错误时，Toast「操作失败，请重试」；不刷新订单状态（由数据库事务保证回滚）

## Dev Notes

- **本 Story 范围**：出货单确认、数据库级联（扣库存 + 写 stock_logs + 生成应收）、前端确认按钮与二次确认弹窗、库存不足提示、最小出货单详情页以便确认后跳转。
- **依赖**：Story 4.1 已完成（sale_orders、sale_order_items、useSaleOrders.createDraft、创建页）；本 Story 新增 receivables、stock_logs、confirm_sale_order、useSaleOrders.confirm、详情页。
- **架构**：级联操作必须在数据库事务中完成（PostgreSQL 函数），前端只调用 RPC，不先扣库存再插应收，避免不一致。

### Project Structure Notes

- **Composable**：在 `useSaleOrders.ts` 中新增 `confirm(orderId: string)`，内部 `supabase.rpc('confirm_sale_order', { order_id: orderId })`；错误解析（库存不足 vs 通用错误）按函数约定实现。
- **视图**：`SaleOrderCreateView.vue` 增加「确认出货」按钮（保存草稿后或从详情页进入草稿时显示）；新建 `SaleOrderDetailView.vue`（或 `src/views/SaleOrderDetailView.vue`）只读展示订单信息，draft 时可提供「确认出货」。
- **路由**：已有 `/sale-orders/new`；新增 `/sale-orders/:id` 指向详情视图，meta.title「出货单详情」。
- **DB**：receivables、stock_logs 的 RLS 与现有项目一致（已认证用户）；stock_logs 若需 reference_id 关联 sale_orders，保留 FK 或仅存 UUID 引用按架构文档。

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 4 - Story 4.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture receivables / stock_logs; 单据确认的级联操作]
- [Source: _bmad-output/implementation-artifacts/4-1-sale-order-create.md#useSaleOrders、创建页、主从一致性、Toast]
- [Source: _bmad-output/project-context.md#Supabase 单例、Toast 中文、错误重试、关键操作二次确认]

---

## Developer Context (Guardrails)

### Technical Requirements

- **receivables 表**：id (uuid PK), sale_order_id (uuid FK→sale_orders), customer_id (uuid FK→customers), amount (numeric), paid_amount (numeric DEFAULT 0), status (text DEFAULT 'unpaid'), created_at, updated_at (timestamptz)。RLS：已认证用户可 SELECT/INSERT/UPDATE/DELETE。
- **stock_logs 表**：id (uuid PK), product_id (uuid FK→products), change (integer，正入库负出库), reason (text，如 'sale_order'/'purchase_order'/'manual'), reference_id (uuid，关联单据 id), balance (integer，变动后余额), created_at (timestamptz)。RLS 同项目惯例。
- **confirm_sale_order(order_id uuid)**：在 migration 中 CREATE OR REPLACE FUNCTION；逻辑顺序：① 校验订单存在且 status='draft'；② 校验每条 sale_order_items 对应 product 的 stock >= quantity，否则 RAISE EXCEPTION 并携带商品名、当前库存、需要数量（便于前端展示）；**推荐 RAISE 消息格式**：如 `INSUFFICIENT_STOCK:商品名,当前库存,需要数量`，便于前端用正则或 split 解析并 Toast；③ UPDATE sale_orders SET status='confirmed' WHERE id=order_id；④ 对每条 item：UPDATE products SET stock=stock-item.quantity WHERE id=item.product_id；INSERT INTO stock_logs (product_id, change, reason, reference_id, balance) 使用 change=-quantity, reason='sale_order', reference_id=order_id, balance 为更新后的 stock；⑤ INSERT INTO receivables (sale_order_id, customer_id, amount, paid_amount, status) SELECT order_id, customer_id, total_amount, 0, 'unpaid' FROM sale_orders WHERE id=order_id。所有步骤在同一事务中，任一步失败则回滚。
- **useSaleOrders.confirm**：调用 `supabase.rpc('confirm_sale_order', { order_id: orderId })`；成功时返回，前端 Toast 并跳转详情；失败时解析 PostgreSQL 错误消息（若消息含 `INSUFFICIENT_STOCK:` 或类似约定则解析出商品名、当前、需要数量并 Toast「商品 XXX 库存不足（当前 N 件，需要 M 件）」）或通用「操作失败，请重试」；网络错误重试 1 次。
- **确认弹窗**：Vant Dialog 二次确认，文案显示出货单摘要（客户、商品数、总金额）；用户确认后再调用 confirm。

### Architecture Compliance

- 前端：Vue 3 + Vite + TypeScript，Vant 4，仅从 `src/lib/supabase.ts` 导入 supabase；Composable 在 `src/composables/useSaleOrders.ts`，视图在 `src/views/`。
- 级联操作：仅通过 Database Function 在服务端执行，不在前端多次写表。
- 错误处理：统一 Toast 中文；关键操作前二次确认；网络错误重试 1 次。

### Library & Framework Requirements

| 依赖 | 用途 |
|------|------|
| @supabase/supabase-js | RPC 调用 confirm_sale_order |
| vant | Dialog、Toast、Button、NavBar 等 |
| Vue Router | 跳转 /sale-orders/:id |

### File Structure Requirements

- `huotong-app/src/composables/useSaleOrders.ts` — 修改：新增 confirm(orderId)
- `huotong-app/src/views/SaleOrderCreateView.vue` 或 `SaleOrderDetailView.vue` — 修改/新建：确认出货按钮、二次确认弹窗；新建详情页
- `huotong-app/src/views/SaleOrderDetailView.vue` — 新建：只读展示订单，draft 时可入口确认出货
- `huotong-app/src/router/index.ts` — 修改：新增 /sale-orders/:id
- Supabase migrations — 新建：create receivables、stock_logs、confirm_sale_order 函数及 RLS

### Testing Requirements

- 创建草稿出货单后，可点击「确认出货」弹出摘要弹窗，确认后 RPC 成功、订单状态变为 confirmed、库存扣减、stock_logs 与 receivables 有对应记录。
- 某商品库存不足时，确认失败并提示「商品 XXX 库存不足（当前 N 件，需要 M 件）」。
- 网络或数据库错误时，事务回滚，Toast「操作失败，请重试」。
- 确认成功后跳转至出货单详情页，显示已确认状态。

---

## Previous Story Intelligence

- **4.1 出货单创建**：useSaleOrders.createDraft 先 insert sale_orders 再 insert sale_order_items；主表成功从表失败时需回滚主表，避免孤立草稿。数量/单价需数值清洗（数量≥1、单价≥0、金额保留两位）。创建页使用 VanPopup + 客户与商品选择、底部总金额与保存；路由 /sale-orders/new 已存在。保存成功后当前为 Toast 后留在本页或返回列表；本 Story 需在创建页或详情页提供「确认出货」，确认后跳转详情页，故需实现最小详情页 /sale-orders/:id。

---

## Project Context Reference

- [Source: _bmad-output/project-context.md] — Vue 3.5+、Vite 7.x、Vant 4.9+、Pinia、Vue Router、Supabase 单例从 `src/lib/supabase.ts` 导入；Toast 中文错误提示；网络错误重试 1 次；关键操作二次确认；登录与路由守卫已配置。

---

## Dev Agent Record

### Agent Model Used

(实现时由 Agent 填写)

### Debug Log References

(无)

### Completion Notes List

- Migration create_receivables_stock_logs_confirm_sale_order：创建 receivables、stock_logs 表及 RLS；创建 confirm_sale_order(order_id) 函数，事务内校验 draft、库存充足后更新状态、扣库存写 stock_logs、插 receivables；库存不足时 RAISE 'INSUFFICIENT_STOCK:商品名,当前,需要'。
- useSaleOrders：新增 confirm(orderId)、parseConfirmError(err)、getItemsWithProduct(orderId)；confirm 内 withRetry 调用 supabase.rpc('confirm_sale_order', { order_id })。
- SaleOrderDetailView.vue：按 id 加载订单、客户名、明细（含商品名）；draft 显示「确认出货」、二次确认弹窗后调用 confirm，成功 Toast 并重新 loadOrder；已确认只读。
- SaleOrderCreateView：保存草稿成功后 router.push(`/sale-orders/${order.id}`) 跳转详情页。
- 路由新增 /sale-orders/:id → SaleOrderDetailView，meta.title「出货单详情」。
- main.ts 注册 Vant Loading。
- 自测：npm run build 通过。
- CR 修复：confirm RPC 重试后若返回“非 draft”错误，自动回查订单状态；若已 confirmed 则按成功处理，避免网络抖动下误报失败。

### File List

- huotong-app/src/composables/useSaleOrders.ts（修改：confirm、parseConfirmError、getItemsWithProduct）
- huotong-app/src/views/SaleOrderDetailView.vue（新建）
- huotong-app/src/views/SaleOrderCreateView.vue（修改：保存后跳转详情）
- huotong-app/src/router/index.ts（修改：新增 sale-orders/:id）
- huotong-app/src/main.ts（修改：注册 Loading）
- Supabase：migration create_receivables_stock_logs_confirm_sale_order（receivables、stock_logs 表及 RLS，confirm_sale_order 函数）

### Change Log

- 2026-03-10：完成 Story 4.2 实现；receivables/stock_logs 表与 confirm_sale_order 函数、useSaleOrders.confirm、出货单详情页与确认出货流程、保存后跳转详情；状态更新为 review。
- 2026-03-10：完成代码审查，修复确认出货重试幂等性问题，状态更新为 done。

### Review Record

- Reviewer: AI Agent
- Date: 2026-03-10
- Findings:
  - High: 0
  - Medium: 1（已修复 1，剩余 0）
  - Low: 0
- Verification:
  - `npm run build`：通过
