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
