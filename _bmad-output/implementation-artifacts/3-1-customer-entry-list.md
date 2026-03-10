# Story 3.1: 客户录入与列表

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 家人（用户），
I want 录入客户的姓名、电话、地址，并查看客户列表，
so that 开出货单时可以快速选择客户。

## Acceptance Criteria

1. **Given** Supabase 中已创建 customers 表（id, name, phone, address, created_at, updated_at）且 RLS 策略已配置  
   **When** 用户在「新增客户」页面填写姓名、电话、地址并保存  
   **Then** 客户信息成功保存，返回客户列表

2. **Given** 系统中已有客户数据  
   **When** 用户进入客户列表页  
   **Then** 显示所有客户（姓名、电话），支持搜索和下拉刷新

3. **Given** 用户在搜索栏输入关键字  
   **When** 输入后触发搜索  
   **Then** 列表过滤显示姓名或电话中包含关键字的客户

## Tasks / Subtasks

- [x] Task 1 (AC: #1) — 数据库与 Composable
  - [x] 1.1 在 Supabase 中创建 customers 表（id uuid PK, name text, phone text, address text, created_at timestamptz, updated_at timestamptz），并配置 RLS 策略（与 products 一致：已认证用户可 CRUD）
  - [x] 1.2 新建 `useCustomers.ts` composable：fetchAll、search(keyword)、create(input)、类型 Customer / CustomerInput；搜索按 name/phone 模糊匹配；create 网络错误重试 1 次
- [x] Task 2 (AC: #1) — 新增客户页面
  - [x] 2.1 新增路由 `/customers/new`，对应客户表单视图（CustomerFormView 或通用表单）
  - [x] 2.2 表单字段：姓名（必填）、电话、地址；保存前校验「请填写客户姓名」；保存成功后跳转客户列表并 Toast 成功
  - [x] 2.3 保存失败时 Toast「保存失败，请检查网络后重试」，网络错误自动重试 1 次
- [x] Task 3 (AC: #2, #3) — 客户列表与搜索
  - [x] 3.1 新增路由 `/customers`，客户列表页：显示姓名、电话，按姓名排序，支持下拉刷新
  - [x] 3.2 搜索栏输入关键字（防抖 300ms）触发 search，列表实时过滤姓名或电话包含关键字的客户
  - [x] 3.3 空状态提示「没有找到相关客户」或「暂无客户，点击下方按钮新增」
  - [x] 3.4 列表页提供 FAB 或按钮「新增客户」跳转 `/customers/new`

## Dev Notes

- **本 Story 范围**：仅客户录入与列表、搜索；不包含客户编辑/删除（Story 3.2）及客户详情中的历史出货单与应收汇总（Epic 6）。
- **数据**：customers 表与 architecture 一致；RLS 参考现有 products 策略（auth.uid() 已认证即可访问）。
- **UI 与交互**：与商品列表/表单保持一致——Vant 组件、大字体、大按钮、中文提示；搜索防抖 300ms，与 2.2 一致。

### Project Structure Notes

- 迁移：Supabase 新建 migration 创建 customers 表及 RLS。
- Composable：`src/composables/useCustomers.ts`。
- 视图：`src/views/CustomerListView.vue`（列表+搜索+下拉刷新）、`src/views/CustomerFormView.vue`（新增客户表单）。
- 路由：`/customers`、`/customers/new`；需登录，不设 meta.public。
- 导航：若主布局底部/首页有「客户」入口，本 Story 可一并接通；若无则仅路由可访问，后续 Story 可加导航。

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 3 - Story 3.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture, customers 表; Frontend Architecture, useCustomers, 路由 /customers]
- [Source: _bmad-output/implementation-artifacts/2-1-product-data-entry.md, 2-2-product-list-search.md# 表单校验、列表搜索、下拉刷新、错误重试]
- [Source: _bmad-output/project-context.md#Supabase 单例、目录约定、Vant 注册、路由守卫]

---

## Developer Context (Guardrails)

### Technical Requirements

- **customers 表**：id (uuid PK default gen_random_uuid()), name (text NOT NULL), phone (text), address (text), created_at (timestamptz default now()), updated_at (timestamptz default now())；RLS 策略与 products 一致（SELECT/INSERT/UPDATE/DELETE 对 auth.role() = 'authenticated' 开放）。
- **Composable**：useCustomers() 提供 customers (ref)、loading (ref)、fetchAll()、search(keyword)、create(input)；create 的 payload 为 { name, phone?, address? }，name 必填；网络错误重试 1 次；搜索使用 ilike 对 name、phone 模糊匹配，与 useProducts.search 模式一致（注意转义 % _）。
- **新增客户页**：姓名必填，未填时 Toast「请填写客户姓名」；保存成功后跳转 `/customers` 并 Toast 成功；失败 Toast「保存失败，请检查网络后重试」。
- **客户列表页**：展示姓名、电话；按 name 升序；下拉刷新（PullRefresh）；搜索框防抖 300ms 触发 search；空列表友好提示；FAB 或底部/顶部按钮「新增客户」→ `/customers/new`.

### Architecture Compliance

- 前端：Vue 3 + Vite + TypeScript；UI：Vant 4；业务数据通过 composable 直连 Supabase；仅从 `src/lib/supabase.ts` 导入 supabase。
- **数据库**：通过 Supabase Migration（若存在 migrations 目录）或 Dashboard SQL Editor 创建 customers 表及 RLS；执行后的 SQL 脚本需留存以便复现。
- 路由：/customers、/customers/new 为需登录路由；meta.title 设为「客户」「新增客户」。
- 错误处理：统一 Toast 中文提示；网络错误重试 1 次（与 project-context 及 2.1 一致）。

### Library & Framework Requirements

| 依赖 | 用途 |
|------|------|
| @supabase/supabase-js | 表 CRUD、RLS | 已有，在 useCustomers 内使用 |
| vant | NavBar, Field, Form, Button, Toast, List, PullRefresh, Empty, FAB 等 | 已有，新用到的组件需在 main.ts 注册 |
| vue-router | push/replace | 已有 |

### File Structure Requirements

- **Supabase**：若项目使用 `supabase/migrations` 目录，则新建 migration 文件创建 `customers` 表及 RLS policies；若未使用 migrations，则在 Supabase Dashboard SQL Editor 中执行建表与 RLS 的 SQL，并将完整脚本保存于 `_bmad-output/implementation-artifacts` 或 `docs`，便于其他环境复现。
- **huotong-app/src/composables/useCustomers.ts**：新建；Customer/CustomerInput 类型；fetchAll、search、create；withRetry 与 escapeIlike 模式可复用或内联。
- **huotong-app/src/views/CustomerListView.vue**：新建；列表、搜索、下拉刷新、空状态、新增按钮。
- **huotong-app/src/views/CustomerFormView.vue**：新建；仅新增客户（name 必填、phone、address）；提交后 create 并跳转列表。
- **huotong-app/src/router/index.ts**：新增 path `customers`、`customers/new`，component 对应上述视图，meta.title 设置。

### Testing Requirements

- 人工验收：新增客户保存成功后在列表中出现；姓名为空时提示「请填写客户名称」；列表搜索姓名/电话关键字能过滤；下拉刷新更新列表；空列表有友好提示。
- 自动化：`npm run build` 通过；若存在 E2E，可增加客户录入与列表访问用例。

### Previous Story Intelligence

- **Epic 2 商品**：useProducts 含 fetchAll、search（防抖 300ms、ilike 转义）、create、withRetry；ProductFormView 单条新增/编辑；ProductListView 搜索、下拉刷新、FAB 新增。客户模块可完全参照：useCustomers 结构类似 useProducts；CustomerFormView 仅新增、字段 name/phone/address；CustomerListView 类似 ProductListView（列表+搜索+下拉刷新+FAB）。
- **错误与重试**：网络错误重试 1 次；必填校验 Toast 中文；失败统一「保存失败，请检查网络后重试」。

### Project Context Reference

- 前端入口：huotong-app/src/main.ts；Supabase 单例仅从 lib/supabase.ts 导入；Vant 组件需在 main.ts 注册；路由默认需登录；新视图与路由需与 MainLayout/底部导航协调（若导航有「客户」则本 Story 可接通，否则仅路由可访问）。

---

## Dev Agent Record

### Agent Model Used

(本循环由 Agent 实现)

### Debug Log References

- `npm run build` 通过

### Completion Notes List

- Task 1：Supabase 通过 apply_migration 创建 customers 表及 RLS（SELECT/INSERT/UPDATE/DELETE for authenticated）；useCustomers.ts 实现 fetchAll、search（name/phone ilike 转义）、create（withRetry 1 次）。
- Task 2：路由 customers/new 对应 CustomerFormView；表单姓名必填、电话、地址；保存成功跳转 /customers 并 Toast；失败 Toast「保存失败，请检查网络后重试」。
- Task 3：路由 customers 对应 CustomerListView；搜索防抖 300ms、下拉刷新、空状态文案、FAB「新增客户」；MainLayout titleMap 增加 customers 以显示标题「客户」。
- CR 修复：处理 CustomerListView 中搜索与初始加载失败时的未处理 Promise 拒绝；为 useCustomers.create 增加空姓名兜底校验，避免非法写入。

### File List

- huotong-app/src/composables/useCustomers.ts（新建）
- huotong-app/src/views/CustomerFormView.vue（新建）
- huotong-app/src/views/CustomerListView.vue（新建）
- huotong-app/src/router/index.ts（修改：新增 customers、customers/new 路由）
- huotong-app/src/components/MainLayout.vue（修改：titleMap 增加 customers）
- _bmad-output/implementation-artifacts/3-1-customers-table.sql（新建：建表+RLS 脚本留存）
- _bmad-output/implementation-artifacts/3-1-customer-entry-list.md（修改：任务勾选、Status、Dev Agent Record）
- _bmad-output/implementation-artifacts/sprint-status.yaml（修改：3-1 状态 → done）
