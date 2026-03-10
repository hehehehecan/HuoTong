# Story 5.1: 进货单数据表与创建流程

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 父亲（用户），
I want 创建进货单，选择供应商并添加到货商品条目，
so that 供应商送货后能快速记录进货信息。

## Acceptance Criteria

1. **Given** Supabase 中已创建 purchase_orders 表和 purchase_order_items 表，且 RLS 策略已配置
   **When** 用户点击「新建进货单」
   **Then** 进入进货单创建页面，显示供应商选择器和商品添加区域

2. **Given** 用户在进货单创建页面
   **When** 点击「选择供应商」并搜索选择一个供应商
   **Then** 供应商名称显示在进货单头部

3. **Given** 用户已选择供应商
   **When** 点击「添加商品」，搜索并选择商品，输入数量和进价
   **Then** 商品条目添加到进货单列表，小计自动计算
   **And** 可以重复添加多个商品条目

4. **Given** 进货单中有多个商品条目
   **When** 系统计算总金额
   **Then** 页面底部实时显示进货单总金额

5. **Given** 用户想修改已添加的商品条目
   **When** 点击某条目
   **Then** 可以修改数量或进价，或删除该条目，总金额实时更新

## Tasks / Subtasks

- [x] Task 1 (AC: #1) — 数据表与创建页入口
  - [x] 1.1 在 Supabase 中创建 purchase_orders 表（id uuid PK, order_no text, supplier_id uuid FK→suppliers, total_amount decimal, status text default 'draft', note text, created_at, updated_at）；配置 RLS（已登录用户可 CRUD）
  - [x] 1.2 创建 purchase_order_items 表（id uuid PK, order_id uuid FK→purchase_orders, product_id uuid FK→products, quantity integer, unit_price decimal, subtotal decimal）；配置 RLS
  - [x] 1.3 将路由 `/purchase-orders/new` 的组件从 PlaceholderView 改为新建的进货单创建视图（如 PurchaseOrderCreateView.vue），meta.title「新建进货单」
- [x] Task 2 (AC: #2) — 供应商选择
  - [x] 2.1 创建页顶部显示「选择供应商」区域；点击后进入供应商选择流程（弹窗或跳转供应商列表/搜索页，选择后回填）
  - [x] 2.2 使用 useSuppliers 搜索/列表接口；选中后在本页显示供应商名称，并保存 supplier_id 供提交使用
- [x] Task 3 (AC: #3, #4, #5) — 商品条目与总金额
  - [x] 3.1 提供「添加商品」入口；点击后弹出或展开商品选择（useProducts 搜索），选择商品并输入数量、进价；小计 = 数量×进价
  - [x] 3.2 已添加条目以列表形式展示（商品名、数量、单价、小计）；支持编辑数量/单价、删除条目；任一变更后重新计算该条小计及页面底部总金额（所有小计之和）
  - [x] 3.3 总金额在页面底部实时显示；可重复添加多个商品条目
- [x] Task 4 — 保存草稿与校验
  - [x] 4.1 **必须实现保存草稿**：用户点击「保存」时，校验已选择供应商且至少一条商品条目且数量>0；未通过时禁用保存并 Toast「请选择供应商」或「请至少添加一件商品」。通过后调用 usePurchaseOrders.createDraft 将 purchase_orders（status=draft）+ purchase_order_items 插入数据库，total_amount 由前端计算写入。
  - [x] 4.2 保存成功后 Toast「已保存」，并跳转到该进货单详情页（/purchase-orders/:id）。若尚无详情页，需在本 Story 内新增路由 `/purchase-orders/:id` 并挂载占位视图（如 PurchaseOrderDetailView 仅显示单号与总金额），5.3 再完善列表与详情。「确认进货」在 Story 5.2 实现。

## Dev Notes

- **本 Story 范围**：仅进货单数据表与创建流程（选供应商、添加商品条目、进价、实时总金额、修改/删除条目）；不包含「确认进货」及级联增库存、生成应付（属 Story 5.2）。
- **数据**：purchase_orders、purchase_order_items 在本 Story 内创建并配置 RLS；order_no 自动生成，建议格式「PO+yyyyMMdd+短随机码」或 UUID 短码，保证唯一即可。
- **入口**：首页已有「新建进货单」入口指向 `/purchase-orders/new`，本 Story 仅需将路由组件从 PlaceholderView 替换为新建视图；需增加 purchase-orders 列表路由（可先指向占位或简单列表）以便详情跳转，或保存后跳转详情页时路由在 5.3 再补全，本 Story 可保存后跳转 /purchase-orders/:id，详情页 5.3 实现前可占位或仅显示单号与总金额。
- **依赖**：供应商与商品已存在（Epic 3/2）；使用现有 useSuppliers、useProducts；不依赖 payables、stock_logs 的进货写入（5.2 再建 confirm 函数）。

### Project Structure Notes

- **Composable**：新建 `src/composables/usePurchaseOrders.ts`，提供 createDraft(order: { supplier_id, items: [{ product_id, quantity, unit_price }] })、可选 getById、list 等；createDraft 内计算 total_amount 并插入 purchase_orders + purchase_order_items。
- **视图**：新建 `src/views/PurchaseOrderCreateView.vue`（或 `src/views/purchase-orders/PurchaseOrderCreateView.vue`），包含供应商选择区、商品条目列表、添加商品、底部总金额；与出货单创建页风格一致（Vant Form/Field、Toast、大按钮）。
- **路由**：已有 `/purchase-orders/new`，将 component 改为 PurchaseOrderCreateView，meta.title「新建进货单」。若详情页尚未存在，保存后跳转 /purchase-orders/:id 时需新增该路由并挂载占位或简易详情视图（本 Story 可只做跳转，详情页由 5.3 完善）。

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 5 - Story 5.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture purchase_orders / purchase_order_items; Frontend Architecture /purchase-orders/new]
- [Source: _bmad-output/implementation-artifacts/4-1-sale-order-create.md#SaleOrderCreateView、useSaleOrders.createDraft、客户/商品选择 — 进货单为供应商/商品+进价，结构对称]
- [Source: _bmad-output/implementation-artifacts/3-3-supplier-entry-list.md#useSuppliers、搜索、列表]
- [Source: _bmad-output/implementation-artifacts/2-2-product-list-search.md#useProducts search、列表]
- [Source: _bmad-output/project-context.md#Supabase 单例、Vant 注册、错误重试、Toast 中文提示]

---

## Developer Context (Guardrails)

### Technical Requirements

- **purchase_orders 表**：id (uuid PK), order_no (text 唯一), supplier_id (uuid FK→suppliers), total_amount (numeric), status (text default 'draft'), note (text nullable), created_at, updated_at (timestamptz)。RLS：已认证用户可 SELECT/INSERT/UPDATE/DELETE。
- **purchase_order_items 表**：id (uuid PK), order_id (uuid FK→purchase_orders), product_id (uuid FK→products), quantity (integer), unit_price (numeric), subtotal (numeric)。RLS 与 purchase_orders 一致。
- **usePurchaseOrders**：至少提供 createDraft({ supplier_id, items: [{ product_id, quantity, unit_price }] })；在 composable 内计算 total_amount = sum(items.subtotal)，subtotal = quantity * unit_price；先 insert purchase_orders 再 insert purchase_order_items；明细写入失败时回滚删除主表，避免孤立草稿；网络错误重试 1 次；错误用 Toast 中文提示。
- **创建页**：供应商选择可复用 useSuppliers.fetchAll/search + 弹窗或下拉选择；商品选择复用 useProducts.search；单价为进价（用户输入或可默认带出 product.buy_price）；总金额为所有条目小计之和，实时计算；数量/单价需数值清洗（数量≥1、单价≥0），避免 NaN/负值导致总额异常。

### Architecture Compliance

- 前端：Vue 3 + Vite + TypeScript；UI：Vant 4；仅从 `src/lib/supabase.ts` 导入 supabase；Composable 放在 `src/composables/`，视图放在 `src/views/`。
- 路由：/purchase-orders/new 为需登录路由；meta.title「新建进货单」。若实现保存后跳转详情，需 /purchase-orders/:id 路由（可占位视图）。
- 错误处理：统一 Toast 中文提示；网络错误重试 1 次；主从写入一致性（明细失败回滚主表）。

### Library & Framework Requirements

| 依赖 | 用途 |
|------|------|
| @supabase/supabase-js | 表 insert、RLS，在 usePurchaseOrders 内使用 |
| vant | NavBar, Field, Form, Button, Toast, Dialog, Popup 等，已有 |
| Vue Router | 路由跳转，已有 |

### File Structure Requirements

- `huotong-app/src/composables/usePurchaseOrders.ts` — 新建
- `huotong-app/src/views/PurchaseOrderCreateView.vue` — 新建
- `huotong-app/src/router/index.ts` — 修改：purchase-orders/new 指向 PurchaseOrderCreateView；如需跳转详情则新增 purchase-orders/:id 路由
- Supabase migrations — 新建 migration：create purchase_orders、purchase_order_items 及 RLS

### Testing Requirements

- 能通过「新建进货单」进入创建页，显示供应商选择与商品添加区域。
- 选择供应商后供应商名显示在头部；添加商品后条目显示且可输入进价、小计与总金额正确。
- 修改数量/单价或删除条目后，小计与总金额实时更新。
- 保存草稿（必须实现）后，purchase_orders 与 purchase_order_items 有对应记录，total_amount 正确。

---

## Previous Story Intelligence

- **4.1 出货单创建**：SaleOrderCreateView、useSaleOrders.createDraft、客户选择（useCustomers）、商品选择（useProducts）、条目数量/单价编辑、总金额实时计算；保存草稿校验客户+至少一条条目；主从写入失败需回滚主表；数量/单价需数值清洗与边界兜底。
- **4.4 拍照识别**：仅出货单创建页；进货单识图在 5.4 复用同一 Edge Function。本 Story 不包含识图。

---

## Project Context Reference

- [Source: _bmad-output/project-context.md] — 技术栈 Vue 3.5+、Vite 7.x、Vant 4.9+、Pinia、Vue Router、Supabase 单例从 `src/lib/supabase.ts` 导入；环境变量 VITE_ 前缀；路由默认需登录；Toast 中文错误提示；网络错误重试 1 次。

---

## Dev Agent Record

### Agent Model Used

(实现时由 Agent 填写)

### Debug Log References

### Completion Notes List

- Supabase migration `create_purchase_orders_and_items`：已创建 purchase_orders、purchase_order_items 表及 RLS。
- usePurchaseOrders：createDraft（主从写入、明细失败回滚主表）、getById；order_no 格式 POyyyyMMdd-随机码；数量/单价数值清洗。
- PurchaseOrderCreateView：选择供应商（VanPopup + useSuppliers）、添加商品（数量+进价，默认带出 buy_price）、小计与总金额实时计算、保存草稿后跳转详情。
- PurchaseOrderDetailView：占位页，显示单号、供应商名、总金额、状态；5.3 完善列表与详情。
- 路由：purchase-orders/new → PurchaseOrderCreateView；purchase-orders/:id → PurchaseOrderDetailView；purchase-orders 列表为占位。
- 自测：npm run build 通过；未登录访问 /purchase-orders/new 重定向至 /login?redirect=/purchase-orders/new。

### File List

- huotong-app/src/composables/usePurchaseOrders.ts（新建）
- huotong-app/src/views/PurchaseOrderCreateView.vue（新建）
- huotong-app/src/views/PurchaseOrderDetailView.vue（新建）
- huotong-app/src/router/index.ts（修改：purchase-orders/new、purchase-orders/:id、purchase-orders 列表占位）
- Supabase：migration create_purchase_orders_and_items（purchase_orders、purchase_order_items 表及 RLS）

### Change Log

- 2026-03-10：完成 Story 5.1 实现；进货单数据表与创建流程、占位详情页；状态更新为 review。
- 2026-03-10：完成代码审查；未发现需修复的 High/Medium 问题，回归构建通过，状态更新为 done。

### Review Record

- Reviewer: AI Agent
- Date: 2026-03-10
- Findings:
  - High: 0
  - Medium: 0
  - Low: 0
- Verification:
  - `npm run build`：通过
