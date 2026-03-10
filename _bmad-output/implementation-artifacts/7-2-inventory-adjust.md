# Story 7.2: 手动库存调整（盘点校正）

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 家人（用户）,
I want 手动调整库存数量,
so that 实际盘点后发现差异时可以校正系统数据。

## Acceptance Criteria

1. **Given** 用户在库存总览页选择某商品 **When** 点击「调整库存」 **Then** 显示当前库存数量，提供输入框填写调整后的库存数量和调整原因。
2. **Given** 用户输入新的库存数量并确认 **When** 系统执行调整操作 **Then** products 表中该商品的 stock 更新为新数量 **And** stock_logs 表记录一条变动记录（reason = 'manual'，change = 新数量 - 旧数量，balance = 新数量）。
3. **Given** 用户未填写调整原因 **When** 尝试提交 **Then** 提示「请填写调整原因」。

## Tasks / Subtasks

- [x] Task 1：后端原子操作 (AC: #2)
  - [x] 1.1 在 Supabase 中新增数据库函数（或迁移）：`adjust_stock(p_product_id uuid, p_new_stock integer, p_reason_note text)`。函数内：① 校验 p_new_stock >= 0（否则 RAISE 异常）；② 读取该商品当前 stock；③ UPDATE products SET stock = p_new_stock, updated_at = now() WHERE id = p_product_id；④ INSERT INTO stock_logs (product_id, change, reason, reference_id, balance) VALUES (p_product_id, p_new_stock - 旧stock, 'manual', NULL, p_new_stock)；保证在同一事务中。p_reason_note 由前端必填校验使用，函数内可不落库（stock_logs 当前无 note 字段）。若项目已有 migrations 目录，则新增 migration 文件；否则在 `_bmad-output/implementation-artifacts/` 下提供 SQL，由开发者应用到 Supabase。
  - [x] 1.2 为 `authenticated` 角色授予该函数的 EXECUTE 权限；确保 RLS 不阻止已登录用户调用（通过 service role 或 authenticated 调用 RPC）。
- [x] Task 2：前端 Composable / 调用 (AC: #2)
  - [x] 2.1 新建 `huotong-app/src/composables/useInventory.ts`（或扩展现有 useProducts）：提供 `adjustStock(productId: string, newStock: number, reasonNote: string): Promise<void>`，内部调用 `supabase.rpc('adjust_stock', { p_product_id: productId, p_new_stock: newStock, p_reason_note: reasonNote })`。若 RPC 名为其他（如 `inventory_adjust`），保持与迁移中函数名一致。错误时抛出，由调用方 showToast 提示。
- [x] Task 3：库存总览页「调整库存」入口与弹窗 (AC: #1, #3)
  - [x] 3.1 在 `InventoryView.vue` 的每个商品行（van-cell）上增加「调整库存」按钮或链接（可与「库存不足」标签并列，或放在 value 区域右侧），点击后打开弹窗/抽屉。
  - [x] 3.2 弹窗内容：展示当前商品名称、规格、当前库存数量；表单项：调整后库存（数字输入，默认值为当前库存，建议校验为非负整数）、调整原因（必填，文本输入或 textarea）。提交前校验：调整原因 trim 后不可为空，否则 Toast「请填写调整原因」且不请求后端；调整后库存若为负数则 Toast 提示并拒绝提交。
  - [x] 3.3 提交时调用 adjustStock，成功后 Toast「调整成功」、关闭弹窗、刷新当前列表（或重新 fetch 该页数据），使列表显示最新库存。
- [x] Task 4：自测与验收 (AC: #1, #2, #3)
  - [x] 4.1 本地执行迁移/应用 SQL 后，`npm run build` 通过；未登录访问 `/stock` 被重定向到登录页。
  - [x] 4.2 已登录下进入库存总览，点击某商品「调整库存」，弹窗显示当前库存与表单；不填原因点击提交，提示「请填写调整原因」；填写原因并提交后，列表该商品库存更新，Supabase 中 products.stock 与 stock_logs 表各有正确记录（reason='manual'，change、balance 正确）。

## Dev Notes

- **数据模型**：products.stock 已存在；stock_logs 表已存在，字段含 product_id, change, reason, reference_id（可为 NULL）, balance, created_at。手动调整时 reason = 'manual'，reference_id 置为 NULL。
- **与 7.1 关系**：7.1 已完成库存总览页（InventoryView.vue），仅读展示与搜索、下拉刷新；本 Story 在同一页增加「调整库存」入口与弹窗，不新增路由。
- **事务**：必须在同一事务内完成「更新 products.stock」与「插入 stock_logs」，避免并发下数据不一致，故采用数据库函数（RPC）实现。
- **参考**：进货单确认时已有类似逻辑（5-2-payables-confirm-purchase-order.sql 中更新 products.stock 并插入 stock_logs）；本 Story 为手动调整，无 reference 单据，reason 固定为 'manual'。
- **弹窗组件**：项目已注册 Vant Dialog、Popup（main.ts）；可与现有 PayablesView/ReceivablesView 的 van-popup 表单风格一致。

### Project Structure Notes

- 视图：`huotong-app/src/views/InventoryView.vue`（在现有列表行上增加「调整库存」与弹窗）。
- Composable：新建 `huotong-app/src/composables/useInventory.ts` 封装 `adjustStock` RPC 调用；或若团队约定库存写操作放在 useProducts 内，可在此新增 `adjustStock` 方法。
- 迁移/SQL：若仓库使用 `supabase/migrations`，新增 migration；否则在 `_bmad-output/implementation-artifacts/` 提供 `7-2-inventory-adjust.sql`，便于应用到 Supabase Dashboard SQL Editor 或 CLI。

### References

- [Source: _bmad-output/planning-artifacts/epics.md] Epic 7, Story 7.2 用户故事与 AC。
- [Source: _bmad-output/planning-artifacts/architecture.md] 数据模型 products.stock、stock_logs 表结构；级联策略说明。
- [Source: _bmad-output/implementation-artifacts/5-2-payables-confirm-purchase-order.sql] 进货确认时更新 stock 并写入 stock_logs 的写法参考。
- [Source: _bmad-output/project-context.md] Supabase 单例、Vant 组件、Toast 与表单校验约定。

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

- `npm run build`（`vue-tsc -b && vite build`）通过。

### Completion Notes List

- 迁移：通过 MCP 应用 `add_adjust_stock_function`，在 public 下创建 `adjust_stock(p_product_id, p_new_stock, p_reason_note)`，内部校验非负、UPDATE products、INSERT stock_logs（reason='manual'），并 GRANT EXECUTE TO authenticated/service_role。
- useInventory.ts：新建 composable，`adjustStock(productId, newStock, reasonNote)` 调用 `supabase.rpc('adjust_stock', { ... })`。
- InventoryView.vue：每行可点击打开调整弹窗；弹窗展示商品名/规格/当前库存，表单项为调整后库存（数字）、调整原因（必填）；提交前校验原因非空、库存≥0；成功后 Toast、关闭弹窗并刷新列表。
- 复现 SQL 已写入 `_bmad-output/implementation-artifacts/7-2-inventory-adjust.sql`。`npm run build` 已通过。
- CR 复核结果：未发现 High/Medium 级问题，验收标准与实现一致，状态可置为 done。

### File List

- huotong-app/src/composables/useInventory.ts（新建）
- huotong-app/src/views/InventoryView.vue（修改：调整库存入口与弹窗）
- _bmad-output/implementation-artifacts/7-2-inventory-adjust.sql（新建，可复现 SQL）
