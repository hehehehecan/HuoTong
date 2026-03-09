# Story 1.2: 用户登录与认证

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 家人（用户）,
I want 通过密码登录系统,
so that 只有家人才能访问和操作业务数据。

## Acceptance Criteria

1. **Given** 开发者已在 Supabase Auth 中创建了用户账号  
   **When** 用户在登录页面输入邮箱和密码并点击「登录」  
   **Then** 系统验证成功后跳转到首页，显示用户已登录状态  
   **And** 登录状态通过 Pinia store 全局管理，页面刷新后保持登录

2. **Given** 用户未登录  
   **When** 用户尝试访问任何业务页面  
   **Then** 系统通过 Vue Router 导航守卫自动跳转到登录页面

3. **Given** 用户输入错误的邮箱或密码  
   **When** 点击「登录」  
   **Then** 显示清晰的中文错误提示「邮箱或密码错误」

4. **Given** 用户已登录  
   **When** 点击「退出登录」  
   **Then** 系统清除认证状态并跳转回登录页

## Tasks / Subtasks

- [x] Task 1 (AC: #1) — 登录页与 Supabase Auth 登录
  - [x] 创建登录页组件（邮箱、密码输入框，登录按钮），路由 `/login`
  - [x] 使用 `supabase.auth.signInWithPassword({ email, password })` 调用 Supabase Auth
  - [x] 登录成功后：将 session/user 写入 Pinia user store，并 `router.push('/')` 跳转首页
  - [x] 在 user store 中持久化登录状态：监听 `supabase.auth.onAuthStateChange`，同步 session 到 store；可选使用 `getSession()` 在应用启动时恢复登录
- [x] Task 2 (AC: #2) — 路由守卫与未登录重定向
  - [x] 在 Vue Router 中配置全局前置守卫（beforeEach）
  - [x] 将 `/login` 设为公开路由，其余业务路由需认证；未登录访问受保护路由时重定向到 `/login`
  - [x] 已登录用户访问 `/login` 时重定向到首页，避免重复登录
- [x] Task 3 (AC: #3) — 登录错误提示
  - [x] 对 `signInWithPassword` 的错误进行判断（如 Invalid login credentials）
  - [x] 使用 Vant Toast 或 Dialog 显示中文提示「邮箱或密码错误」，不暴露具体技术信息
- [x] Task 4 (AC: #4) — 退出登录
  - [x] 在首页或布局中提供「退出登录」入口
  - [x] 调用 `supabase.auth.signOut()`，清除 Pinia 中的用户状态，再 `router.push('/login')`

## Dev Notes

- **认证方案**：Supabase Auth Email + Password；不在本 Story 内实现注册，由开发者在 Supabase Dashboard 创建 4 个账号。
- **状态持久化**：Supabase JS 客户端会持久化 session（如 localStorage），`getSession()` 可恢复；Pinia store 需在应用初始化时从 `getSession()` 同步一次，并订阅 `onAuthStateChange` 保持与 Supabase 一致。
- **路由约定**：登录页 `/login` 为公开；`/`（首页）及后续业务路由均为受保护，未登录一律重定向到 `/login`。
- **错误与 UI**：统一使用 Vant 组件与中文提示；大字体、大按钮符合 NFR（最小 16px、触控 44x44px）。

### Project Structure Notes

- 与架构一致：认证状态集中在 `src/stores/user.ts`，Supabase 客户端从 `src/lib/supabase.ts` 导入；登录页可放在 `src/views/LoginView.vue` 或 `src/pages/auth/LoginPage.vue`，与现有 `HomeView.vue` 风格统一。
- Story 1.1 已提供 `src/stores/user.ts` 占位（仅 `isLoggedIn`），本 Story 需扩展为持有 `user`/`session` 并对接 Supabase Auth。

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 1 - Story 1.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security, Frontend Architecture]
- [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements - 安全]

---

## Developer Context (Guardrails)

### Technical Requirements

- **登录 API**：仅使用 Supabase Auth 的 `signInWithPassword`、`signOut`、`getSession`、`onAuthStateChange`；不自行实现密码校验或 token 存储。
- **路由守卫**：使用 Vue Router 的 `router.beforeEach`，根据 Pinia user store 的登录状态（或直接根据 `supabase.auth.getSession()` 的异步结果）决定放行或重定向；注意守卫内异步判断时返回 Promise 或 async 处理，避免闪屏。
- **会话持久化**：应用启动时（如 `main.ts` 或 router 初始化前）调用一次 `getSession()`，若有 session 则写入 user store，再挂载 app，这样刷新后仍为已登录。
- **环境变量**：沿用 Story 1.1 的 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`，无需新增。

### Architecture Compliance

- 前端：Vue 3 + Vite + TypeScript；UI：Vant 4；状态：Pinia（user store 管理登录状态）；路由：Vue Router 4.x；认证：Supabase Auth（Email + Password）。
- 后端：仅使用 Supabase Auth，不涉及本 Story 的 RLS 或业务表；RLS 在后续业务 Story 中配置。
- 安全：不在前端暴露除 anon key 外的密钥；错误提示不泄露「用户不存在」或「密码错误」的区分信息，统一为「邮箱或密码错误」。

### Library & Framework Requirements

| 依赖 | 用途 | 说明 |
|------|------|------|
| @supabase/supabase-js | Auth | 已安装，使用 auth 命名空间：signInWithPassword, signOut, getSession, onAuthStateChange |
| pinia | 用户状态 | 2.x，user store 存 session/user 与 isLoggedIn |
| vue-router | 路由与守卫 | 4.x，beforeEach 做认证检查 |
| vant | 登录表单与提示 | 4.9+，Form、Field、Button、Toast 等 |

### File Structure Requirements

- `src/views/LoginView.vue` 或 `src/pages/auth/LoginPage.vue`：登录页，邮箱、密码、登录按钮，提交调用 Supabase Auth。
- `src/stores/user.ts`：扩展为维护 `user`、`session`、`isLoggedIn`，订阅 `onAuthStateChange`，提供 `login`、`logout`、`initSession`（或由调用方在启动时调 getSession）。
- `src/router/index.ts`：新增 `/login` 路由；添加 `beforeEach` 守卫，未登录访问 `/` 等受保护路由时重定向到 `/login`，已登录访问 `/login` 时重定向到 `/`。
- `src/main.ts`：应用启动时可选先 `await` 恢复 session 再挂载 app，避免首页先闪未登录再变为已登录。

### Testing Requirements

- 本 Story 以人工验收为主：能登录、能退出、未登录访问首页会跳转登录、错误密码有中文提示、刷新后仍保持登录。
- 若有 E2E：可覆盖「错误密码显示提示」「正确密码跳转首页」「退出后访问首页跳转登录」。

### Previous Story Intelligence

- **Story 1.1** 已搭建：`src/lib/supabase.ts` 导出 supabase 单例；`src/stores/user.ts` 仅有 `isLoggedIn` 占位；`src/router/index.ts` 仅配置了 `/` → HomeView。
- **本 Story 需复用**：从 `src/lib/supabase.ts` 导入 `supabase`，在 store 和登录页中使用；扩展 `user.ts` 而非重写；路由在现有 `createRouter` 上新增 `/login` 与守卫。
- **CR 经验**：Story 1.1 的 Code Review 强调错误处理（如 getSession 的 error 检查）、环境变量缺失保护、组件注册名与使用一致；本 Story 的登录错误处理与守卫逻辑应显式处理异步与边界情况，避免误报「已登录」或未正确重定向。

### Git Intelligence Summary

- 最近提交为 Story 1.1 脚手架与 CR 修复；代码位于 `huotong-app/`，采用 Vite + Vue 3 + TypeScript，已集成 Supabase client、Pinia、Vue Router、Vant。本 Story 在同一仓库、同一应用内新增登录页、扩展 user store、增加路由守卫即可。

### Latest Tech Information

- **Supabase Auth (JS v2)**：`signInWithPassword`、`signOut`、`getSession`、`onAuthStateChange` 为稳定 API；session 默认持久化在 localStorage，刷新页面后需在应用入口调用 `getSession()` 以恢复 UI 状态。
- **Vue Router 4**：导航守卫支持返回 Promise；在 `beforeEach` 中若需异步判断登录状态，应 `return` 该 Promise，以便在解析后再进行导航。

### Project Context Reference

- 项目为 HuoTong（货通），家庭式小型商户业务管理；移动端优先，支持 PC 浏览器；认证为家人 4 账号，Email + 密码，由开发者在 Supabase 后台创建，无注册功能。技术栈与部署见 `_bmad-output/planning-artifacts/architecture.md`。

---

## Dev Agent Record

### Agent Model Used

（实施时填写）

### Debug Log References

-

### Completion Notes List

- 登录页 LoginView.vue：邮箱/密码表单，Vant Field/Form/Button，提交调用 userStore.login，成功 router.replace('/')，失败 showToast「邮箱或密码错误」。
- user store：user/session/isLoggedIn、initSession（getSession）、subscribeAuth（onAuthStateChange）、login（signInWithPassword）、logout（signOut）。
- main.ts：bootstrap 中先 await userStore.initSession()、userStore.subscribeAuth() 再 app.mount，保证首屏路由守卫时已有登录状态。
- 路由：/login 为 public，beforeEach 未登录访问受保护路由重定向到 /login，已登录访问 /login 重定向到 /。
- 首页增加「退出登录」按钮，调用 userStore.logout() 后 router.replace('/login')。构建通过。

### File List

- huotong-app/src/stores/user.ts（扩展：session/user/initSession/subscribeAuth/login/logout）
- huotong-app/src/views/LoginView.vue（新建）
- huotong-app/src/views/HomeView.vue（增加退出登录入口）
- huotong-app/src/router/index.ts（/login 路由与 beforeEach 守卫）
- huotong-app/src/main.ts（Vant Field/Form/Toast 注册与 bootstrap 初始化 session）
- _bmad-output/implementation-artifacts/1-2-user-login-auth.md（本 story 状态与任务勾选）
- _bmad-output/implementation-artifacts/sprint-status.yaml（状态更新）

### Change Log

- 2026-03-09: 实现 Story 1.2 用户登录与认证：登录页、Supabase Auth、Pinia 会话持久化、路由守卫、退出登录；状态更新为 review。
- 2026-03-09: 完成代码审查并修复高/中优先问题：首屏认证恢复竞态与登录错误提示分级；状态更新为 done。

## Senior Developer Review (AI)

### Review Date

- 2026-03-09

### Findings Summary

- High: 1（已修复 1，剩余 0）
- Medium: 2（已修复 2，剩余 0）
- Low: 0

### Findings and Resolutions

1. [High] 首屏路由守卫与会话恢复存在竞态，刷新后可能误判未登录并重定向到 `/login`。  
   - 修复：在 `main.ts` 中先 `await userStore.initSession()` 再 `app.use(router)` 并 `await router.isReady()` 后挂载；同时在守卫中补充 `await userStore.initSession()` 兜底。
2. [Medium] 登录错误提示将所有异常都归类为“邮箱或密码错误”，会掩盖网络或服务异常。  
   - 修复：在 `LoginView.vue` 中仅对 `invalid login credentials` 显示“邮箱或密码错误”，其他异常提示“登录失败，请稍后重试”。
3. [Medium] 路由守卫在初始化边界条件下缺少会话重试校验，导致 AC #1“刷新后保持登录”稳定性不足。  
   - 修复：`router.beforeEach` 改为异步并在未登录状态先恢复一次会话，再做跳转判断。

### Verification

- `npm run build`：通过（包含 `vue-tsc -b` 与 `vite build`）。
