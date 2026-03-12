# Story 10.2: Android 首版功能降级与入口整形

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 开发者,
I want 在 Android 首版默认关闭高风险增强能力,
so that 家人先用上稳定的核心进销存流程，再逐步恢复附加能力。

## Acceptance Criteria

1. **Given** Android 首版发布配置 **When** 应用首次交付给家人 **Then** Realtime、拍照识别、浏览器式导出下载等高风险能力默认关闭或隐藏。  
**And** 登录、商品、客户、供应商、进货、出货、应收应付、库存等核心流程保持可用。
2. **Given** 用户进入不再推荐的历史 Web/桌面特化功能 **When** 该功能不适合 Android 首版 **Then** 系统隐藏入口或给出明确说明，而不是暴露半完成体验。

## Tasks / Subtasks

- [x] Task 1：建立 Android 首版降级策略配置（AC: #1, #2）
  - [x] 1.1 在 `huotong-app/src/lib/` 或 `src/config/` 增加统一的降级策略模块（例如 `androidFirstRelease.ts`），集中声明开关：`realtime`、`receiptRecognition`、`webExportDownload`、`desktopBatchImport`。
  - [x] 1.2 仅在 Android 原生容器环境启用该策略（基于 `src/lib/platform.ts`），Web 环境保持现有能力不受影响。
  - [x] 1.3 为每个开关提供清晰中文说明文案（用于入口隐藏后的替代提示）。

- [x] Task 2：关闭 Android 首版 Realtime 自动订阅（AC: #1）
  - [x] 2.1 在 `src/lib/realtime.ts` 增加统一 gating（当降级开关关闭 Realtime 时直接 no-op 并返回可安全调用的取消函数）。
  - [x] 2.2 验证 `useProducts`、`useSaleOrders`、`usePurchaseOrders`、`useReceivables`、`usePayables` 等现有 composables 在 no-op 订阅下不报错，仍可通过主动刷新获取数据。
  - [x] 2.3 保留手动刷新和 `useAppResumeRefresh` 这类关键场景刷新路径，确保核心业务可用。

- [x] Task 3：下线拍照识别入口（AC: #1）
  - [x] 3.1 在 `SaleOrderCreateView.vue`、`PurchaseOrderCreateView.vue` 对“拍照识别”入口做 Android 首版隐藏或禁用处理。
  - [x] 3.2 如展示禁用态，需给出明确中文说明（例如“Android 首版暂不开放拍照识别，请先手动录入”）。
  - [x] 3.3 不删除既有识图实现代码，仅控制入口与触发，便于后续版本恢复。

- [x] Task 4：整形历史 Web/桌面特化入口（AC: #1, #2）
  - [x] 4.1 对“导出数据”“浏览器下载”等仅适合 Web 的入口，在 Android 首版隐藏或替换为说明（涉及 `useExportData` 相关入口页面）。
  - [x] 4.2 对“批量录入（PC）”入口在 Android 首版默认隐藏，避免用户进入不适配体验。
  - [x] 4.3 保证导航结构清晰，用户不会看到半完成能力但找不到可行路径。

- [x] Task 5：回归验证与测试（AC: #1, #2）
  - [x] 5.1 补充/更新测试，覆盖：Android 环境下降级开关生效、Web 环境不受影响、核心流程入口仍可见。
  - [x] 5.2 执行 `npm run test:run` 与 `npm run build`，确保无回归。
  - [x] 5.3 在 Android 端本地验证：登录、商品/客户/供应商、进货/出货、应收应付、库存可正常使用；降级能力入口按预期隐藏/提示。

## Dev Notes

- 本 Story 的目标是“首版稳定性优先”，应遵循“能力可恢复、入口先收敛”的思路，避免删除底层实现导致后续恢复成本增加。
- 现有 Android 运行时能力已在 Story 9.1 与 9.2 引入生命周期刷新与返回键规范，本 Story 需要与这些平台适配保持一致，不引入分散的条件分支。
- Realtime 在 Android 首版默认关闭后，页面数据新鲜度主要依赖手动刷新与页面恢复刷新；必须保证关键列表不会陷入“无法更新”状态。
- 入口整形应以“减少误导”为第一目标：看不到就不要让用户误触，看到时就给明确中文说明。
- 降级策略必须集中管理，避免在多个页面硬编码 `isNativePlatform` + 字符串常量造成后续维护困难。

### Project Structure Notes

- 建议新增：`huotong-app/src/lib/androidFirstRelease.ts`（统一降级配置与 helper）。
- 重点改动文件：
  - `huotong-app/src/lib/realtime.ts`
  - `huotong-app/src/views/SaleOrderCreateView.vue`
  - `huotong-app/src/views/PurchaseOrderCreateView.vue`
  - `huotong-app/src/components/MainLayout.vue` 或相关“更多/工具”入口聚合处
  - 含导出入口与批量录入入口的页面/路由
- 可选补充：`huotong-app/src/router/index.ts`（若需要针对 Android 首版隐藏路由入口但保留路由能力）

### References

- [Source: _bmad-output/planning-artifacts/epics.md] Epic 10 Story 10.2 用户故事与 AC。
- [Source: _bmad-output/planning-artifacts/prd.md] FR50（Android 首版降级策略）与 FR47（网络稳态导向）。
- [Source: _bmad-output/planning-artifacts/architecture.md] Android 首版降级策略（Realtime/拍照识图/文件导出）与平台抽象层约束。
- [Source: _bmad-output/project-context.md] 模块目录约定、`src/lib/realtime.ts` 订阅约定、Android 自动化验证注意项。
- [Source: _bmad-output/implementation-artifacts/9-1-session-resume-lifecycle-adaptation.md] 生命周期恢复后刷新策略。
- [Source: _bmad-output/implementation-artifacts/9-2-android-back-button-navigation.md] Android 平台能力集中封装方式与回归验证基线。

## Developer Context (Guardrails)

### Technical Requirements

- 降级开关仅影响 Android 原生环境；Web 端不得误伤历史能力。
- Realtime 关闭时不得抛异常；所有调用方继续可运行，返回取消函数保持幂等。
- 入口隐藏或禁用时必须有清晰中文反馈，避免“按钮消失但用户不知原因”的困惑。
- 不删除拍照识图、导出逻辑的底层代码，仅限制首版入口暴露。

### Architecture Compliance

- 平台差异放在 `src/lib` 或集中配置模块，页面层只消费布尔状态和提示文案。
- 继续使用 Vue 3 + TypeScript + Vant + Pinia + Vue Router 既有模式，不新增重型依赖。
- 路由守卫和登录态流程保持现状，不因入口整形破坏认证链路。

### Library & Framework Requirements

| 依赖/模块 | 用途 |
|------|------|
| `@capacitor/core` / 现有 `platform.ts` | 判断 Android 原生容器环境 |
| `src/lib/realtime.ts` | 统一 Realtime 订阅入口的首版降级控制 |
| Vant (`Toast` / `Dialog`) | 禁用能力提示文案 |
| Vue Router 4 | 控制入口可达性与导航一致性 |

### File Structure Requirements

- 新增（建议）：`huotong-app/src/lib/androidFirstRelease.ts`
- 修改（至少）：
  - `huotong-app/src/lib/realtime.ts`
  - `huotong-app/src/views/SaleOrderCreateView.vue`
  - `huotong-app/src/views/PurchaseOrderCreateView.vue`
  - `huotong-app/src/components/MainLayout.vue`（或实际入口文件）
  - `huotong-app/src/views/ProductListView.vue` / `ProductBatchImportView.vue`（按入口关系调整）

### Testing Requirements

- Android 环境：Realtime 不自动订阅，页面仍可通过手动/恢复刷新拿到最新数据。
- Android 环境：拍照识别、导出下载、批量录入入口隐藏或显示明确“暂不开放”提示。
- Web 环境：不受该 Story 影响，历史能力仍可访问。
- 回归通过：`npm run test:run`、`npm run build`。

## Project Context Reference

- [Source: _bmad-output/project-context.md] 项目规则、技术版本、目录约定与自动化验证策略。

## Dev Agent Record

### Agent Model Used

gpt-5.3-codex

### Debug Log References

- `npm run test:run`
- `npm run build`

### Completion Notes List

- 2026-03-12：Create Story 初始化（ready-for-dev）。
- 2026-03-12：扩展 `src/lib/platform.ts`，新增 Android 首版降级策略解析（`androidFirstReleaseMode`）与统一功能开关/提示文案。
- 2026-03-12：`src/lib/realtime.ts` 在 Realtime 关闭时统一返回 no-op 取消订阅函数，避免调用方分支处理。
- 2026-03-12：下线 Android 首版拍照识别入口：`SaleOrderCreateView.vue` 与 `PurchaseOrderCreateView.vue` 隐藏按钮并显示“暂不开放”提示，保留原识图实现代码。
- 2026-03-12：整形历史 Web/桌面入口：`PlaceholderView.vue` 对导出功能做 Android 首版禁用提示；`ProductListView.vue` 隐藏批量录入入口；`ProductBatchImportView.vue` 增加路由级降级兜底。
- 2026-03-12：补充 `tests/api/platform.config.spec.ts` 覆盖 Android/Web 默认策略与环境变量覆盖，并通过全量测试和构建回归。
- 2026-03-12：CR 补充 `tests/api/realtime.gating.spec.ts` 与 `tests/e2e/android-first-release.entry-shaping.spec.ts`，覆盖 Realtime no-op、拍照识别/导出/批量录入入口收敛以及核心新增入口保留。

### File List

- _bmad-output/implementation-artifacts/10-2-android-first-release-degrade-entry-shaping.md（新增并更新）
- _bmad-output/implementation-artifacts/sprint-status.yaml（更新）
- huotong-app/src/lib/platform.ts（更新）
- huotong-app/src/lib/realtime.ts（更新）
- huotong-app/src/views/SaleOrderCreateView.vue（更新）
- huotong-app/src/views/PurchaseOrderCreateView.vue（更新）
- huotong-app/src/views/ProductListView.vue（更新）
- huotong-app/src/views/ProductBatchImportView.vue（更新）
- huotong-app/src/views/PlaceholderView.vue（更新）
- huotong-app/tests/api/platform.config.spec.ts（新增）
- huotong-app/tests/api/realtime.gating.spec.ts（新增）
- huotong-app/tests/e2e/android-first-release.entry-shaping.spec.ts（新增）
- _bmad-output/implementation-artifacts/local-verification-checklist.md（更新）

### Senior Developer Review (AI)

- Reviewer: Hezhangcan
- Date: 2026-03-12
- Outcome: Approved

#### Findings Summary

- High: 0
- Medium: 1
- Low: 0

#### Review Notes

- Medium：原实现仅验证了降级配置解析，缺少 Android 首版关键回归保护，无法防止后续改动重新暴露拍照识别、导出下载、批量录入入口，或让 Realtime 关闭分支回退成非 no-op；现已补齐自动化回归测试并完成全量测试与构建验证。

## Change Log

- 2026-03-12：Create Story 初始化，状态设为 ready-for-dev。
- 2026-03-12：完成 DS 实现与回归验证（`npm run test:run`、`npm run build`），状态更新为 review。
- 2026-03-12：完成 CR，补充 Android 首版降级回归测试并将状态更新为 done。
