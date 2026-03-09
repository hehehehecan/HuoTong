---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments:
  - 'prd.md'
  - 'architecture.md'
---

# HuoTong（货通） - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for HuoTong（货通）, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**商品管理**

- FR1: 用户可以录入商品信息（名称、规格、售价、进价）
- FR2: 用户可以编辑和删除已有商品信息
- FR3: 用户可以通过关键字模糊搜索商品
- FR4: 用户可以查看商品列表并按名称或类别浏览
- FR5: 用户可以在电脑端批量录入商品数据

**客户管理**

- FR6: 用户可以录入客户信息（姓名、电话、地址）
- FR7: 用户可以编辑和删除已有客户信息
- FR8: 用户可以搜索和浏览客户列表
- FR9: 用户可以查看某客户的历史出货单和应收账款汇总

**供应商管理**

- FR10: 用户可以录入供应商信息（名称、联系人、电话、主营品类）
- FR11: 用户可以编辑和删除已有供应商信息
- FR12: 用户可以搜索和浏览供应商列表
- FR13: 用户可以查看某供应商的历史进货单和应付账款汇总

**出货单管理**

- FR14: 用户可以创建出货单并关联客户
- FR15: 用户可以在出货单中添加多个商品条目（商品、数量、单价）
- FR16: 系统可以自动计算出货单总金额
- FR17: 用户可以查看历史出货单列表并按日期、客户筛选
- FR18: 用户可以查看出货单详情
- FR19: 出货单确认后，系统自动扣减相关商品库存
- FR20: 出货单确认后，系统自动生成对应的应收记录

**进货单管理**

- FR21: 用户可以创建进货单并关联供应商
- FR22: 用户可以在进货单中添加多个商品条目（商品、数量、单价）
- FR23: 系统可以自动计算进货单总金额
- FR24: 用户可以查看历史进货单列表并按日期、供应商筛选
- FR25: 用户可以查看进货单详情
- FR26: 进货单确认后，系统自动增加相关商品库存
- FR27: 进货单确认后，系统自动生成对应的应付记录

**应收应付管理**

- FR28: 用户可以查看所有应收账款列表，按客户汇总
- FR29: 用户可以查看所有应付账款列表，按供应商汇总
- FR30: 用户可以将账款标记为"已付"或"部分付款"
- FR31: 用户可以查看某笔账款关联的原始单据
- FR32: 系统可以显示每个客户/供应商的总欠款金额

**库存管理**

- FR33: 用户可以查看当前所有商品的库存数量
- FR34: 系统在出货时自动扣减库存
- FR35: 系统在进货时自动增加库存
- FR36: 用户可以手动调整库存数量（盘点校正）
- FR37: 用户可以查看某商品的库存变动记录

**智能识图录入**

- FR42: 用户可以在新建出货单/进货单时，通过拍照或从相册选取纸质单据图片，系统调用大模型 Vision API 自动识别并提取商品名称、数量、单价、客户/供应商名称等信息，填充到单据表单中
- FR43: 识别结果填充表单后，用户可以检查、修改识别结果，确认无误后再提交

**系统与数据**

- FR38: 用户可以通过手机浏览器访问所有功能
- FR39: 用户可以通过电脑浏览器访问所有功能（尤其批量录入）
- FR40: 多个用户可以同时使用系统，数据实时同步
- FR41: 用户可以备份和恢复数据

### NonFunctional Requirements

**性能**

- NFR1: 页面加载时间 < 2 秒（3G 网络环境）
- NFR2: 搜索商品响应时间 < 500 毫秒
- NFR3: 创建单据操作 < 3 秒完成确认
- NFR4: 支持 4 人同时在线操作无卡顿

**安全**

- NFR5: 数据传输使用 HTTPS 加密
- NFR6: 用户访问需要登录认证（简单密码或邀请码即可）
- NFR7: 数据存储不暴露在公网可直接访问

**可用性**

- NFR8: 界面使用大字体（最小 16px）、大按钮（最小 44x44px 触控区域）
- NFR9: 高对比度配色，适合各年龄段阅读
- NFR10: 核心操作路径不超过 3 步点击
- NFR11: 输入表单支持自动填充和智能建议
- NFR12: 操作出错时提供清晰的中文错误提示
- NFR13: 支持修改和撤销操作，容错设计

**可靠性**

- NFR14: 数据不丢失：提交成功的数据永久保存
- NFR15: 提供定期自动备份机制
- NFR16: 系统异常时给出友好提示，不导致数据损坏

### Additional Requirements

**Architecture 技术需求**

- 使用 Vue 3 + Vite + TypeScript 作为前端技术栈（Starter Template: `npm create vite@latest huotong -- --template vue-ts`）
- 使用 Supabase (PostgreSQL) 作为 BaaS 后端，提供 API、认证、实时同步
- 使用 Vant 4 作为移动端 UI 组件库
- 使用 Pinia 进行状态管理（仅全局状态如用户认证）
- 使用 Vue Router 4.x 进行路由管理
- 业务数据通过 Composables 封装，直接从 Supabase 获取
- 部署到 Vercel（前端）+ Supabase（后端），推送即上线
- 单据确认的级联操作（库存增减 + 账款生成）通过 Supabase Database Functions (PostgreSQL Functions + Triggers) 在数据库事务中执行，保证一致性
- 实时同步使用 Supabase Realtime 订阅关键表变更
- 认证方案使用 Supabase Auth（Email + Password），开发者创建 4 个账号
- Row Level Security (RLS) 防止未授权访问
- 备份策略：定期导出 SQL dump（免费版），后续可升级 Supabase Pro 获得自动备份
- 响应式设计：移动端优先（Vant），PC 端通过 CSS Media Query 适配
- 批量录入页面在 PC 端展示为表格编辑器，手机端降级为逐条录入
- 错误处理：统一封装 Supabase 操作错误，使用 Vant Toast/Dialog 展示中文提示
- 网络错误自动重试（1次）
- 关键操作（确认单据）前二次确认弹窗
- 智能识图通过 Supabase Edge Functions 调用 GPT-4o Vision API，API Key 存储在 Edge Function Secrets 中
- 前端拍照/选图后压缩至 < 1MB，发送到 Edge Function，返回结构化 JSON
- 识别结果中的客户/商品名与系统已有数据模糊匹配，匹配失败标记为"需手动选择"

### FR Coverage Map

| FR | Epic | 简述 |
|----|------|------|
| FR1 | Epic 2 | 录入商品信息 |
| FR2 | Epic 2 | 编辑删除商品 |
| FR3 | Epic 2 | 模糊搜索商品 |
| FR4 | Epic 2 | 浏览商品列表 |
| FR5 | Epic 2 | PC端批量录入 |
| FR6 | Epic 3 | 录入客户信息 |
| FR7 | Epic 3 | 编辑删除客户 |
| FR8 | Epic 3 | 搜索浏览客户 |
| FR9 | Epic 6 | 客户历史交易和应收汇总 |
| FR10 | Epic 3 | 录入供应商信息 |
| FR11 | Epic 3 | 编辑删除供应商 |
| FR12 | Epic 3 | 搜索浏览供应商 |
| FR13 | Epic 6 | 供应商历史交易和应付汇总 |
| FR14 | Epic 4 | 创建出货单关联客户 |
| FR15 | Epic 4 | 出货单添加商品条目 |
| FR16 | Epic 4 | 出货单自动计算金额 |
| FR17 | Epic 4 | 查看历史出货单列表 |
| FR18 | Epic 4 | 查看出货单详情 |
| FR19 | Epic 4 | 出货确认自动扣库存 |
| FR20 | Epic 4 | 出货确认自动生成应收 |
| FR21 | Epic 5 | 创建进货单关联供应商 |
| FR22 | Epic 5 | 进货单添加商品条目 |
| FR23 | Epic 5 | 进货单自动计算金额 |
| FR24 | Epic 5 | 查看历史进货单列表 |
| FR25 | Epic 5 | 查看进货单详情 |
| FR26 | Epic 5 | 进货确认自动增库存 |
| FR27 | Epic 5 | 进货确认自动生成应付 |
| FR28 | Epic 6 | 查看应收账款列表按客户汇总 |
| FR29 | Epic 6 | 查看应付账款列表按供应商汇总 |
| FR30 | Epic 6 | 标记已付/部分付款 |
| FR31 | Epic 6 | 查看账款关联原始单据 |
| FR32 | Epic 6 | 显示总欠款金额 |
| FR33 | Epic 7 | 查看所有商品库存 |
| FR34 | Epic 4 | 出货自动扣减库存 |
| FR35 | Epic 5 | 进货自动增加库存 |
| FR36 | Epic 7 | 手动调整库存（盘点） |
| FR37 | Epic 7 | 查看库存变动记录 |
| FR38 | Epic 1 | 手机浏览器访问 |
| FR39 | Epic 1 | 电脑浏览器访问 |
| FR40 | Epic 7 | 多人实时同步 |
| FR41 | Epic 7 | 数据备份恢复 |
| FR42 | Epic 4/5 | 拍照识别纸质单据自动填充表单 |
| FR43 | Epic 4/5 | 识别结果可编辑确认后提交 |

## Epic List

### Epic 1: 项目初始化与用户认证
让家人能够登录系统、访问应用，并建立开发和部署的技术基础。
**FRs covered:** FR38, FR39

### Epic 2: 商品信息管理
让用户能够建立和维护商品价格库，实现快速查价和批量录入。
**FRs covered:** FR1, FR2, FR3, FR4, FR5

### Epic 3: 客户与供应商管理
让用户能够管理客户和供应商信息，为后续开单做准备。
**FRs covered:** FR6, FR7, FR8, FR10, FR11, FR12

### Epic 4: 出货开单与库存联动
核心业务场景 — 创建出货单，系统自动扣减库存、生成应收记录，支持拍照识别纸质单据快速录入。
**FRs covered:** FR14, FR15, FR16, FR17, FR18, FR19, FR20, FR34, FR42, FR43

### Epic 5: 进货记账与库存联动
记录进货，系统自动增加库存、生成应付记录，支持拍照识别纸质单据快速录入。
**FRs covered:** FR21, FR22, FR23, FR24, FR25, FR26, FR27, FR35, FR42, FR43

### Epic 6: 应收应付与对账管理
查看、追踪、管理所有应收应付账款，进行对账和催款。
**FRs covered:** FR9, FR13, FR28, FR29, FR30, FR31, FR32

### Epic 7: 库存管理与数据维护
全面管理库存、手动盘点校正，支持数据备份恢复和实时同步。
**FRs covered:** FR33, FR36, FR37, FR40, FR41

---

## Epic 1: 项目初始化与用户认证

让家人能够登录系统、访问应用，并建立开发和部署的技术基础。

### Story 1.1: 项目脚手架与基础配置

As a 开发者,
I want 使用 Vue 3 + Vite + TypeScript 初始化项目并集成 Supabase、Vant 4、Pinia、Vue Router,
So that 后续所有功能开发有统一的技术基础。

**Acceptance Criteria:**

**Given** 开发者执行 `npm create vite@latest huotong -- --template vue-ts`
**When** 安装完成并配置好所有依赖（@supabase/supabase-js、vant、pinia、vue-router）
**Then** 项目可以通过 `npm run dev` 在本地启动，浏览器打开看到初始页面
**And** TypeScript 编译无错误，Vant 组件可正常渲染

**Given** Supabase 项目已创建
**When** 开发者配置 `.env` 文件中的 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`
**Then** 前端可以通过 Supabase Client SDK 成功连接到 Supabase
**And** `src/lib/supabase.ts` 导出初始化好的 supabase client 实例

### Story 1.2: 用户登录与认证

As a 家人（用户）,
I want 通过密码登录系统,
So that 只有家人才能访问和操作业务数据。

**Acceptance Criteria:**

**Given** 开发者已在 Supabase Auth 中创建了用户账号
**When** 用户在登录页面输入邮箱和密码并点击"登录"
**Then** 系统验证成功后跳转到首页，显示用户已登录状态
**And** 登录状态通过 Pinia store 全局管理，页面刷新后保持登录

**Given** 用户未登录
**When** 用户尝试访问任何业务页面
**Then** 系统通过 Vue Router 导航守卫自动跳转到登录页面

**Given** 用户输入错误的邮箱或密码
**When** 点击"登录"
**Then** 显示清晰的中文错误提示"邮箱或密码错误"

**Given** 用户已登录
**When** 点击"退出登录"
**Then** 系统清除认证状态并跳转回登录页

### Story 1.3: 主布局与导航框架

As a 家人（用户）,
I want 看到清晰的底部导航栏和顶部标题栏，可以快速切换到各功能模块,
So that 操作入口一目了然，不用学习就能找到功能。

**Acceptance Criteria:**

**Given** 用户已登录
**When** 进入首页
**Then** 底部显示 Vant Tabbar 导航栏，包含"首页"、"商品"、"单据"、"更多"等入口
**And** 顶部显示 Vant NavBar，展示当前页面标题
**And** 界面使用大字体（最小 16px）、大按钮（最小 44x44px）、高对比度配色

**Given** 用户使用手机浏览器（含微信内置浏览器）
**When** 访问应用
**Then** 页面完整适配移动端屏幕，无水平滚动，触控区域足够大

**Given** 用户使用电脑浏览器
**When** 访问应用
**Then** 页面在宽屏下合理适配，内容区居中，最大宽度限制，功能正常可用

**Given** Vue Router 已配置所有路由路径
**When** 用户点击导航栏各入口
**Then** 页面切换流畅，无整页刷新（SPA 行为）
**And** 尚未实现的模块页面显示友好的占位内容

### Story 1.4: 首页快捷入口与部署上线

As a 家人（用户）,
I want 打开首页就能看到最常用的操作按钮,
So that 日常操作可以一键直达，不超过 3 步点击。

**Acceptance Criteria:**

**Given** 用户已登录进入首页
**When** 查看首页内容
**Then** 显示大按钮快捷入口：新建出货单、新建进货单、查应收
**And** 点击快捷入口跳转到对应页面路由

**Given** 代码推送到 Git 仓库
**When** Vercel 自动构建部署完成
**Then** 家人可以通过 HTTPS 域名在手机/电脑浏览器访问应用

**Given** 应用已部署上线，用户使用手机（3G 或更好的网络）首次打开应用
**When** 浏览器加载应用页面（含登录页）
**Then** 页面在 2 秒内完成加载并可交互（以页面内容可见、输入框可点击为准）

**Given** 用户使用手机 Chrome/Safari 访问应用
**When** 选择"添加到主屏幕"
**Then** 应用图标出现在手机主屏幕，点击后以全屏模式打开（PWA 基础 manifest 配置）

---

## Epic 2: 商品信息管理

让用户能够建立和维护商品价格库，实现快速查价和批量录入。

### Story 2.1: 商品数据表与录入

As a 家人（用户）,
I want 录入商品的名称、规格、售价和进价,
So that 系统中有完整的商品价格库，开单时可以直接引用。

**Acceptance Criteria:**

**Given** Supabase 中已创建 products 表（id, name, spec, sell_price, buy_price, stock, created_at, updated_at）且 RLS 策略已配置
**When** 用户在"新增商品"页面填写商品名称、规格、售价、进价并点击"保存"
**Then** 商品信息成功保存到数据库，返回商品列表页，新商品出现在列表中
**And** 库存字段 stock 默认初始化为 0

**Given** 用户未填写必填字段（名称）
**When** 点击"保存"
**Then** 显示中文提示"请填写商品名称"，不提交数据

**Given** 保存操作出现网络错误
**When** 系统检测到请求失败
**Then** 自动重试 1 次，仍失败则显示"保存失败，请检查网络后重试"

### Story 2.2: 商品列表与模糊搜索

As a 父亲（用户）,
I want 通过关键字快速搜索商品并查看价格,
So that 接到客户电话时能在几秒内查到商品价格。

**Acceptance Criteria:**

**Given** 系统中已有商品数据
**When** 用户进入商品列表页
**Then** 显示所有商品，每条显示名称、规格、售价，按名称排序
**And** 列表支持下拉刷新

**Given** 用户在搜索栏输入关键字（如"锅"）
**When** 输入后自动触发搜索（防抖 300ms）
**Then** 列表实时过滤，显示名称或规格中包含该关键字的商品
**And** 搜索响应时间 < 500 毫秒

**Given** 搜索结果为空
**When** 用户查看列表
**Then** 显示友好的空状态提示"没有找到相关商品"

### Story 2.3: 商品编辑与删除

As a 家人（用户）,
I want 编辑已有商品的信息或删除不再销售的商品,
So that 商品价格库始终保持最新准确。

**Acceptance Criteria:**

**Given** 用户在商品列表中点击某商品
**When** 进入商品详情/编辑页
**Then** 显示商品的所有信息（名称、规格、售价、进价），各字段可编辑

**Given** 用户修改了商品信息并点击"保存"
**When** 保存请求发送到 Supabase
**Then** 数据库更新成功，返回列表页，显示更新后的信息

**Given** 用户点击"删除商品"
**When** 系统弹出确认弹窗"确定要删除该商品吗？"
**Then** 用户确认后商品从数据库删除，列表中不再显示
**And** 用户取消则关闭弹窗，不执行删除

### Story 2.4: 电脑端批量录入商品

As a 女儿（用户）,
I want 在电脑端通过表格形式快速批量录入多个商品,
So that 系统初始化时能高效地导入大量商品数据。

**Acceptance Criteria:**

**Given** 用户使用电脑浏览器访问商品管理页
**When** 点击"批量录入"按钮
**Then** 显示表格编辑器界面，每行一个商品（名称、规格、售价、进价），可动态添加行

**Given** 用户在表格中填写了多条商品数据
**When** 点击"批量保存"
**Then** 所有商品一次性保存到数据库，成功后显示"成功录入 N 件商品"

**Given** 批量数据中某条记录缺少必填字段
**When** 点击"批量保存"
**Then** 高亮标记有问题的行，提示"第 X 行：请填写商品名称"，不提交任何数据

**Given** 用户使用手机浏览器
**When** 访问批量录入功能
**Then** 降级为逐条录入模式（跳转到单条新增页面），提示"批量录入请使用电脑端"

---

## Epic 3: 客户与供应商管理

让用户能够管理客户和供应商信息，为后续开单做准备。

### Story 3.1: 客户录入与列表

As a 家人（用户）,
I want 录入客户的姓名、电话、地址，并查看客户列表,
So that 开出货单时可以快速选择客户。

**Acceptance Criteria:**

**Given** Supabase 中已创建 customers 表（id, name, phone, address, created_at, updated_at）且 RLS 策略已配置
**When** 用户在"新增客户"页面填写姓名、电话、地址并保存
**Then** 客户信息成功保存，返回客户列表

**Given** 系统中已有客户数据
**When** 用户进入客户列表页
**Then** 显示所有客户（姓名、电话），支持搜索和下拉刷新

**Given** 用户在搜索栏输入关键字
**When** 输入后触发搜索
**Then** 列表过滤显示姓名或电话中包含关键字的客户

### Story 3.2: 客户编辑与删除

As a 家人（用户）,
I want 修改客户信息或删除不再合作的客户,
So that 客户资料始终准确。

**Acceptance Criteria:**

**Given** 用户点击客户列表中的某客户
**When** 进入客户详情页
**Then** 显示客户所有信息，各字段可编辑

**Given** 用户修改信息并保存
**When** 保存请求成功
**Then** 数据库更新，返回列表显示最新信息

**Given** 用户点击"删除客户"
**When** 弹出确认弹窗
**Then** 确认后删除客户，取消则不操作

### Story 3.3: 供应商录入与列表

As a 家人（用户）,
I want 录入供应商的名称、联系人、电话、主营品类，并查看供应商列表,
So that 进货记账时可以快速选择供应商。

**Acceptance Criteria:**

**Given** Supabase 中已创建 suppliers 表（id, name, contact, phone, category, created_at, updated_at）且 RLS 策略已配置
**When** 用户在"新增供应商"页面填写名称、联系人、电话、主营品类并保存
**Then** 供应商信息成功保存，返回供应商列表

**Given** 系统中已有供应商数据
**When** 用户进入供应商列表页
**Then** 显示所有供应商（名称、联系人、电话），支持搜索和下拉刷新

**Given** 用户搜索关键字
**When** 输入触发搜索
**Then** 列表过滤显示名称或联系人包含关键字的供应商

### Story 3.4: 供应商编辑与删除

As a 家人（用户）,
I want 修改供应商信息或删除不再合作的供应商,
So that 供应商资料始终准确。

**Acceptance Criteria:**

**Given** 用户点击供应商列表中的某供应商
**When** 进入供应商详情页
**Then** 显示供应商所有信息，各字段可编辑

**Given** 用户修改信息并保存
**When** 保存请求成功
**Then** 数据库更新，返回列表显示最新信息

**Given** 用户点击"删除供应商"
**When** 弹出确认弹窗
**Then** 确认后删除供应商，取消则不操作

---

## Epic 4: 出货开单与库存联动

核心业务场景 — 创建出货单，系统自动扣减库存、生成应收记录，支持拍照识别纸质单据快速录入。

### Story 4.1: 出货单数据表与创建流程

As a 父亲（用户）,
I want 创建出货单，选择客户并添加多个商品条目,
So that 接到客户电话后能快速完成数字化开单。

**Acceptance Criteria:**

**Given** Supabase 中已创建 sale_orders 表和 sale_order_items 表，且 RLS 策略已配置
**When** 用户点击"新建出货单"
**Then** 进入出货单创建页面，显示客户选择器和商品添加区域

**Given** 用户在出货单创建页面
**When** 点击"选择客户"并搜索选择一个客户
**Then** 客户名称显示在出货单头部

**Given** 用户已选择客户
**When** 点击"添加商品"，搜索并选择商品，输入数量
**Then** 商品条目添加到出货单列表，单价自动带出（售价），小计自动计算
**And** 可以重复添加多个商品条目

**Given** 出货单中有多个商品条目
**When** 系统计算总金额
**Then** 页面底部实时显示出货单总金额（所有条目小计之和）

**Given** 用户想修改已添加的商品条目
**When** 点击某条目
**Then** 可以修改数量或单价，或删除该条目，总金额实时更新

### Story 4.2: 出货单确认与级联操作

As a 父亲（用户）,
I want 确认出货单后系统自动扣减库存和生成应收记录,
So that 不需要手动维护库存和账款，减少人为遗漏。

**Acceptance Criteria:**

**Given** Supabase 中已创建以下表及 RLS 策略：
- `receivables` 表（id uuid PK, sale_order_id uuid FK→sale_orders, customer_id uuid FK→customers, amount decimal, paid_amount decimal DEFAULT 0, status text DEFAULT 'unpaid', created_at timestamptz, updated_at timestamptz）
- `stock_logs` 表（id uuid PK, product_id uuid FK→products, change integer, reason text, reference_id uuid, balance integer, created_at timestamptz）
- PostgreSQL Function `confirm_sale_order(order_id uuid)` 已通过 SQL migration 在 Supabase 中创建，函数在同一事务中：① 更新出货单状态、② 扣减库存并写入 stock_logs、③ 在 receivables 中生成应收记录
**When** 开发者确认上述数据库对象均已部署
**Then** 本 Story 的业务功能可以正确运行

**Given** 用户已创建好出货单（选择了客户、添加了商品条目）
**When** 点击"确认出货"
**Then** 弹出二次确认弹窗，显示出货单摘要（客户、商品数、总金额）

**Given** 用户在确认弹窗中点击"确认"
**When** 系统调用 Supabase Database Function `confirm_sale_order`
**Then** 在同一数据库事务中完成：
1. 出货单状态从 draft 更新为 confirmed
2. 相关商品库存自动扣减
3. stock_logs 表记录每个商品的库存变动
4. receivables 表自动生成一条应收记录（金额=出货单总金额，状态=unpaid）
**And** 操作成功后显示"出货单已确认"，跳转到出货单详情页
**And** 从用户点击"确认"到页面显示"出货单已确认"的总耗时 < 3 秒（正常网络条件下）

**Given** 某商品库存不足（库存 < 出货数量）
**When** 用户尝试确认出货单
**Then** 系统提示"商品 XXX 库存不足（当前 N 件，需要 M 件）"，不执行确认操作

**Given** 确认操作过程中出现网络或数据库错误
**When** 事务执行失败
**Then** 所有操作回滚，数据保持一致，显示"操作失败，请重试"

### Story 4.3: 出货单列表与详情

As a 家人（用户）,
I want 查看历史出货单列表并按日期或客户筛选,
So that 可以随时回顾历史出货记录。

**Acceptance Criteria:**

**Given** 系统中已有出货单记录
**When** 用户进入出货单列表页
**Then** 显示所有出货单，每条显示单号、客户名、总金额、日期、状态
**And** 按创建日期倒序排列（最新在前），支持下拉刷新

**Given** 用户想筛选出货单
**When** 选择按客户筛选或按日期范围筛选
**Then** 列表更新为符合条件的出货单

**Given** 用户点击某条出货单
**When** 进入出货单详情页
**Then** 显示完整信息：单号、客户名称、所有商品条目（商品名、数量、单价、小计）、总金额、创建时间、状态

### Story 4.4: 拍照识别纸质出货单

As a 父亲（用户）,
I want 拍照识别纸质出货单，系统自动提取商品和客户信息填充到表单,
So that 过渡期可以先写纸质单再拍照录入系统，降低使用门槛。

**Acceptance Criteria:**

**Given** Supabase Edge Function `recognize-receipt` 已按以下要求创建并部署：
- 函数接收 `{ image_base64: string }` 请求体
- 调用 OpenAI GPT-4o Vision API（API Key 存储于 Supabase Edge Function Secrets 中，变量名 `OPENAI_API_KEY`）
- 返回结构化 JSON：`{ customer_name, supplier_name, items: [{ name, quantity, unit_price }], total }`，识别不到的字段返回 `null`
- 已在本地通过 `supabase functions serve` 测试并通过 `supabase functions deploy recognize-receipt` 部署到生产环境
**When** 开发者确认 Edge Function 可正常调用（可用 curl 或 Supabase Dashboard 测试）
**Then** 本 Story 的拍照识别功能可以正确运行

**Given** 用户在新建出货单页面
**When** 点击"拍照识别"按钮
**Then** 调用手机摄像头拍照，或从相册选取图片

**Given** 用户拍照或选取了一张纸质出货单图片
**When** 图片压缩至 < 1MB 后发送到 Supabase Edge Function
**Then** Edge Function 调用 GPT-4o Vision API 识别图片，返回结构化 JSON（customer_name、items 数组、total）
**And** 识别过程中显示加载动画和"正在识别..."提示

**Given** 识别结果返回成功
**When** 系统接收到结构化数据
**Then** 自动匹配客户名（模糊匹配 customers 表），匹配成功则自动选中客户，匹配失败标记"需手动选择"
**And** 自动匹配商品名（模糊匹配 products 表），匹配成功则自动填充商品条目，匹配失败标记"需手动选择"
**And** 所有字段均可编辑修改

**Given** 识别结果已填充到表单
**When** 用户检查确认无误
**Then** 可以继续正常的出货单确认流程

**Given** 图片识别失败（模糊、非单据图片等）
**When** API 返回错误或无法解析
**Then** 显示"识别失败，请重新拍照或手动录入"，用户可切换回手动录入模式

---

## Epic 5: 进货记账与库存联动

记录进货，系统自动增加库存、生成应付记录，支持拍照识别纸质单据快速录入。

### Story 5.1: 进货单数据表与创建流程

As a 父亲（用户）,
I want 创建进货单，选择供应商并添加到货商品条目,
So that 供应商送货后能快速记录进货信息。

**Acceptance Criteria:**

**Given** Supabase 中已创建 purchase_orders 表和 purchase_order_items 表，且 RLS 策略已配置
**When** 用户点击"新建进货单"
**Then** 进入进货单创建页面，显示供应商选择器和商品添加区域

**Given** 用户在进货单创建页面
**When** 点击"选择供应商"并搜索选择一个供应商
**Then** 供应商名称显示在进货单头部

**Given** 用户已选择供应商
**When** 点击"添加商品"，搜索并选择商品，输入数量和进价
**Then** 商品条目添加到进货单列表，小计自动计算
**And** 可以重复添加多个商品条目

**Given** 进货单中有多个商品条目
**When** 系统计算总金额
**Then** 页面底部实时显示进货单总金额

### Story 5.2: 进货单确认与级联操作

As a 父亲（用户）,
I want 确认进货单后系统自动增加库存和生成应付记录,
So that 进货数据自动联动，无需手动更新库存和账款。

**Acceptance Criteria:**

**Given** Supabase 中已创建以下表及 RLS 策略：
- `payables` 表（id uuid PK, purchase_order_id uuid FK→purchase_orders, supplier_id uuid FK→suppliers, amount decimal, paid_amount decimal DEFAULT 0, status text DEFAULT 'unpaid', created_at timestamptz, updated_at timestamptz）
- `stock_logs` 表已在 Story 4.2 中创建，可直接使用
- PostgreSQL Function `confirm_purchase_order(order_id uuid)` 已通过 SQL migration 在 Supabase 中创建，函数在同一事务中：① 更新进货单状态、② 增加库存并写入 stock_logs、③ 在 payables 中生成应付记录
**When** 开发者确认上述数据库对象均已部署
**Then** 本 Story 的业务功能可以正确运行

**Given** 用户已创建好进货单（选择了供应商、添加了商品条目）
**When** 点击"确认进货"
**Then** 弹出二次确认弹窗，显示进货单摘要

**Given** 用户在确认弹窗中点击"确认"
**When** 系统调用 Supabase Database Function `confirm_purchase_order`
**Then** 在同一数据库事务中完成：
1. 进货单状态从 draft 更新为 confirmed
2. 相关商品库存自动增加
3. stock_logs 表记录每个商品的库存变动
4. payables 表自动生成一条应付记录（金额=进货单总金额，状态=unpaid）
**And** 操作成功后显示"进货单已确认"，跳转到进货单详情页
**And** 从用户点击"确认"到页面显示"进货单已确认"的总耗时 < 3 秒（正常网络条件下）

**Given** 确认操作过程中出现网络或数据库错误
**When** 事务执行失败
**Then** 所有操作回滚，数据保持一致，显示"操作失败，请重试"

### Story 5.3: 进货单列表与详情

As a 家人（用户）,
I want 查看历史进货单列表并按日期或供应商筛选,
So that 可以随时回顾历史进货记录，方便与供应商对账。

**Acceptance Criteria:**

**Given** 系统中已有进货单记录
**When** 用户进入进货单列表页
**Then** 显示所有进货单，每条显示单号、供应商名、总金额、日期、状态
**And** 按创建日期倒序排列，支持下拉刷新

**Given** 用户想筛选进货单
**When** 选择按供应商筛选或按日期范围筛选
**Then** 列表更新为符合条件的进货单

**Given** 用户点击某条进货单
**When** 进入进货单详情页
**Then** 显示完整信息：单号、供应商名称、所有商品条目（商品名、数量、单价、小计）、总金额、创建时间、状态

### Story 5.4: 拍照识别纸质进货单

As a 父亲（用户）,
I want 拍照识别纸质进货单，系统自动提取商品和供应商信息填充到表单,
So that 供应商送货后可以先收纸质单据再拍照录入系统。

**Acceptance Criteria:**

**Given** 用户在新建进货单页面
**When** 点击"拍照识别"按钮
**Then** 调用手机摄像头拍照，或从相册选取图片

**Given** 用户拍照或选取了一张纸质进货单图片
**When** 图片压缩并发送到 Supabase Edge Function
**Then** 复用 Epic 4 中的 recognize-receipt Edge Function，返回结构化 JSON（supplier_name、items 数组、total）
**And** 识别过程中显示加载动画和"正在识别..."提示

**Given** 识别结果返回成功
**When** 系统接收到结构化数据
**Then** 自动匹配供应商名（模糊匹配 suppliers 表），匹配成功则自动选中，匹配失败标记"需手动选择"
**And** 自动匹配商品名（模糊匹配 products 表），匹配成功则自动填充商品条目，匹配失败标记"需手动选择"
**And** 所有字段均可编辑修改

**Given** 图片识别失败
**When** API 返回错误或无法解析
**Then** 显示"识别失败，请重新拍照或手动录入"

---

## Epic 6: 应收应付与对账管理

查看、追踪、管理所有应收应付账款，进行对账和催款。

### Story 6.1: 应收账款列表与汇总

As a 母亲（用户）,
I want 查看所有客户的应收账款，按客户汇总欠款金额,
So that 月底对账催款时有清晰的数据依据。

**Acceptance Criteria:**

**Given** 系统中已有出货单确认后自动生成的应收记录
**When** 用户进入"应收账款"页面
**Then** 显示按客户汇总的欠款列表，每条显示客户名、总欠款金额、未付单据数量
**And** 按总欠款金额降序排列

**Given** 用户点击某客户的欠款汇总
**When** 展开该客户的详细列表
**Then** 显示该客户所有未付/部分付的应收记录，每条显示关联出货单号、金额、已付金额、状态、日期

### Story 6.2: 应付账款列表与汇总

As a 家人（用户）,
I want 查看所有供应商的应付账款，按供应商汇总欠款金额,
So that 供应商来结账时能快速查看应付明细。

**Acceptance Criteria:**

**Given** 系统中已有进货单确认后自动生成的应付记录
**When** 用户进入"应付账款"页面
**Then** 显示按供应商汇总的欠款列表，每条显示供应商名、总欠款金额、未付单据数量
**And** 按总欠款金额降序排列

**Given** 用户点击某供应商的欠款汇总
**When** 展开该供应商的详细列表
**Then** 显示该供应商所有未付/部分付的应付记录，每条显示关联进货单号、金额、已付金额、状态、日期

### Story 6.3: 账款付款状态管理

As a 母亲（用户）,
I want 将账款标记为"已付"或"部分付款",
So that 客户付款后能及时更新记录，保持账目准确。

**Acceptance Criteria:**

**Given** 用户在应收/应付详情中查看某条账款记录
**When** 点击"标记付款"
**Then** 弹出付款操作面板，显示应付总额、已付金额，可输入本次付款金额

**Given** 用户输入的付款金额等于剩余未付金额
**When** 确认付款
**Then** 账款状态更新为"已付"（paid），已付金额更新

**Given** 用户输入的付款金额小于剩余未付金额
**When** 确认付款
**Then** 账款状态更新为"部分付款"（partial），已付金额累加

**Given** 用户输入的付款金额大于剩余未付金额
**When** 尝试确认
**Then** 提示"付款金额不能超过未付金额"，不执行操作

### Story 6.4: 账款关联单据查看与客户/供应商历史

As a 母亲（用户）,
I want 从账款记录直接跳转查看原始出货单/进货单,
So that 催款或对账时有据可查，减少纠纷。

**Acceptance Criteria:**

**Given** 用户查看某条应收账款记录
**When** 点击"查看原始单据"
**Then** 跳转到关联的出货单详情页

**Given** 用户查看某条应付账款记录
**When** 点击"查看原始单据"
**Then** 跳转到关联的进货单详情页

**Given** 用户在客户详情页
**When** 查看客户信息
**Then** 页面底部显示该客户的历史出货单列表和应收账款汇总（总欠款金额）

**Given** 用户在供应商详情页
**When** 查看供应商信息
**Then** 页面底部显示该供应商的历史进货单列表和应付账款汇总（总欠款金额）

---

## Epic 7: 库存管理与数据维护

全面管理库存、手动盘点校正，支持数据备份恢复和实时同步。

### Story 7.1: 库存总览与查询

As a 家人（用户）,
I want 查看当前所有商品的库存数量,
So that 随时了解库存情况，及时发现缺货商品。

**Acceptance Criteria:**

**Given** 系统中已有商品数据（含库存字段）
**When** 用户进入"库存总览"页面
**Then** 显示所有商品的当前库存列表，每条显示商品名、规格、当前库存数量
**And** 支持按名称搜索，支持下拉刷新

**Given** 某商品库存为 0 或低于安全线
**When** 用户查看库存列表
**Then** 该商品以醒目样式（如红色标记）提示库存不足

### Story 7.2: 手动库存调整（盘点校正）

As a 家人（用户）,
I want 手动调整库存数量,
So that 实际盘点后发现差异时可以校正系统数据。

**Acceptance Criteria:**

**Given** 用户在库存总览页选择某商品
**When** 点击"调整库存"
**Then** 显示当前库存数量，提供输入框填写调整后的库存数量和调整原因

**Given** 用户输入新的库存数量并确认
**When** 系统执行调整操作
**Then** products 表中该商品的 stock 更新为新数量
**And** stock_logs 表记录一条变动记录（reason = 'manual'，change = 新数量 - 旧数量）

**Given** 用户未填写调整原因
**When** 尝试提交
**Then** 提示"请填写调整原因"

### Story 7.3: 库存变动记录查看

As a 家人（用户）,
I want 查看某商品的库存变动历史记录,
So that 可以追溯每次库存变化的原因和关联单据。

**Acceptance Criteria:**

**Given** 系统中已有库存变动记录（出货扣减、进货增加、手动调整）
**When** 用户在库存总览中选择某商品并点击"变动记录"
**Then** 显示该商品的所有库存变动列表，每条显示：变动时间、变动数量（+/-）、变动后余额、原因（出货/进货/手动）、关联单据号

**Given** 变动记录关联了出货单或进货单
**When** 用户点击关联单据号
**Then** 跳转到对应的出货单/进货单详情页

### Story 7.4: 实时数据同步

As a 家人（用户）,
I want 当其他家人修改了数据后，我的页面能实时更新,
So that 多人同时使用时不会看到过期数据或产生操作冲突。

**Acceptance Criteria:**

**Given** 多个用户同时在线使用系统
**When** 用户 A 确认了一笔出货单
**Then** 用户 B 正在查看的商品库存、应收列表自动刷新为最新数据
**And** 无需用户 B 手动刷新页面

**Given** Supabase Realtime 订阅已配置
**When** products、sale_orders、purchase_orders、receivables、payables 表发生变更
**Then** 所有在线用户的相关页面自动接收并展示最新数据

**Given** 实时同步连接断开（网络不稳定）
**When** 网络恢复
**Then** 自动重新建立 Realtime 连接，拉取最新数据

### Story 7.5: 数据备份与恢复

As a 女儿（开发者/管理员）,
I want 能够备份和恢复系统数据,
So that 商业数据不会因意外而永久丢失。

**Acceptance Criteria:**

**Given** 开发者需要备份数据
**When** 执行备份脚本（通过 Supabase CLI 或 pg_dump）
**Then** 导出包含所有表数据的 SQL dump 文件，保存到指定位置

**Given** 系统数据需要恢复
**When** 开发者使用备份文件执行恢复操作
**Then** 数据库恢复到备份时的状态，所有业务数据完好

**Given** 应用管理页面（"更多"栏目）
**When** 用户点击"导出数据"
**Then** 系统将关键业务数据导出为 JSON 文件供下载
**And** 导出文件包含商品、客户、供应商、出货单、进货单、应收、应付、库存变动数据
