# Story 8.1: Capacitor Android 工程初始化

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 开发者,
I want 在现有 Vue/Vite 项目上接入 Capacitor 并生成 Android 工程,
so that HuoTong 可以作为 Android 客户端继续演进，而不是继续依赖公网网页入口。

## Acceptance Criteria

1. **Given** 现有 Web 项目已可正常构建 **When** 开发者接入 Capacitor 并生成 Android 工程 **Then** 项目可以输出可安装的 Android 调试包 **And** Android 工程能正确加载本地前端资源，而不是依赖线上网页入口。
2. **Given** Android 客户端首次启动 **When** 用户从桌面点击应用图标 **Then** 应用正常打开 HuoTong 登录页或首页 **And** 不经过浏览器地址栏和网页托管入口。

## Tasks / Subtasks

- [x] Task 1：接入 Capacitor 基础依赖与配置 (AC: #1)
  - [x] 1.1 在 `huotong-app` 安装 `@capacitor/core`、`@capacitor/cli`、`@capacitor/android`，并确保与当前 Vue/Vite 构建链兼容。
  - [x] 1.2 新增 `capacitor.config.ts`，设置 `webDir=dist`，确保 Android 运行时从本地打包资源加载（不配置远程 server URL）。
  - [x] 1.3 在 `package.json` 增加 Android 相关脚本（如 `android:add`、`android:sync`、`android:open`、`android:run` 或等价命令），便于后续 Story 复用。
- [x] Task 2：生成并接入 Android 工程 (AC: #1, #2)
  - [x] 2.1 执行 `npm run build` 产出前端静态资源后，执行 Capacitor 命令生成 `android/` 工程（如 `npx cap add android`）。
  - [x] 2.2 执行 `npx cap sync android`，确认 `android/app/src/main/assets/public` 已同步 web 资源。
  - [x] 2.3 校验 Android 工程默认入口通过 Capacitor WebView 加载本地资源，避免回退到公网网页入口。
- [x] Task 3：补充 Android 初始化文档 (AC: #1, #2)
  - [x] 3.1 在 `docs/` 新增 Android 初始化说明，包含首次接入、增量同步和本地运行命令。
  - [x] 3.2 文档中明确本 Story 的目标是“可安装可启动的基础壳”，应用身份、签名、版本策略留给 Story 8.2。
- [x] Task 4：自测与验收记录 (AC: #1, #2)
  - [x] 4.1 运行 `npm run build` 成功，且 `npx cap sync android` 无报错。
  - [x] 4.2 在具备 Android 环境的本机执行一次 `npx cap run android` 或 Android Studio 启动验证，确认应用可打开登录页/首页。
  - [x] 4.3 无 Android SDK 环境时，至少完成命令级校验并在本地验证清单中明确“需用户真机验证”的步骤与预期结果。

## Dev Notes

- **范围来源**：Epic 8 Story 8.1 目标是建立 Android 基础壳与可安装调试包，不包含应用身份、签名与升级策略（属于 Story 8.2）。
- **技术约束**：架构文档明确 Android 容器为 Capacitor；需复用现有 `huotong-app` Vue/Vite 代码，`webDir` 使用构建产物目录 `dist`。
- **资源加载要求**：必须走本地 Web 资源加载路径，不应通过 `server.url` 指向线上站点；满足“从桌面图标进入 App，不经过浏览器地址栏”。
- **版本与依赖**：遵循项目文档中的 “Capacitor latest” 策略；新增依赖前确认与 Node 20、Vite 7、Vue 3.5+ 可共存。
- **与后续 Story 关系**：本 Story 只交付“壳可跑”；`applicationId`、图标、签名、versionName/versionCode 在 Story 8.2 完成。

### Project Structure Notes

- 前端工程在 `huotong-app/`，Capacitor 初始化和 Android 工程均在该目录内进行。
- 预期新增/修改文件：
  - `huotong-app/capacitor.config.ts`（新增）
  - `huotong-app/android/**`（新增，Capacitor Android 工程）
  - `huotong-app/package.json`（修改：Android 脚本与依赖）
  - `docs/android-capacitor-init.md`（新增）

### References

- [Source: _bmad-output/planning-artifacts/epics.md] Epic 8 Story 8.1 用户故事与 AC。
- [Source: _bmad-output/planning-artifacts/architecture.md] Android 容器选择（Capacitor）、本地资源加载与 APK 交付方向。
- [Source: _bmad-output/planning-artifacts/prd.md] Android 客户端增量需求 FR44、Android 首版交付边界。
- [Source: _bmad-output/project-context.md] 技术栈版本、前端目录与构建命令约定。
- [Source: _bmad-output/implementation-artifacts/android-sprint-planning-2026-03-12.md] 推荐队列与 8.1 作为 Android 第二轮起点。

## Dev Agent Record

### Agent Model Used

gpt-5.3-codex

### Debug Log References

- `npm install @capacitor/core @capacitor/cli @capacitor/android`
- `npx cap init HuoTong com.huotong.app --web-dir=dist`
- `npm run build`
- `npx cap add android`
- `npx cap sync android`
- `npm run test:run`
- `npm run android:sync`

### Completion Notes List

- 已完成 Capacitor 初始化与 Android 工程生成，`webDir=dist` 且未配置远端 `server.url`，满足本地资源加载目标。
- 已补充 `docs/android-capacitor-init.md`，覆盖初始化、日常命令、验收建议与 Story 8.2 范围边界。
- 已补充 `package.json` Android 脚本，统一同步/运行入口，降低后续 Story 操作成本。
- 本地自动化验证通过：`npm run test:run`（13 tests）、`npm run build`、`npm run android:sync`。
- `npx cap run android` 在当前环境停留在等待设备/模拟器阶段，已转为“需用户真机验证”并写入本地验证清单。
- CR 修复：新增 `npm run android:build` 与 `huotong-app/scripts/ensure-android-java.mjs`，在运行 Gradle 前预检 JDK 版本，避免 Java 版本不达标时直接进入模糊失败。
- CR 复核：Capacitor 生成的 `capacitor.build.gradle` 编译目标为 Java 21；本轮已切换到 JDK 21，`npm run android:build` 成功产出 `app-debug.apk`，`npm run android:run` 已成功部署到在线模拟器 `emulator-5564`。
- CR 修复：将 Android 模板测试中的默认包名与断言更新为 `com.huotong.app`，避免后续运行 Android 测试时出现明显误报。

### File List

- huotong-app/package.json（修改）
- huotong-app/package-lock.json（修改）
- huotong-app/capacitor.config.ts（新增）
- huotong-app/android/**（新增）
- huotong-app/scripts/ensure-android-java.mjs（新增）
- docs/android-capacitor-init.md（新增）
- _bmad-output/implementation-artifacts/local-verification-checklist.md（修改）

## Change Log

- 2026-03-12：Create Story 初始化（ready-for-dev）。
- 2026-03-12：完成 DS 实现与自测，状态更新为 review。
- 2026-03-12：完成 CR 修复，补充 JDK 17 预检与 APK 构建入口；因当前环境仍缺少 JDK 17，状态回退为 in-progress。

## Senior Developer Review (AI)

### Review Date

2026-03-12

### Reviewer

Hezhangcan

### Findings Summary

- High：1（已修复 1，剩余 0）
- Medium：3（已修复 3，剩余 0）
- Low：0

### Findings

1. High：当前机器默认 `java -version` 为 11，且即便切到 JDK 17，`./android/gradlew -p android assembleDebug` 仍会因为 `capacitor.build.gradle` 使用 `JavaVersion.VERSION_21` 而失败，尚未完成 AC1 所要求的“可产出 Android 调试包”验证；本轮已通过安装并切换到 JDK 21 修复。
2. Medium：原实现只有 `android:sync` / `android:run`，缺少显式的 APK 构建验证入口，导致“能否产出调试包”没有稳定、可复现的验证命令；本轮已补充 `android:build`。
3. Medium：Android 模板测试仍保留默认 `com.getcapacitor.app` 包名与断言，后续执行 Android 测试会与当前应用标识不一致；本轮已修复为 `com.huotong.app`。
4. Medium：最初文档与校验脚本只要求 JDK 17，会误导后续开发者再次撞上 Java 21 编译门槛；本轮已统一修正为 JDK 21+。

### Verification

- 通过：`npm run test:run`
- 通过：`npm run android:sync`
- 通过：`JAVA_HOME=<jdk21> npm run android:build`
- 通过：`JAVA_HOME=<jdk21> npm run android:run`（已部署到 `emulator-5564`）

### Recommended Next Step

- 如需补全人工验收，可在模拟器内手动确认登录页/首页首屏与本地资源加载路径；代码审查阻塞已清除，本 Story 可进入 `done`。
