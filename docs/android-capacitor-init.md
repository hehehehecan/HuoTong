# Android Capacitor 初始化说明（Story 8.1）

本文档记录 HuoTong 在现有 `huotong-app`（Vue + Vite）上接入 Capacitor 并初始化 Android 工程的最小步骤。

## 目标

- 生成可运行的 Android 工程（`huotong-app/android`）
- Android 端通过 Capacitor WebView 加载本地前端资源（`dist`），不依赖线上网页入口
- 为后续 Story 8.2（应用身份、签名、版本）提供基础壳

## 环境前置条件

- Node.js 20+
- Android Studio（用于打开工程、设备管理和后续调试）
- JDK 21 或更高版本

如果本机默认 `java -version` 低于 21，`npm run android:build` / `npm run android:run` 会直接提示失败；先切换 `JAVA_HOME` 到 JDK 21+ 再继续。

## 一次性初始化（已完成）

在 `huotong-app/` 下执行：

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init HuoTong com.huotong.app --web-dir=dist
npm run build
npx cap add android
npx cap sync android
```

初始化后关键文件：

- `huotong-app/capacitor.config.ts`
- `huotong-app/android/`

## 日常开发命令

在 `huotong-app/` 下执行：

```bash
npm run android:sync
npm run android:build
npm run android:open
npm run android:run
```

脚本说明：

- `android:sync`：重新构建前端并同步到 Android 资源目录
- `android:build`：执行 Java 版本预检后产出 Android 调试包（`assembleDebug`）
- `android:open`：使用 Android Studio 打开原生工程
- `android:run`：同步后直接尝试运行到设备/模拟器

## 本地资源加载校验

- `capacitor.config.ts` 中 `webDir` 必须为 `dist`
- 不配置 `server.url`，确保不回退到远程 H5 入口
- 执行 `npx cap sync android` 后，应看到 `android/app/src/main/assets/public` 下有最新前端资源

## 验收建议

1. 先执行 `java -version`，确认当前 JDK 为 21 或更高版本。
2. 运行 `npm run android:sync`，确认前端资源同步成功。
3. 运行 `npm run android:build`，确认可产出 Android 调试包。
4. 使用 `npm run android:open` 打开 Android Studio，等待 Gradle 同步完成。
5. 连接真机或启动模拟器后运行应用，确认从桌面图标打开后直接进入 HuoTong 登录页/首页。

## 非本 Story 范围

以下内容由 Story 8.2 处理：

- 应用名/图标/启动图细化
- 正式包名与 `applicationId` 冻结
- `versionName` / `versionCode`
- keystore 签名与覆盖升级策略
