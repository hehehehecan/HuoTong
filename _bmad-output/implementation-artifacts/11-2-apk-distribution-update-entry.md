# Story 11.2: APK 分发与更新入口

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 家人（用户）,  
I want 通过简单明确的方式获取新版 APK,  
so that 后续升级不需要每次都靠口头说明。

## Acceptance Criteria

1. **Given** 开发者已准备好新版 APK **When** 提供固定下载页或固定分发入口 **Then** 用户可以按指引下载并安装更新。
2. **Given** 用户需要升级 **When** 查看更新说明 **Then** 能理解本次更新内容与安装步骤。

## Tasks / Subtasks

- [x] Task 1：在 App 内提供固定更新入口（AC: #1）
  - [x] 1.1 在 `huotong-app/src/lib/` 新增 APK 分发配置模块，统一维护下载入口、当前推荐版本和更新说明摘要。
  - [x] 1.2 在“更多”页（`huotong-app/src/views/PlaceholderView.vue`）新增“下载更新包”入口，确保家人可以在固定位置找到升级入口。
  - [x] 1.3 当下载入口未配置时，给出清晰中文提示，不允许静默失败。

- [x] Task 2：在 App 内提供可读的更新说明与安装步骤（AC: #2）
  - [x] 2.1 在“更多”页新增“更新说明”入口，展示本次更新重点和安装步骤（覆盖安装前提、安装顺序、失败排查）。
  - [x] 2.2 安装说明文案需与 Android 签名/版本策略保持一致（同包名、同签名、`versionCode` 递增）。
  - [x] 2.3 保持文案对非技术用户可理解，避免仅给技术术语。

- [x] Task 3：完善分发文档与回归测试（AC: #1, #2）
  - [x] 3.1 新增或更新分发文档（`docs/`）并记录固定下载入口维护方式、更新说明模板和安装步骤。
  - [x] 3.2 新增/更新测试，覆盖“更多”页更新入口展示、点击行为和“未配置入口”的提示分支。
  - [x] 3.3 运行 `npm run test:run` 与 `npm run build`，确保无回归。

## Dev Notes

- Epic 11 的目标是“可持续升级与分发管理”，11.1 已完成版本展示与覆盖升级验证，11.2 重点是把“获取新包 + 看懂更新说明”的路径产品化。
- Android 首版仍以家庭内分发为主，不依赖应用商店；本 Story 仅要求“固定入口 + 清晰说明”，不引入复杂 OTA 机制。
- 安装说明必须与 `docs/android-app-identity-signing.md` 一致，避免出现“文档 A 说法”和“应用内说法”冲突。
- 继续遵守现有 Android 首版降级策略：不恢复高风险功能，不影响核心进销存流程稳定性。

### Project Structure Notes

- 建议新增：
  - `huotong-app/src/lib/apkDistribution.ts`
- 重点修改：
  - `huotong-app/src/views/PlaceholderView.vue`
  - `docs/android-app-identity-signing.md`
  - `docs/android-apk-distribution.md`（如原文档不存在则新增）
- 测试文件建议：
  - `huotong-app/tests/e2e/placeholder.version.spec.ts`（扩展为“更多页版本 + 更新入口”）
  - `huotong-app/tests/api/apkDistribution.spec.ts`（新增）

### References

- [Source: _bmad-output/planning-artifacts/epics.md] Epic 11 Story 11.2 用户故事与验收标准。
- [Source: _bmad-output/planning-artifacts/prd.md] FR48 / FR49（升级分发、安装指引、反馈闭环）。
- [Source: _bmad-output/planning-artifacts/architecture.md] Android 发布管理（包名/签名/版本）与 APK 分发约束。
- [Source: _bmad-output/project-context.md] 目录约定、Vant 页面规范、测试与构建要求。

## Developer Context (Guardrails)

### Technical Requirements

- 固定分发入口必须在应用内“更多”页可见，不依赖用户记住外部链接。
- 下载入口配置必须可维护（集中在单文件/单模块），避免散落在组件模板中。
- 若下载入口为空，必须明确告知“尚未配置”，并引导用户联系维护者获取链接。
- 更新说明至少包含：本次更新内容、安装步骤、安装失败常见原因。

### Architecture Compliance

- 平台与分发配置放在 `src/lib`，页面层仅消费配置与行为函数。
- 不引入新全局状态（Pinia）来承载静态分发信息，保持实现轻量。
- 不改变现有登录、路由守卫、核心业务数据流。

### Library & Framework Requirements

| 依赖/模块 | 用途 |
|------|------|
| Vue 3 + `<script setup>` | “更多”页更新入口与说明展示 |
| Vant `Cell` / `Dialog` / `Toast` | 展示入口、说明弹层、失败提示 |
| Vitest + Vue Test Utils | 覆盖入口展示与交互回归 |

### File Structure Requirements

- 新增：`huotong-app/src/lib/apkDistribution.ts`
- 修改：
  - `huotong-app/src/views/PlaceholderView.vue`
  - `docs/android-app-identity-signing.md`
  - `docs/android-apk-distribution.md`（新增或更新）
- 测试：
  - `huotong-app/tests/api/apkDistribution.spec.ts`
  - `huotong-app/tests/e2e/placeholder.version.spec.ts`

### Testing Requirements

- 验证“更多”页可见固定更新入口与更新说明入口。
- 验证点击“下载更新包”会触发打开固定分发链接（或对应处理函数）。
- 验证分发链接未配置时显示清晰中文提示。
- 回归通过：`npm run test:run`、`npm run build`。

## Project Context Reference

- [Source: _bmad-output/project-context.md] 项目规则、目录约束、自动化验证注意项。

## Dev Agent Record

### Agent Model Used

gpt-5.3-codex

### Debug Log References

- `npm run test:run -- tests/api/apkDistribution.spec.ts tests/e2e/placeholder.version.spec.ts`
- `npm run test:run`
- `npm run build`

### Completion Notes List

- 2026-03-12：Create Story 初始化（ready-for-dev）。
- 2026-03-12：新增 `src/lib/apkDistribution.ts`，集中维护 APK 推荐版本、下载入口、更新说明文案与安装排查提示。
- 2026-03-12：更新 `src/views/PlaceholderView.vue`，在“更多”页新增“下载更新包”和“更新说明”固定入口，支持未配置下载链接时中文提示。
- 2026-03-12：新增 `docs/android-apk-distribution.md`，并补充 `docs/android-app-identity-signing.md` 的 Story 11.2 入口与维护要求。
- 2026-03-12：更新 `.env.example`，补充 APK 分发入口相关环境变量示例。
- 2026-03-12：新增 `tests/api/apkDistribution.spec.ts`，扩展 `tests/e2e/placeholder.version.spec.ts`，覆盖更新入口展示与交互分支。
- 2026-03-12：CR 修复补齐“下载入口实际未打开”失败分支处理与回归测试，并同步修正 Story 文件清单。

### File List

- _bmad-output/implementation-artifacts/11-2-apk-distribution-update-entry.md
- _bmad-output/implementation-artifacts/local-verification-checklist.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- huotong-app/src/lib/apkDistribution.ts
- huotong-app/src/views/PlaceholderView.vue
- huotong-app/tests/api/apkDistribution.spec.ts
- huotong-app/tests/e2e/placeholder.version.spec.ts
- huotong-app/.env.example
- docs/android-apk-distribution.md
- docs/android-app-identity-signing.md

## Senior Developer Review (AI)

### Reviewer

GPT-5.4

### Review Date

2026-03-12

### Outcome

Approve

### Findings Summary

1. Medium：`openApkDownloadEntry()` 仅检查 `window.open` 是否存在，未校验链接是否真的被打开；在 Android WebView 或浏览器拦截场景下会把失败误判为成功，用户拿不到任何中文提示。
2. Medium：缺少“`window.open` 返回 `null` / 抛错”的回归测试，无法防止后续再次引入静默失败。
3. Medium：Story `File List` 漏记 `_bmad-output/implementation-artifacts/local-verification-checklist.md`，与实际 git 变更不一致。

### Fixes Applied

- 更新 `src/lib/apkDistribution.ts`，在未真正打开窗口或抛错时返回 `false`，让页面层能走失败提示分支。
- 为 `tests/api/apkDistribution.spec.ts` 补充“返回 null / 抛错”的回归测试。
- 更新 Story `File List` 与 CR 记录，保持文档和实际变更一致。

## Change Log

- 2026-03-12：完成 Story 11.2 实现，新增 App 内固定 APK 下载入口与更新说明入口，补齐分发文档、配置示例和自动化回归测试，状态更新为 review。
- 2026-03-12：完成 CR 修复，补齐下载失败分支与 Story 记录，状态更新为 done。
