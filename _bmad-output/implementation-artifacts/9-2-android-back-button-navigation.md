# Story 9.2: Android 返回键与弹窗导航适配

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 家人（用户）,
I want 使用 Android 返回键时获得符合手机习惯的反馈,
so that 不会因为误触返回而迷路、退出应用或丢失上下文。

## Acceptance Criteria

1. **Given** 用户正在二级页面 **When** 按下 Android 返回键 **Then** 页面回到上一级，而不是直接退出应用。
2. **Given** 页面上有打开的弹窗、抽屉或选择器 **When** 用户按下返回键 **Then** 优先关闭当前弹层。
3. **Given** 用户位于首页 **When** 按下返回键 **Then** 系统执行退出确认或符合预期的首页退出行为。

## Tasks / Subtasks

- [x] Task 1：新增 Android 返回键平台服务（AC: #1, #2, #3）
  - [x] 1.1 在 `huotong-app/src/lib/` 新增 `backButton.ts`（或同等命名），统一监听 Android `backButton` 事件，并提供订阅/注销能力。
  - [x] 1.2 服务层需支持“拦截优先级”：优先处理弹层关闭，再处理路由回退，最后处理首页退出确认。
  - [x] 1.3 兼容 Web 与 Android：非原生环境不破坏浏览器默认导航行为，原生环境避免重复注册导致多次触发。
- [x] Task 2：接入全局返回键处理与首页退出确认（AC: #1, #3）
  - [x] 2.1 在应用启动流程挂载返回键处理（建议 `main.ts`），结合 `vue-router` 判定是否可回退。
  - [x] 2.2 当存在可回退历史时执行 `router.back()`，确保二级页返回上一级而非直接退出。
  - [x] 2.3 当位于首页时展示明确中文退出确认（如“再按一次退出”或确认弹窗），按确认后执行原生退出行为。
- [x] Task 3：接入弹层优先关闭机制（AC: #2）
  - [x] 3.1 为常用弹层（至少覆盖 Vant Popup / Dialog / Picker 等在本项目已使用的弹层）提供统一注册与关闭接口。
  - [x] 3.2 当弹层处于打开状态时，按返回键应只关闭最上层弹层，不触发路由回退和应用退出。
  - [x] 3.3 保证弹层关闭后页面状态一致，不产生“弹层已关但页面已回退”的竞态问题。
- [x] Task 4：测试与回归验证（AC: #1, #2, #3）
  - [x] 4.1 为返回键服务补充单元测试（至少覆盖：有弹层优先关闭、可回退路由时回退、首页退出确认分支）。
  - [x] 4.2 执行 `npm run test:run` 与 `npm run build`，确保无回归。
  - [x] 4.3 Android 本地验证：二级页返回、弹层优先关闭、首页退出确认三条路径行为符合预期。

## Dev Notes

- Story 9.1 已引入 `AppLifecycleService` 风格封装（`src/lib/appLifecycle.ts`），本 Story 应保持同样模式：平台事件集中在 `lib` 层，不在多个页面散落监听。
- Android 返回键是首版可用性的关键风险之一（架构文档已单列 `BackButtonService`），优先保证“可预期”而非花哨交互。
- 返回键处理必须遵守优先级：弹层 > 路由回退 > 首页退出确认；避免用户在弹层打开时被误导回退页面。
- 首页退出策略只在 Android 原生环境触发，Web 环境不应强行拦截浏览器标准返回行为。
- 文案与提示统一使用中文，沿用 Vant 交互风格，避免出现系统级英文错误信息。

### Project Structure Notes

- `huotong-app/src/lib/backButton.ts`（新增）负责平台级返回键监听与分发。
- `huotong-app/src/main.ts`（修改）负责应用级返回键策略装配。
- 弹层页面优先通过可复用能力接入，不应在每个视图独立复制返回键监听逻辑。
- 认证与路由守卫继续由 `src/stores/user.ts` 与 `src/router/index.ts` 管理，本 Story 不改变登录鉴权流程。

### References

- [Source: _bmad-output/planning-artifacts/epics.md] Epic 9 Story 9.2 用户故事与 AC。
- [Source: _bmad-output/planning-artifacts/prd.md] FR46：Android 返回键导航反馈要求（回退/弹层关闭/首页退出确认）。
- [Source: _bmad-output/planning-artifacts/architecture.md] Android 平台抽象层 `BackButtonService`、首版运行时适配风险与验收要求。
- [Source: _bmad-output/implementation-artifacts/9-1-session-resume-lifecycle-adaptation.md] 已落地平台服务封装模式与启动挂载方式。
- [Source: huotong-app/src/main.ts] 当前启动流程与全局生命周期恢复监听位置。

## Developer Context (Guardrails)

### Technical Requirements

- 必须统一通过一个返回键服务处理 Android `backButton` 事件，不允许页面各自直接绑定 Capacitor 监听。
- 返回键处理顺序固定：先尝试关闭弹层，再尝试路由回退，最后才进入首页退出流程。
- 首页退出确认必须有明显中文反馈，并避免一次误触直接退出 App。
- 若当前路由为登录页或首页，需要明确区分“回退”与“退出”的触发条件，防止错误跳转。

### Architecture Compliance

- 技术栈保持 Vue 3 + TypeScript + Vant + Vue Router + Capacitor，不引入新的状态管理方案。
- 平台事件封装层放 `src/lib`；业务页面只消费封装后的接口。
- Android 原生行为通过 Capacitor App 插件接入；Web 平台只保留兼容兜底，不改写浏览器核心行为。

### Library & Framework Requirements

| 依赖 | 用途 |
|------|------|
| `@capacitor/app` | 监听 `backButton`、执行 `exitApp` |
| Vue Router 4 | 判断并执行页面回退 |
| Vant Dialog/Toast | 首页退出确认与提示文案 |
| Vue Composition API | 组织返回键策略和弹层注册/清理 |

### File Structure Requirements

- `huotong-app/src/lib/backButton.ts`（新增）
- `huotong-app/src/main.ts`（修改）
- `huotong-app/src/views/*`（按需修改：仅为弹层注册回调，不直接绑原生事件）
- `huotong-app/tests/api/backButton.spec.ts`（新增）

### Testing Requirements

- 二级页面按返回键：页面逐级回退，不出现直接退出。
- 弹层打开时按返回键：先关闭弹层，页面保持原位。
- 首页按返回键：出现退出确认提示；确认后退出，不确认则留在首页。
- 构建与测试通过：`npm run test:run`、`npm run build`。

## Project Context Reference

- [Source: _bmad-output/project-context.md] 技术栈版本、目录约束与自动化验证约定。

## Dev Agent Record

### Agent Model Used

gpt-5.3-codex

### Debug Log References

- `npm run test:run`
- `npm run build`

### Completion Notes List

- 2026-03-12：Create Story 初始化（ready-for-dev）。
- 新增 `src/lib/backButton.ts`：统一处理 Android 返回键，支持按优先级注册拦截器（弹层优先），并在无拦截时走路由回退/首页退出确认。
- 新增 `src/composables/useBackButtonPopup.ts`：提供弹层可复用接入，弹层显示时自动注册返回键处理，关闭后自动注销。
- `src/main.ts` 挂载全局返回键回退策略：二级页优先 `router.back()`，首页/登录页弹出中文退出确认，确认后调用原生 `exitApp`。
- CR 修复补充：二级页返回改为稳定的应用内目标回退，不再依赖浏览器历史；首页退出确认 `Dialog` 也已纳入返回键优先关闭处理。
- 为主要弹层页面接入返回键优先关闭：出货/进货新建页、出货/进货列表筛选、库存调整与日志、应收/应付付款弹层。
- 新增 `tests/api/backButton.spec.ts` 覆盖“弹层优先关闭 / 路由回退 / 首页退出确认”三条核心分支，并通过全量测试与构建回归。

### File List

- _bmad-output/implementation-artifacts/9-2-android-back-button-navigation.md（新增并更新）
- _bmad-output/implementation-artifacts/sprint-status.yaml（更新）
- huotong-app/src/lib/backButton.ts（新增）
- huotong-app/src/composables/useBackButtonPopup.ts（新增）
- huotong-app/src/main.ts（更新）
- huotong-app/src/views/SaleOrderListView.vue（更新）
- huotong-app/src/views/PurchaseOrderListView.vue（更新）
- huotong-app/src/views/SaleOrderCreateView.vue（更新）
- huotong-app/src/views/PurchaseOrderCreateView.vue（更新）
- huotong-app/src/views/InventoryView.vue（更新）
- huotong-app/src/views/ReceivablesView.vue（更新）
- huotong-app/src/views/PayablesView.vue（更新）
- huotong-app/tests/api/backButton.spec.ts（新增）
- _bmad-output/implementation-artifacts/local-verification-checklist.md（更新）

### Senior Developer Review (AI)

- Reviewer: Hezhangcan
- Date: 2026-03-12
- Outcome: Approved

#### Findings Summary

- High: 1
- Medium: 1
- Low: 0

#### Review Notes

- High：二级页回退原先依赖 `window.history.length` + `router.back()`，当用户直达详情页或浏览器历史包含应用外页面时，返回键可能把用户带离 App，而不是回到上一级业务页；现已改为按路由解析稳定的应用内回退目标。
- Medium：首页退出确认使用 `showConfirmDialog()`，但此前未纳入返回键弹层优先关闭链路；现在已增加全局 `Dialog` 拦截，返回键会先关闭对话框，再处理页面回退或退出。

## Change Log

- 2026-03-12：Create Story 初始化（ready-for-dev）。
- 2026-03-12：完成 DS 实现与回归验证（`npm run test:run`、`npm run build`），状态更新为 review。
- 2026-03-12：完成 CR，修复应用内回退目标解析与全局 Dialog 返回键关闭逻辑，并将状态更新为 done。
