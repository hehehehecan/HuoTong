# Story 3.2: 客户编辑与删除

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 家人（用户），
I want 修改客户信息或删除不再合作的客户，
so that 客户资料始终准确。

## Acceptance Criteria

1. **Given** 用户点击客户列表中的某客户  
   **When** 进入客户详情页  
   **Then** 显示客户所有信息（姓名、电话、地址），各字段可编辑

2. **Given** 用户修改信息并保存  
   **When** 保存成功  
   **Then** Toast 成功提示，可选：留在详情页或返回列表

3. **Given** 用户点击「删除客户」  
   **When** 弹出确认弹窗  
   **Then** 确认后删除客户并返回客户列表；取消则不操作

## Tasks / Subtasks

- [x] Task 1 (AC: #1) — 客户详情页与编辑
  - [x] 1.1 新增路由 `/customers/:id`，对应客户详情/编辑视图（如 CustomerDetailView 或复用/扩展表单）
  - [x] 1.2 根据路由 params 加载该客户数据（useCustomers 需提供 getById 或由列表传入）；展示姓名、电话、地址，均为可编辑表单项
  - [x] 1.3 保存时调用 useCustomers.update(id, payload)；保存前校验姓名必填；成功 Toast「保存成功」，失败 Toast「保存失败，请检查网络后重试」
- [x] Task 2 (AC: #2, #3) — 删除与确认
  - [x] 2.1 详情页提供「删除客户」按钮；点击后弹出 Vant Dialog 二次确认（文案如「确定要删除该客户吗？」）
  - [x] 2.2 确认后调用 useCustomers.remove(id)；成功则跳转 `/customers` 并 Toast「已删除」；失败 Toast 错误提示
  - [x] 2.3 列表页点击某客户进入详情：从 CustomerListView 跳转到 `/customers/:id`（传 id）

## Dev Notes

- **本 Story 范围**：仅客户编辑与删除；不包含客户详情中的历史出货单与应收汇总（Epic 6 Story 6.4）。
- **数据**：customers 表已存在（Story 3.1）；RLS 已配置；需在 useCustomers 中扩展 update(id, data)、remove(id)、可选 getById(id)。
- **UI 与交互**：与 3.1 及商品编辑保持一致——Vant Form/Field、大字体、大按钮；删除前必须二次确认。

### Project Structure Notes

- Composable：扩展 `src/composables/useCustomers.ts`，增加 update(id, partial)、remove(id)；可选 getById(id) 或由列表项导航带 id 加载。
- 视图：新建 `src/views/CustomerDetailView.vue`（或合并编辑与详情的表单视图），展示并编辑单条客户，底部或头部有「删除客户」按钮。
- 路由：新增 `/customers/:id`，对应 CustomerDetailView，meta.title「客户详情」或「编辑客户」。
- 列表：CustomerListView 中列表项点击跳转 `/customers/{{customer.id}}`。

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 3 - Story 3.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture customers 表; Frontend Architecture /customers/:id]
- [Source: _bmad-output/implementation-artifacts/3-1-customer-entry-list.md#useCustomers、表单校验、Toast、路由]
- [Source: _bmad-output/implementation-artifacts/2-2-product-list-search.md, 2-3-product-edit-delete.md# 编辑页、删除确认、update/remove]
- [Source: _bmad-output/project-context.md#Supabase 单例、Vant 注册、路由守卫、错误重试]

---

## Developer Context (Guardrails)

### Technical Requirements

- **useCustomers 扩展**：update(id: string, data: Partial&lt;CustomerInput&gt;) 与 remove(id: string)；update 时 name 可为空则保持原值或校验必填（与 3.1 一致：姓名必填）；remove 调用 Supabase delete；网络错误重试 1 次。
- **客户详情/编辑页**：根据 `/customers/:id` 的 id 加载客户；若 getById 不存在则可在 onMounted 用 fetchAll 后 find 或单独查；字段姓名（必填）、电话、地址可编辑；保存调用 update(id, { name, phone, address })。
- **删除**：Vant Dialog.confirm 文案「确定要删除该客户吗？」；确认后 remove(id)，成功 replace 到 `/customers` 并 Toast「已删除」。

### Architecture Compliance

- 前端：Vue 3 + Vite + TypeScript；UI：Vant 4；仅从 `src/lib/supabase.ts` 导入 supabase；useCustomers 与 3.1 一致风格。
- 路由：/customers/:id 为需登录路由；meta.title「编辑客户」或「客户详情」。
- 错误处理：统一 Toast 中文提示；网络错误重试 1 次。

### Library & Framework Requirements

| 依赖 | 用途 |
|------|------|
| @supabase/supabase-js | 表 update/delete、RLS | 已有，在 useCustomers 内使用 |
| vant | NavBar, Field, Form, Button, Toast, Dialog 等 | 已有 |
| vue-router | params.id, push/replace | 已有 |

### File Structure Requirements

- **huotong-app/src/composables/useCustomers.ts**：增加 update(id, data)、remove(id)；可选 getById(id)。
- **huotong-app/src/views/CustomerDetailView.vue**：新建；展示并编辑单条客户；删除按钮 + Dialog 确认。
- **huotong-app/src/views/CustomerListView.vue**：列表项点击跳转 `/customers/{{customer.id}}`。
- **huotong-app/src/router/index.ts**：新增 path `customers/:id`，component CustomerDetailView。

### Testing Requirements

- 人工验收：从列表进入客户详情，修改姓名/电话/地址保存成功；姓名为空时提示「请填写客户姓名」；删除确认弹窗取消则不删，确认后删除并回到列表且 Toast「已删除」。
- 自动化：`npm run build` 通过；若有 E2E 可增加编辑与删除流程用例。

### Previous Story Intelligence

- **3-1 客户录入与列表**：useCustomers 已有 fetchAll、search、create；CustomerFormView 仅新增、CustomerListView 列表+搜索+FAB。本 Story 扩展 useCustomers 的 update/remove；CustomerDetailView 可复用表单组件或独立页面，删除前必须 Dialog 确认。
- **2-3 商品编辑与删除**：ProductFormView 支持 :id 编辑、update、删除前确认；可完全参照：客户详情 = 单条客户表单 + 删除按钮 + 确认弹窗。
- **错误与重试**：网络错误重试 1 次；必填校验 Toast 中文；失败统一「保存失败，请检查网络后重试」。

### Project Context Reference

- 前端入口：huotong-app/src/main.ts；Supabase 单例仅从 lib/supabase.ts 导入；Vant 组件需已在 main.ts 注册；路由默认需登录；/customers/:id 需登录。

---

## Dev Agent Record

### Agent Model Used

(本循环由 Agent 实现)

### Debug Log References

- `npm run build` 通过

### Completion Notes List

- Task 1：useCustomers 增加 getById、update(id, data)、remove(id)；CustomerDetailView.vue 新建，路由 customers/:id 加载客户并支持编辑与保存；姓名必填，保存成功 Toast「保存成功」。
- Task 2：删除使用 showConfirmDialog「确定要删除该客户吗？」；确认后 remove(id) 并 replace 到 /customers、Toast「已删除」；CustomerListView 列表项 is-link 点击跳转 /customers/:id。
- CR 结论：未发现新的 High/Medium 问题；构建与类型检查通过。

### File List

- huotong-app/src/composables/useCustomers.ts（修改：增加 getById、update、remove）
- huotong-app/src/views/CustomerDetailView.vue（新建）
- huotong-app/src/views/CustomerListView.vue（修改：列表项点击跳转详情）
- huotong-app/src/router/index.ts（修改：新增 customers/:id 路由）
- _bmad-output/implementation-artifacts/3-2-customer-edit-delete.md（修改：任务勾选、Status、Dev Agent Record）
- _bmad-output/implementation-artifacts/sprint-status.yaml（修改：3-2 状态 → done）
