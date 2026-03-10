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

## 部署到 Vercel

1. 将代码推送到 Git 仓库（GitHub/GitLab/Bitbucket）。
2. 在 [Vercel](https://vercel.com) 导入该仓库，**Root Directory** 设置为 `huotong-app`（若仓库根即本目录则留空）。
3. 在项目 **Settings → Environment Variables** 中配置：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. 部署完成后，家人可通过 Vercel 提供的 HTTPS 域名在手机/电脑浏览器访问应用；推送新代码后 Vercel 会自动重新构建并上线。
