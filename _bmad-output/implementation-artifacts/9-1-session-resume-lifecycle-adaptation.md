# Story 9.1: 会话恢复与前后台生命周期适配

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 家人（用户）,
I want 在 App 从后台恢复或被短暂中断后继续使用系统,
so that 不会因为切到微信、接电话或网络抖动而频繁重新登录或看到旧数据。

## Acceptance Criteria

1. **Given** 用户已登录系统 **When** App 退到后台后再次恢复 **Then** 系统优先恢复现有会话 **And** 若会话失效则给出明确提示并引导重新登录。
2. **Given** 用户从后台恢复到关键列表页 **When** 页面重新激活 **Then** 系统刷新必要数据或提供明显的手动刷新入口 **And** 不依赖 Realtime 才能看到最新数据。

## Tasks / Subtasks

- [x] Task 1：新增应用生命周期恢复服务（AC: #1, #2）
  - [x] 1.1 在 `huotong-app/src/lib/` 新增 `appLifecycle.ts`（或同等命名），统一监听 Android `resume`/Web `visibilitychange`，对外暴露 `onAppResume` 订阅能力。
  - [x] 1.2 兼容 Web 与 Android（Capacitor App 插件可用时优先使用原生事件，不可用时回退到浏览器事件），避免仅在浏览器环境生效。
  - [x] 1.3 提供清理机制，确保页面销毁后取消监听，防止重复触发与内存泄漏。
- [x] Task 2：实现登录态恢复与失效引导（AC: #1）
  - [x] 2.1 在 `user` store 增加“恢复时会话复检”能力（调用 `supabase.auth.getSession()` 重新同步本地会话）。
  - [x] 2.2 若恢复后会话有效，保持当前页面与登录状态；若会话失效，清空本地登录态并引导到 `/login`（保留 `redirect`）。
  - [x] 2.3 会话失效时展示明确中文提示（如“登录状态已失效，请重新登录”），避免无提示跳转。
- [x] Task 3：关键列表页恢复后刷新机制（AC: #2）
  - [x] 3.1 为关键列表页（至少：商品、客户、供应商、出货单、进货单、应收、应付、库存）接入统一“恢复后刷新”逻辑。
  - [x] 3.2 刷新时复用各页面已有 `load/fetch/search` 逻辑，避免重复实现数据请求。
  - [x] 3.3 刷新失败显示统一中文提示，并保留现有“下拉刷新/手动刷新”入口作为兜底，不依赖 Realtime。
- [x] Task 4：回归与验证（AC: #1, #2）
  - [x] 4.1 补充 `appLifecycle` 和会话恢复逻辑的单元测试（至少覆盖：恢复回调触发、会话有效、会话失效）。
  - [x] 4.2 执行 `npm run test:run` 与 `npm run build`，确保无回归。
  - [x] 4.3 Android 本地验证：登录后切到后台再回前台，确认会话保留；模拟会话失效后恢复，确认提示并跳转登录；关键列表页可刷新最新数据。

## Dev Notes

- 本 Story 目标是“恢复体验稳定”，不是新增业务功能；应优先复用现有 `initSession`、路由守卫与列表页加载能力。
- 当前项目的启动顺序已要求先 `initSession()` 再挂载路由，避免首屏误判未登录；本 Story 需在此基础上补“恢复场景”而非改坏启动流程。
- Realtime 在 Android 首版允许默认关闭，因此关键列表页必须具备“恢复后主动刷新 + 手动刷新”能力。
- 会话恢复后应尽量保持用户上下文；只有会话明确失效才跳登录，并通过 `redirect` 让用户可回到原页面。
- 生命周期监听应统一封装在 `lib` 层，不要在多个页面分散绑定原生事件，避免行为不一致。

### Project Structure Notes

- 生命周期相关放在 `huotong-app/src/lib/`（如 `appLifecycle.ts`），遵循项目“平台/基础能力放 lib”的约定。
- 认证状态只通过 `huotong-app/src/stores/user.ts` 管理；不得在页面中直接维护登录态副本。
- 列表页刷新逻辑应落在 `huotong-app/src/views/*ListView.vue` 或可复用 composable 中，不要创建与现有 `useXxx` 冲突的并行数据层。
- 路由守卫仍由 `huotong-app/src/router/index.ts` 统一控制，保持“默认需登录”的规则。

### References

- [Source: _bmad-output/planning-artifacts/epics.md] Epic 9 Story 9.1 用户故事与 AC。
- [Source: _bmad-output/planning-artifacts/architecture.md] Android 平台抽象层（`AppLifecycleService`、`SessionStorageStrategy`、`NetworkStatusService`）、Android 首版 Realtime 可降级策略、真机前后台验收要求。
- [Source: _bmad-output/project-context.md] 启动顺序约束、路由鉴权约束、Supabase 单例与测试要求。
- [Source: huotong-app/src/main.ts] 现有启动链路 `initSession -> subscribeAuth -> router.isReady -> mount`。
- [Source: huotong-app/src/stores/user.ts] 现有会话初始化与登录态管理实现。
- [Source: huotong-app/src/router/index.ts] 现有登录守卫与 `redirect` 机制。

## Developer Context (Guardrails)

### Technical Requirements

- 生命周期恢复事件必须统一来源（一个服务层），并提供订阅/取消订阅 API。
- 会话恢复时必须“先复检再决策”：调用 `supabase.auth.getSession()` 后再决定保持页面或跳登录。
- 会话失效跳转登录时必须带上当前 `to.fullPath` 或可等价恢复上下文的信息。
- 关键列表页恢复刷新要复用已有 `loadList` / `runSearch` / `fetchAll`，避免复制查询代码。
- 错误提示保持中文，且与现有 Vant Toast 交互风格一致。

### Architecture Compliance

- 技术栈保持 Vue 3 + TS + Vant + Supabase JS，不引入额外状态管理框架。
- 仅使用 `src/lib/supabase.ts` 的客户端实例，不重复 `createClient`。
- Realtime 作为可选增强，不能成为恢复后看见新数据的唯一依赖。
- Android/Web 双端兼容优先，不写仅浏览器可用实现。

### Library & Framework Requirements

| 依赖 | 用途 |
|------|------|
| `@capacitor/app`（若可用） | 监听 App 前后台恢复事件 |
| Vue Composition API | 生命周期订阅与页面刷新协调 |
| Vant Toast | 会话失效/刷新失败提示 |
| `@supabase/supabase-js` | 会话复检 `auth.getSession()` |

### File Structure Requirements

- `huotong-app/src/lib/appLifecycle.ts`（新增）
- `huotong-app/src/stores/user.ts`（修改：恢复会话复检能力）
- `huotong-app/src/main.ts`（按需修改：挂载全局恢复监听）
- `huotong-app/src/router/index.ts`（按需修改：恢复场景跳转与 redirect 处理）
- `huotong-app/src/views/*ListView.vue`（关键列表页接入恢复刷新）
- `huotong-app/src/lib/__tests__/appLifecycle.spec.ts` 或同等测试文件（新增）

### Testing Requirements

- 登录后退到后台再恢复：保持已登录且不闪退到登录页。
- 模拟会话失效后恢复：展示提示并跳转登录页。
- 在关键列表页恢复：自动刷新成功或可手动刷新成功，且在 Realtime 关闭时依然可获得最新数据。
- 构建与测试通过：`npm run test:run`、`npm run build`。

## Project Context Reference

- [Source: _bmad-output/project-context.md] 技术栈版本、目录约束、启动顺序与认证守卫规则。

## Dev Agent Record

### Agent Model Used

gpt-5.3-codex

### Debug Log References

- `npm install @capacitor/app`
- `npm run test:run`
- `npm run build`

### Completion Notes List

- 新增 `src/lib/appLifecycle.ts`，统一封装 App 恢复事件：原生端监听 `@capacitor/app` 的 `resume`，Web 端监听 `visibilitychange`，并做短时间去重与卸载清理。
- 新增 `src/composables/useAppResumeRefresh.ts`，让关键列表页以一致方式接入“前台恢复后自动刷新”。
- `src/stores/user.ts` 新增 `refreshSession()`，恢复时统一复检 Supabase 会话并同步登录态；`initSession()` 改为复用该能力。
- `src/main.ts` 挂载全局恢复处理：会话失效时提示“登录状态已失效，请重新登录”，并跳转 `/login?redirect=当前路径`。
- 关键列表页（商品/客户/供应商/出货单/进货单/应收/应付/库存）均已接入恢复后刷新逻辑，且继续保留下拉刷新作为兜底。
- 已补充测试：`appLifecycle` 恢复回调触发（Web/Native）与 `userStore.refreshSession()` 会话有效/失效分支。
- CR 修复补充：`refreshSession()` 遇到临时错误时不再误判为会话失效；应收/应付页在恢复时会同步刷新当前展开明细；`appLifecycle` 会兜住异步恢复回调异常。

### File List

- _bmad-output/implementation-artifacts/9-1-session-resume-lifecycle-adaptation.md（修改）
- _bmad-output/implementation-artifacts/sprint-status.yaml（修改）
- huotong-app/package.json（修改）
- huotong-app/package-lock.json（修改）
- huotong-app/src/lib/appLifecycle.ts（新增）
- huotong-app/src/composables/useAppResumeRefresh.ts（新增）
- huotong-app/src/stores/user.ts（修改）
- huotong-app/src/main.ts（修改）
- huotong-app/src/views/ProductListView.vue（修改）
- huotong-app/src/views/CustomerListView.vue（修改）
- huotong-app/src/views/SupplierListView.vue（修改）
- huotong-app/src/views/SaleOrderListView.vue（修改）
- huotong-app/src/views/PurchaseOrderListView.vue（修改）
- huotong-app/src/views/ReceivablesView.vue（修改）
- huotong-app/src/views/PayablesView.vue（修改）
- huotong-app/src/views/InventoryView.vue（修改）
- huotong-app/tests/api/appLifecycle.spec.ts（新增）
- huotong-app/tests/api/userStore.session-refresh.spec.ts（新增）
- _bmad-output/implementation-artifacts/local-verification-checklist.md（修改）

### Senior Developer Review (AI)

- Reviewer: Hezhangcan
- Date: 2026-03-12
- Outcome: Approved

#### Findings Summary

- High: 1
- Medium: 2
- Low: 0

#### Review Notes

- High：`userStore.refreshSession()` 原实现将 `supabase.auth.getSession()` 的临时错误直接视为会话失效，弱网或恢复瞬间抖动会把已登录用户误踢回登录页；现已改为区分 `valid / invalid / error`，仅在明确失效时跳转登录。
- Medium：`appLifecycle` 之前只包住同步异常，异步恢复回调若 reject 会形成未处理 Promise 拒绝；现已统一捕获并记录告警，避免恢复流程污染运行时。
- Medium：应收/应付页恢复时原先只刷新汇总列表，已展开的客户/供应商明细仍保留旧缓存；现已在恢复后补刷当前展开明细，保证关键列表页前台恢复后看到的是最新数据。

## Change Log

- 2026-03-12：Create Story 初始化（ready-for-dev）。
- 2026-03-12：完成 DS 实现与回归验证（`npm run test:run`、`npm run build`），状态更新为 review。
- 2026-03-12：完成 CR，修复会话复检误判登出、恢复回调异步异常兜底、应收/应付展开明细恢复刷新，并将状态更新为 done。
