# Story 4.1: 出货单数据表与创建流程

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 父亲（用户），
I want 创建出货单，选择客户并添加多个商品条目，
so that 接到客户电话后能快速完成数字化开单。

## Acceptance Criteria

1. **Given** Supabase 中已创建 sale_orders 表和 sale_order_items 表，且 RLS 策略已配置  
   **When** 用户点击「新建出货单」  
   **Then** 进入出货单创建页面，显示客户选择器和商品添加区域

2. **Given** 用户在出货单创建页面  
   **When** 点击「选择客户」并搜索选择一个客户  
   **Then** 客户名称显示在出货单头部

3. **Given** 用户已选择客户  
   **When** 点击「添加商品」，搜索并选择商品，输入数量  
   **Then** 商品条目添加到出货单列表，单价自动带出（售价），小计自动计算  
   **And** 可以重复添加多个商品条目

4. **Given** 出货单中有多个商品条目  
   **When** 系统计算总金额  
   **Then** 页面底部实时显示出货单总金额（所有条目小计之和）

5. **Given** 用户想修改已添加的商品条目  
   **When** 点击某条目  
   **Then** 可以修改数量或单价，或删除该条目，总金额实时更新

## Tasks / Subtasks

- [x] Task 1 (AC: #1) — 数据表与创建页入口
  - [x] 1.1 在 Supabase 中创建 sale_orders 表（id uuid PK, order_no text, customer_id uuid FK→customers, total_amount decimal, status text default 'draft', note text, created_at, updated_at）；配置 RLS（已登录用户可 CRUD）
  - [x] 1.2 创建 sale_order_items 表（id uuid PK, order_id uuid FK→sale_orders, product_id uuid FK→products, quantity integer, unit_price decimal, subtotal decimal）；配置 RLS
  - [x] 1.3 将路由 `/sale-orders/new` 的组件从 PlaceholderView 改为新建的出货单创建视图（如 SaleOrderCreateView.vue），meta.title「新建出货单」
- [x] Task 2 (AC: #2) — 客户选择
  - [x] 2.1 创建页顶部显示「选择客户」区域；点击后进入客户选择流程（弹窗或跳转客户列表/搜索页，选择后回填）
  - [x] 2.2 使用 useCustomers 搜索/列表接口；选中后在本页显示客户名称，并保存 customer_id 供提交使用
- [x] Task 3 (AC: #3, #4, #5) — 商品条目与总金额
  - [x] 3.1 提供「添加商品」入口；点击后弹出或展开商品选择（useProducts 搜索），选择商品并输入数量；单价从商品售价自动带出，小计 = 数量×单价
  - [x] 3.2 已添加条目以列表形式展示（商品名、数量、单价、小计）；支持编辑数量/单价、删除条目；任一变更后重新计算该条小计及页面底部总金额（所有小计之和）
  - [x] 3.3 总金额在页面底部实时显示；可重复添加多个商品条目
- [x] Task 4 — 保存草稿与校验
  - [x] 4.1 **必须实现保存草稿**：用户点击「保存」时，校验已选择客户且至少一条商品条目且数量>0；未通过时禁用保存并 Toast「请选择客户」或「请至少添加一件商品」。通过后调用 useSaleOrders.createDraft 将 sale_orders（status=draft）+ sale_order_items 插入数据库，total_amount 由前端计算写入。
  - [x] 4.2 保存成功后 Toast「已保存」，并跳转到该出货单详情页（/sale-orders/:id）或留在本页继续编辑（详情页可留待 4.3 实现，本 Story 可仅 Toast 后留在本页或返回列表）。「确认出货」在 Story 4.2 实现。

## Dev Notes

- **本 Story 范围**：仅出货单数据表与创建流程（选客户、添加商品条目、实时总金额、修改/删除条目）；不包含「确认出货」及级联扣库存、生成应收（属 Story 4.2）。
- **数据**：sale_orders、sale_order_items 在本 Story 内创建并配置 RLS；order_no 自动生成，建议格式「SO+yyyyMMdd+短随机码」或 UUID 短码，保证唯一即可。
- **入口**：首页已有「新建出货单」入口指向 `/sale-orders/new`，本 Story 仅需将路由组件从 PlaceholderView 替换为新建视图，无需改首页。
- **依赖**：客户与商品已存在（Epic 2/3）；使用现有 useCustomers、useProducts；不依赖 receivables、stock_logs（4.2 再建）。

### Project Structure Notes

- **Composable**：新建 `src/composables/useSaleOrders.ts`，提供 createDraft(order: { customer_id, items: [{ product_id, quantity, unit_price }] })、可选 getById、list 等；createDraft 内计算 total_amount 并插入 sale_orders + sale_order_items。
- **视图**：新建 `src/views/sale-orders/SaleOrderCreateView.vue`（或同级命名），包含客户选择区、商品条目列表、添加商品、底部总金额；与现有 Vant Form/Field、Toast、大按钮风格一致。
- **路由**：已有 `/sale-orders/new`，将 component 改为 SaleOrderCreateView，meta.title「新建出货单」。

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 4 - Story 4.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture sale_orders / sale_order_items; Frontend Architecture /sale-orders/new]
- [Source: _bmad-output/implementation-artifacts/3-4-supplier-edit-delete.md#useSuppliers、详情页、Vant Dialog、路由]
- [Source: _bmad-output/implementation-artifacts/3-1-customer-entry-list.md#useCustomers、搜索、列表]
- [Source: _bmad-output/implementation-artifacts/2-2-product-list-search.md#useProducts search、列表]
- [Source: _bmad-output/project-context.md#Supabase 单例、Vant 注册、错误重试、Toast 中文提示]

---

## Developer Context (Guardrails)

### Technical Requirements

- **sale_orders 表**：id (uuid PK), order_no (text 唯一), customer_id (uuid FK→customers), total_amount (numeric), status (text default 'draft'), note (text nullable), created_at, updated_at (timestamptz)。RLS：已认证用户可 SELECT/INSERT/UPDATE/DELETE 自己的租户数据（若未做多租户则按项目现有 RLS 习惯）。
- **sale_order_items 表**：id (uuid PK), order_id (uuid FK→sale_orders), product_id (uuid FK→products), quantity (integer), unit_price (numeric), subtotal (numeric)。RLS 与 sale_orders 一致。
- **useSaleOrders**：至少提供 createDraft({ customer_id, items: [{ product_id, quantity, unit_price }] })；在 composable 内计算 total_amount = sum(items.subtotal)，subtotal = quantity * unit_price；先 insert sale_orders 再 insert sale_order_items；网络错误重试 1 次；错误用 Toast 中文提示。
- **创建页**：客户选择可复用 useCustomers.fetchAll/search + 弹窗或下拉选择；商品选择复用 useProducts.search；单价从 product.sell_price 带出；总金额为所有条目小计之和，实时计算。

### Architecture Compliance

- 前端：Vue 3 + Vite + TypeScript；UI：Vant 4；仅从 `src/lib/supabase.ts` 导入 supabase；Composable 放在 `src/composables/`，视图放在 `src/views/` 或 `src/views/sale-orders/`。
- 路由：/sale-orders/new 为需登录路由；meta.title「新建出货单」。
- 错误处理：统一 Toast 中文提示；网络错误重试 1 次；关键操作（若本 Story 有删除条目）可二次确认。

### Library & Framework Requirements

| 依赖 | 用途 |
|------|------|
| @supabase/supabase-js | 表 insert、RLS | 在 useSaleOrders 内使用 |
| vant | NavBar, Field, Form, Button, Toast, Dialog, Popup 等 | 已有 |
| Vue Router | 路由跳转 | 已有 |

### File Structure Requirements

- `huotong-app/src/composables/useSaleOrders.ts` — 新建
- `huotong-app/src/views/sale-orders/SaleOrderCreateView.vue` 或 `huotong-app/src/views/SaleOrderCreateView.vue` — 新建
- `huotong-app/src/router/index.ts` — 修改：将 sale-orders/new 的 component 指向新视图
- Supabase migrations — 新建 migration：create sale_orders、sale_order_items 及 RLS

### Testing Requirements

- 能通过「新建出货单」进入创建页，显示客户选择与商品添加区域。
- 选择客户后客户名显示在头部；添加商品后条目显示且单价为售价、小计与总金额正确。
- 修改数量/单价或删除条目后，小计与总金额实时更新。
- 保存草稿（必须实现）后，sale_orders 与 sale_order_items 有对应记录，total_amount 正确。

---

## Project Context Reference

- [Source: _bmad-output/project-context.md] — 技术栈 Vue 3.5+、Vite 7.x、Vant 4.9+、Pinia、Vue Router、Supabase 单例从 `src/lib/supabase.ts` 导入；环境变量 VITE_ 前缀；路由默认需登录；Toast 中文错误提示；网络错误重试 1 次。

---

## Dev Agent Record

### Agent Model Used

(实现时由 Agent 填写)

### Debug Log References

(无)

### Completion Notes List

- Supabase 通过 MCP apply_migration 创建 sale_orders、sale_order_items 表及 RLS。
- useSaleOrders.createDraft 实现：order_no 格式 SOyyyyMMdd-随机码，先 insert 主表再 insert 明细，网络错误重试 1 次。
- SaleOrderCreateView：客户选择与商品选择均用 VanPopup + Search + 列表，选中客户/商品后回填；条目支持数量/单价内联编辑（原生 input）与删除；底部实时总金额与保存按钮，未选客户或无有效条目时禁用保存并 Toast 提示。
- 路由 /sale-orders/new 指向 SaleOrderCreateView；main.ts 注册 Popup 组件。
- 自测：npm run build 通过；未登录访问 /sale-orders/new 重定向至 /login?redirect=/sale-orders/new。建议用户本地登录后验证：选择客户、添加商品、修改数量/单价、保存草稿。
- CR 修复：createDraft 明细写入失败时回滚删除主单，避免遗留孤立草稿单。
- CR 修复：创建页对数量/单价做数值清洗与边界兜底（数量>=1、单价>=0、金额保留两位），避免 NaN/负值导致总额异常。

### Change Log

- 2026-03-10：完成代码审查并修复 2 个 Medium 问题（主从写入一致性、金额输入健壮性），回归构建通过，状态更新为 done。

### Review Record

- Reviewer: AI Agent
- Date: 2026-03-10
- Findings:
  - High: 0
  - Medium: 2（已修复 2，剩余 0）
  - Low: 0
- Verification:
  - `npm run build`：通过

### File List

- huotong-app/src/composables/useSaleOrders.ts（新建）
- huotong-app/src/views/SaleOrderCreateView.vue（新建）
- huotong-app/src/router/index.ts（修改：sale-orders/new 指向 SaleOrderCreateView）
- huotong-app/src/main.ts（修改：注册 Vant Popup）
- Supabase：migration create_sale_orders_and_items（sale_orders、sale_order_items 表及 RLS）
