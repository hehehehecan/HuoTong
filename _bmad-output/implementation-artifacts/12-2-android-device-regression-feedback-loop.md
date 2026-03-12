# Story 12.2: Android 真机回归与反馈闭环

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 开发者,  
I want 在家人正式开始使用前完成真机验证并建立最小反馈闭环,  
so that 首版问题能被快速识别、定位和修复。

## Acceptance Criteria

1. **Given** Android 首版候选包已可安装 **When** 在至少一台真实家庭使用手机上验证核心流程 **Then** 完成登录、商品/客户/供应商、进货、出货、应收应付、库存、前后台切换等回归检查。
2. **Given** 家人在试用过程中遇到问题 **When** 反馈问题给开发者 **Then** 至少能同时提供版本号、机型、网络环境和问题复现步骤 **And** 开发者可以据此判断是否需要重新发版。

## Tasks / Subtasks

- [x] Task 1：建立 Android 真机回归执行清单与记录模板（AC: #1, #2）
  - [x] 1.1 新增 `docs/android-regression-feedback-loop.md`，覆盖“回归前准备、核心流程清单、前后台切换验证、结果记录、发版决策建议”。
  - [x] 1.2 在清单中明确“至少一台家庭真实 Android 设备”执行要求，并提供可复用记录表格。
  - [x] 1.3 将 `docs/android-apk-distribution.md`、`docs/family-account-install-guide.md` 补充为统一入口，指向本回归与反馈闭环文档。

- [x] Task 2：在 App 内提供问题反馈模板入口（AC: #2）
  - [x] 2.1 新增 `huotong-app/src/lib/androidFeedback.ts`，统一生成“反馈时必须提供字段”的文本模板（版本号、机型、网络环境、复现步骤、现象描述）。
  - [x] 2.2 更新 `huotong-app/src/views/PlaceholderView.vue`，在“更多”页增加“问题反馈模板”入口，点击后弹出反馈模板说明对话框。
  - [x] 2.3 反馈模板文案与文档字段保持一致，避免“文档与应用不一致”导致反馈缺项。

- [x] Task 3：补齐自动化回归（AC: #2）
  - [x] 3.1 新增 `huotong-app/tests/api/androidFeedback.spec.ts`，验证反馈模板包含版本号、机型、网络环境、复现步骤等必填字段。
  - [x] 3.2 扩展 `huotong-app/tests/e2e/placeholder.version.spec.ts`，验证“问题反馈模板”入口可见且点击后展示正确对话框文案。

- [x] Task 4：执行验证并同步 Story 记录（AC: #1, #2）
  - [x] 4.1 运行 `npm run test:run -- tests/api/androidFeedback.spec.ts tests/e2e/placeholder.version.spec.ts` 并通过。
  - [x] 4.2 运行 `npm run build` 并通过。
  - [x] 4.3 更新 Story 的 `Dev Agent Record`、`File List`、`Change Log`、`Status`（完成实现后改为 `review`）。

## Dev Notes

- Epic 12 的目标是“家庭内测交付与上线准备”，12.1 已解决“安装与账号分发”，12.2 需要把“真机回归 + 反馈闭环 + 发版决策”补齐为可执行流程。
- 复用现有“更多”页作为 Android 运维入口，不另起新页面，减少认知负担和入口分散风险。
- FR49 与 Architecture 的 Android 发布管理要求“真机安装/前后台/弱网回归”，本 Story 将其沉淀为统一 checklist 与反馈模板。
- 不在代码仓库写入真实家人账号，只提供反馈字段模板和回归记录结构。

### Project Structure Notes

- 建议新增：
  - `docs/android-regression-feedback-loop.md`
  - `huotong-app/src/lib/androidFeedback.ts`
  - `huotong-app/tests/api/androidFeedback.spec.ts`
- 重点修改：
  - `docs/android-apk-distribution.md`
  - `docs/family-account-install-guide.md`
  - `huotong-app/src/views/PlaceholderView.vue`
  - `huotong-app/tests/e2e/placeholder.version.spec.ts`
- 可参考：
  - `docs/android-app-identity-signing.md`
  - `huotong-app/src/lib/apkDistribution.ts`
  - `huotong-app/src/lib/accountOnboarding.ts`

### References

- [Source: _bmad-output/planning-artifacts/epics.md] Epic 12 Story 12.2 用户故事与验收标准。
- [Source: _bmad-output/planning-artifacts/prd.md] FR49 与 Android 交付约束（真机回归、持续使用、反馈机制）。
- [Source: _bmad-output/planning-artifacts/architecture.md] Android 发布管理（真机安装/覆盖升级/前后台切换/弱网回归）与技术栈约束。
- [Source: _bmad-output/project-context.md] 目录规则、Vant 对话框模式、测试与安全约束。

## Developer Context (Guardrails)

### Technical Requirements

- 真机回归清单需覆盖：登录、商品、客户、供应商、进货、出货、应收应付、库存、前后台切换。
- 反馈模板必须明确要求：版本号、机型、网络环境、复现步骤，并补充现象描述字段。
- App 内入口文案与文档字段一一对应，避免字段命名不一致。
- 反馈模板不包含隐私敏感信息字段，不要求用户上传账号密码。

### Architecture Compliance

- 文案和模板生成逻辑放在 `src/lib`，页面层只负责展示和交互。
- 延续“更多”页作为发布、升级、安装和反馈的一体化入口。
- 不变更现有 Supabase 认证、路由守卫和平台降级开关行为。

### Library & Framework Requirements

| 依赖/模块 | 用途 |
|------|------|
| Vue 3 + `<script setup>` | 在“更多”页增加反馈模板入口 |
| Vant `Cell` / `Dialog` | 展示入口与反馈模板弹窗 |
| Vitest + Vue Test Utils | 覆盖模板生成和入口交互 |

### File Structure Requirements

- 新增：`docs/android-regression-feedback-loop.md`、`src/lib/androidFeedback.ts`、`tests/api/androidFeedback.spec.ts`
- 修改：`docs/android-apk-distribution.md`、`docs/family-account-install-guide.md`、`src/views/PlaceholderView.vue`、`tests/e2e/placeholder.version.spec.ts`
- 所有路径保持在既有目录与模块边界内。

### Testing Requirements

- 验证“更多”页可见“问题反馈模板”入口。
- 验证点击后弹窗内容包含版本号、机型、网络环境、复现步骤。
- 验证模板字段与文档要求一致，避免回归导致字段缺失。
- 回归通过：`npm run test:run -- tests/api/androidFeedback.spec.ts tests/e2e/placeholder.version.spec.ts` 与 `npm run build`。

## Project Context Reference

- [Source: _bmad-output/project-context.md] 项目规则、自动化验证要求与敏感信息约束。

## Dev Agent Record

### Agent Model Used

gpt-5.3-codex

### Debug Log References

- `npm run test:run -- tests/api/androidFeedback.spec.ts tests/e2e/placeholder.version.spec.ts`
- `npm run build`
- `npm run test:run`

### Completion Notes List

- 2026-03-12：Create Story 初始化（ready-for-dev）。
- 2026-03-12：新增 `docs/android-regression-feedback-loop.md`，沉淀 Android 真机回归清单、反馈模板与“是否需重新发版”决策标准。
- 2026-03-12：更新 `docs/android-apk-distribution.md`、`docs/family-account-install-guide.md`，将分发、安装、反馈入口统一收敛到回归闭环文档。
- 2026-03-12：新增 `src/lib/androidFeedback.ts`，统一维护问题反馈模板与维护者快速分级检查项。
- 2026-03-12：更新 `src/views/PlaceholderView.vue`，在“更多”页新增“问题反馈模板”入口并接入对话框展示。
- 2026-03-12：新增 `tests/api/androidFeedback.spec.ts`，并扩展 `tests/e2e/placeholder.version.spec.ts`，覆盖反馈模板字段与入口交互回归。
- 2026-03-12：执行 `npm run test:run -- tests/api/androidFeedback.spec.ts tests/e2e/placeholder.version.spec.ts`、`npm run build`、`npm run test:run`，结果均通过。
- 2026-03-12：CR 修复反馈字段在文档与 App 间不一致的问题，并补齐可直接复制的问题反馈模板文本。

### File List

- _bmad-output/implementation-artifacts/12-2-android-device-regression-feedback-loop.md
- _bmad-output/implementation-artifacts/local-verification-checklist.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- docs/android-regression-feedback-loop.md
- docs/android-apk-distribution.md
- docs/family-account-install-guide.md
- huotong-app/src/lib/androidFeedback.ts
- huotong-app/src/views/PlaceholderView.vue
- huotong-app/tests/api/androidFeedback.spec.ts
- huotong-app/tests/e2e/placeholder.version.spec.ts

## Senior Developer Review (AI)

### Reviewer

GPT-5.4

### Review Date

2026-03-12

### Outcome

Changes Requested

### Findings Summary

1. High：AC1 要求“至少一台真实家庭 Android 设备”完成登录、商品、客户、供应商、进货、出货、应收应付、库存、前后台切换回归，但当前仓库只有 checklist/template，`local-verification-checklist.md` 仍是“已验证：否”，没有任何真机执行记录或发版判断结果，Story 不能判定完成。
2. Medium：反馈字段在文档与 App 内模板之间不一致，`问题现象描述` 只出现在回归闭环文档和代码模板里，`docs/android-apk-distribution.md`、`docs/family-account-install-guide.md` 缺项，违背 Task 2.3。
3. Medium：`src/lib/androidFeedback.ts` 只输出字段清单，没有生成可直接复制给家人的反馈模板文本；这与 `docs/android-regression-feedback-loop.md` 中的模板形式不一致，降低反馈收集可执行性。

### Fixes Applied

- 更新 `docs/android-apk-distribution.md`、`docs/family-account-install-guide.md`，补齐“问题现象描述”字段，统一反馈要求。
- 更新 `src/lib/androidFeedback.ts`，新增可直接复制的“【货通问题反馈】”模板文本。
- 更新 `tests/api/androidFeedback.spec.ts`，覆盖反馈模板正文与恢复性判断字段，防止模板再次退化。

### Remaining Blockers

- 需要在至少 1 台真实家庭 Android 设备上完成回归执行，并把设备机型、Android 版本、验证人、验证日期、各项通过/失败结果及“是否需要重新发版”的结论补入验证记录后，才能将 Story 推进到 `done`。

## Change Log

- 2026-03-12：完成 Story 12.2 初始化，补齐真机回归与反馈闭环实现计划。
- 2026-03-12：完成 Story 12.2，实现真机回归与反馈闭环文档、App 内反馈模板入口与自动化回归，并将状态更新为 review。
- 2026-03-12：完成 CR 修复，统一反馈字段与模板文案；因缺少真实 Android 设备回归记录，状态回退为 in-progress。
