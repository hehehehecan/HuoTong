# Story 12.1: 家庭账号分发与安装指引

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 开发者,  
I want 为家人准备清晰的安装和登录指引,  
so that 他们在没有我实时陪同的情况下也能完成首次使用。

## Acceptance Criteria

1. **Given** 首版 APK 已准备完成 **When** 开发者整理交付材料 **Then** 至少包含安装步骤、未知来源授权说明、登录方式、忘记密码处理和常见问题。
2. **Given** 家人收到安装包和账号信息 **When** 按说明操作 **Then** 可以独立完成安装并成功登录系统。

## Tasks / Subtasks

- [x] Task 1：补齐家庭内测交付文档（AC: #1, #2）
  - [x] 1.1 新增 `docs/family-account-install-guide.md`，覆盖首次安装全流程：下载 APK、未知来源授权、安装后首次启动。
  - [x] 1.2 在文档中明确“登录方式”与“账号分发建议”（不在仓库明文保存家人账号），并给出“忘记密码处理流程”。
  - [x] 1.3 在文档中补充常见问题（至少包含安装失败、登录失败、网络异常、升级后问题）与对应排查步骤。
  - [x] 1.4 更新 `docs/android-apk-distribution.md`，新增对家庭安装指引文档的引用，形成统一入口。

- [x] Task 2：在 App 内提供固定可见的安装/登录指引入口（AC: #1, #2）
  - [x] 2.1 在“更多”页新增“首次安装与登录指引”入口，展示面向家人的简洁步骤文案。
  - [x] 2.2 指引文案需包含未知来源授权提醒、登录方式、忘记密码处理提示与维护者联系建议。
  - [x] 2.3 不在前端代码硬编码真实家人账号，仅展示流程与说明，避免敏感信息泄漏。

- [x] Task 3：补齐自动化回归（AC: #2）
  - [x] 3.1 为安装指引文案生成逻辑新增单测，验证“安装步骤/登录方式/忘记密码/FAQ”关键片段存在。
  - [x] 3.2 扩展“更多”页测试，验证新入口可见且点击后会展示安装与登录指引弹窗。

- [x] Task 4：执行验证并同步 Story 记录（AC: #1, #2）
  - [x] 4.1 运行 `npm run test:run -- tests/api/accountOnboarding.spec.ts tests/e2e/placeholder.version.spec.ts`（或等效命令）并通过。
  - [x] 4.2 运行 `npm run build` 并通过。
  - [x] 4.3 更新 Story 的 `Dev Agent Record`、`File List`、`Change Log`、`Status`（完成实现后改为 `review`）。

## Dev Notes

- Epic 12 的目标是“家庭内测交付与上线准备”，12.1 先解决“家人可独立安装并登录”的可操作指引，12.2 再做真机回归与反馈闭环。
- 11.2 已落地“更多页下载更新包 + 更新说明”与分发文档，本 Story 应优先复用既有入口与文档，避免另起一套分发路径。
- FR49 明确要求“版本号 + 安装指引 + 账号分发 + 反馈机制”，本 Story 覆盖前 3 项中的“安装指引 + 账号分发流程说明”。
- 登录实现当前基于 Supabase Email/Password，登录失败文案已区分“账号密码错误”和“网络失败重试”；文档需与现有行为一致。

### Project Structure Notes

- 建议新增：
  - `docs/family-account-install-guide.md`
  - `huotong-app/src/lib/accountOnboarding.ts`
  - `huotong-app/tests/api/accountOnboarding.spec.ts`
- 重点修改：
  - `huotong-app/src/views/PlaceholderView.vue`
  - `huotong-app/tests/e2e/placeholder.version.spec.ts`
  - `docs/android-apk-distribution.md`
- 可参考：
  - `docs/android-app-identity-signing.md`
  - `huotong-app/src/lib/apkDistribution.ts`
  - `huotong-app/src/views/LoginView.vue`

### References

- [Source: _bmad-output/planning-artifacts/epics.md] Epic 12 Story 12.1 用户故事与验收标准。
- [Source: _bmad-output/planning-artifacts/prd.md] FR49、Android 交付与运维约束（安装指引、账号分发、可持续使用）。
- [Source: _bmad-output/planning-artifacts/architecture.md] Android 发布管理、APK 分发与安装风险、认证方案（Supabase Auth）。
- [Source: _bmad-output/project-context.md] 目录规范、敏感信息管理、Vue/Vant 与测试要求。

## Developer Context (Guardrails)

### Technical Requirements

- 输出材料必须覆盖：安装步骤、未知来源授权说明、登录方式、忘记密码处理、常见问题。
- 指引必须面向非技术家人：用语简洁、步骤清晰，避免仅给技术术语。
- 不得将真实账号密码写入仓库；账号分发只提供流程与渠道建议。
- App 内入口与离线文档信息保持一致，避免“文档和应用说法冲突”。

### Architecture Compliance

- 文案与配置逻辑放在 `src/lib`，页面层仅消费内容并负责展示交互。
- 维持现有“更多页”作为 Android 交付入口，不新增分散入口。
- 不改变现有登录鉴权流程和 Supabase 客户端初始化方式。

### Library & Framework Requirements

| 依赖/模块 | 用途 |
|------|------|
| Vue 3 + `<script setup>` | “更多”页新增安装/登录指引入口 |
| Vant `Cell` / `Dialog` | 展示指引入口与说明弹窗 |
| Vitest + Vue Test Utils | 覆盖入口可见性与点击交互回归 |

### File Structure Requirements

- 新增：`docs/family-account-install-guide.md`、`src/lib/accountOnboarding.ts`、`tests/api/accountOnboarding.spec.ts`
- 修改：`src/views/PlaceholderView.vue`、`tests/e2e/placeholder.version.spec.ts`、`docs/android-apk-distribution.md`
- 路径保持在既有目录约定内，避免跨层耦合。

### Testing Requirements

- 验证“更多”页可见“首次安装与登录指引”入口。
- 验证点击入口会弹出包含安装、登录、忘记密码和 FAQ 的说明文案。
- 验证文档与应用入口都存在且内容一致指向。
- 回归通过：`npm run test:run`（至少覆盖新增测试）与 `npm run build`。

## Project Context Reference

- [Source: _bmad-output/project-context.md] 项目规则、自动化验证注意项与敏感信息约束。

## Dev Agent Record

### Agent Model Used

gpt-5.3-codex

### Debug Log References

- `npm run test:run -- tests/api/accountOnboarding.spec.ts tests/e2e/placeholder.version.spec.ts`
- `npm run build`
- `npm run test:run`

### Completion Notes List

- 2026-03-12：Create Story 初始化（ready-for-dev）。
- 2026-03-12：新增 `docs/family-account-install-guide.md`，补齐安装步骤、未知来源授权、登录方式、忘记密码和 FAQ 的家庭交付手册。
- 2026-03-12：新增 `src/lib/accountOnboarding.ts`，统一管理“首次安装与登录指引”文案，避免在页面层散落硬编码文本。
- 2026-03-12：更新 `src/views/PlaceholderView.vue`，在“更多”页新增“首次安装与登录指引”入口并接入弹窗展示。
- 2026-03-12：新增 `tests/api/accountOnboarding.spec.ts`，扩展 `tests/e2e/placeholder.version.spec.ts`，覆盖新入口与文案关键项回归。
- 2026-03-12：更新 `docs/android-apk-distribution.md`，补充家庭首次交付建议并链接统一安装指引文档。
- 2026-03-12：CR 修复首次安装路径表述不准确的问题，补齐“网络异常/联系维护者”文案，并加强安装引导回归断言。

### File List

- _bmad-output/implementation-artifacts/12-1-family-account-distribution-install-guide.md
- _bmad-output/implementation-artifacts/local-verification-checklist.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- docs/family-account-install-guide.md
- docs/android-apk-distribution.md
- huotong-app/src/lib/accountOnboarding.ts
- huotong-app/src/views/PlaceholderView.vue
- huotong-app/tests/api/accountOnboarding.spec.ts
- huotong-app/tests/e2e/placeholder.version.spec.ts

## Senior Developer Review (AI)

### Reviewer

GPT-5.4

### Review Date

2026-03-12

### Outcome

Approve

### Findings Summary

1. High：安装指引把“首次安装”用户引导到 `更多 -> 下载更新包`，但首次安装前无法进入 App，导致 AC2 的独立安装路径不成立。
2. Medium：离线文档 FAQ 缺少独立的“网络异常”条目，Task 1.3 要求的关键场景覆盖不完整。
3. Medium：`tests/api/accountOnboarding.spec.ts` 只校验大类标题，未锁定“首次安装 vs 已安装升级”的关键文案，无法防止同类回归。

### Fixes Applied

- 更新 `docs/family-account-install-guide.md` 与 `src/lib/accountOnboarding.ts`，区分首次安装和已安装升级入口，并补充联系维护者建议。
- 更新 `docs/family-account-install-guide.md`，新增独立“网络异常” FAQ 条目，补齐反馈字段要求。
- 更新 `docs/android-apk-distribution.md` 与 `tests/api/accountOnboarding.spec.ts`，统一首次安装文案并增加关键断言。

## Change Log

- 2026-03-12：完成 Story 12.1，实现家庭首次安装与账号分发指引文档、App 内固定入口、自动化回归，并将状态更新为 review。
- 2026-03-12：完成 CR 修复，校正首次安装指引、补齐 FAQ/联系维护者文案与回归断言，状态更新为 done。
