# Story 2.4: 电脑端批量录入商品

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 女儿（用户），
I want 在电脑端通过表格形式快速批量录入多个商品，
so that 系统初始化时能高效地导入大量商品数据。

## Acceptance Criteria

1. **Given** 用户使用电脑浏览器访问商品管理页  
   **When** 点击「批量录入」按钮  
   **Then** 显示表格编辑器界面，每行一个商品（名称、规格、售价、进价），可动态添加行

2. **Given** 用户在表格中填写了多条商品数据  
   **When** 点击「批量保存」  
   **Then** 所有商品一次性保存到数据库，成功后显示「成功录入 N 件商品」

3. **Given** 批量数据中某条记录缺少必填字段  
   **When** 点击「批量保存」  
   **Then** 高亮标记有问题的行，提示「第 X 行：请填写商品名称」，不提交任何数据

4. **Given** 用户使用手机浏览器  
   **When** 访问批量录入功能  
   **Then** 降级为逐条录入模式（跳转到单条新增页面），提示「批量录入请使用电脑端」

## Tasks / Subtasks

- [x] Task 1 (AC: #1) — PC 端批量录入入口与表格页
  - [x] 1.1 在商品列表页（ProductListView）增加「批量录入」按钮；仅在 PC 端显示（通过媒体查询或检测 viewport 宽度）
  - [x] 1.2 新增路由 `/products/batch`，对应批量录入视图（如 ProductBatchImportView.vue）
  - [x] 1.3 批量录入页：表格形式，列包括名称、规格、售价、进价；支持动态添加行、删除空行；表头固定，内容可滚动
- [x] Task 2 (AC: #2, #3) — 批量保存与校验
  - [x] 2.1 实现 useProducts 的 `createBatch(items: ProductInput[])` 或等价能力：循环调用 Supabase insert 或使用 `.insert([...])` 批量插入；统一错误处理与重试（网络错误重试 1 次）
  - [x] 2.2 提交前校验：遍历每一行，若名称为空则记录行号；若有任意一行无效，高亮该行（如红色边框或背景），Toast「第 X 行：请填写商品名称」，不发起任何请求
  - [x] 2.3 校验通过后调用 createBatch，成功后 Toast「成功录入 N 件商品」，并跳转回商品列表或清空表格供继续录入
- [x] Task 3 (AC: #4) — 手机端降级
  - [x] 3.1 进入批量录入路由时检测是否为窄屏（或通过路由 meta + 布局判断）；若为手机端则重定向到 `/products/new` 并 Toast「批量录入请使用电脑端」
  - [x] 3.2 或在商品列表页在手机端不显示「批量录入」按钮，仅 PC 端显示，避免用户从其他入口进入批量页；若仍从 URL 直接进入则执行 3.1 的降级逻辑

## Dev Notes

- **本 Story 范围**：在现有商品列表与单条新增/编辑基础上，增加 PC 端表格批量录入、批量保存 API、必填校验与错误行高亮；手机端不提供表格界面，降级为跳转单条新增并提示。
- **数据**：复用 products 表与 useProducts；批量插入可复用单条 create 的 payload 结构（name, spec, sell_price, buy_price），stock 默认 0；不修改表结构。
- **PC 与手机判定**：可用 `window.matchMedia('(min-width: 768px)')` 或类似断点（与架构中「响应式设计」一致）；断点需与 MainLayout/导航表现一致。

### Project Structure Notes

- 视图：新增 `src/views/ProductBatchImportView.vue`（表格编辑器 + 批量保存 + 校验）。
- 路由：`path: 'products/batch'`，name 可选 `ProductBatchImport`，component 为 ProductBatchImportView；需登录；可在路由守卫或组件内做窄屏重定向。
- Composable：`useProducts.ts` 增加 `createBatch(items: ProductInput[])`，内部可多次 insert 或 Supabase 批量 insert。

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2 - Story 2.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture, Frontend Architecture, Implementation Patterns, 响应式设计策略]
- [Source: _bmad-output/implementation-artifacts/2-3-product-edit-delete.md#Dev Notes, File List]
- [Source: _bmad-output/implementation-artifacts/2-1-product-data-entry.md#Dev Notes]

---

## Developer Context (Guardrails)

### Technical Requirements

- **表格编辑器**：PC 端展示为可编辑表格，每行对应一个商品（名称、规格、售价、进价）；至少支持动态添加行；规格/售价/进价可为空，默认与 2.1 一致（空字符串或 0）。
- **必填校验**：仅「名称」为必填；校验在客户端进行，按行索引提示「第 X 行：请填写商品名称」（X 从 1 开始）；有问题时高亮对应行，不调用后端。
- **批量保存**：createBatch 接收 ProductInput[]；可逐条调用现有 create() 或使用 Supabase `.insert(rows)` 一次插入多行；失败时统一 Toast「保存失败，请检查网络后重试」，网络错误重试 1 次（与 2.1/2.3 一致）。
- **成功反馈**：全部成功后 Toast「成功录入 N 件商品」，N 为实际插入条数。
- **手机端**：通过 viewport 或媒体查询判定；窄屏下访问 `/products/batch` 时重定向到 `/products/new` 并 Toast「批量录入请使用电脑端」；列表页在窄屏下不显示「批量录入」按钮。

### Architecture Compliance

- 前端：Vue 3 + Vite + TypeScript；UI：Vant 4（PC 端表格可用原生 table + input 或 Vant 组件组合）；业务数据通过 composable 直连 Supabase；仅从 `src/lib/supabase.ts` 导入 supabase。
- 不新增 Supabase 表或 RLS 变更；复用现有 products 表与 RLS。
- 路由：/products/batch 为需登录路由，不设 meta.public。
- 响应式：批量录入页面在 PC 端为表格编辑器，手机端降级为跳转单条新增并提示（与 architecture 中「批量录入页面在 PC 端展示为表格编辑器，手机端降级为逐条录入」一致）。

### Library & Framework Requirements

| 依赖 | 用途 | 说明 |
|------|------|------|
| @supabase/supabase-js | 批量 insert 或多次 insert | 已有，在 useProducts.createBatch 内使用 |
| vant | Button、Toast、NavBar、Field 等 | 已有；表格可用原生 HTML table + input 或 van-field |
| vue-router | push('/products'), push('/products/new') | 已有 |

### File Structure Requirements

- `huotong-app/src/composables/useProducts.ts`：增加 `createBatch(items: ProductInput[]): Promise<{ count: number }>` 或等价；内部可 `Promise.all(items.map(create))` 或 `supabase.from('products').insert([...])`；错误处理与重试与 create 一致。
- `huotong-app/src/views/ProductBatchImportView.vue`：新建；表格 UI、行数据绑定、添加行、校验、调用 createBatch、成功/失败 Toast、高亮错误行。
- `huotong-app/src/views/ProductListView.vue`：增加「批量录入」按钮，PC 端显示（如 `v-if="isDesktop"` 或 class 控制）；点击 `router.push('/products/batch')`。
- `huotong-app/src/router/index.ts`：新增 `path: 'products/batch'`，name 可选 `ProductBatchImport`，component 为 ProductBatchImportView；meta.title「批量录入商品」。
- 可选：在路由守卫或 ProductBatchImportView 的 onMounted 中检测窄屏，若为手机则 `router.replace('/products/new')` 并 `showToast('批量录入请使用电脑端')`。

### Testing Requirements

- 人工验收：PC 端进入商品列表点击「批量录入」进入表格页，添加多行并填写名称等，批量保存后列表中出现新商品且 Toast 显示「成功录入 N 件商品」；某行名称为空时点击批量保存，该行高亮且 Toast 提示「第 X 行：请填写商品名称」且无请求发出；手机端访问批量录入或从列表不显示按钮时，行为符合降级逻辑（跳转单条新增 + 提示）。
- 自动化：`npm run build` 通过。

### Previous Story Intelligence

- **Story 2.1**：useProducts 已有 fetchAll、create；ProductFormView 为单条新增表单；products 表结构为 id, name, spec, sell_price, buy_price, stock, created_at, updated_at；create 的 payload 为 name(必填)、spec/sell_price/buy_price/stock 默认值。
- **Story 2.2**：ProductListView 有搜索、下拉刷新、FAB 新增；路由 /products、/products/new。
- **Story 2.3**：useProducts 已有 getById、update、remove；编辑页复用 ProductFormView 或独立编辑页；列表项点击进编辑；main.ts 已注册 Dialog。批量录入不涉及编辑/删除，仅新增 createBatch 与表格页。
- **错误与重试**：网络错误重试 1 次，失败 Toast「保存失败，请检查网络后重试」；必填校验名称为空时 Toast「请填写商品名称」（单条）或「第 X 行：请填写商品名称」（批量）。

### Project Context Reference

- 前端入口：huotong-app/src/main.ts；Supabase 单例仅从 lib/supabase.ts 导入；Vant 组件需在 main.ts 注册；路由默认需登录；关键操作前二次确认（本 Story 批量保存可不必二次确认，因表格数据可恢复；若产品要求可加确认弹窗）。

---

## Dev Agent Record

### Agent Model Used

(本循环由 Agent 实现)

### Debug Log References

- `npm run build` 通过

### Completion Notes List

- Task 1：ProductListView 增加 isDesktop（matchMedia 768px）与「批量录入」按钮（仅 PC 显示）；路由新增 products/batch，component 为 ProductBatchImportView；ProductBatchImportView 实现表格（名称、规格、售价、进价）、添加行、删除行、表头固定。
- Task 2：useProducts 新增 createBatch(items)，使用 supabase.from('products').insert(rows).select('id') 批量插入，withRetry 网络错误重试 1 次；提交前校验名称必填，无效行高亮（error-row class）并 Toast「第 X 行：请填写商品名称」；成功后 Toast「成功录入 N 件商品」并跳转 /products。
- Task 3：ProductBatchImportView onMounted 检测窄屏则 router.replace('/products/new') 并 showToast「批量录入请使用电脑端」；列表页批量录入按钮 v-if="isDesktop"。

### File List

- huotong-app/src/composables/useProducts.ts（修改：新增 createBatch）
- huotong-app/src/views/ProductBatchImportView.vue（新建：表格批量录入、校验、手机端重定向、媒体查询监听清理与并发提交保护）
- huotong-app/src/views/ProductListView.vue（修改：isDesktop、批量录入按钮、媒体查询监听清理）
- huotong-app/src/router/index.ts（修改：新增 products/batch 路由）
- _bmad-output/implementation-artifacts/2-4-batch-import-products.md（修改：任务勾选、Status、Dev Agent Record）
- _bmad-output/implementation-artifacts/sprint-status.yaml（修改：2-4-batch-import-products 状态）

### Senior Developer Review (AI)

- Review Date: 2026-03-10
- Reviewer: Hezhangcan (AI)
- Outcome: Approve after fixes

#### Findings

- High: 0
- Medium: 2
  - `ProductListView` 在 `onMounted` 内部注册 `onUnmounted`，生命周期监听器无法可靠清理（已修复）
  - `ProductBatchImportView` 缺少媒体查询监听清理，且提交入口未做并发保护（已修复）
- Low: 1
  - 文件清单未体现上述审查修复细节（已补充）

#### Fix Summary

- 重构 `ProductListView` 的桌面端监听逻辑：在 setup 作用域维护 media query listener，并在卸载时统一移除。
- 为 `ProductBatchImportView` 增加媒体查询 change 监听与清理；在提交函数入口增加并发保护。
- 已执行 `npm run build`，构建通过。

### Change Log

- 2026-03-10: 完成代码审查，修复 2 个 Medium 问题；回归构建通过；状态更新为 done。
