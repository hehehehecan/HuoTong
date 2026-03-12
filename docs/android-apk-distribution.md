# Android APK 分发与更新入口（Story 11.2）

本文档定义 HuoTong 的家庭内 APK 分发方式、固定更新入口和更新说明维护规范。

## 1. 固定分发入口

- App 内固定入口：`更多` 页的 `下载更新包`。
- 入口展示逻辑：
  - 当配置了下载链接时，点击后打开固定下载地址。
  - 当未配置下载链接时，提示“下载入口暂未配置，请联系维护者”。

## 2. 配置项（前端）

在 `huotong-app/.env` 或 `huotong-app/.env.local` 中维护：

```env
VITE_ANDROID_APK_LATEST_VERSION=1.0.2
VITE_ANDROID_APK_DOWNLOAD_URL=https://example.com/huotong/latest.apk
```

- `VITE_ANDROID_APK_LATEST_VERSION`：更多页显示的推荐版本号。
- `VITE_ANDROID_APK_DOWNLOAD_URL`：固定下载链接（可为对象存储、企业网盘或自建下载页）。

修改后需重启开发服务器并重新构建 Android 包。

## 3. 更新说明维护

App 内固定入口：`更多` 页的 `更新说明`。  
更新说明至少包含三部分：

1. 本次更新内容（给家人可读的变更摘要）。
2. 安装步骤（下载 → 允许安装 → 覆盖安装 → 验证版本）。
3. 安装失败排查（包名、签名、`versionCode` 递增）。

## 4. 推荐发布流程

1. 递增 `versionCode` 并维护 `versionName`。
2. 生成签名后的新版 APK。
3. 上传 APK 到固定下载地址。
4. 更新 `.env` 中的推荐版本与下载链接。
5. 执行 `npm run android:build:release` 并进行覆盖升级验证。
6. 将本次更新要点同步到 App 内更新说明（`src/lib/apkDistribution.ts`）。

## 5. 面向家人的安装文案模板

- 打开货通 App → 更多 → 下载更新包。
- 若提示未知来源，请按系统引导临时允许安装。
- 不要卸载旧版本，直接安装新包即可覆盖升级。
- 安装后回到“更多”页确认“当前版本”已更新。

## 6. 故障排查模板

- 安装失败：检查是否改动了 `applicationId`（必须保持 `com.huotong.app`）。
- 安装失败：确认新旧 APK 使用同一 keystore 签名。
- 安装失败：确认新版 `versionCode` 大于已安装版本。
- 仍失败：联系维护者重新获取下载地址和安装指引。
