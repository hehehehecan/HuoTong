# HuoTong Android Round 2 Sprint Planning

**Date:** 2026-03-12  
**Scope:** Stage 4 Sprint Planning only  
**Source docs:** `prd.md`, `architecture.md`, `epics.md`, `implementation-readiness-report-2026-03-12-android.md`

## Planning Decision

本次采用**在现有 `sprint-status.yaml` 中追加 Android 第二轮状态**的方式，而不是新建独立状态主文件。

原因：

- BMAD 手册后续 Story 循环默认读取 `sprint-status.yaml`
- 直接追加可保持后续 `Create Story / 继续开发` 流程无缝衔接
- `epic-1` 到 `epic-7` 的第一轮 Web 历史状态可完整保留，不需要覆盖或迁移

## Initial Status Design

- Android 第二轮新增 `epic-8` 到 `epic-12`
- 所有 Android stories 初始状态统一设为 `backlog`
- 所有 Android epics 初始状态统一设为 `backlog`
- retrospective 仍保持 `optional`

这符合 BMAD 手册对 Sprint Planning 的要求：先生成状态跟踪，再由后续 Story 循环逐个推进。

## Recommended Development Queue

`sprint-status.yaml` 中 Android 新增部分的顺序已按推荐开发队列排列，供后续 agent 直接从首个 `backlog` story 开始：

1. `8-1-capacitor-android-init`
2. `8-2-android-app-identity-build-config`
3. `10-2-android-first-release-degrade-entry-shaping`
4. `9-1-session-resume-lifecycle-adaptation`
5. `9-2-android-back-button-navigation`
6. `10-1-network-error-feedback-retry`
7. `11-1-version-display-overwrite-upgrade-verification`
8. `11-2-apk-distribution-update-entry`
9. `12-1-family-account-distribution-install-guide`
10. `12-2-android-device-regression-feedback-loop`

## Sequencing Rationale

- 先完成 `8-1`、`8-2`，建立可安装、可维护的 Android 壳与应用身份
- 再做 `10-2`，先把首版范围收敛到稳定闭环，避免过早恢复高风险能力
- 随后推进 `9-1`、`9-2`，补齐 Android 运行时体验
- `10-1` 放在运行时适配之后，统一补强网络异常提示与重试链路
- 最后处理升级分发与家庭内测交付，确保首版真正可发、可装、可反馈

## Handoff Note

后续 Story 开发应直接从 `8-1-capacitor-android-init` 开始。

在进入 Create Story 之前，无需再改 Sprint Planning 文件；后续 agent 只需按 `sprint-status.yaml` 的首个 `backlog` story 继续即可。
