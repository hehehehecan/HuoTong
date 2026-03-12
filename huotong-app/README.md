# 货通 HuoTong - 前端

Vue 3 + Vite + TypeScript + Vant + Pinia + Vue Router + Supabase。

## 第一步：Supabase 配置

1. 在 [Supabase](https://supabase.com) 创建项目（若尚未创建）。
2. 打开 **Project Settings → API**，复制 **Project URL** 和 **anon public** key。
3. 复制 `.env.example` 为 `.env`，将 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 替换为上述值。
4. 重启 dev 服务器（若已运行）：`npm run dev`。

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:5173/ 可查看首页及 Supabase 连接状态。

## 构建

```bash
npm run build
```

## 推荐部署到 CloudBase

当前项目推荐迁移到 `腾讯云 CloudBase 静态托管`，优先解决 `*.vercel.app` 在中国大陆移动网络下不可达或不稳定的问题。

1. 在 `huotong-app/` 下执行构建：`npm run build`
2. 上传 `dist/` 到 CloudBase 静态托管
3. 在托管平台中确认：
   - 默认首页：`index.html`
   - SPA 回退：`404.html` 或直接回退到 `index.html`
4. 在 CloudBase 中配置环境变量：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_REALTIME_ENABLED=false`
   - `VITE_RECEIPT_RECOGNITION_ENABLED=false`
5. 先用平台默认域名完成桌面端与手机流量验证，稳定后再考虑自定义域名。

## 兼容旧的 Vercel 部署

如果仍需临时保留 Vercel，可继续在 [Vercel](https://vercel.com) 中使用：

1. 导入该仓库，**Root Directory** 设置为 `huotong-app`
2. 在项目 **Settings → Environment Variables** 中配置：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_REALTIME_ENABLED=false`
   - `VITE_RECEIPT_RECOGNITION_ENABLED=false`
3. 推送代码后触发自动重新构建

## 国内网络访问建议

如果目标用户主要在中国大陆，尤其需要兼容手机流量访问，`*.vercel.app` 可能会出现不可达或不稳定的问题。建议参考：

- `docs/domestic-deployment.md`

该文档包含：

- 当前项目对 Supabase 能力的使用面审计
- 开发阶段的 schema-only 迁移方式
- 国内友好静态托管建议
- `Realtime` / `拍照识别` 的兼容开关说明
- 手机流量回归验证请参考 `docs/mobile-network-verification.md`
