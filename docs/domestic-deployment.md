# 国内可访问性迁移说明

本文档面向当前项目的开发阶段迁移场景：现有 Supabase 中**没有需要保留的有效业务数据**，因此采用“重建新环境 + 结构迁移 + 前端切换”的方式，而不是做复杂的数据导入导出。

## 当前后端能力审计

当前项目实际使用的 Supabase 能力：

- Auth
- PostgREST（表 CRUD / 关联查询）
- RPC：`confirm_sale_order`、`confirm_purchase_order`、`adjust_stock`
- Realtime：`products`、`sale_orders`、`purchase_orders`、`receivables`、`payables`
- Edge Function：`recognize-receipt`

当前项目**未使用 Storage**。

项目中的 Supabase 客户端入口集中在：

- `huotong-app/src/lib/supabase.ts`
- `huotong-app/src/lib/realtime.ts`

业务侧直接依赖 Supabase 的模块主要是：

- `huotong-app/src/stores/user.ts`
- `huotong-app/src/composables/useProducts.ts`
- `huotong-app/src/composables/useCustomers.ts`
- `huotong-app/src/composables/useSuppliers.ts`
- `huotong-app/src/composables/useSaleOrders.ts`
- `huotong-app/src/composables/usePurchaseOrders.ts`
- `huotong-app/src/composables/useReceivables.ts`
- `huotong-app/src/composables/usePayables.ts`
- `huotong-app/src/composables/useInventory.ts`
- `huotong-app/src/composables/useExportData.ts`

## 推荐落地方案

开发阶段优先推荐：

1. 后端迁移到阿里云 Supabase
2. 前端迁移到国内友好的静态托管
3. 暂不迁历史数据，只迁 `schema / function / edge function / env`

之所以这样做，是因为当前项目已把 Supabase 初始化集中在单一入口，迁移后的业务代码改动可以控制在较小范围内。

## 一、迁移阿里云 Supabase

### 1. 创建新项目

在阿里云 Supabase 新建项目后，先记录：

- Project URL
- anon key
- service role key（仅后台/脚本使用，不写入前端）

### 2. 导出现有数据库结构

在仓库根目录执行：

```bash
chmod +x scripts/export-schema-only.sh
./scripts/export-schema-only.sh
```

如果本地已配置数据库连接或已执行 `supabase link`，会得到：

- `_backups/schema_YYYYMMDD_HHmm.sql`

由于当前后端无有效业务数据，**只需要导入 schema，不需要导入表数据**。

### 3. 在新环境执行结构初始化

将 schema-only SQL 导入阿里云 Supabase 后，确认以下对象存在：

- 表：`products`、`customers`、`suppliers`
- 表：`sale_orders`、`sale_order_items`
- 表：`purchase_orders`、`purchase_order_items`
- 表：`receivables`、`payables`
- 表：`stock_logs`
- 函数：`confirm_sale_order`
- 函数：`confirm_purchase_order`
- 函数：`adjust_stock`
- RLS 策略
- Realtime 对应表配置

### 4. 补齐 Edge Function

当前项目依赖 1 个 Edge Function：

- `recognize-receipt`

该函数需要配置：

- `OPENAI_API_KEY`

如果新环境暂时不准备启用拍照识别，可在前端环境变量中设置：

```bash
VITE_RECEIPT_RECOGNITION_ENABLED=false
```

这样页面仍可正常使用，只是拍照识别会返回空结果，不会影响核心业务流程。

### 5. Realtime 兼容开关

如果新环境初期还没开通或验证好 Realtime，可先设置：

```bash
VITE_REALTIME_ENABLED=false
```

项目已兼容该场景：关闭后只是不自动刷新，不会阻止页面正常读写数据。

## 二、切换前端环境变量

复制 `huotong-app/.env.example` 为 `.env` 或 `.env.local`，填入新环境：

```bash
VITE_SUPABASE_URL=https://your-new-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-new-anon-key
VITE_REALTIME_ENABLED=true
VITE_RECEIPT_RECOGNITION_ENABLED=true
```

如果新后端尚未完成对应能力配置，可临时关闭相关开关。

## 三、迁移前端托管

当前问题的核心不是代码逻辑，而是 `vercel.app` 在中国移动网络下不可达或不稳定。因此建议前端迁移到**国内友好的静态托管**。

开发阶段优先推荐：

- 腾讯云 CloudBase 静态托管

推荐原因：

- 不依赖自定义域名也能先验证
- 对 Vue / Vite 静态产物友好
- 可通过静态托管设置中的 404 重定向处理 SPA history 路由

### 1. 本地构建

在 `huotong-app/` 下执行：

```bash
npm install
npm run build
```

构建后会自动生成：

- `dist/index.html`
- `dist/404.html`

其中 `404.html` 已由构建流程自动复制，便于静态托管平台把未知路由 fallback 到 SPA。

### 2. CloudBase 托管建议

上传目录：

- `huotong-app/dist`

托管侧需要确认：

- 索引文档：`index.html`
- 错误页面 / 404 重定向：`404.html` 或直接回退到 `index.html`

本次迁移已上传的 CloudBase 默认域名：

- `https://huotong-0g6yu5yy0fa75e05-1259204178.tcloudbaseapp.com`

已验证结论：

- `dist/` 已成功部署到 CloudBase 静态托管
- `/`、`/login`、`/sale-orders/new` 直接请求都能返回 SPA 入口 HTML
- 默认域名在浏览器侧会先出现腾讯云“风险提醒”页面，开发测试可手动点“确定访问”继续
- 若后续希望去掉该提醒并提升访问稳定性，建议绑定自定义域名再做最终验收

如果后续改用其他国内静态托管，只要支持：

- HTTPS
- 自定义环境变量（构建阶段或平台变量）
- SPA 路由 fallback

同样可以沿用本项目的构建产物。

## 四、回归验证

迁移完成后，建议至少验证：

1. 手机流量能打开首页 / 登录页
2. 登录成功
3. 商品列表能读取
4. 客户 / 供应商 CRUD 正常
5. 出货单 / 进货单创建与确认正常
6. 应收 / 应付页面能加载
7. 库存调整和库存流水正常

如果 `拍照识别` 或 `Realtime` 尚未启用，应在关闭对应环境开关的前提下再验证主流程，避免因为可选能力未完成而误判整站不可用。

## 五、开发阶段的最简迁移顺序

如果目标只是尽快摆脱 `vercel.app` 的公网可达问题，建议按这个顺序做：

1. 在阿里云 Supabase 新建空项目
2. 导入 schema-only SQL
3. 暂时关闭 `VITE_REALTIME_ENABLED` 与 `VITE_RECEIPT_RECOGNITION_ENABLED`
4. 用新 URL / key 跑通本地
5. 把前端部署到 CloudBase 静态托管
6. 用手机流量验证可访问
7. 再逐步开启 Realtime 与拍照识别

这样风险最低，排障也最容易。
