# Story 8.2: Android 应用身份与构建配置

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 开发者,
I want 确定 Android 应用名、包名、图标、版本号与签名策略,
so that 后续版本可以稳定覆盖升级并长期维护。

## Acceptance Criteria

1. **Given** Android 工程已创建 **When** 配置应用名、包名、图标、启动图、`versionName`、`versionCode` **Then** 调试包与发布包都具备明确的应用身份信息。
2. **Given** 开发者准备发布首版 APK **When** 使用正式 keystore 签名 **Then** 生成的 APK 可作为后续所有版本覆盖安装升级的基础 **And** keystore 保管方式被记录下来。

## Tasks / Subtasks

- [x] Task 1：固化 Android 应用身份与版本元数据 (AC: #1)
  - [x] 1.1 校验并统一 `applicationId` / `namespace` / `app_name` / `custom_url_scheme`，确保与 `com.huotong.app` 一致且可长期复用。
  - [x] 1.2 明确 `versionName` 与 `versionCode` 规则，并在 Android 工程中设置首版基线值。
  - [x] 1.3 补充注释或文档，避免后续误改包名和版本编号策略。
- [x] Task 2：补齐 Android 品牌标识（图标与启动体验）(AC: #1)
  - [x] 2.1 更新 launcher icon 前景/背景资源，确保应用图标不再使用默认模板形态。
  - [x] 2.2 配置启动页资源（splash 背景/主题），保证首屏展示为 HuoTong 统一风格。
  - [x] 2.3 校验 AndroidManifest 的 `icon` / `roundIcon` / `label` 关联资源正确。
- [x] Task 3：建立 release 签名与构建流程 (AC: #2)
  - [x] 3.1 为 Android release 构建增加 keystore 配置读取能力（不把敏感信息写入仓库）。
  - [x] 3.2 提供签名配置模板与校验脚本，保证 release 构建前能发现缺失配置。
  - [x] 3.3 在 `package.json` 增加 release 构建脚本，形成可复用的发版入口。
- [x] Task 4：文档化证书保管与升级策略 (AC: #2)
  - [x] 4.1 新增 Android 签名与版本策略文档，包含 keystore 生成、保管、轮换注意事项。
  - [x] 4.2 文档明确覆盖安装升级前置条件（包名一致、签名一致、versionCode 递增）。
  - [x] 4.3 将 Story 8.1 初始化文档与本 Story 文档建立关联，方便后续连续操作。
- [x] Task 5：验证与记录 (AC: #1, #2)
  - [x] 5.1 运行 Android 调试构建命令，确认调整后仍可产出调试包。
  - [x] 5.2 在具备 keystore 的前提下运行 release 构建命令，确认产出签名后的 release APK。
  - [x] 5.3 更新 Dev Agent Record（Debug Log、Completion Notes、File List、Change Log）。

## Dev Notes

- 本 Story 紧接 `8-1-capacitor-android-init`，需保持已有 Capacitor 工程结构和命令体系，避免破坏已验证的 Android 调试流程。
- `applicationId` 一旦发布后不应变更，否则无法平滑覆盖安装；架构文档已明确包名应冻结。
- `versionCode` 必须单调递增；`versionName` 面向用户展示，可按语义化版本管理。
- release 签名不得将 keystore 或密码提交仓库，应通过 `keystore.properties`（本地文件）和环境隔离管理。
- keystore 丢失将导致后续升级链路中断，必须在文档中要求多副本离线备份与保管责任。
- 图标和 splash 需要体现 HuoTong 品牌身份，至少应替换默认模板视觉，防止安装后难以识别。

### Project Structure Notes

- Android 原生工程位于 `huotong-app/android/`。
- 包名、版本和签名配置主要落在 `huotong-app/android/app/build.gradle`。
- 应用名与 scheme 在 `huotong-app/android/app/src/main/res/values/strings.xml`。
- 图标与启动页资源在 `huotong-app/android/app/src/main/res/`。
- 脚本入口在 `huotong-app/package.json` 与 `huotong-app/scripts/`。
- 签名与版本策略文档放在仓库 `docs/` 下。

### References

- [Source: _bmad-output/planning-artifacts/epics.md] Epic 8 Story 8.2 用户故事与 AC。
- [Source: _bmad-output/planning-artifacts/architecture.md] Android 发布管理（applicationId、keystore、versionName/versionCode）与验收要求。
- [Source: _bmad-output/planning-artifacts/prd.md] FR44、FR48、FR49 与 Android 交付运维约束。
- [Source: _bmad-output/project-context.md] 当前技术栈、目录规范、构建与测试约定。
- [Source: _bmad-output/implementation-artifacts/8-1-capacitor-android-init.md] 前序 Story 的基线实现和经验。

## Dev Agent Record

### Agent Model Used

gpt-5.3-codex

### Debug Log References

- `npm run test:run`
- `npm run android:build`（当前机器默认 JDK 11，预检脚本按预期阻断）
- `npm run android:build`（继续开发复验：仍因 JDK 11 被 `ensure-android-java.mjs` 阻断）
- `npm run android:build:release`（继续开发复验：同样因 JDK 11 被预检提前阻断）
- `npm run android:sync`
- `node ./scripts/ensure-android-signing.mjs`（缺少 `android/keystore.properties` 时按预期阻断）
- `JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home npm run android:build`（构建成功，产出 `android/app/build/outputs/apk/debug/app-debug.apk`）
- `JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home npm run android:build:release`（签名构建成功，产出 `android/app/build/outputs/apk/release/app-release.apk`）

### Completion Notes List

- 已将 Android 首版身份信息固定为 `com.huotong.app`，并将 `versionName` 统一为 `1.0.0`，应用显示名更新为「货通」。
- 已替换 launcher 图标前景/背景资源，补齐 `splash.xml`，避免继续使用默认模板视觉。
- 已在 `build.gradle` 增加 release 签名配置读取逻辑，并在 CR 中修正 `storeFile` 的路径解析基准，避免预检通过但 Gradle 仍读取错误 keystore 路径。
- 已新增 `keystore.properties.example` 与 `ensure-android-signing.mjs`，并补充 `android:build:release` 脚本，发布前可自动校验签名配置完整性。
- 已新增 `docs/android-app-identity-signing.md`，明确 keystore 保管、版本递增与覆盖升级前置条件。
- 当前环境缺少 JDK 21 与正式 keystore，`npm run android:build` / `npm run android:build:release` 尚未完成最终出包验证；相关步骤需在补齐环境后继续执行。
- 本轮继续开发再次验证：`java -version` 仍为 11，且 `android/keystore.properties` 仍缺失，Task 5.1 / 5.2 维持未完成，Story 继续保持 `in-progress`。
- 本轮继续开发已使用 Homebrew JDK 21 完成 debug/release 构建实跑，Task 5.1 / 5.2 完成；release 已通过本地 keystore 签名。
- 复验过程中发现 `android/app/src/main/res/drawable/splash.png` 与 `splash.xml` 同名冲突导致资源合并失败，删除 `splash.png` 后构建恢复正常。

### File List

- _bmad-output/implementation-artifacts/8-2-android-app-identity-build-config.md（新增并完成 DS 回填）
- huotong-app/android/app/build.gradle（修改）
- huotong-app/android/app/src/main/res/values/strings.xml（修改）
- huotong-app/android/app/src/main/res/values/ic_launcher_background.xml（修改）
- huotong-app/android/app/src/main/res/drawable/ic_launcher_background.xml（修改）
- huotong-app/android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml（修改）
- huotong-app/android/app/src/main/res/drawable/splash.xml（新增）
- huotong-app/android/app/src/main/res/drawable/splash.png（删除）
- huotong-app/android/.gitignore（修改）
- huotong-app/android/keystore.properties.example（新增）
- huotong-app/scripts/ensure-android-java.mjs（修改）
- huotong-app/scripts/ensure-android-signing.mjs（新增）
- huotong-app/package.json（修改）
- huotong-app/.gitignore（修改）
- docs/android-app-identity-signing.md（新增）
- docs/android-capacitor-init.md（修改）

### Senior Developer Review (AI)

- Reviewer: Hezhangcan
- Date: 2026-03-12
- Outcome: Approved

#### Findings Summary

- High: 0
- Medium: 0
- Low: 0

#### Review Notes

- 已复核 AC #1 的身份信息、图标、启动页与资源绑定，当前实现与构建结果一致。
- 上一轮 CR 中发现的 release 签名路径问题已修复；在补齐 JDK 21 与正式 keystore 后，debug/release 构建均已成功完成。
- `splash.png` 与 `splash.xml` 的同名资源冲突已在复验过程中排除，当前 Story 满足收口条件。

## Change Log

- 2026-03-12：Create Story 初始化（ready-for-dev）。
- 2026-03-12：完成 DS 实现与自测，状态更新为 review。
- 2026-03-12：完成 CR，修复 release 签名路径解析问题，并将未完成的构建验证任务回退为待完成。
- 2026-03-12：继续开发复验构建流程；确认当前环境仍未满足 JDK 21 与签名配置前置条件，Task 5.1/5.2 继续保留未完成。
- 2026-03-12：切换至 Homebrew JDK 21 并补齐本地签名配置，完成 debug/release 构建实跑；修复 splash 资源重名冲突后将 Story 状态更新为 review。
- 2026-03-12：完成最终 CR 收口，确认构建验证已补齐并将 Story 状态更新为 done。
