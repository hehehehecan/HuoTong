# Story 7.1: 库存总览与查询

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 家人（用户）,
I want 查看当前所有商品的库存数量,
so that 随时了解库存情况，及时发现缺货商品。

## Acceptance Criteria

1. **Given** 系统中已有商品数据（含库存字段）**When** 用户进入「库存总览」页面 **Then** 显示所有商品的当前库存列表，每条显示商品名、规格、当前库存数量 **And** 支持按名称搜索，支持下拉刷新。
2. **Given** 某商品库存为 0 或低于安全线 **When** 用户查看库存列表 **Then** 该商品以醒目样式（如红色标记）提示库存不足。

## Tasks / Subtasks

- [x] Task 1：路由与入口 (AC: #1)
  - [x] 1.1 在 `huotong-app/src/router/index.ts` 的 MainLayout children 中新增 `/stock` 路由，组件为库存总览视图，meta.title 为「库存总览」。
  - [x] 1.2 在「更多」页（当前为 `PlaceholderView.vue`）增加「库存总览」入口（如链接或按钮），指向 `/stock`；不增加第五个 Tabbar 项，保持现有 4 个 Tab（首页、商品、单据、更多）。
- [x] Task 2：数据与列表 (AC: #1)
  - [x] 2.1 使用现有 `useProducts` 的 `fetchAll()` 与 `search(keyword)` 获取商品列表（已含 `stock` 字段）；或新建 `useInventory`/`useStock` 仅做只读查询 products 的 id、name、spec、stock，与现有 composable 风格一致。
  - [x] 2.2 新建视图 `huotong-app/src/views/InventoryView.vue`：展示商品名、规格、当前库存数量，列表按名称排序，支持搜索框（防抖约 300ms）与下拉刷新（Vant PullRefresh）。
- [x] Task 3：库存不足醒目展示 (AC: #2)
  - [x] 3.1 当商品 `stock === 0` 时，该行以醒目样式（如红色文字或红色标记/角标）提示「库存不足」；若产品定义「安全线」为可配置，则 `stock < 安全线` 时同样提示（本 Story 最小实现可为仅 0 视为不足，安全线可为后续扩展）。
- [x] Task 4：自测与验收 (AC: #1, #2)
  - [x] 4.1 本地运行 `npm run build` 通过；访问 `/stock` 需登录，未登录跳转登录页。
  - [x] 4.2 已登录下进入库存总览页，列表展示商品名、规格、库存；搜索、下拉刷新正常；库存为 0 的商品有醒目提示。

## Dev Notes

- 库存数据来源：`products` 表已有 `stock` 字段（architecture 与 useProducts 已包含），无需新建表。
- 路由与架构一致：architecture 中路由表包含 `/stock` → 库存总览；视图命名为 `InventoryView.vue`，与现有 `ReceivablesView.vue`、`PayablesView.vue` 命名风格一致。
- 仅读操作：本 Story 不涉及修改库存，不调用 confirm 类接口；后续 Story 7.2 为手动调整库存、7.3 为变动记录。

### Project Structure Notes

- 视图：`huotong-app/src/views/InventoryView.vue`。
- Composable：复用 `huotong-app/src/composables/useProducts.ts` 的 `fetchAll`、`search` 即可（返回含 `stock` 的 Product[]）；无需新建 useInventory，与现有模式一致。
- 路由：`huotong-app/src/router/index.ts`，在 MainLayout 的 children 中增加 path: `'stock'`，name: `'stock'`，component: `() => import('../views/InventoryView.vue')`，meta: `{ title: '库存总览' }`。
- 导航入口：在「更多」页（`PlaceholderView.vue` 或后续更多页）增加「库存总览」入口，链接到 `/stock`；MainLayout 的 `navTitle` 若需支持 stock 路由，在 titleMap 中增加 `stock: '库存总览'`（或由 meta.title 统一提供）。

### References

- [Source: _bmad-output/planning-artifacts/epics.md] Epic 7, Story 7.1 用户故事与 AC。
- [Source: _bmad-output/planning-artifacts/architecture.md] 数据模型 products.stock、路由 /stock、Composable 模式、Frontend 项目结构。
- [Source: _bmad-output/project-context.md] Supabase 单例、Vant 组件、Pinia、路由守卫、大字体与触控区域、错误提示与下拉刷新约定。

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

- `npm run build`（`vue-tsc -b && vite build`）通过。

### Completion Notes List

- 路由：在 router 中新增 path `stock`，组件 InventoryView，meta.title「库存总览」。
- 更多页：PlaceholderView 在 path 为 /more 时显示「库存总览」van-cell，点击跳转 /stock。
- InventoryView：复用 useProducts 的 fetchAll/search，van-search 防抖 300ms，van-pull-refresh 下拉刷新；列表展示商品名、规格、库存数量；stock===0 时红色文字 + van-tag「库存不足」。
- 注册 Vant Tag 组件于 main.ts。npm run build 通过；浏览器自测：/stock 页与更多页入口、跳转正常。
- CR 复核结果：未发现 High/Medium 级问题，验收项与实现一致，状态可置为 done。

### File List

- huotong-app/src/router/index.ts（新增 /stock 路由）
- huotong-app/src/views/InventoryView.vue（新建）
- huotong-app/src/views/PlaceholderView.vue（更多页增加库存总览入口）
- huotong-app/src/main.ts（注册 Vant Tag）
