---
project_name: HuoTong
user_name: Hezhangcan
date: '2026-03-12'
sections_completed:
  ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'anti_patterns']
existing_patterns_found: 8
status: complete
rule_count: 30
optimized_for_llm: true
---

# Project Context for AI Agents

_本文件包含 AI 代理在本项目中实现代码时必须遵守的关键规则与约定。重点关注容易被忽略的细节。_

---

## Technology Stack & Versions

| 技术 | 版本/说明 |
|------|------------|
| Vue | 3.5.25 |
| Vite | 7.3.1 |
| TypeScript | 5.9.3（`strict: true`） |
| Vant | 4.9.22（移动端 UI，需在 `main.ts` 中 `app.use()` 注册） |
| Pinia | 3.0.4 |
| Vue Router | 4.6.4 |
| @supabase/supabase-js | 2.98.0 |
| Capacitor Core / Android / CLI | 8.2.0 |
| @capacitor/app | 8.0.1 |
| Vitest | 4.0.8（`jsdom` 环境） |
| @vue/test-utils | 2.4.6 |

- 前端主应用位于 `huotong-app/`，入口为 `huotong-app/src/main.ts`。
- Android 容器配置位于 `huotong-app/capacitor.config.ts`，当前 `appId` 为 `com.huotong.app`，`webDir` 为 `dist`。
- 环境变量统一使用 `VITE_` 前缀；修改后必须重启 dev server。
- Android 首版能力开关包括：`VITE_ANDROID_FIRST_RELEASE_MODE`、`VITE_REALTIME_ENABLED`、`VITE_RECEIPT_RECOGNITION_ENABLED`、`VITE_WEB_EXPORT_DOWNLOAD_ENABLED`、`VITE_DESKTOP_BATCH_IMPORT_ENABLED`。
- Vite 构建会把 `dist/index.html` 复制为 `dist/404.html`；部署静态托管时必须保留该 SPA fallback 约定。

## Critical Implementation Rules

### Language-Specific Rules

- TypeScript 处于严格模式；新增代码必须通过 `strict`、`noUnusedLocals`、`noUnusedParameters`、`noFallthroughCasesInSwitch` 约束。
- 业务异步逻辑优先使用 `async/await`，不要把 `.then().catch()` 链式风格扩散到 composable 和 store 主流程里。
- 所有 Supabase 访问统一从 `src/lib/supabase.ts` 导入 `supabase`；禁止在其他文件再次 `createClient()`。
- 涉及网络不稳定的 Supabase 请求，默认复用 `src/lib/networkRetry.ts` 的 `withNetworkRetry(..., 1)`，不要各处手写重试逻辑。
- 搜索/列表类 composable 若存在并发请求风险，沿用 `queryId` 或同等机制防止旧响应覆盖新状态。

### Framework-Specific Rules

- 新组件优先使用 Vue 3 Composition API + `<script setup lang="ts">`。
- 新增 Vant 组件时，先在 `src/main.ts` 中 `app.use()` 注册，再在模板里以 kebab-case 使用。
- 应用启动顺序不可打乱：`initSession()` -> `subscribeAuth()` -> `app.use(router)` -> `await router.isReady()` -> `app.mount('#app')`。
- 路由默认需要登录；只有明确公开页面才设置 `meta: { public: true }`。
- 业务数据读取/写入放在 `src/composables/`，页面组件负责交互，不直接堆叠 Supabase 查询细节。
- Realtime 订阅统一通过 `src/lib/realtime.ts` 的 `subscribeTable()`，并在 composable 生命周期内注册。
- Android/Web 差异统一走 `src/lib/platform.ts`；首版被降级的功能必须通过 `platformConfig` 控制显示、入口和提示文案。

### Testing Rules

- 测试基线是 Vitest + `jsdom`，测试文件按 `tests/**/*.spec.ts` 收集；新增测试保持这一结构。
- composable 测试若依赖作用域清理，使用 `effectScope()` 包裹并在结尾 `scope.stop()`。
- `tests/setup.ts` 会在每个测试后清空 `localStorage` 和 `sessionStorage`；测试不要依赖跨用例持久状态。
- 优先 mock `src/lib/*` 和 `src/composables/*` 的边界，而不是把整页真实依赖全串起来。
- Android 首版入口整形、重试、提示文案等回归，优先补在现有 `tests/e2e/*.spec.ts` 风格测试里。

### Code Quality & Style Rules

- 视图文件命名遵循 `PascalCase + View.vue`；composable 命名遵循 `useXxx.ts`；store 放在 `src/stores/`。
- `src/lib/` 只放平台能力、基础设施与共享工具；不要把页面级状态或业务页面逻辑塞进去。
- 用户可见文案默认使用中文，并与现有 Vant Toast / Dialog 风格保持一致。
- 注释保持稀少且有信息量，只解释顺序约束、平台差异或不明显的原因。
- 涉及环境差异、密钥或平台开关的配置写入 `.env*`，不要硬编码到源码中。

### Development Workflow Rules

- 任何会影响类型或依赖的改动，至少保证 `npm run build` 可通过。
- 单测相关改动优先运行 `npm run test:run` 或针对性 Vitest 用例。
- Android 相关交付走既有脚本：`android:sync`、`android:build`、`android:build:release`；不要手工跳过 `ensure-android-*.mjs` 检查。
- 当新增稳定的项目级约定、平台限制或测试陷阱时，同步更新本文件，避免规则只留在聊天记录里。

### Critical Don't-Miss Rules

- 不要把 `app.mount()` 提前到会话恢复前，否则路由守卫会把已登录用户误判为未登录。
- 不要假设 Realtime 一定开启；Android 首版默认可能关闭，页面必须仍可通过手动刷新和前台恢复刷新工作。
- 不要只隐藏 Android 首版降级功能的按钮；若用户可直达路由，也要做提示和回退处理。
- 不要把浏览器专属能力直接写进页面逻辑；文件下载、返回键、前后台恢复等都应走平台抽象。
- 不要提交真实环境密钥；`VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 缺失时应继续依赖 `supabase.ts` 的启动期失败保护。
- 不要随意变更测试账号约定。需要登录态验证时统一使用：`1559082675@qq.com` / `hezhangcan199873`（仅开发/测试环境）。
- 浏览器自动化登录页时，填写账号密码后要重新获取一次最新 snapshot 再点击登录按钮，否则容易命中 stale element ref。
- 浏览器自动化等待优先使用文本条件或短等待 + 再次 snapshot，不要在每步后都塞固定 2 到 3 秒延迟。

---

## Usage Guidelines

**For AI Agents:**

- 实现任何代码前先阅读本文件。
- 严格遵守全部规则；有歧义时采用更保守、更限制性的做法。
- 若发现新的项目级约定或陷阱，应同步更新本文件。

**For Humans:**

- 保持本文件精简，只保留 AI 代理真正需要的规则。
- 技术栈、平台能力或测试策略变化时及时更新。
- 定期删除已经显而易见或已失效的规则，避免上下文膨胀。

Last Updated: 2026-03-12
