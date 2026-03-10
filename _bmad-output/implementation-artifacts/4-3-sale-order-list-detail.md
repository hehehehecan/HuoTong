# Story 4.3: 出货单列表与详情

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 家人（用户），
I want 查看历史出货单列表并按日期或客户筛选，
so that 可以随时回顾历史出货记录。

## Acceptance Criteria

1. **Given** 系统中已有出货单记录  
   **When** 用户进入出货单列表页  
   **Then** 显示所有出货单，每条显示单号、客户名、总金额、日期、状态  
   **And** 按创建日期倒序排列（最新在前），支持下拉刷新

2. **Given** 用户想筛选出货单  
   **When** 选择按客户筛选或按日期范围筛选  
   **Then** 列表更新为符合条件的出货单

3. **Given** 用户点击某条出货单  
   **When** 进入出货单详情页  
   **Then** 显示完整信息：单号、客户名称、所有商品条目（商品名、数量、单价、小计）、总金额、创建时间、状态

## Tasks / Subtasks

- [x] Task 1 (AC: #1) — 出货单列表页与数据
  - [x] 1.1 在 useSaleOrders 中提供 list(filters?) 方法：从 sale_orders 查询（可选 customer_id、created_at 日期范围），join customers 取客户名，按 created_at 倒序；支持下拉刷新（重新调用 list）
  - [x] 1.2 新增路由 path: 'sale-orders'、name: 'sale-orders'，组件 SaleOrderListView.vue，meta.title「出货单」
  - [x] 1.3 列表页展示每条：单号(order_no)、客户名、总金额(total_amount)、日期(created_at)、状态(status)；空状态提示「暂无出货单」
- [x] Task 2 (AC: #2) — 筛选
  - [x] 2.1 列表页提供筛选入口：按客户（弹窗选择客户，useCustomers）、按日期范围（起止日期选择）；筛选条件变化时重新请求 list(filters)
  - [x] 2.2 显示当前筛选条件，支持清除筛选恢复全部
- [x] Task 3 (AC: #3) — 详情页与导航
  - [x] 3.1 列表项点击跳转 /sale-orders/:id（已有 SaleOrderDetailView）；确认详情页已展示单号、客户名称、商品条目（商品名、数量、单价、小计）、总金额、创建时间、状态
  - [x] 3.2 首页或导航栏「单据」入口可进入出货单列表（或保留现有「新建出货单」入口，列表从首页快捷入口或底部 Tab 进入，按项目现有导航设计）

## Dev Notes

- **本 Story 范围**：出货单列表页（含筛选）、与已有详情页的导航衔接；详情页已在 Story 4.2 实现（SaleOrderDetailView），本 Story 仅确认展示内容满足 AC#3 并确保从列表可进入。
- **数据**：sale_orders、sale_order_items、customers 已存在；list 需 join customers 显示客户名；筛选为前端或 Supabase 查询参数（customer_id、created_at gte/lte）。
- **入口**：路由需新增 /sale-orders 列表；首页已有「新建出货单」指向 /sale-orders/new，可增加「出货单列表」入口或由底部「单据」Tab 进入列表（与现有 PlaceholderView 替换为列表页）。

### Project Structure Notes

- **Composable**：在 `useSaleOrders.ts` 中新增 `list(filters?: { customer_id?: string; date_from?: string; date_to?: string })`，返回带客户名的订单列表，按 created_at desc。
- **视图**：新建 `src/views/SaleOrderListView.vue`，列表用 Vant List/PullRefresh，筛选用 Popup + 客户选择 + 日期选择（Vant DatetimePicker 或原生 input type="date"），点击行 router.push(`/sale-orders/${id}`)。
- **路由**：新增 `path: 'sale-orders'`（注意顺序：列表放 :id 之前或使用明确 path），component: SaleOrderListView，meta.title「出货单」。若当前无 path 'sale-orders'，添加在 sale-orders/new 之前。

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 4 - Story 4.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture sale_orders; Frontend Architecture /sale-orders]
- [Source: _bmad-output/implementation-artifacts/4-2-sale-order-confirm.md#SaleOrderDetailView、useSaleOrders、路由 /sale-orders/:id]
- [Source: _bmad-output/implementation-artifacts/4-1-sale-order-create.md#useSaleOrders、createDraft]
- [Source: _bmad-output/implementation-artifacts/3-1-customer-entry-list.md#useCustomers、列表与搜索]
- [Source: _bmad-output/project-context.md#Supabase 单例、Vant 注册、Toast 中文]

---

## Developer Context (Guardrails)

### Technical Requirements

- **useSaleOrders.list(filters?)**：查询 sale_orders，select 含 id, order_no, customer_id, total_amount, status, created_at；join customers 取 name 作为客户名；可选 filter：customer_id 精确匹配，date_from/date_to 为 created_at 范围（ISO 日期字符串，含当日边界）；order by created_at desc；错误用 Toast 中文、网络重试 1 次。
- **列表页**：Vant PullRefresh 下拉刷新调用 list；每条显示 order_no、客户名、total_amount 格式化为金额、created_at 格式化为本地日期时间、status 显示为「草稿」/「已确认」；点击行跳转 /sale-orders/:id。
- **筛选**：客户筛选弹窗复用 useCustomers.fetchAll 或 search 选单；日期范围用两个日期选择（起、止），提交后 list({ customer_id, date_from, date_to })；清除筛选即 list() 无参。

### Architecture Compliance

- 前端：Vue 3 + Vite + TypeScript，Vant 4，仅从 `src/lib/supabase.ts` 导入 supabase；Composable 在 `src/composables/useSaleOrders.ts`，视图在 `src/views/`。
- 路由：/sale-orders 为需登录；列表 path 须在 /sale-orders/:id 之前注册（或 path 为 'sale-orders' 且 name: 'sale-orders'），避免 :id 吃掉 'sale-orders'。
- 详情页：4.2 已实现 SaleOrderDetailView，展示单号、客户、商品条目、总金额、创建时间、状态；本 Story 不修改详情页逻辑，仅确保列表可跳转并确认详情展示完整。

### Library & Framework Requirements

| 依赖 | 用途 |
|------|------|
| @supabase/supabase-js | select、join、filter、order |
| vant | List、PullRefresh、Popup、DatetimePicker/Field、NavBar、Toast |
| Vue Router | 跳转 /sale-orders/:id |

### File Structure Requirements

- `huotong-app/src/composables/useSaleOrders.ts` — 修改：新增 list(filters?)
- `huotong-app/src/views/SaleOrderListView.vue` — 新建
- `huotong-app/src/router/index.ts` — 修改：新增 path 'sale-orders' 指向 SaleOrderListView（在 sale-orders/:id 前）
- 无需新 Supabase migration（表已存在）

### Testing Requirements

- 进入出货单列表页，有数据时显示单号、客户名、总金额、日期、状态，按日期倒序；无数据时显示空状态。
- 下拉刷新重新加载列表。
- 按客户筛选后列表仅该客户出货单；按日期范围筛选后列表在范围内；清除筛选恢复全部。
- 点击某条进入详情页，详情显示单号、客户、商品条目、总金额、创建时间、状态。

---

## Previous Story Intelligence

- **4.1 出货单创建**：useSaleOrders.createDraft、SaleOrderCreateView、/sale-orders/new；order_no 格式 SO+日期+随机码；主从表先主后从，失败回滚。
- **4.2 出货单确认**：useSaleOrders.confirm、SaleOrderDetailView、/sale-orders/:id；详情页已展示单号、客户、商品条目、总金额、状态、创建时间；draft 可确认出货，confirmed 只读。本 Story 复用详情页，仅新增列表与筛选。

---

## Project Context Reference

- [Source: _bmad-output/project-context.md] — Vue 3.5+、Vite 7.x、Vant 4.9+、Pinia、Vue Router、Supabase 单例从 `src/lib/supabase.ts` 导入；Toast 中文；网络错误重试 1 次；路由默认需登录。

---

## Dev Agent Record

### Agent Model Used

(实现时由 Agent 填写)

### Debug Log References

(无)

### Completion Notes List

- useSaleOrders：新增 list(filters?)、SaleOrderWithCustomer、SaleOrderListFilters；select 含 customers(name) join，按 created_at 倒序，支持 customer_id、date_from/date_to 筛选；错误 Toast、网络重试 1 次。
- SaleOrderListView.vue：PullRefresh 下拉刷新、列表展示单号/客户名/总金额/日期/状态，筛选弹窗（客户 select + 日期起止 input date），清除筛选与确定应用筛选；点击行跳转 /sale-orders/:id。
- 路由：新增 path 'sale-orders' 指向 SaleOrderListView；底部 Tab「单据」改为 to="/sale-orders"；path 'orders' 重定向至 /sale-orders。
- 详情页：4.2 已实现 SaleOrderDetailView，满足 AC#3（单号、客户、商品条目、总金额、创建时间、状态）；列表可正常跳转详情。
- 自测：npm run build 通过。

### File List

- huotong-app/src/composables/useSaleOrders.ts（修改：list、SaleOrderWithCustomer、SaleOrderListFilters）
- huotong-app/src/views/SaleOrderListView.vue（新建）
- huotong-app/src/router/index.ts（修改：新增 sale-orders 列表路由，orders 重定向至 sale-orders，Tab 单据指向 /sale-orders）
- huotong-app/src/components/MainLayout.vue（修改：Tabbar 单据 to="/sale-orders"）

### Change Log

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
