# Story 6.4: 账款关联单据查看与客户/供应商历史

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 母亲（用户），
I want 从账款记录直接跳转查看原始出货单/进货单，并在客户/供应商详情页看到历史单据与账款汇总，
so that 催款或对账时有据可查，减少纠纷。

## Acceptance Criteria

1. **Given** 用户查看某条应收账款记录  
   **When** 点击「查看原始单据」  
   **Then** 跳转到关联的出货单详情页

2. **Given** 用户查看某条应付账款记录  
   **When** 点击「查看原始单据」  
   **Then** 跳转到关联的进货单详情页

3. **Given** 用户在客户详情页  
   **When** 查看客户信息  
   **Then** 页面底部显示该客户的历史出货单列表和应收账款汇总（总欠款金额）

4. **Given** 用户在供应商详情页  
   **When** 查看供应商信息  
   **Then** 页面底部显示该供应商的历史进货单列表和应付账款汇总（总欠款金额）

## Tasks / Subtasks

- [x] Task 1 (AC: #1) — 应收账款页增加「查看原始单据」并跳转出货单详情
  - [x] 1.1 在 ReceivablesView 每条应收明细（detail-item）上增加「查看原始单据」按钮/链接
  - [x] 1.2 点击时使用 router.push({ name: 'sale-order-detail', params: { id: item.sale_order_id } })，其中 item 为当前应收记录（含 sale_order_id）
  - [x] 1.3 若 sale_order_id 缺失或无效，不显示该按钮或点击后 Toast 提示「关联单据不存在」

- [x] Task 2 (AC: #2) — 应付账款页增加「查看原始单据」并跳转进货单详情
  - [x] 2.1 在 PayablesView 每条应付明细上增加「查看原始单据」按钮/链接
  - [x] 2.2 点击时使用 router.push({ name: 'purchase-order-detail', params: { id: item.purchase_order_id } })
  - [x] 2.3 若 purchase_order_id 缺失或无效，不显示该按钮或 Toast 提示「关联单据不存在」

- [x] Task 3 (AC: #3) — 客户详情页底部展示历史出货单列表与应收汇总
  - [x] 3.1 在 CustomerDetailView 中，客户信息表单下方增加区块「历史出货单」与「应收账款汇总」
  - [x] 3.2 使用 **useSaleOrders().list({ customer_id: customerId })** 获取该客户的历史出货单列表（已有 API，支持 customer_id 筛选，按日期倒序）；可选前端限制展示条数（如 20）
  - [x] 3.3 使用 **useReceivables().listByCustomer(customerId)** 获取该客户应收明细，前端汇总 total_unpaid（或先 listGroupedByCustomer 再取该客户的 total_unpaid），展示「总欠款：¥xxx」；若无欠款则展示「无欠款」或「总欠款：¥0.00」
  - [x] 3.4 历史出货单列表每条展示：单号、日期、总金额、状态；点击某条跳转到该出货单详情页（sale-order-detail）

- [x] Task 4 (AC: #4) — 供应商详情页底部展示历史进货单列表与应付汇总
  - [x] 4.1 在 SupplierDetailView 中，供应商信息表单下方增加区块「历史进货单」与「应付账款汇总」
  - [x] 4.2 使用 **usePurchaseOrders().list({ supplier_id: supplierId })** 获取该供应商的历史进货单列表（已有 API，支持 supplier_id 筛选）；可选前端限制展示条数
  - [x] 4.3 使用 **usePayables().listBySupplier(supplierId)** 获取该供应商应付明细，前端汇总 total_unpaid（或 listGroupedBySupplier 后取该供应商的 total_unpaid），展示总欠款；若无则展示「无欠款」或「总欠款：¥0.00」
  - [x] 4.4 历史进货单列表每条展示：单号、日期、总金额、状态；点击跳转 purchase-order-detail

- [x] Task 5 — 自测与回归
  - [x] 5.1 应收列表展开后，点击某条「查看原始单据」正确跳转至对应出货单详情
  - [x] 5.2 应付列表展开后，点击某条「查看原始单据」正确跳转至对应进货单详情
  - [x] 5.3 客户详情页底部历史出货单与应收汇总展示正确，点击出货单可进入详情
  - [x] 5.4 供应商详情页底部历史进货单与应付汇总展示正确，点击进货单可进入详情
  - [x] 5.5 `npm run build` 无错误

## Dev Notes

- **路由与命名**：sale-order-detail 路径 `/sale-orders/:id`，params.id 为 sale_orders.id；purchase-order-detail 路径 `/purchase-orders/:id`，params.id 为 purchase_orders.id。receivables.sale_order_id、payables.purchase_order_id 即对应订单主键。
- **数据已有**：ReceivableWithOrder / PayableWithOrder 在 listByCustomer / listBySupplier 中已关联 sale_orders / purchase_orders，但返回的可能是 order_no，跳转需要订单 id。当前 composable 若 select 未包含 sale_orders.id / purchase_orders.id，需在 select 中增加 id（或确保 receivables.sale_order_id / payables.purchase_order_id 可直接用作路由 params.id）。
- **客户/供应商详情页**：CustomerDetailView、SupplierDetailView 当前仅含表单编辑与删除，需在模板底部增加两个区块（历史单据列表 + 账款汇总），数据由 composable 按 customer_id / supplier_id 查询。
- **useSaleOrders / usePurchaseOrders**：**无需新增方法**。useSaleOrders 已有 `list(filters)`，其中 `filters.customer_id` 可筛该客户出货单；usePurchaseOrders 已有 `list(filters)`，其中 `filters.supplier_id` 可筛该供应商进货单。客户/供应商详情页直接调用 `list({ customer_id })` / `list({ supplier_id })` 即可。

### Project Structure Notes

- **Views**：ReceivablesView.vue、PayablesView.vue — 增加「查看原始单据」按钮及跳转。
- **Views**：CustomerDetailView.vue、SupplierDetailView.vue — 底部增加历史出货单/进货单列表与应收/应付汇总。
- **Composables**：useSaleOrders.ts、usePurchaseOrders.ts — 若无按客户/供应商查询则新增方法；useReceivables、usePayables 已有 listByCustomer、listBySupplier，可用于汇总与总欠款计算。

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 6 - Story 6.4]
- [Source: huotong-app/src/router/index.ts — sale-order-detail, purchase-order-detail, customer-detail, supplier-detail]
- [Source: _bmad-output/implementation-artifacts/6-3-payment-status.md — ReceivablesView/PayablesView 明细结构]

---

## Developer Context (Guardrails)

### Technical Requirements

- **跳转原始单据**：应收记录带 `sale_order_id`，应付记录带 `purchase_order_id`；路由名为 `sale-order-detail`、`purchase-order-detail`，params 为 `{ id: sale_order_id }` 或 `{ id: purchase_order_id }`。在 ReceivablesView/PayablesView 的每条明细上增加按钮，用 `useRouter().push({ name: 'sale-order-detail', params: { id: item.sale_order_id } })`（应付同理）。
- **客户详情页**：CustomerDetailView 路由为 `customer-detail`，params 为 `id`（客户 id）。需在页面底部增加：① 该客户历史出货单列表（调用 useSaleOrders 按 customer_id 查询）；② 该客户应收账款汇总（总欠款，可用 useReceivables.listByCustomer(customerId) 后前端汇总 total_unpaid，或新增/使用汇总接口）。列表项点击跳转 sale-order-detail。
- **供应商详情页**：SupplierDetailView 路由为 `supplier-detail`，params 为 `id`（供应商 id）。需在页面底部增加：① 该供应商历史进货单列表（usePurchaseOrders 按 supplier_id）；② 该供应商应付账款汇总（总欠款）。列表项点击跳转 purchase-order-detail。
- **表与字段**：sale_orders 有 customer_id、order_no、total_amount、status、created_at；purchase_orders 有 supplier_id、order_no、total_amount、status、created_at。receivables/payables 已有 sale_order_id/purchase_order_id，RLS 与现有查询不变。

### Architecture Compliance

- 仅从 `src/lib/supabase.ts` 导入 supabase；使用 Vue Router 进行编程式导航。
- 错误与无数据时使用 Toast 或页面内友好文案（如「暂无历史出货单」「无欠款」）。
- 新 Vant 组件若未在 main.ts 注册需注册；列表可用 van-cell、van-button 等已有组件。

### Library & Framework Requirements

| 依赖 | 用途 |
|------|------|
| vue-router | 跳转出货单/进货单详情 |
| @supabase/supabase-js | 已有；按需在 useSaleOrders/usePurchaseOrders 中增加按客户/供应商查询 |
| vant | 列表、按钮、Toast（已用） |

### File Structure Requirements

- `huotong-app/src/views/ReceivablesView.vue` — 修改：每条应收明细增加「查看原始单据」并跳转
- `huotong-app/src/views/PayablesView.vue` — 修改：每条应付明细增加「查看原始单据」并跳转
- `huotong-app/src/views/CustomerDetailView.vue` — 修改：底部增加历史出货单列表 + 应收汇总
- `huotong-app/src/views/SupplierDetailView.vue` — 修改：底部增加历史进货单列表 + 应付汇总
- `huotong-app/src/composables/useSaleOrders.ts` — 无需修改（已有 list({ customer_id })）
- `huotong-app/src/composables/usePurchaseOrders.ts` — 无需修改（已有 list({ supplier_id })）

### Testing Requirements

- 应收/应付列表中「查看原始单据」跳转至正确出货单/进货单详情页。
- 客户详情页展示该客户历史出货单与总欠款，点击出货单进入详情。
- 供应商详情页展示该供应商历史进货单与总欠款，点击进货单进入详情。
- `npm run build` 通过。

---

## Previous Story Intelligence

- **6.3**：ReceivablesView/PayablesView 使用 van-collapse，展开后 detail-item 展示 order_no、金额、已付、状态、日期及「标记付款」按钮。每条明细已有 receivable.sale_order_id / payable.purchase_order_id，可直接用于 router 跳转；需在 UI 上增加「查看原始单据」入口。
- **6.1 / 6.2**：listByCustomer、listBySupplier 返回的每条记录已包含 sale_order_id / purchase_order_id；若需在列表显示订单号，已有 getOrderNo 等，跳转只需用 id 即可。
- **4.3 / 5.3**：出货单详情页、进货单详情页已存在，路由与视图完备，无需新建页面，仅需在应收/应付页增加导航。

---

## Project Context Reference

- [Source: _bmad-output/project-context.md] — Supabase 单例、Vant、Toast 中文、路由守卫；新组件需在 main.ts 注册。

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

(无)

### Completion Notes List

- ReceivablesView：每条应收明细增加「查看原始单据」按钮，goToSaleOrder(sale_order_id) 跳转 sale-order-detail；无 sale_order_id 时点击 Toast「关联单据不存在」。
- PayablesView：每条应付明细增加「查看原始单据」按钮，goToPurchaseOrder(purchase_order_id) 跳转 purchase-order-detail。
- CustomerDetailView：底部增加「应收账款汇总」（listGroupedByCustomer 取该客户 total_unpaid）与「历史出货单」（useSaleOrders().list({ customer_id }) 前 20 条），列表项点击跳转出货单详情。
- SupplierDetailView：底部增加「应付账款汇总」与「历史进货单」（usePurchaseOrders().list({ supplier_id }) 前 20 条），列表项点击跳转进货单详情。
- 未修改 useSaleOrders/usePurchaseOrders，复用现有 list(filters) API。npm run build 通过。
- CR 结论：未发现 High/Medium/Low 级问题；构建与类型检查通过，功能与 AC 一致。

### File List

- huotong-app/src/views/ReceivablesView.vue（修改）
- huotong-app/src/views/PayablesView.vue（修改）
- huotong-app/src/views/CustomerDetailView.vue（修改）
- huotong-app/src/views/SupplierDetailView.vue（修改）

### Change Log

- 2026-03-10：完成 Story 6.4 实现；应收/应付页增加「查看原始单据」跳转；客户/供应商详情页底部增加历史单据列表与账款汇总；状态更新为 review。
- 2026-03-10：完成 Code Review；未发现需修复问题；状态更新为 done。
