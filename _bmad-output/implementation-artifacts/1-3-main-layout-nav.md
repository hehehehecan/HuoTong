# Story 1.3: 主布局与导航框架

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 家人（用户）,
I want 看到清晰的底部导航栏和顶部标题栏，可以快速切换到各功能模块,
so that 操作入口一目了然，不用学习就能找到功能。

## Acceptance Criteria

1. **Given** 用户已登录  
   **When** 进入首页  
   **Then** 底部显示 Vant Tabbar 导航栏，包含「首页」「商品」「单据」「更多」等入口  
   **And** 顶部显示 Vant NavBar，展示当前页面标题  
   **And** 界面使用大字体（最小 16px）、大按钮（最小 44x44px）、高对比度配色

2. **Given** 用户使用手机浏览器（含微信内置浏览器）  
   **When** 访问应用  
   **Then** 页面完整适配移动端屏幕，无水平滚动，触控区域足够大

3. **Given** 用户使用电脑浏览器  
   **When** 访问应用  
   **Then** 页面在宽屏下合理适配，内容区居中，最大宽度限制，功能正常可用

4. **Given** Vue Router 已配置所有路由路径  
   **When** 用户点击导航栏各入口  
   **Then** 页面切换流畅，无整页刷新（SPA 行为）  
   **And** 尚未实现的模块页面显示友好的占位内容

## Tasks / Subtasks

- [x] Task 1 (AC: #1) — 主布局：顶部 NavBar + 底部 Tabbar
  - [x] 1.1 创建主布局组件（如 `MainLayout.vue` 或 `AppLayout.vue`），包含顶部 Vant NavBar、中间路由出口、底部 Vant Tabbar
  - [x] 1.2 在 `main.ts` 中注册 Vant Tabbar、TabbarItem、NavBar（若尚未注册）
  - [x] 1.3 配置 Tabbar 项：首页、商品、单据、更多；每项对应路由路径（如 `/`、`/products`、`/orders`、`/more`）
  - [x] 1.4 NavBar 标题根据当前路由动态显示（如首页→「首页」，商品→「商品」）
  - [x] 1.5 应用全局样式：最小字体 16px、触控区域最小 44x44px、高对比度配色（可复用 Vant 主题变量或 project-context 约定）
- [x] Task 2 (AC: #2, #3) — 移动端与 PC 适配
  - [x] 2.1 确保主布局在移动端无水平滚动，Tabbar/NavBar 触控区域足够大
  - [x] 2.2 宽屏下内容区居中、最大宽度限制（如 max-width + margin auto），功能正常可用
- [x] Task 3 (AC: #4) — 路由与占位页
  - [x] 3.1 在 Vue Router 中新增路由：`/products`、`/orders`、`/more`（或与产品/设计一致的路径），与 Tabbar 项一一对应
  - [x] 3.2 将原首页 `/` 置于主布局内，作为 Tabbar「首页」对应页面
  - [x] 3.3 为「商品」「单据」「更多」创建占位视图（如 `PlaceholderView.vue` 或独立页面），显示友好占位文案（如「功能开发中」），确保点击 Tabbar 可切换且无整页刷新
  - [x] 3.4 验证：点击各 Tab 仅切换路由与内容，无整页重载（SPA 行为）

## Dev Notes

- **布局结构**：登录后所见的主界面 = 顶部 NavBar + 中间 `<router-view />` + 底部 Tabbar；登录页 `/login` 不展示 Tabbar，保持现有全屏登录样式。
- **路由与守卫**：主布局包裹的路由（`/`、`/products`、`/orders`、`/more`）均需登录，沿用现有 `beforeEach` 守卫；无需变更 `meta.public`。
- **Vant 组件**：Tabbar、TabbarItem、NavBar 需在 `main.ts` 中 `app.use()` 注册，模板中使用 kebab-case（如 `<van-tabbar>`、`<van-nav-bar>`）。见 project-context：新增 Vant 组件时需先注册。
- **响应式**：移动端优先（Vant 默认）；PC 端用 CSS（如 `max-width`、`margin: 0 auto`）限制内容宽度即可，无需额外框架。

### Project Structure Notes

- 主布局组件建议放在 `huotong-app/src/components/` 或 `huotong-app/src/layouts/`（若新建 layouts 目录），与现有 `views/`、`router/` 约定一致。
- 占位页可统一为一个 `PlaceholderView.vue` 通过路由 meta 或 props 区分标题与文案，或每个模块一个简单视图。

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 1 - Story 1.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#Starter Template & Technology Stack, Frontend Architecture]
- [Source: _bmad-output/project-context.md#Technology Stack, Critical Implementation Rules, Vue 与 Vant]

---

## Developer Context (Guardrails)

### Technical Requirements

- **Vant Tabbar**：使用 Vant 4 的 `Tabbar`、`TabbarItem`，通过 `v-model` 或路由绑定当前激活项；路由模式建议用 `router-link` 或编程式 `router.push` 与 Tabbar 的 `route` 属性配合，保证高亮与路由一致。
- **Vant NavBar**：使用 `NavBar` 展示标题；标题可从当前路由的 `meta.title` 或路由 name 映射得到，保证与 Tabbar 切换同步。
- **根路由结构**：建议将「主布局」作为一层父路由，children 为首页、商品、单据、更多；这样仅登录后主界面才出现 Tabbar，`/login` 仍为独立全屏。
- **字体与触控**：NFR 要求最小 16px 字体、最小 44x44px 触控区域；Vant 默认已考虑触控，可通过 CSS 变量或全局样式覆盖字体大小；高对比度配色在 `project-context` 或设计规范中体现，无额外库要求。

### Architecture Compliance

- 前端：Vue 3 + Vite + TypeScript；UI：Vant 4（移动端优先）；状态：Pinia（本 Story 仅布局与导航，可只读 user store 判断登录）；路由：Vue Router 4.x。
- 本 Story 不涉及 Supabase 业务表、不涉及新 API；仅前端布局与路由结构调整。
- 部署与构建：无新增环境变量；`npm run build` 需继续通过。

### Library & Framework Requirements

| 依赖 | 用途 | 说明 |
|------|------|------|
| vant | Tabbar、NavBar | 4.9+，Tabbar、TabbarItem、NavBar 需在 main.ts 中注册 |
| vue-router | 路由与布局 | 4.x，嵌套路由（主布局 + children）或平级路由均可，保证 SPA 切换 |

### File Structure Requirements

- `huotong-app/src/components/MainLayout.vue` 或 `huotong-app/src/layouts/MainLayout.vue`：主布局（NavBar + router-view + Tabbar）。
- `huotong-app/src/router/index.ts`：新增 `/products`、`/orders`、`/more` 及占位组件引用；或将 `/` 改为布局子路由，并添加上述路径为同级子路由。
- 占位页：`huotong-app/src/views/ProductsPlaceholder.vue`、`OrdersPlaceholder.vue`、`MorePlaceholder.vue` 或单一 `PlaceholderView.vue` 通过路由参数区分。
- `huotong-app/src/main.ts`：若尚未注册 VanTabbar、VanTabbarItem、VanNavBar，需在此注册。

### Testing Requirements

- 人工验收：登录后可见底部 Tabbar 与顶部 NavBar；点击「首页」「商品」「单据」「更多」切换无整页刷新；占位页显示友好文案；移动端无横向滚动、触控区域足够；PC 宽屏内容居中、最大宽度限制。
- 可选：E2E 覆盖「登录后主布局展示」「点击 Tab 切换路由且 URL 与内容一致」。

### Previous Story Intelligence

- **Story 1.1**：项目在 `huotong-app/`，已集成 Vant、Vue Router、Pinia；`src/lib/supabase.ts`、`src/stores/user.ts`、`src/router/index.ts` 已存在；Vant 组件需在 main.ts 注册后使用 kebab-case。
- **Story 1.2**：登录页 `LoginView.vue`、路由 `/login`（public）、`/`（home）；守卫已实现未登录重定向登录、已登录访问 `/login` 重定向首页；bootstrap 顺序为 `userStore.initSession()` → `userStore.subscribeAuth()` → `app.mount()`；不要破坏该顺序。
- **本 Story**：在保留现有 `/` 与 `/login` 行为前提下，将「登录后的首页」纳入主布局（带 Tabbar+NavBar），并新增商品/单据/更多路由与占位页；不修改 auth 守卫逻辑。

### Project Context Reference

- 前端应用入口：`huotong-app/src/main.ts`；视图放 `src/views/`，可复用组件放 `src/components/`（或 `src/layouts/`）。
- Vant 组件须在 main.ts 用 `app.use()` 注册，模板中使用 kebab-case（如 `<van-tabbar>`）。
- 路由默认需登录；公开页设 `meta: { public: true }`；主布局内所有 Tab 对应路由均受保护。
- 大字体（最小 16px）、大按钮（最小 44x44px）、高对比度：见 NFR 与 project-context。

---

## Dev Agent Record

### Agent Model Used

(本循环由 Agent 实现)

### Debug Log References

- `npm run build`（通过）

### Completion Notes List

- 新增 MainLayout.vue：顶部 VanNavBar（标题随路由）、中间 router-view、底部 VanTabbar（route 模式，四 Tab：首页/商品/单据/更多）。
- 路由改为嵌套：`/` 对应 MainLayout，children 为 home、products、orders、more；占位页使用单一 PlaceholderView.vue，通过 route.meta.title/message 区分。
- main.ts 注册 NavBar、Tabbar、TabbarItem；App.vue 已有 font-size 16px；主内容区 max-width: 1200px、margin: 0 auto 满足宽屏适配。
- `npm run build` 通过，无回归。
- CR 修复：移除 MainLayout 中重复的顶部偏移（`NavBar placeholder` + `padding-top` 双重占位），避免页面内容区出现额外留白。

### File List

- huotong-app/src/components/MainLayout.vue（新增）
- huotong-app/src/views/PlaceholderView.vue（新增）
- huotong-app/src/router/index.ts（修改：嵌套路由 + 占位路由）
- huotong-app/src/main.ts（修改：注册 NavBar、Tabbar、TabbarItem）
- _bmad-output/implementation-artifacts/1-3-main-layout-nav.md（修改：CR 记录与状态）
- _bmad-output/implementation-artifacts/sprint-status.yaml（修改：Story 状态同步）

### Code Review Notes

- 审查结论：High 0 / Medium 1 / Low 0。
- 已修复 Medium：
  - `MainLayout.vue` 中 `van-nav-bar placeholder` 已提供占位，再对 `.main-content` 设置 `padding-top: 46px` 会造成重复留白；已移除该偏移并调整 `min-height` 计算。
- 回归验证：
  - `npm run build` 通过（含 `vue-tsc -b` 与 `vite build`）。
