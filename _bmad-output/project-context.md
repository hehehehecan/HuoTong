---
project_name: HuoTong
user_name: Hezhangcan
date: '2026-03-09'
sections_completed: ['technology_stack', 'critical_implementation_rules', 'routing_pattern', 'auth_flow', 'bootstrap_pattern']
existing_patterns_found: 4
---

# Project Context for AI Agents

_本文件包含 AI 代理在本项目中实现代码时必须遵守的关键规则与约定。重点关注容易被忽略的细节。_

---

## Technology Stack & Versions

| 技术 | 版本/说明 |
|------|------------|
| Vue | 3.5+ |
| Vite | 7.x |
| TypeScript | 5.9.x |
| Vant | 4.9+（移动端 UI，通过 `app.use()` 插件注册） |
| Pinia | 3.x（全局状态，如用户） |
| Vue Router | 4.x |
| @supabase/supabase-js | 2.x |

- 前端应用位于 `huotong-app/`，入口为 `huotong-app/src/main.ts`。
- 环境变量使用 `VITE_` 前缀，在 `huotong-app/.env` 或 `huotong-app/.env.local` 中配置；修改后需重启 dev server。
- `huotong-app/.env.example` 为环境变量模板，新开发者应复制为 `.env` 后填入真实值。

---

## Critical Implementation Rules

### Supabase

- **单例入口**：全项目仅通过 `huotong-app/src/lib/supabase.ts` 导入 Supabase 客户端，禁止在其他文件中再次 `createClient`。
- **环境变量**：必须存在 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_ANON_KEY`；`supabase.ts` 已做缺失校验，新增 Supabase 相关功能时保持从该文件导入 `supabase` 实例。

### 目录与模块约定

- **Supabase / 通用工具**：放在 `huotong-app/src/lib/`（如 `supabase.ts`）。
- **可复用 UI 组件**：放在 `huotong-app/src/components/`。
- **业务逻辑与可复用逻辑**：按需创建 `huotong-app/src/composables/`（目前尚未建立，首次使用时创建）。
- **页面/视图**：放在 `huotong-app/src/views/` 或按功能分子目录；路由在 `huotong-app/src/router/`。
- **状态**：使用 Pinia，store 放在 `huotong-app/src/stores/`（如 `user.ts`）。

### Vue 与 Vant

- 使用 Vue 3 Composition API；新组件优先 `<script setup>`。
- Vant 组件在 `main.ts` 中通过 `app.use()` 以插件形式注册（如 `app.use(VanButton)`）；模板中使用 kebab-case 名称（如 `<van-button>`、`<van-field>`、`<van-form>`）。新增 Vant 组件时需先在 `main.ts` 中注册。

### 路由与认证守卫

- 路由默认**需要登录**；公开页面必须显式设置 `meta: { public: true }`。
- 已登录用户访问公开页面（如 `/login`）会被重定向到首页 `/`。
- 未登录用户访问受保护页面会被重定向到 `/login`，并携带 `redirect` 查询参数以便登录后跳回。
- 新增页面路由时，务必根据需求决定是否设置 `meta: { public: true }`。

### 应用启动顺序

- `main.ts` 使用异步 `bootstrap()` 函数，**必须**按以下顺序执行：`userStore.initSession()` → `userStore.subscribeAuth()` → `app.mount('#app')`。
- 禁止将 `app.mount()` 移到 `bootstrap()` 之外或在 `initSession()` 完成前调用，否则路由守卫会在会话恢复前误判用户未登录。

### 类型与构建

- 新增代码需满足 TypeScript 严格检查，`npm run build` 应无错误。
- 依赖版本与 `huotong-app/package.json` 及架构文档（Vue Router 4.x、Vant 4.x 等）保持一致，引入新依赖前确认与现有栈兼容。

### 安全与配置

- 含密钥或环境差异的配置放在 `.env` / `.env.local`，且已加入 `.gitignore`；禁止将 `VITE_SUPABASE_ANON_KEY` 等写入代码或提交到仓库。

### 统一测试用户（Supabase Auth）

- **凡需要登录态或测试用户的场景，一律使用以下账号，不要另建或假设其他测试账号。**
- 邮箱：`1559082675@qq.com`
- 密码：`hezhangcan199873`
- 用途：本地开发、E2E/手动验收、文档与脚本中的示例。仅限开发/测试环境使用，禁止在生产环境使用或泄露。

---

_Generated for HuoTong project; update as conventions evolve._
