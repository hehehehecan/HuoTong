# Story 2.3: 商品编辑与删除

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 家人（用户），
I want 编辑已有商品的信息或删除不再销售的商品，
so that 商品价格库始终保持最新准确。

## Acceptance Criteria

1. **Given** 用户在商品列表中点击某商品  
   **When** 进入商品详情/编辑页  
   **Then** 显示商品的所有信息（名称、规格、售价、进价），各字段可编辑

2. **Given** 用户修改了商品信息并点击「保存」  
   **When** 保存请求发送到 Supabase  
   **Then** 数据库更新成功，返回列表页，显示更新后的信息

3. **Given** 用户点击「删除商品」  
   **When** 系统弹出确认弹窗「确定要删除该商品吗？」  
   **Then** 用户确认后商品从数据库删除，列表中不再显示  
   **And** 用户取消则关闭弹窗，不执行删除

## Tasks / Subtasks

- [x] Task 1 (AC: #1,#2) — 商品编辑页与路由
  - [x] 1.1 新增路由 `/products/:id`，对应商品详情/编辑页；从路由 params 读取商品 id
  - [x] 1.2 编辑页展示商品名称、规格、售价、进价（Vant Form + Field），各字段可编辑；加载时通过 useProducts 根据 id 拉取单条商品数据
  - [x] 1.3 实现 useProducts 的 `getById(id)` 或 `fetchById(id)`：Supabase 按 id 查询单条；若不存在则 Toast 提示并返回列表
  - [x] 1.4 实现 useProducts 的 `update(id, data)`：Supabase 按 id 更新 name/spec/sell_price/buy_price（不在此 Story 改 stock）；统一错误处理与重试 1 次，失败 Toast「保存失败，请检查网络后重试」
  - [x] 1.5 提交前校验：名称为空时 Toast「请填写商品名称」，不请求；保存成功后 `router.push('/products')` 返回列表
- [x] Task 2 (AC: #3) — 删除商品与确认弹窗
  - [x] 2.1 实现 useProducts 的 `remove(id)`：Supabase 按 id 删除；统一错误处理，失败 Toast 提示
  - [x] 2.2 编辑页增加「删除商品」按钮；点击时弹出 Vant Dialog 确认，文案严格为「确定要删除该商品吗？」
  - [x] 2.3 用户确认后调用 remove(id)，成功后 Toast「已删除」并 `router.push('/products')`；用户取消则关闭弹窗，不调用 remove
- [x] Task 3 (AC: #1) — 列表入口到编辑页
  - [x] 3.1 在商品列表页（ProductListView）中，列表项可点击；点击某商品时 `router.push('/products/' + id)` 进入编辑页
  - [x] 3.2 编辑页 NavBar 标题为「编辑商品」或「商品详情」

## Dev Notes

- **本 Story 范围**：在 Story 2.1、2.2 已有商品列表与新增基础上，增加编辑页、更新/删除 API、列表项点击进入编辑；不改变 products 表结构、不实现库存字段的编辑（库存由出货/进货/盘点 Story 处理）。
- **复用**：沿用 `useProducts`、`ProductListView.vue`、`ProductFormView.vue` 的形态；编辑页可复用 ProductFormView 作为编辑表单（传入 id 时加载并更新），或新建 ProductDetailView/ProductEditView 统一承载查看+编辑+删除。
- **删除约束**：当前无出货单/进货单引用商品的外键约束时，直接 DELETE；若未来有 FK 约束，需在架构/后续 Story 中约定软删除或限制有引用时不可删（本 Story 按直接删除实现）。

### Project Structure Notes

- 视图：`src/views/ProductFormView.vue` 可扩展为「有 id 则编辑、无 id 则新增」，或新增 `src/views/ProductEditView.vue` 专门承载编辑+删除。
- 路由：在 router 中新增 `path: 'products/:id'`，对应编辑页组件；需登录。
- Composable：`useProducts.ts` 增加 `getById(id)`、`update(id, data)`、`remove(id)`。

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2 - Story 2.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture, Frontend Architecture, Implementation Patterns]
- [Source: _bmad-output/implementation-artifacts/2-1-product-data-entry.md#Dev Notes, File List]
- [Source: _bmad-output/implementation-artifacts/2-2-product-list-search.md#Dev Notes, File List]

---

## Developer Context (Guardrails)

### Technical Requirements

- **编辑页数据**：根据路由 `params.id` 加载商品；useProducts 提供 `getById(id)` 返回单条或 null，使用 `supabase.from('products').select().eq('id', id).single()`；若 404 或 PGRST116 则 Toast「商品不存在」并 `router.push('/products')`。
- **更新**：`update(id, data)` 只更新 name、spec、sell_price、buy_price（及 updated_at 若由 DB trigger 处理）；不在此 Story 暴露 stock 编辑。
- **删除**：`remove(id)` 使用 `supabase.from('products').delete().eq('id', id)`；成功后列表需反映（返回列表后列表会重新拉取或下拉刷新即可）。
- **确认弹窗**：文案严格为「确定要删除该商品吗？」；确认后执行删除，取消仅关闭弹窗。
- **校验与错误**：与 2.1 一致：名称为空不提交并 Toast「请填写商品名称」；网络错误重试 1 次，失败 Toast「保存失败，请检查网络后重试」。

### Architecture Compliance

- 前端：Vue 3 + Vite + TypeScript；UI：Vant 4；业务数据通过 composable 直连 Supabase；仅从 `src/lib/supabase.ts` 导入 supabase。
- 不新增 Supabase 表或 RLS 变更；复用现有 products 表与 RLS。
- 路由：/products/:id 为需登录路由，不设 meta.public。

### Library & Framework Requirements

| 依赖 | 用途 | 说明 |
|------|------|------|
| @supabase/supabase-js | getById、update、delete | 已有，在 useProducts 内使用 |
| vant | Form、Field、Button、Dialog、NavBar、Toast | 已有；若使用 Dialog 确认需在 main.ts 注册 Dialog |
| vue-router | push('/products'), params.id | 已有 |

### File Structure Requirements

- `huotong-app/src/composables/useProducts.ts`：增加 `getById(id: string)`、`update(id: string, data: Partial<ProductInput>)`、`remove(id: string)`；错误处理与重试与 create 一致。
- `huotong-app/src/views/ProductFormView.vue` 或新建 `ProductEditView.vue`：编辑页表单（名称、规格、售价、进价）、保存调用 update、删除按钮+Dialog 确认后调用 remove；路由进入时根据 id 加载数据。
- `huotong-app/src/views/ProductListView.vue`：列表项（van-cell 或等价）增加点击事件，`router.push('/products/' + product.id)`。
- `huotong-app/src/router/index.ts`：新增 `path: 'products/:id'`，name 可选 `ProductEdit`，component 为编辑页视图；meta.title「编辑商品」。

### Testing Requirements

- 人工验收：从列表点击某商品进入编辑页，修改后保存返回列表且显示更新内容；点击删除弹出「确定要删除该商品吗？」，确认后列表不再显示该商品，取消则不删；名称为空保存提示「请填写商品名称」。
- 自动化：`npm run build` 通过。

### Previous Story Intelligence

- **Story 2.1**：useProducts 已有 fetchAll()、create()；ProductListView 展示列表、下拉刷新、FAB 新增；ProductFormView 为新增表单；路由 /products、/products/new。本 Story 增加 getById、update、remove；列表项可点击进编辑；编辑页可复用 ProductFormView（传入 id 时加载并提交 update）或独立 ProductEditView。
- **Story 2.2**：useProducts 已有 search(keyword)；ProductListView 已有搜索栏、防抖、空状态。编辑/删除不改变搜索与列表展示逻辑；从编辑页返回列表后保持原有列表/搜索状态即可（或重新 fetchAll/runSearch）。
- **main.ts**：已注册 List、Cell、CellGroup、PullRefresh、Search 等；若使用 VanDialog 需补充注册 Dialog。

### Project Context Reference

- 前端入口：huotong-app/src/main.ts；Supabase 单例仅从 lib/supabase.ts 导入；Vant 组件需在 main.ts 注册；路由默认需登录；关键操作前二次确认（删除用 Dialog）。

---

## Dev Agent Record

### Agent Model Used

(本循环由 Agent 实现)

### Debug Log References

- `npm run build` 通过

### Completion Notes List

- Task 1：useProducts 新增 getById(id)、update(id, data)、remove(id)；ProductFormView 支持编辑模式（route.params.id 存在时 onMounted 拉取商品并填充表单，提交调用 update）；路由新增 products/:id，meta.title「编辑商品」；getById 返回 null 或 PGRST116 时 Toast「商品不存在」并跳转列表。
- Task 2：编辑页增加「删除商品」按钮；使用 Vant showConfirmDialog 文案「确定要删除该商品吗？」；确认后调用 remove(id)，Toast「已删除」并 push /products；main.ts 注册 Dialog。
- Task 3：ProductListView 的 van-cell 增加 clickable 与 @click="goToEdit(p.id)"，goToEdit 即 router.push('/products/' + id)；编辑页标题由 MainLayout 通过 meta.title 显示「编辑商品」。

### File List

- huotong-app/src/composables/useProducts.ts（修改：getById、update、remove）
- huotong-app/src/views/ProductFormView.vue（修改：编辑模式、加载单条、update、删除按钮与 Dialog 确认、路由切换重载与加载竞态防护）
- huotong-app/src/views/ProductListView.vue（修改：列表项点击跳转编辑页）
- huotong-app/src/router/index.ts（修改：新增 products/:id）
- huotong-app/src/main.ts（修改：注册 Dialog）
- _bmad-output/implementation-artifacts/2-3-product-edit-delete.md（修改：任务勾选、Status、Dev Agent Record）
- _bmad-output/implementation-artifacts/sprint-status.yaml（修改：2-3-product-edit-delete 状态）

### Senior Developer Review (AI)

- Review Date: 2026-03-10
- Reviewer: Hezhangcan (AI)
- Outcome: Approve after fixes

#### Findings

- High: 0
- Medium: 2
  - 编辑页使用同一组件承载新增/编辑时，仅 `onMounted` 加载会导致路由参数变化后数据不刷新（已修复）
  - 保存提交中仍可点击删除，可能触发并发写操作导致状态不一致（已修复）
- Low: 1
  - File List 未体现编辑页路由切换重载和竞态防护细节（已修复）

#### Fix Summary

- 将编辑页加载逻辑从一次性挂载改为监听 `productId`，确保路由参数变化时重新加载对应商品。
- 为编辑页加载请求增加序号保护，避免旧请求覆盖新路由的数据。
- 删除按钮在 `loading/submitting` 期间禁用，并在 `onDelete` 入口增加并发保护。
- 已执行 `npm run build`，构建通过。

### Change Log

- 2026-03-10: 完成代码审查，修复 2 个 Medium 问题；回归构建通过；状态更新为 done。
