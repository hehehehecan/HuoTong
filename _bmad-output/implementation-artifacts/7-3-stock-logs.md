# Story 7.3: 库存变动记录查看

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 家人（用户）,
I want 查看某商品的库存变动历史记录,
so that 可以追溯每次库存变化的原因和关联单据。

## Acceptance Criteria

1. **Given** 系统中已有库存变动记录（出货扣减、进货增加、手动调整） **When** 用户在库存总览中选择某商品并点击「变动记录」 **Then** 显示该商品的所有库存变动列表，每条显示：变动时间、变动数量（+/-）、变动后余额、原因（出货/进货/手动）、关联单据号。
2. **Given** 变动记录关联了出货单或进货单 **When** 用户点击关联单据号 **Then** 跳转到对应的出货单/进货单详情页。

## Tasks / Subtasks

- [x] Task 1：Composable 获取某商品库存变动列表 (AC: #1)
  - [x] 1.1 在 `huotong-app/src/composables/useInventory.ts` 中新增 `getStockLogs(productId: string): Promise<StockLogWithOrderNo[]>`。从 `stock_logs` 表按 `product_id` 筛选、按 `created_at` 倒序；返回字段含 id, product_id, change, reason, reference_id, balance, created_at。当 reason 为 `sale_order` 或 `purchase_order` 且 reference_id 非空时，批量查询 `sale_orders` 或 `purchase_orders` 表获取对应 `order_no`，组装为前端可用的「关联单据号」；reason 为 `manual` 时关联单据号显示为「—」。类型 `StockLogWithOrderNo` 可定义为接口，含 orderNo?: string（可选）。
  - [x] 1.2 确保 RLS 允许已登录用户读取 `stock_logs`、`sale_orders`、`purchase_orders`（项目若已配置则仅确认，不重复建表）。
- [x] Task 2：库存总览页「变动记录」入口与列表展示 (AC: #1)
  - [x] 2.1 在 `InventoryView.vue` 的每个商品行（van-cell）上增加「变动记录」入口（与「调整库存」并列，如放在 label 区域或 value 旁），**须为独立可点链接/按钮**（使用 `@click.stop` 或单独可点区域），与「调整库存」并列，避免与当前行整行点击打开调整弹窗冲突；点击「变动记录」后打开弹窗或抽屉，展示该商品的库存变动列表（调用 getStockLogs(productId)）。
  - [x] 2.2 列表每条显示：变动时间（格式化为本地时间）、变动数量（正数显示 +N，负数显示 -N）、变动后余额、原因（reason 映射：sale_order→出货，purchase_order→进货，manual→手动）、关联单据号（有则显示 order_no，无则「—」）。支持空状态：「暂无变动记录」。
- [x] Task 3：点击关联单据号跳转详情 (AC: #2)
  - [x] 3.1 当 reason 为 `sale_order` 且有关联单据号时，关联单据号可点击，点击后 `router.push({ name: 'sale-order-detail', params: { id: reference_id } })`（即 `/sale-orders/:id`）。当 reason 为 `purchase_order` 时，跳转 `purchase-order-detail`（`/purchase-orders/:id`）。manual 不跳转。
- [x] Task 4：自测与验收 (AC: #1, #2)
  - [x] 4.1 本地 `npm run build` 通过；未登录访问库存相关路由被重定向到登录页。
  - [x] 4.2 已登录下进入库存总览，点击某商品「变动记录」，列表正确显示该商品的 stock_logs（时间、数量、余额、原因、单据号）；点击出货/进货关联单据号可跳转到对应详情页。

## Dev Notes

- **数据模型**：`stock_logs` 表已存在，字段：id, product_id, change (integer), reason (text: 'sale_order'|'purchase_order'|'manual'), reference_id (uuid, 可为 NULL), balance (integer), created_at。手动调整时 reason='manual'，reference_id 为 NULL；出货/进货时 reason 与 reference_id 由 confirm_sale_order/confirm_purchase_order 及 adjust_stock 写入。
- **与 7.1、7.2 关系**：7.1 为库存总览页只读与搜索；7.2 在同一页增加「调整库存」弹窗并写入 stock_logs。本 Story 在同一页增加「变动记录」入口，展示该商品的 stock_logs 列表并支持跳转单据详情，不改变现有「调整库存」流程。
- **路由**：出货单详情 `name: 'sale-order-detail'`，path `/sale-orders/:id`；进货单详情 `name: 'purchase-order-detail'`，path `/purchase-orders/:id`。与 ReceivablesView/PayablesView 中跳转方式一致。
- **UI 形态**：与 7.2 的「调整库存」弹窗风格一致，使用 Vant Popup 或 Popup + 列表（van-cell-group）；或底部弹出抽屉内嵌 van-list 展示变动记录，避免与调整弹窗冲突（两个入口：调整库存 / 变动记录）。

### Project Structure Notes

- 视图：`huotong-app/src/views/InventoryView.vue`（在现有列表行增加「变动记录」入口与弹窗/抽屉及列表展示）。
- Composable：扩展现有 `huotong-app/src/composables/useInventory.ts`，新增 `getStockLogs` 及类型 `StockLogWithOrderNo`。
- 无需新增路由；若采用独立「库存变动记录」页则可加路由 `/stock/:productId/logs`，但 AC 未强制要求独立页，弹窗/抽屉即可。

### References

- [Source: _bmad-output/planning-artifacts/epics.md] Epic 7, Story 7.3 用户故事与 AC。
- [Source: _bmad-output/planning-artifacts/architecture.md] 数据模型 stock_logs 表结构；reason、reference_id 含义。
- [Source: huotong-app/src/views/InventoryView.vue] 现有库存总览与「调整库存」入口、弹窗结构。
- [Source: huotong-app/src/views/ReceivablesView.vue] 点击单据号跳转 sale-order-detail 的写法。
- [Source: _bmad-output/project-context.md] Supabase 单例、Vant 组件、路由与认证约定。

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

- `npm run build`（vue-tsc -b && vite build）通过。
- `npm run test -- --run` 通过（新增 7.3 回归用例后共 9 个测试）。

### Completion Notes List

- useInventory.ts：新增 `StockLogWithOrderNo` 接口与 `getStockLogs(productId)`，从 stock_logs 按 product_id 查询并倒序，批量拉取 sale_orders/purchase_orders 的 order_no 填入 orderNo。
- InventoryView.vue：每行 label 增加「变动记录」链接（@click.stop），与「调整库存」并列；新增变动记录弹窗，打开时请求 getStockLogs，列表展示时间、变动数量（+/-）、余额、原因（出货/进货/手动）、单据号；出货/进货的单据号可点击跳转对应详情页。
- CR 修复：`getStockLogs` 补充对 `sale_orders` / `purchase_orders` 查询错误的显式抛出，避免后端异常被静默吞掉导致单据号错误显示为「—」。
- QA 补测：补充 `getStockLogs` API 单测（映射/空结果/错误分支）和库存页日志入口+单据跳转回归测试。

### File List

- huotong-app/src/composables/useInventory.ts（修改：新增 getStockLogs、StockLogWithOrderNo）
- huotong-app/src/views/InventoryView.vue（修改：变动记录入口与弹窗列表、跳转详情）
- huotong-app/tests/api/useInventory.getStockLogs.spec.ts（新增：getStockLogs 映射与错误分支回归）
- huotong-app/tests/e2e/inventory-adjust.spec.ts（修改：补充日志加载/跳转测试，并补 router mock）

## Review Results

### Code Review Summary (2026-03-10)

- Reviewer: AI CR Agent
- Scope: Story 7.3 全量实现（Composable、库存页 UI、跳转逻辑、自动化测试）

### Findings

1. **Medium**：`getStockLogs` 在批量查询 `sale_orders` / `purchase_orders` 时未处理查询错误，可能将后端失败误显示为「—」。
   - 处理结果：已修复（查询错误显式抛出，前端统一提示“加载变动记录失败”）。
2. **Medium**：缺少 7.3 核心回归测试（日志映射、单据跳转、异常分支），后续改动有回归风险。
   - 处理结果：已修复（新增 API + 页面回归测试）。
3. **Low**：测试中缺少 `vue-router` mock，出现注入告警影响日志可读性。
   - 处理结果：已修复（补充 `useRouter` mock，告警消失）。
