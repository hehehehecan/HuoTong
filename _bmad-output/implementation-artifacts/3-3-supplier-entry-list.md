# Story 3.3: 供应商录入与列表

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 家人（用户），
I want 录入供应商的名称、联系人、电话、主营品类，并查看供应商列表，
so that 进货记账时可以快速选择供应商。

## Acceptance Criteria

1. **Given** Supabase 中已创建 suppliers 表（id, name, contact, phone, category, created_at, updated_at）且 RLS 策略已配置  
   **When** 用户在「新增供应商」页面填写名称、联系人、电话、主营品类并保存  
   **Then** 供应商信息成功保存，返回供应商列表

2. **Given** 系统中已有供应商数据  
   **When** 用户进入供应商列表页  
   **Then** 显示所有供应商（名称、联系人、电话），支持搜索和下拉刷新

3. **Given** 用户在搜索栏输入关键字  
   **When** 输入后触发搜索  
   **Then** 列表过滤显示名称或联系人包含关键字的供应商

## Tasks / Subtasks

- [x] Task 1 (AC: #1) — 数据库与 Composable
  - [x] 1.1 在 Supabase 中创建 suppliers 表（id uuid PK, name text, contact text, phone text, category text, created_at timestamptz, updated_at timestamptz），并配置 RLS 策略（与 customers/products 一致：已认证用户可 CRUD）
  - [x] 1.2 新建 `useSuppliers.ts` composable：fetchAll、search(keyword)、create(input)、类型 Supplier / SupplierInput；搜索按 name/contact 模糊匹配；create 网络错误重试 1 次
- [x] Task 2 (AC: #1) — 新增供应商页面
  - [x] 2.1 新增路由 `/suppliers/new`，对应供应商表单视图（SupplierFormView 或通用表单）
  - [x] 2.2 表单字段：名称（必填）、联系人、电话、主营品类；保存前校验「请填写供应商名称」；保存成功后跳转供应商列表并 Toast 成功
  - [x] 2.3 保存失败时 Toast「保存失败，请检查网络后重试」，网络错误自动重试 1 次
- [x] Task 3 (AC: #2, #3) — 供应商列表与搜索
  - [x] 3.1 新增路由 `/suppliers`，供应商列表页：显示名称、联系人、电话，按名称排序，支持下拉刷新
  - [x] 3.2 搜索栏输入关键字（防抖 300ms）触发 search，列表实时过滤名称或联系人包含关键字的供应商
  - [x] 3.3 空状态提示「没有找到相关供应商」或「暂无供应商，点击下方按钮新增」
  - [x] 3.4 列表页提供 FAB 或按钮「新增供应商」跳转 `/suppliers/new`

## Dev Notes

- **本 Story 范围**：仅供应商录入与列表、搜索；不包含供应商编辑/删除（Story 3.4）及供应商详情中的历史进货单与应付汇总（Epic 6）。
- **数据**：suppliers 表与 architecture 一致；RLS 参考现有 customers/products 策略（auth.uid() 已认证即可访问）。
- **UI 与交互**：与客户列表/表单、商品列表/表单保持一致——Vant 组件、大字体、大按钮、中文提示；搜索防抖 300ms。

### Project Structure Notes

- 迁移：Supabase 新建 migration 创建 suppliers 表及 RLS。
- Composable：`src/composables/useSuppliers.ts`。
- 视图：`src/views/SupplierListView.vue`（列表+搜索+下拉刷新）、`src/views/SupplierFormView.vue`（新增供应商表单）。
- 路由：`/suppliers`、`/suppliers/new`；需登录，不设 meta.public。
- 导航：主布局通过 titleMap 映射路由名到标题；本 Story 需在 MainLayout 的 titleMap 中增加 `suppliers: '供应商'`，使 /suppliers 页显示标题「供应商」。若底部 Tabbar 或首页有「供应商」入口，可一并接通；若无则仅路由可访问，后续 Story 可加导航。

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 3 - Story 3.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture suppliers 表; Frontend Architecture useSuppliers, 路由 /suppliers]
- [Source: _bmad-output/implementation-artifacts/3-1-customer-entry-list.md, 3-2-customer-edit-delete.md#useCustomers、表单校验、列表搜索、下拉刷新]
- [Source: _bmad-output/project-context.md#Supabase 单例、Vant 注册、路由守卫、错误重试]

---

## Developer Context (Guardrails)

### Technical Requirements

- **suppliers 表**：id (uuid PK default gen_random_uuid()), name (text NOT NULL), contact (text), phone (text), category (text), created_at (timestamptz default now()), updated_at (timestamptz default now())；RLS 策略与 customers/products 一致（SELECT/INSERT/UPDATE/DELETE 对 auth.role() = 'authenticated' 开放）。
- **Composable**：useSuppliers() 提供 suppliers (ref)、loading (ref)、fetchAll()、search(keyword)、create(input)；create 的 payload 为 { name, contact?, phone?, category? }，name 必填；网络错误重试 1 次；搜索使用 ilike 对 name、contact 模糊匹配，与 useCustomers/useProducts.search 模式一致（注意转义 % _）。
- **新增供应商页**：名称必填，未填时 Toast「请填写供应商名称」；保存成功后跳转 `/suppliers` 并 Toast 成功；失败 Toast「保存失败，请检查网络后重试」。
- **供应商列表页**：展示名称、联系人、电话；按 name 升序；下拉刷新（PullRefresh）；搜索框防抖 300ms 触发 search；空列表友好提示；FAB 或底部/顶部按钮「新增供应商」→ `/suppliers/new`。

### Architecture Compliance

- 前端：Vue 3 + Vite + TypeScript；UI：Vant 4；仅从 `src/lib/supabase.ts` 导入 supabase；useSuppliers 与 useCustomers/useProducts 一致风格。
- 路由：/suppliers、/suppliers/new 为需登录路由；meta.title「供应商」「新增供应商」。
- 错误处理：统一 Toast 中文提示；网络错误重试 1 次。

### Library & Framework Requirements

| 依赖 | 用途 |
|------|------|
| @supabase/supabase-js | 表 CRUD、RLS | 已有，在 useSuppliers 内使用 |
| vant | NavBar, Field, Form, Button, Toast, List, PullRefresh, Empty, FAB 等 | 已有 |
| vue-router | push/replace | 已有 |

### File Structure Requirements

- **huotong-app/src/composables/useSuppliers.ts**：新建；Supplier/SupplierInput 类型；fetchAll、search、create；withRetry 与 escapeIlike 模式可复用 useCustomers 或内联。
- **huotong-app/src/views/SupplierFormView.vue**：新建；仅新增供应商（name 必填、contact、phone、category）；提交后 create 并跳转列表。
- **huotong-app/src/views/SupplierListView.vue**：新建；列表、搜索、下拉刷新、空状态、新增按钮。
- **huotong-app/src/router/index.ts**：新增 path `suppliers`、`suppliers/new`，component 对应上述视图，meta.title 设置。
- **huotong-app/src/components/MainLayout.vue**：若路由通过 MainLayout 渲染，则 titleMap 增加 `suppliers: '供应商'`，以便访问 /suppliers 时顶部标题显示「供应商」（与 3-1 客户入口一致）。
- **Supabase**：若项目使用 `supabase/migrations` 目录，则新建 migration 创建 `suppliers` 表及 RLS policies；若未使用 migrations，则在 Supabase Dashboard SQL Editor 中执行建表与 RLS 的 SQL，并将完整脚本保存于 `_bmad-output/implementation-artifacts` 或 docs，便于复现。

### Testing Requirements

- 人工验收：新增供应商保存成功后在列表中出现；名称为空时提示「请填写供应商名称」；列表搜索名称/联系人关键字能过滤；下拉刷新更新列表；空列表有友好提示。
- 自动化：`npm run build` 通过；若存在 E2E，可增加供应商录入与列表访问用例。

### Previous Story Intelligence

- **3-1 客户录入与列表**：useCustomers 已有 fetchAll、search、create；CustomerFormView 仅新增、CustomerListView 列表+搜索+FAB。本 Story 完全参照：useSuppliers 结构同 useCustomers；SupplierFormView 仅新增、字段 name（必填）/contact/phone/category；SupplierListView 同 CustomerListView（列表+搜索+下拉刷新+FAB）。
- **3-2 客户编辑与删除**：本 Story 不涉及编辑/删除，仅录入与列表；3.4 再做供应商编辑与删除。
- **2-1/2-2 商品**：useProducts 含 fetchAll、search（防抖 300ms、ilike 转义）、create、withRetry；表单校验、Toast、下拉刷新模式一致。
- **错误与重试**：网络错误重试 1 次；必填校验 Toast 中文；失败统一「保存失败，请检查网络后重试」。

### Project Context Reference

- 前端入口：huotong-app/src/main.ts；Supabase 单例仅从 lib/supabase.ts 导入；Vant 组件需在 main.ts 注册；路由默认需登录；/suppliers、/suppliers/new 需登录。

---

## Dev Agent Record

### Agent Model Used

(本循环由 Agent 实现)

### Debug Log References

- `npm run build` 通过

### Completion Notes List

- Task 1：Supabase migration 创建 suppliers 表及 RLS（SELECT/INSERT/UPDATE/DELETE for authenticated）；useSuppliers.ts 实现 fetchAll、search（name/contact ilike 转义）、create（withRetry 1 次）；SQL 脚本留存于 3-3-suppliers-table.sql。
- Task 2：路由 suppliers/new 对应 SupplierFormView；表单名称必填、联系人、电话、主营品类；保存成功跳转 /suppliers 并 Toast；失败 Toast「保存失败，请检查网络后重试」。
- Task 3：路由 suppliers 对应 SupplierListView；搜索防抖 300ms、下拉刷新、空状态文案、FAB「新增供应商」；MainLayout titleMap 增加 suppliers: '供应商'。
- CR 结论：未发现新的 High/Medium 问题；构建与类型检查通过。

### File List

- huotong-app/src/composables/useSuppliers.ts（新建）
- huotong-app/src/views/SupplierFormView.vue（新建）
- huotong-app/src/views/SupplierListView.vue（新建）
- huotong-app/src/router/index.ts（修改：新增 suppliers、suppliers/new 路由）
- huotong-app/src/components/MainLayout.vue（修改：titleMap 增加 suppliers）
- _bmad-output/implementation-artifacts/3-3-suppliers-table.sql（新建：建表+RLS 脚本留存）
- _bmad-output/implementation-artifacts/3-3-supplier-entry-list.md（修改：任务勾选、Status、Dev Agent Record）
- _bmad-output/implementation-artifacts/sprint-status.yaml（修改：3-3 状态 → done）
