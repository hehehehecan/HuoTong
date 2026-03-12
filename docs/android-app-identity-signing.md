# Android 应用身份与签名策略（Story 8.2）

本文档定义 HuoTong Android 版本的应用身份、版本号和签名策略，确保后续 APK 可以持续覆盖升级。

## 1. 应用身份冻结项

- 应用显示名：`货通`
- 包名（applicationId）：`com.huotong.app`
- Android namespace：`com.huotong.app`
- URL Scheme：`com.huotong.app`

> 以上字段一旦发布给家人使用，不应随意修改。若修改包名，旧版本将无法被新版本覆盖安装。

## 2. 图标与启动页

- Launcher icon 资源：
  - `huotong-app/android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml`
  - `huotong-app/android/app/src/main/res/values/ic_launcher_background.xml`
- 启动页资源：
  - `huotong-app/android/app/src/main/res/drawable/splash.xml`
  - `huotong-app/android/app/src/main/res/values/styles.xml`

若后续替换为设计稿图标，保持资源命名不变（`ic_launcher*`）可降低改动面。

## 3. 版本号策略

- `versionName`：面向用户展示，使用语义化版本（例如 `1.0.0`、`1.0.1`）。
- `versionCode`：仅用于 Android 升级判定，必须严格递增（1, 2, 3...）。

推荐流程：

1. 发版前先确定 `versionName`。
2. 在 `build.gradle` 中将 `versionCode` 增加 1。
3. 再执行 release 构建，避免重复出包造成编号混乱。

## 4. keystore 配置（本地）

1. 在 `huotong-app/android` 下复制模板：

```bash
cp keystore.properties.example keystore.properties
```

2. 修改 `keystore.properties`：

```properties
storeFile=../keystore/huotong-release.jks
storePassword=***
keyAlias=huotong-release
keyPassword=***
```

3. 确保 `storeFile` 指向真实存在的 keystore 文件。

> `keystore.properties`、`*.jks`、`*.keystore` 已被 git 忽略，禁止提交到仓库。

## 5. 生成签名 keystore（首次）

在 `huotong-app/` 执行：

```bash
keytool -genkeypair \
  -v \
  -keystore ./keystore/huotong-release.jks \
  -alias huotong-release \
  -keyalg RSA \
  -keysize 2048 \
  -validity 3650
```

## 6. 构建命令

- 调试包（debug）：

```bash
npm run android:build
```

- 发布包（release，要求 keystore 配置完整）：

```bash
npm run android:build:release
```

发布命令会先检查：

- JDK 是否为 21+
- `android/keystore.properties` 是否存在
- `storeFile` / `storePassword` / `keyAlias` / `keyPassword` 是否齐全
- keystore 文件路径是否有效

## 7. keystore 保管要求

- 至少保留 2 份离线备份（例如加密 U 盘 + 本地密码库）。
- 记录保管责任人和恢复流程，避免单点丢失。
- 不通过聊天工具明文发送 keystore 或密码。
- 若怀疑泄露，应尽快停止分发并评估是否需要更换签名（会影响旧版本升级链路）。

## 8. 覆盖升级检查清单

发布前最少确认以下 4 项：

1. `applicationId` 与线上已安装版本一致（`com.huotong.app`）。
2. 使用同一 keystore 和 alias 签名。
3. `versionCode` 大于已安装版本。
4. 真机执行一次覆盖安装并验证可正常启动、登录和进入首页。

## 9. 覆盖升级实操验证（Story 11.1）

每次发布候选包都按以下步骤执行一次：

1. 在真机安装“旧版本”APK（例如 `versionCode=1`）。
2. 登录并进入首页，记录一个可见业务数据点（如商品列表第一条名称）。
3. 不卸载应用，直接安装“新版本”APK（`applicationId` 不变、同 keystore、`versionCode` 递增）。
4. 打开 App 的“更多”页，确认可见“当前版本”且与本次发版版本一致。
5. 验证登录态仍有效（无需重新登录即可访问首页或业务页）。
6. 验证步骤 2 的业务数据点仍可访问，确保未出现异常丢失。

若第 3 步安装失败，优先检查：

- 是否误用了不同签名证书；
- 是否改动了 `applicationId`；
- 是否忘记递增 `versionCode`。

## 10. 固定分发入口与更新说明（Story 11.2）

- App 内固定更新入口：`更多` 页的 `下载更新包` 与 `更新说明`。
- 下载入口和推荐版本由前端环境变量维护：
  - `VITE_ANDROID_APK_LATEST_VERSION`
  - `VITE_ANDROID_APK_DOWNLOAD_URL`
- 每次发版后需同步更新上述配置，并确保“更新说明”文案与本次版本一致。

详细流程见：`docs/android-apk-distribution.md`。
