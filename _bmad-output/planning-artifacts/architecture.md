---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - 'product-brief-MyApp-2026-03-09.md'
  - 'prd.md'
workflowType: 'architecture'
project_name: 'HuoTong（货通）'
user_name: 'Hezhangcan'
date: '2026-03-09'
workflow_completed: true
---

# Architecture Decision Document

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
当前以已落地的 43 条业务需求作为 Web 基线，并在此基础上新增 Android 客户端增量需求（安装、会话恢复、返回键、网络提示、升级分发与首版降级策略）。核心架构特征仍然是以"单据"为数据纽带，出货/进货操作需要触发跨模块的级联更新（库存增减 + 账款生成）。智能识图链路保留，但不要求在 Android 首版默认启用。

**Non-Functional Requirements:**
- 性能：页面加载 < 2s，搜索响应 < 500ms
- 安全：HTTPS + 简单认证
- 可用性：大字体、大按钮、3步内完成操作
- 可靠性：数据不丢失、可备份恢复
- 交付：支持 APK 安装、覆盖升级、家庭内部分发与真机回归

**Scale & Complexity:**
- 复杂度：低
- 用户规模：4 人（固定，不会增长）
- 数据量：小型（数百商品、数十客户/供应商、每日数笔单据）
- 并发：极低（最多 4 人同时在线）

### Technical Constraints & Dependencies

- 单人开发者，业余时间开发
- 用户数字化水平：微信级别
- 首轮 Web 基线已完成，本轮主交付形态改为 Android 客户端
- 无预算限制但倾向免费/低成本方案
- 需要网络连接（MVP 不要求离线）
- 需要支持家庭内部 APK 分发与覆盖安装升级

### Cross-Cutting Concerns

- **数据一致性**：单据操作的级联更新（出货→库存减+应收增）需要事务保证
- **多端同步**：4人可能同时操作，需要实时数据同步
- **数据备份**：商业数据不能丢失

---

## Starter Template & Technology Stack

### 选定方案：Vue 3 + Vite + Supabase + Capacitor(Android)

**初始化命令：**

```bash
npm create vite@latest huotong -- --template vue-ts
```

### 完整技术栈

| 层面 | 技术选择 | 版本 | 选择理由 |
|------|---------|------|---------|
| **前端框架** | Vue 3 | 3.4+ | 中文社区最大、学习曲线平缓、单人开发效率高 |
| **构建工具** | Vite | 7 (stable) | 极快的开发体验、Vue 官方推荐 |
| **语言** | TypeScript | 5.x | 类型安全减少 bug，IDE 支持更好 |
| **UI 组件库** | Vant 4 | 4.9+ | 专为移动端设计的 Vue 3 组件库，70+ 组件 |
| **后端/数据库** | Supabase (PostgreSQL) | - | 免运维、自带认证/实时同步/API，免费额度完全够用 |
| **状态管理** | Pinia | 2.x | Vue 3 官方推荐，轻量直觉 |
| **路由** | Vue Router | 4.x | Vue 3 官方路由 |
| **Android 容器** | Capacitor | latest | 最大化复用现有 Vue/Vite 代码，优先快速交付 Android 客户端 |
| **分发** | APK 手工分发 | - | 适合家庭内测和非应用商店首发 |
| **CSS 方案** | Vant 主题变量 + CSS Variables | - | 使用 Vant 内置主题系统定制样式 |
| **智能识图** | GPT-4o Vision API | - | 通过 Supabase Edge Functions 调用，识别纸质单据 |

---

## Core Architectural Decisions

### Data Architecture

**数据库：Supabase (PostgreSQL)**

选择 Supabase 作为 BaaS 后端，理由：
- 免费额度完全满足需求（500MB 数据库、50,000 MAU、无限 API 请求）
- 自带 RESTful API，无需手写后端
- 内置 Row Level Security（行级安全）
- 内置实时订阅（Realtime），解决多人同步问题
- PostgreSQL 支持事务，保证单据操作的数据一致性

**数据模型：**

```
products (商品表)
├── id: uuid (PK)
├── name: text (商品名称)
├── spec: text (规格)
├── sell_price: decimal (售价)
├── buy_price: decimal (进价)
├── stock: integer (当前库存)
├── created_at: timestamptz
└── updated_at: timestamptz

customers (客户表)
├── id: uuid (PK)
├── name: text (客户名称)
├── phone: text (电话)
├── address: text (地址)
├── created_at: timestamptz
└── updated_at: timestamptz

suppliers (供应商表)
├── id: uuid (PK)
├── name: text (名称)
├── contact: text (联系人)
├── phone: text (电话)
├── category: text (主营品类)
├── created_at: timestamptz
└── updated_at: timestamptz

sale_orders (出货单表)
├── id: uuid (PK)
├── order_no: text (单号，自动生成)
├── customer_id: uuid (FK → customers)
├── total_amount: decimal (总金额)
├── status: text (draft/confirmed)
├── note: text (备注)
├── created_at: timestamptz
└── updated_at: timestamptz

sale_order_items (出货单明细)
├── id: uuid (PK)
├── order_id: uuid (FK → sale_orders)
├── product_id: uuid (FK → products)
├── quantity: integer (数量)
├── unit_price: decimal (单价)
└── subtotal: decimal (小计)

purchase_orders (进货单表)
├── id: uuid (PK)
├── order_no: text (单号，自动生成)
├── supplier_id: uuid (FK → suppliers)
├── total_amount: decimal (总金额)
├── status: text (draft/confirmed)
├── note: text (备注)
├── created_at: timestamptz
└── updated_at: timestamptz

purchase_order_items (进货单明细)
├── id: uuid (PK)
├── order_id: uuid (FK → purchase_orders)
├── product_id: uuid (FK → products)
├── quantity: integer (数量)
├── unit_price: decimal (单价)
└── subtotal: decimal (小计)

receivables (应收账款)
├── id: uuid (PK)
├── sale_order_id: uuid (FK → sale_orders)
├── customer_id: uuid (FK → customers)
├── amount: decimal (金额)
├── paid_amount: decimal (已付金额)
├── status: text (unpaid/partial/paid)
├── created_at: timestamptz
└── updated_at: timestamptz

payables (应付账款)
├── id: uuid (PK)
├── purchase_order_id: uuid (FK → purchase_orders)
├── supplier_id: uuid (FK → suppliers)
├── amount: decimal (金额)
├── paid_amount: decimal (已付金额)
├── status: text (unpaid/partial/paid)
├── created_at: timestamptz
└── updated_at: timestamptz

stock_logs (库存变动记录)
├── id: uuid (PK)
├── product_id: uuid (FK → products)
├── change: integer (变动数量，正为入库负为出库)
├── reason: text (sale_order/purchase_order/manual)
├── reference_id: uuid (关联单据ID)
├── created_at: timestamptz
└── balance: integer (变动后余额)
```

**级联操作策略：**
使用 Supabase Database Functions (PostgreSQL Functions + Triggers) 实现：
- 出货单确认 → 自动扣减库存 + 自动生成应收记录 + 记录库存变动
- 进货单确认 → 自动增加库存 + 自动生成应付记录 + 记录库存变动
- 这些操作在数据库事务中执行，保证一致性

### Authentication & Security

**认证方案：Supabase Auth — 邀请码/密码登录**

- 使用 Supabase 内置的 Email + Password 认证
- 由开发者创建 4 个账号，分发给家人
- 不需要注册功能、不需要社交登录
- Row Level Security (RLS) 确保数据隔离（虽然本项目所有人共享数据，但 RLS 防止未授权访问）

**安全措施：**
- HTTPS（Android 客户端与 Supabase 通信）
- Supabase API Key 不暴露在客户端（使用 anon key + RLS）
- 数据库不直接暴露公网

### API & Communication

**API 方案：Supabase Client SDK (直连)**

- 使用 `@supabase/supabase-js` 直接与 Supabase 交互
- 无需自建 REST API 层
- Supabase 自动生成 RESTful API 和 GraphQL API
- 实时同步使用 Supabase Realtime（基于 PostgreSQL 的 Change Data Capture）

**实时同步策略：**
- 订阅关键表的变更（products, sale_orders, purchase_orders, receivables, payables）
- 当一个用户修改数据，其他在线用户自动获得最新数据
- 使用 Supabase Realtime 的 Postgres Changes 功能

### 智能识图架构

**方案：Supabase Edge Functions + 大模型 Vision API（GPT-4o）**

**技术选型理由：**
- 大模型 Vision 不仅能 OCR 识别文字，还能理解单据结构，直接返回结构化 JSON
- 手写体容错性好，无需额外开发解析器
- Supabase Edge Functions 作为中转层，避免 API Key 暴露在前端
- 每张图识别成本约 ¥0.07，月均 300 张约 ¥21

**识别流程：**

```
用户手机拍照/选取图片
        │
        ▼
   前端压缩图片（< 1MB）
        │
        ▼
   上传到 Supabase Edge Function
        │
        ▼
   Edge Function 调用 GPT-4o Vision API
   （提示词要求返回结构化 JSON）
        │
        ▼
   返回结构化数据：
   {
     customer_name: "张大哥",
     items: [
       { name: "锅铲", quantity: 10, unit_price: 15.00 },
       { name: "炒锅", quantity: 2, unit_price: 89.00 }
     ],
     total: 328.00
   }
        │
        ▼
   前端自动填充单据表单
   （匹配系统中已有的客户和商品）
        │
        ▼
   用户检查确认后提交
```

**Supabase Edge Function 示例：**

```typescript
// supabase/functions/recognize-receipt/index.ts
import { serve } from 'https://deno.land/std/http/server.ts'

serve(async (req) => {
  const { image_base64 } = await req.json()

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: '请识别这张单据图片，提取以下信息并返回 JSON 格式：customer_name（客户名）、supplier_name（供应商名，如果是进货单）、items 数组（每项包含 name 商品名、quantity 数量、unit_price 单价）、total 总金额。如果某个字段无法识别，设为 null。'
          },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image_base64}` } }
        ]
      }],
      response_format: { type: 'json_object' }
    })
  })

  const result = await response.json()
  return new Response(JSON.stringify(result.choices[0].message.content))
})
```

**前端匹配策略：**
- 识别出的客户名 → 在 customers 表中模糊匹配
- 识别出的商品名 → 在 products 表中模糊匹配
- 匹配成功的自动关联，匹配失败的标记为"需手动选择"
- 所有字段均可编辑修改，用户确认后再提交

**环境变量：**

| 变量 | 存储位置 | 用途 |
|------|---------|------|
| `OPENAI_API_KEY` | Supabase Edge Function Secrets | GPT-4o Vision API 密钥 |

### Frontend Architecture

**项目结构：**

```
src/
├── assets/          # 静态资源
├── components/      # 通用组件
│   ├── AppHeader.vue
│   ├── SearchBar.vue
│   └── EmptyState.vue
├── composables/     # 组合式函数
│   ├── useProducts.ts
│   ├── useCustomers.ts
│   ├── useSuppliers.ts
│   ├── useSaleOrders.ts
│   ├── usePurchaseOrders.ts
│   ├── useReceivables.ts
│   ├── usePayables.ts
│   └── useStock.ts
├── layouts/         # 布局组件
│   └── MainLayout.vue
├── lib/             # 工具库
│   └── supabase.ts  # Supabase 客户端初始化
├── pages/           # 页面组件（按功能模块组织）
│   ├── home/
│   ├── products/
│   ├── customers/
│   ├── suppliers/
│   ├── sale-orders/
│   ├── purchase-orders/
│   ├── receivables/
│   ├── payables/
│   └── stock/
├── router/          # 路由配置
│   └── index.ts
├── stores/          # Pinia 状态管理
│   └── user.ts
├── styles/          # 全局样式
│   └── variables.css
├── App.vue
└── main.ts
```

**状态管理策略：**
- Pinia 仅管理全局状态（用户认证状态）
- 业务数据通过 Composables 直接从 Supabase 获取，不做全局缓存
- 利用 Supabase Realtime 订阅保持数据新鲜，但 Android 首版允许默认关闭

**路由结构：**

| 路径 | 页面 | 功能 |
|------|------|------|
| `/` | 首页 | 快捷入口（新建出货单、新建进货单、查应收） |
| `/products` | 商品列表 | 搜索、浏览商品 |
| `/products/new` | 新增商品 | 录入商品信息 |
| `/products/:id` | 商品详情 | 查看/编辑商品 |
| `/customers` | 客户列表 | 搜索、浏览客户 |
| `/customers/:id` | 客户详情 | 查看客户 + 历史单据 + 应收汇总 |
| `/suppliers` | 供应商列表 | 搜索、浏览供应商 |
| `/suppliers/:id` | 供应商详情 | 查看供应商 + 历史单据 + 应付汇总 |
| `/sale-orders` | 出货单列表 | 按日期/客户筛选 |
| `/sale-orders/new` | 新建出货单 | 核心开单流程 |
| `/sale-orders/:id` | 出货单详情 | 查看出货单 |
| `/purchase-orders` | 进货单列表 | 按日期/供应商筛选 |
| `/purchase-orders/new` | 新建进货单 | 核心进货流程 |
| `/purchase-orders/:id` | 进货单详情 | 查看进货单 |
| `/receivables` | 应收账款 | 按客户汇总、标记付款 |
| `/payables` | 应付账款 | 按供应商汇总、标记付款 |
| `/stock` | 库存总览 | 当前库存、变动记录 |

### Android 平台抽象层

在保留现有业务层的前提下，新增一层平台适配，避免页面直接依赖浏览器特有能力：

- **CameraService**：封装拍照/相册选图；Android 首版可先不启用识图入口
- **FileExportService**：封装导出到文件/系统分享；首版可先下线原有浏览器下载能力
- **BackButtonService**：统一处理页面回退、弹窗关闭和首页退出确认
- **AppLifecycleService**：处理前后台切换、冷启动恢复、resume 时的数据刷新
- **NetworkStatusService**：识别离线/弱网，提供统一提示与重试入口
- **SessionStorageStrategy**：首版可沿用 Web 存储，后续演进到原生存储适配

共享边界定义如下：

- **共享层**：Pinia、Vue 页面、Composables、Supabase client、领域模型、RLS / RPC / Edge Function 契约
- **平台层**：Android 原生权限、相机、文件系统、返回键、应用生命周期、安装升级体验

### Infrastructure & Deployment

**部署方案：Android APK（前端容器）+ Supabase（后端）**

```
用户手机 Android App
        │
        ▼
   Capacitor WebView (本地前端资源)
        │
        ▼
   Supabase (API + 数据库 + 认证 + 实时)
```

- **前端交付**：通过 Capacitor 构建 Android 工程，签名后输出 APK
- **分发方式**：家庭内部下载页或手工分发 APK，支持覆盖安装升级
- **后端**：Supabase 托管，免运维
- **域名**：不再把公网 Web 域名作为正式交付前提；仅在需要提供下载页时再考虑
- **HTTPS**：Android 与 Supabase 通信继续使用 HTTPS

**备份策略：**
- Supabase 免费版不含自动备份
- 通过定期导出 SQL dump 实现手动备份（可写一个简单的脚本定期执行）
- 后续升级 Supabase Pro ($25/月) 可获得每日自动备份

**环境管理：**

| 环境 | 用途 | Supabase 项目 |
|------|------|-------------|
| development | 本地开发 | 本地 Supabase CLI 或单独的免费项目 |
| production | 线上使用 | 主 Supabase 项目 |

**Android 发布管理：**

- **包名 / applicationId**：一旦确定，后续不轻易修改
- **签名证书 / keystore**：必须安全备份，否则无法平滑升级
- **版本管理**：同时维护 `versionName` 与 `versionCode`
- **验收要求**：上线前必须完成真机安装、覆盖升级、前后台切换和弱网回归

---

## Implementation Patterns

### Composable 模式（核心业务逻辑）

所有业务数据操作封装为 Vue Composable，统一接口：

```typescript
// 示例：useProducts composable 接口
export function useProducts() {
  const products = ref<Product[]>([])
  const loading = ref(false)

  async function fetchAll()
  async function search(keyword: string)
  async function create(data: ProductInput)
  async function update(id: string, data: Partial<ProductInput>)
  async function remove(id: string)

  return { products, loading, fetchAll, search, create, update, remove }
}
```

### 单据确认的级联操作

通过 Supabase Database Function 在数据库层保证事务一致性：

```sql
-- 出货单确认触发器（概念示例）
CREATE OR REPLACE FUNCTION confirm_sale_order(order_id uuid)
RETURNS void AS $$
BEGIN
  -- 1. 更新单据状态
  UPDATE sale_orders SET status = 'confirmed' WHERE id = order_id;

  -- 2. 扣减库存 + 记录变动
  INSERT INTO stock_logs (product_id, change, reason, reference_id, balance)
  SELECT product_id, -quantity, 'sale_order', order_id,
    (SELECT stock FROM products WHERE id = product_id) - quantity
  FROM sale_order_items WHERE order_id = order_id;

  UPDATE products SET stock = stock - soi.quantity
  FROM sale_order_items soi
  WHERE products.id = soi.product_id AND soi.order_id = order_id;

  -- 3. 生成应收记录
  INSERT INTO receivables (sale_order_id, customer_id, amount, paid_amount, status)
  SELECT order_id, customer_id, total_amount, 0, 'unpaid'
  FROM sale_orders WHERE id = order_id;
END;
$$ LANGUAGE plpgsql;
```

### 响应式设计策略

- 默认移动端布局（Vant 组件天然移动优先）
- Android 首版只承诺手机端体验，PC 端批量录入仅作为历史 Web 基线能力保留
- 需要额外处理 Android 软键盘、底部安全区和固定操作栏遮挡问题

### 错误处理模式

- 所有 Supabase 操作统一封装错误处理
- 使用 Vant Toast/Dialog 展示用户友好的中文错误提示
- 网络错误自动重试（1次）
- 关键操作（确认单据）前二次确认弹窗

### Android 首版降级策略

为优先交付稳定可用的首版，以下能力允许显式降级：

- **Realtime**：默认关闭，只保留手动刷新和关键场景返回后刷新
- **拍照识图**：首版可关闭入口，保留后端识别链路作为后续能力
- **文件导出**：先移除浏览器下载模型，待接入原生文件/分享能力后再恢复
- **PC 批量录入**：不作为 Android 继续演进目标

### Primary Risks

- **网络误判风险**：Android 只能移除网页入口问题，不能自动解决 Supabase / Edge Function 公网可达性
- **安装交付风险**：APK 安装、未知来源授权、覆盖升级和 keystore 管理都属于新增运维工作
- **运行时适配风险**：返回键、前后台恢复、软键盘、文件系统和权限体验会显著影响实际可用性

---

## Technology Version Reference

| 技术 | 版本 | 备注 |
|------|------|------|
| Vue | 3.4+ | 当前稳定版 |
| Vite | 7.x | 当前稳定版（8.0 仍在 beta） |
| TypeScript | 5.x | - |
| Vant | 4.9+ | Vue 3 移动端 UI 库 |
| Pinia | 2.x | Vue 3 状态管理 |
| Vue Router | 4.x | Vue 3 路由 |
| Supabase JS | 2.x | Supabase 客户端 SDK |
| Node.js | 20 LTS | 开发环境 |
| OpenAI API (GPT-4o) | - | 智能识图，通过 Edge Functions 调用 |
