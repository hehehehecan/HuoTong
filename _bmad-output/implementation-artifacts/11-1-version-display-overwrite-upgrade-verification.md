# Story 11.1: 版本号展示与覆盖升级验证

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 开发者,  
I want 每个 Android 版本都有清晰编号并能覆盖安装升级,  
so that 家人不会长期停留在旧版本，也不会因为版本混乱导致无法维护。

## Acceptance Criteria

1. **Given** 开发者生成新版 APK **When** 版本号递增并进行签名 **Then** 新 APK 可以覆盖安装旧版本。  
**And** 用户原有登录态和使用数据不会因升级而异常丢失。
2. **Given** 用户在 App 内查看关于页或设置页 **When** 页面展示版本信息 **Then** 能看到当前版本号，便于反馈问题和确认是否更新。

## Tasks / Subtasks

- [x] Task 1：实现 App 内版本信息展示（AC: #2）
  - [x] 1.1 在 `huotong-app/src/lib/` 新增应用版本信息读取模块（如 `appInfo.ts`），统一封装 `@capacitor/app` 的 `App.getInfo()` 调用，并提供 Web 降级值。
  - [x] 1.2 在“更多”页（`PlaceholderView.vue`）新增“当前版本”展示区（含 `versionName` 与可选 `versionCode/build`），保证 Android 与 Web 均可读。
  - [x] 1.3 读取失败时提供稳定回退（例如显示“未知版本”），不得阻塞页面渲染。

- [x] Task 2：完善 Android 覆盖升级可维护性约束（AC: #1）
  - [x] 2.1 校验并保留 `huotong-app/android/app/build.gradle` 中 `applicationId` 稳定不变策略，仅允许递增 `versionCode` 与维护 `versionName`。
  - [x] 2.2 在 Android 构建/发布文档中补充覆盖升级必要条件：同签名证书、同包名、`versionCode` 递增；并注明条件不满足时会触发重装/失败风险。
  - [x] 2.3 为本 Story 增补“覆盖升级本地验证步骤”（安装旧包→安装新包→验证登录态与关键数据仍可访问），供 DS 结束时写入本地验证清单。

- [x] Task 3：补齐自动化测试与回归（AC: #1, #2）
  - [x] 3.1 新增/更新单元测试，覆盖版本信息读取模块在 native/web/异常场景的行为。
  - [x] 3.2 新增组件/视图测试，覆盖“更多”页版本展示文案与降级文案。
  - [x] 3.3 执行 `npm run test:run` 与 `npm run build`，确保无回归。

## Dev Notes

- 本 Story 与 Epic 8/9/10 已完成能力直接关联：Android 容器、生命周期、降级开关已存在，不应破坏既有运行时稳定性。
- 版本展示应是“轻量只读能力”，不得引入额外登录依赖或远程配置依赖。
- 覆盖升级可行性依赖 Android 系统规则：`applicationId` 一致、签名证书一致、`versionCode` 单调递增；本 Story 需把这些规则显式化并可执行化。
- AC #1 关注的是“升级后可继续使用”，因此验证必须覆盖会话与最小业务数据可访问（如进入首页、打开商品/单据列表）。

### Project Structure Notes

- 建议新增：`huotong-app/src/lib/appInfo.ts`
- 重点修改：
  - `huotong-app/src/views/PlaceholderView.vue`
  - `huotong-app/android/app/build.gradle`（仅在需要递增版本号时修改，禁止改包名）
  - `docs/android-app-identity-signing.md`（更新覆盖升级实操验证步骤）
- 测试文件建议：
  - `huotong-app/tests/api/appInfo.spec.ts`
  - `huotong-app/tests/e2e/placeholder.version.spec.ts`

### References

- [Source: _bmad-output/planning-artifacts/epics.md] Epic 11 Story 11.1 用户故事与验收标准。
- [Source: _bmad-output/planning-artifacts/prd.md] FR48（覆盖安装升级）与 Android 交付运维约束。
- [Source: _bmad-output/planning-artifacts/architecture.md] Android 发布管理（包名/签名/版本管理）与 Capacitor 架构约束。
- [Source: _bmad-output/project-context.md] `src/lib` 模块约定、Vant 页面规范、测试与构建要求。

## Developer Context (Guardrails)

### Technical Requirements

- 版本展示优先显示用户可识别版本号（`versionName`/`version`），可附带内部构建号（`versionCode`/`build`）。
- `App.getInfo()` 调用必须容错，避免在个别设备异常时导致页面卡死；必要时做超时兜底。
- 不允许把 Android 发布关键配置散落到多个文件；`applicationId`、`versionCode`、`versionName` 仍以 `android/app/build.gradle` 为单一可信源。
- 覆盖升级验证以“旧包→新包”实机流程为准，不能只靠理论说明。

### Architecture Compliance

- 遵循既有分层：平台能力封装在 `src/lib`，页面仅消费 composable/lib 返回的数据。
- 遵循 Vue 3 + TypeScript + Vant 现有模式，不新增重型依赖。
- 不改变认证与路由守卫主流程；版本展示不得影响登录跳转逻辑。

### Library & Framework Requirements

| 依赖/模块 | 用途 |
|------|------|
| `@capacitor/app` | 获取应用名称、版本、构建号等本地元信息 |
| `@capacitor/core` | 平台判断（native / web） |
| Vant `Cell` / `Tag`（可选） | 在“更多”页展示版本信息 |
| Vitest | 覆盖模块与页面渲染回归 |

### File Structure Requirements

- 新增：`huotong-app/src/lib/appInfo.ts`
- 修改：
  - `huotong-app/src/views/PlaceholderView.vue`
  - `docs/android-app-identity-signing.md`（新增或更新）
- 可选修改：`huotong-app/android/app/build.gradle`（仅版本递增，不改 `applicationId`）

### Testing Requirements

- Native 模式：能读取并展示版本信息（含失败兜底）。
- Web 模式：展示合理降级版本文案，不抛异常。
- 覆盖升级验证步骤明确可执行，且包含“升级后登录态/核心数据仍正常”的验收点。
- 回归通过：`npm run test:run`、`npm run build`。

## Project Context Reference

- [Source: _bmad-output/project-context.md] 项目规则、目录约束、自动化验证注意项。

## Dev Agent Record

### Agent Model Used

gpt-5.3-codex

### Debug Log References

- `npm run test:run -- tests/api/appInfo.spec.ts tests/e2e/placeholder.version.spec.ts`
- `npm run test:run`
- `npm run build`

### Completion Notes List

- 2026-03-12：Create Story 初始化（ready-for-dev）。
- 2026-03-12：新增 `src/lib/appInfo.ts`，封装 `App.getInfo()` + 超时兜底 + Web 降级值，统一版本信息读取。
- 2026-03-12：`PlaceholderView.vue` 在“更多”页新增“当前版本”展示，并保持导出入口降级逻辑不受影响。
- 2026-03-12：Android 版本号递增：`versionCode 1 -> 2`，`versionName 1.0.0 -> 1.0.1`，保持 `applicationId` 不变。
- 2026-03-12：更新 `docs/android-app-identity-signing.md`，补充覆盖升级实操验证步骤（安装旧包→覆盖安装新包→验证版本/登录态/数据）。
- 2026-03-12：新增测试 `tests/api/appInfo.spec.ts` 与 `tests/e2e/placeholder.version.spec.ts`，并通过全量测试与构建回归。
- 2026-03-12：CR 修复补齐 `App.getInfo()` 超时兜底与页面未知版本文案回归测试，并同步修正 Story 文件清单。

### File List

- _bmad-output/implementation-artifacts/11-1-version-display-overwrite-upgrade-verification.md（新增并更新）
- _bmad-output/implementation-artifacts/local-verification-checklist.md（更新）
- _bmad-output/implementation-artifacts/sprint-status.yaml（更新）
- huotong-app/src/lib/appInfo.ts（新增）
- huotong-app/src/views/PlaceholderView.vue（更新）
- huotong-app/android/app/build.gradle（更新）
- huotong-app/tests/api/appInfo.spec.ts（新增）
- huotong-app/tests/e2e/placeholder.version.spec.ts（新增）
- docs/android-app-identity-signing.md（更新）

## Senior Developer Review (AI)

### Reviewer

GPT-5.4

### Review Date

2026-03-12

### Outcome

Approve

### Findings Summary

1. Medium：`App.getInfo()` 超时兜底虽已实现，但缺少回归测试，无法防止后续改动破坏 Android 异常设备场景。
2. Medium：“更多”页仅覆盖正常版本展示测试，缺少“未知版本”兜底文案验证，页面降级路径未闭环。
3. Medium：Story `File List` 漏记 `_bmad-output/implementation-artifacts/local-verification-checklist.md`，与实际 git 变更不一致。

### Fixes Applied

- 为 `tests/api/appInfo.spec.ts` 增加 Native 超时兜底测试。
- 为 `tests/e2e/placeholder.version.spec.ts` 增加“未知版本”展示测试。
- 更新 Story `File List`，补记本地验证清单文件并保留 CR 修复记录。

## Change Log

- 2026-03-12：Create Story 初始化，状态设为 ready-for-dev。
- 2026-03-12：完成 DS 实现与回归验证（`npm run test:run`、`npm run build`），状态更新为 review。
- 2026-03-12：完成 CR 修复，补齐测试覆盖与 Story 记录，状态更新为 done。
