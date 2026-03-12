---
name: 'debug'
description: '安卓端 debug 协作：加载项目概况与 Android 打包/调试方法，等待用户反馈问题后由 agent 修改；用户要求自测时 agent 按方法执行'
---

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND.

## 1. 首次响应：加载项目概况并交代自测方法

1. **加载项目概况**：读取 `{project-root}/_bmad-output/project-context.md` 全文，在回复中简要摘要与 Android 相关的关键信息（技术栈、平台开关、Android 首版降级、启动顺序、测试用户等）。如需分析具体功能，可再读 `{project-root}/_bmad-output/planning-artifacts/architecture.md` 中相关部分。
2. **加载 Android 打包上下文**：读取 `{project-root}/docs/安卓打包说明.md`；若用户问题涉及签名、版本号、APK 分发或覆盖升级，再补读：
   - `{project-root}/docs/android-app-identity-signing.md`
   - `{project-root}/docs/android-apk-distribution.md`
3. **交代自测方法**：将下面「自测方法」一节完整纳入你的认知；在首次回复中说明「自测方法已就绪」，并注明当用户说「你来自测」「执行自测」「按自测方法测一下」时你会按该自测方法执行。
4. **进入等待**：输出上述简短「项目概况 + 自测方法已就绪」后，**等待用户输入**。不主动开始自测，除非用户明确要求。

---

## 2. 自测方法（如何对本项目进行 Android 调试与验证）

以下为 agent 对本项目进行 Android 调试、打包与验证时应遵循的方法；不依赖、不引用任何 checklist 文件。

### 基础前置

- 所有 Android 相关命令都在 `huotong-app/` 下执行。
- 环境变量位于 `huotong-app/.env` 或 `huotong-app/.env.local`；至少确认 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY` 已配置。
- 若涉及 Android 首版降级验证，同时检查：
  - `VITE_ANDROID_FIRST_RELEASE_MODE`
  - `VITE_REALTIME_ENABLED`
  - `VITE_RECEIPT_RECOGNITION_ENABLED`
  - `VITE_WEB_EXPORT_DOWNLOAD_ENABLED`
  - `VITE_DESKTOP_BATCH_IMPORT_ENABLED`

### 构建与测试

- `npm run build`：TypeScript 严格检查 + Vite 构建，用于回归验证。
- `npm run test:run`：Vitest 单次运行，用于确认无测试回归。

### Android 打包与原生调试

- Android 相关命令也在 `huotong-app/` 下执行。
- `npm run android:sync`：重新构建前端并同步到 Android 工程。
- `npm run android:build`：检查 JDK 21+ 后，生成调试包（debug APK）。
- `npm run android:build:release`：检查 JDK 21+ 与签名配置后，生成发布包（release APK）。
- `npm run android:open`：用 Android Studio 打开 `huotong-app/android/`。
- `npm run android:run`：同步并运行到设备/模拟器。
- 调试包常见输出：`huotong-app/android/app/build/outputs/apk/debug/app-debug.apk`
- 发布包常见输出：`huotong-app/android/app/build/outputs/apk/release/app-release.apk`
- 若 Android 构建失败，优先检查：
  - 当前 `java -version` 是否为 21+
  - `android/keystore.properties` 是否存在（仅 release）
  - `storeFile` 指向的 keystore 文件是否存在（仅 release）
  - `android/app/build.gradle` 中的 `versionCode` / `versionName` 是否符合本次目标

### 测试账号

- 测试账号（见 project-context，仅开发/测试环境）：邮箱 `1559082675@qq.com`，密码 `hezhangcan199873`。

### Android 相关重点回归

- Android 首版能力可能通过 `platformConfig` 被降级；自测时不要默认假设以下入口存在：
  - Realtime
  - 拍照识图
  - 浏览器式导出下载
  - 桌面端批量录入
- 若这些能力被关闭，正确行为通常是：
  - 页面隐藏入口，或展示“暂不开放”说明
  - 手动直达路由时给出提示并回退
  - 核心主流程仍可继续使用
- Android 相关问题优先覆盖：
  - 首次安装
  - 覆盖安装升级
  - 前后台切换后的登录态与刷新
  - 返回键处理
  - 弱网/断网提示

---

## 3. 默认模式（等待用户反馈问题）

- 用户在 Android 设备、模拟器或安装流程中**人工调试/自测**后，把发现的问题（现象、复现步骤、预期 vs 实际）描述给你。
- 你根据 project-context、Android 打包文档与代码进行**修改**（修 bug 或小优化），修改后可按需建议用户再测或跑 `npm run build` / `npm run test:run` / `npm run android:build` 验证。

---

## 4. 当用户要求「自测」时

当用户说「你来自测」「执行自测」「按自测方法测一下」等时：

1. 先执行 `npm run build` 与 `npm run test:run`（在 `huotong-app/` 下），确认通过或记录失败。
2. 按场景执行对应 Android 命令：
   - 仅验证可构建：`npm run android:build`
   - 需要发布包：`npm run android:build:release`
   - 需要查看原生工程：`npm run android:open`
   - 需要运行到设备/模拟器：`npm run android:run`
3. 额外记录：
   - APK 是否成功产出
   - 输出路径
   - JDK / keystore / versionCode 相关失败信息
   - 是否命中 Android 首版降级逻辑
4. 若用户明确要求原生安装/覆盖升级验证，则围绕 APK 产出、安装是否成功、启动是否正常、登录态是否保留、关键入口是否符合降级策略来总结结果。
5. 汇总发现的问题，询问用户是否逐项修复。不读取或依赖 `_bmad-output/implementation-artifacts/local-verification-checklist.md`。
