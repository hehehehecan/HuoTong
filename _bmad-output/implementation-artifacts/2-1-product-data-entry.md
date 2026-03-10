# Story 2.1: 商品数据表与录入

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 家人（用户），
I want 录入商品的名称、规格、售价和进价，
so that 系统中有完整的商品价格库，开单时可以直接引用。

## Acceptance Criteria

1. **Given** Supabase 中已创建 products 表（id, name, spec, sell_price, buy_price, stock, created_at, updated_at）且 RLS 策略已配置  
   **When** 用户在「新增商品」页面填写商品名称、规格、售价、进价并点击「保存」  
   **Then** 商品信息成功保存到数据库，返回商品列表页，新商品出现在列表中  
   **And** 库存字段 stock 默认初始化为 0

2. **Given** 用户未填写必填字段（名称）  
   **When** 点击「保存」  
   **Then** 显示中文提示「请填写商品名称」，不提交数据

3. **Given** 保存操作出现网络错误  
   **When** 系统检测到请求失败  
   **Then** 自动重试 1 次，仍失败则显示「保存失败，请检查网络后重试」

## Tasks / Subtasks

- [x] Task 1 (AC: #1) — Supabase products 表与 RLS
  - [x] 1.1 在 Supabase 中创建 products 表：id (uuid PK)、name (text)、spec (text)、sell_price (numeric)、buy_price (numeric)、stock (integer DEFAULT 0)、created_at (timestamptz)、updated_at (timestamptz)
  - [x] 1.2 配置 RLS 策略：仅已认证用户可 SELECT/INSERT/UPDATE/DELETE
  - [x] 1.3 启用 updated_at 自动更新（trigger 或 Supabase 默认）
- [x] Task 2 (AC: #1,#2,#3) — 前端新增商品页与保存
  - [x] 2.1 新增路由 `/products/new`，对应「新增商品」页面
  - [x] 2.2 页面表单：商品名称（必填）、规格、售价、进价；使用 Vant Form + Field，大字体、大触控区域
  - [x] 2.3 创建 composable `useProducts`：`create(data)` 调用 Supabase 插入，stock 默认 0；统一错误处理，网络错误重试 1 次，失败用 Vant Toast 显示「保存失败，请检查网络后重试」
  - [x] 2.4 提交前校验：名称为空时 Toast「请填写商品名称」，不请求
  - [x] 2.5 保存成功后 `router.push('/products')` 返回商品列表
- [x] Task 3 (AC: #1) — 商品列表页占位与路由
  - [x] 3.1 将 `/products` 从 PlaceholderView 改为商品列表页视图，列表展示所有商品（名称、规格、售价），按名称排序；新录入商品出现在列表中
  - [x] 3.2 列表页提供「新增商品」入口（如 FAB 或 NavBar 右侧按钮）跳转 `/products/new`
  - [x] 3.3 列表支持下拉刷新（Vant PullRefresh 或等价）

## Dev Notes

- **本 Story 范围**：仅商品表 + 新增表单 + 商品列表展示；编辑/删除/搜索在 Story 2.2、2.3 实现。
- **数据库**：products 表结构以 architecture.md 与 epics 为准；若项目已有 migration 目录（如 `supabase/migrations/`），使用 migration 创建表与 RLS，便于版本化。
- **Composable**：`useProducts` 放在 `src/composables/useProducts.ts`，内部从 `src/lib/supabase.ts` 获取 supabase 单例，禁止 elsewhere 再 createClient。

### Project Structure Notes

- 视图：`src/views/ProductListView.vue`（商品列表）、`src/views/ProductFormView.vue`（新增商品）或按现有习惯放在 `views/products/` 下。
- 路由：在 MainLayout children 中保留 `path: 'products'`，改为加载 ProductListView；新增 `path: 'products/new'` 加载 ProductFormView。

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2 - Story 2.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture, Frontend Architecture, Implementation Patterns]
- [Source: _bmad-output/project-context.md#Critical Implementation Rules]

---

## Developer Context (Guardrails)

### Technical Requirements

- **products 表**：id uuid PRIMARY KEY DEFAULT gen_random_uuid()，name/spec text，sell_price/buy_price numeric，stock integer DEFAULT 0，created_at/updated_at timestamptz DEFAULT now()；updated_at 在 UPDATE 时自动更新（Supabase 可写 trigger 或应用层写入）。
- **RLS**：policy 条件使用 `auth.role() = 'authenticated'` 或等价，确保仅登录用户可读写。
- **新增商品页**：表单必填项仅「商品名称」；规格、售价、进价可为空或 0，按业务约定（epics 未强制必填则允许空，前端可占位 0）。
- **错误与重试**：Supabase 插入失败时，若为网络类错误则重试 1 次；仍失败则 Toast「保存失败，请检查网络后重试」。校验失败不调用 API，直接 Toast「请填写商品名称」。
- **列表页**：从 Supabase 查询 products，按 name 排序；展示字段至少包含名称、规格、售价；下拉刷新重新拉取列表。

### Architecture Compliance

- 前端：Vue 3 + Vite + TypeScript；UI：Vant 4；路由：Vue Router 4.x；状态：Pinia 仅用于用户；业务数据通过 composable 直连 Supabase。
- 单例：仅从 `src/lib/supabase.ts` 导入 supabase；不新增 createClient。
- 路由：/products、/products/new 均为需登录路由，不设 meta.public。

### Library & Framework Requirements

| 依赖 | 用途 | 说明 |
|------|------|------|
| @supabase/supabase-js | 表 CRUD、RLS | 已有，从 lib/supabase 使用 |
| vant | 表单、列表、Toast、下拉刷新 | 已有，main.ts 中按需注册 VanForm、VanField、VanButton、VanCell、VanPullRefresh 等 |
| vue-router | 跳转 /products、/products/new | 已有 |

### File Structure Requirements

- `huotong-app/src/composables/useProducts.ts`：新建。提供 fetchAll()、create(data)、及后续 story 会用到的 update/remove/search 占位或最小实现；create 时若未传 stock 则用 0。
- `huotong-app/src/views/ProductListView.vue` 或 `views/products/ProductList.vue`：商品列表页，展示列表、下拉刷新、入口到 /products/new。
- `huotong-app/src/views/ProductFormView.vue` 或 `views/products/ProductForm.vue`：新增商品表单页，提交调用 useProducts().create，成功后 push 到 /products。
- `huotong-app/src/router/index.ts`：path `products` 改为加载商品列表组件；新增 path `products/new` 加载新增表单组件。
- Supabase：表与 RLS 通过 migration 或 Dashboard 创建，需在实现前存在。

### Testing Requirements

- 人工验收：登录后进入商品列表，点击新增商品，填写名称等保存，列表中出现新商品；名称为空保存提示「请填写商品名称」；断网或模拟失败时提示「保存失败，请检查网络后重试」。
- 自动化：`npm run build` 通过；可选单元测试 composable 的 create 与校验逻辑。

### Previous Story Intelligence

- **Story 1.1–1.3**：项目在 huotong-app/，Vite + Vue 3 + TS，Supabase、Vant、Pinia、Vue Router 已配置；Vant 需在 main.ts 注册；主布局 Tabbar 已有「商品」指向 /products，当前为占位页，本 Story 替换为真实列表并增加 /products/new。
- **Story 1.4**：HomeView、PlaceholderView、路由结构已定；新增页面沿用同一 MainLayout children 与路由守卫；大字体、大按钮、高对比度见 NFR。

### Project Context Reference

- 前端入口：huotong-app/src/main.ts；视图 src/views/，可复用组件 src/components/， composables 在 src/composables/。
- Supabase 单例：仅从 lib/supabase.ts 导入；Vant 组件在 main.ts 用 app.use() 注册；路由默认需登录；环境变量 VITE_SUPABASE_* 在 .env。

---

## Dev Agent Record

### Agent Model Used

(本循环由 Agent 实现)

### Debug Log References

- `npm run build` 通过
- Code Review 修复后 `npm run build` 再次通过

### Completion Notes List

- Task 1：通过 Supabase MCP 应用 migration 创建 products 表（id, name, spec, sell_price, buy_price, stock DEFAULT 0, created_at, updated_at）、set_updated_at trigger、RLS 策略（authenticated 可 CRUD）。
- Task 2：新增 `composables/useProducts.ts`（fetchAll、create，create 时 stock 默认 0，withRetry 网络错误重试 1 次）；新增 `views/ProductFormView.vue`（Vant Form/Field，必填名称，提交前校验空名称 showToast，保存成功后 router.push('/products')）；路由 `products/new` 指向 ProductFormView，meta.title 为「新增商品」。
- Task 3：`views/ProductListView.vue` 展示商品列表（名称、规格、售价），按 name 排序，van-pull-refresh 下拉刷新，FAB「新增商品」跳转 /products/new；路由 `products` 改为 ProductListView；MainLayout 支持 route.meta.title 优先作为导航标题。
- main.ts 注册 List、Cell、CellGroup、PullRefresh；表单与列表使用 showToast 显示中文提示。
- Code Review 修复：补齐 `van-cell-group` 对应的 Vant 组件注册，避免新增商品页分组组件未注册导致的运行时问题。
- Code Review 修复：商品列表页首次加载失败时增加中文提示「加载商品失败，请下拉重试」，避免静默失败。

### File List

- huotong-app/src/composables/useProducts.ts（新建）
- huotong-app/src/views/ProductFormView.vue（新建）
- huotong-app/src/views/ProductListView.vue（新建）
- huotong-app/src/router/index.ts（修改：products 指向 ProductListView，新增 products/new 指向 ProductFormView）
- huotong-app/src/main.ts（修改：注册 List、Cell、PullRefresh）
- huotong-app/src/components/MainLayout.vue（修改：navTitle 优先使用 meta.title）
- _bmad-output/implementation-artifacts/2-1-product-data-entry.md（修改：任务勾选、状态、Dev Agent Record）
- _bmad-output/implementation-artifacts/sprint-status.yaml（修改：2-1-product-data-entry 状态）
- Supabase：migration create_products_table_and_rls（products 表 + RLS + updated_at trigger）

### Code Review Notes

- 审查结论：High 0 / Medium 2 / Low 0。
- 已修复 Medium：
  - `ProductFormView.vue` 使用了 `van-cell-group`，但 `main.ts` 未注册 `CellGroup`，在运行时可能导致组件不可用；已在入口补齐注册。
  - `ProductListView.vue` 首次进入页面时 `fetchAll()` 失败未提示，用户感知为静默空白；已补充失败 Toast 提示。
- 回归验证：
  - `npm run build` 通过（含 `vue-tsc -b` 与 `vite build`）。
