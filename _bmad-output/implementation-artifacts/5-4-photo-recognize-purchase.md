# Story 5.4: 拍照识别纸质进货单

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 父亲（用户），
I want 拍照识别纸质进货单，系统自动提取商品和供应商信息填充到表单，
so that 供应商送货后可以先收纸质单据再拍照录入系统。

## Acceptance Criteria

1. **Given** 用户在新建进货单页面
   **When** 点击「拍照识别」按钮
   **Then** 调用手机摄像头拍照，或从相册选取图片

2. **Given** 用户拍照或选取了一张纸质进货单图片
   **When** 图片压缩至 < 1MB 后发送到 Supabase Edge Function
   **Then** 复用 Epic 4 中的 recognize-receipt Edge Function，返回结构化 JSON（supplier_name、items 数组、total）
   **And** 识别过程中显示加载动画和「正在识别...」提示

3. **Given** 识别结果返回成功
   **When** 系统接收到结构化数据
   **Then** 自动匹配供应商名（模糊匹配 suppliers 表），匹配成功则自动选中供应商，匹配失败标记「需手动选择」
   **And** 自动匹配商品名（模糊匹配 products 表），匹配成功则自动填充商品条目，匹配失败标记「需手动选择」
   **And** 所有字段均可编辑修改

4. **Given** 识别结果已填充到表单
   **When** 用户检查确认无误
   **Then** 可以继续正常的进货单保存草稿/确认进货流程

5. **Given** 图片识别失败（模糊、非单据图片等）
   **When** API 返回错误或无法解析
   **Then** 显示「识别失败，请重新拍照或手动录入」，用户可切换回手动录入模式

## Tasks / Subtasks

- [x] Task 1 (AC: #2 前置) — 确认复用 Edge Function recognize-receipt
  - [x] 1.1 确认 `supabase/functions/recognize-receipt` 已存在（Story 4.4 已创建），请求/响应格式含 supplier_name、items、total；无需新建或修改 Edge Function
  - [x] 1.2 若未部署或 Secrets 未配置，按 4.4 文档完成部署与 OPENAI_API_KEY 配置
- [x] Task 2 (AC: #1, #2) — 前端拍照/选图与调用
  - [x] 2.1 在 PurchaseOrderCreateView 增加「拍照识别」按钮；点击后触发移动端拍照或相册选图（与 SaleOrderCreateView 一致：input type="file" accept="image/*" capture="environment"）
  - [x] 2.2 选图后在前端将图片压缩至 < 1MB（复用 4.4 的 canvas 压缩逻辑或共享工具），转为 base64；显示 Loading +「正在识别...」
  - [x] 2.3 调用 Supabase Edge Function：`supabase.functions.invoke('recognize-receipt', { body: { image_base64 } })`；解析返回 JSON（supplier_name、items、total）
- [x] Task 3 (AC: #3) — 匹配与填充
  - [x] 3.1 供应商匹配：用 useSuppliers 获取列表或搜索，对识别出的 supplier_name 做模糊匹配；匹配到则设置当前选中供应商，否则显示「需手动选择」并保留供应商名为参考
  - [x] 3.2 商品匹配：用 useProducts 列表/搜索，对每个 item.name 模糊匹配商品；匹配到则添加一条进货单条目（product_id、quantity、unit_price 从识别结果或 product.buy_price），匹配不到则添加一条「需手动选择」占位条目（可编辑或后续选择商品）
  - [x] 3.3 总金额：若识别结果有 total 可预填，否则按条目小计汇总；所有已填充字段可编辑，与现有创建页逻辑一致
- [x] Task 4 (AC: #4, #5) — 错误与流程
  - [x] 4.1 识别成功：关闭 Loading，表单已填充，用户可修改后走保存草稿/确认进货流程
  - [x] 4.2 识别失败（API 错误、超时、返回非 JSON）：关闭 Loading，Toast「识别失败，请重新拍照或手动录入」，不覆盖当前表单内容

## Dev Notes

- **本 Story 范围**：进货单创建页的「拍照识别」入口 + 前端压缩、调用已有 recognize-receipt、供应商/商品匹配与填充；不新建 Edge Function（复用 4.4）。
- **数据**：suppliers、products 已存在，用于模糊匹配；purchase_orders/purchase_order_items 与 5.1 一致，识别结果填充后仍通过 usePurchaseOrders.createDraft 保存。
- **入口**：仅在新建进货单页 `/purchase-orders/new`（PurchaseOrderCreateView）增加「拍照识别」按钮，与「选择供应商」「添加商品」并列或显眼位置。
- **架构**：智能识图见 architecture.md「智能识图架构」；Edge Function 已存在，密钥存 Secrets；图片 < 1MB 与 4.4 一致。

### Project Structure Notes

- **Edge Function**：复用 `supabase/functions/recognize-receipt/index.ts`，已返回 supplier_name、items、total（与 customer_name 并存），无需修改。
- **Composable**：可在 `usePurchaseOrders.ts` 新增 `recognizeFromImage(imageBase64: string)` 调用 `supabase.functions.invoke('recognize-receipt', { body: { image_base64 } })` 并返回解析后的 JSON（类型可复用或定义 PurchaseRecognizeResult 含 supplier_name、items、total）；或直接在视图内调用 invoke，与 4.4 保持一致即可。
- **匹配逻辑**：供应商匹配复用 useSuppliers.fetchAll 或 search(supplier_name)，取第一个匹配或最相似；商品每条 item 调用 useProducts.search(item.name) 取第一个匹配，单价用识别 unit_price 或 product.buy_price。
- **视图**：`PurchaseOrderCreateView.vue` 增加拍照识别按钮、图片选择、压缩（可与 4.4 共享或复制相同逻辑）、调用、Loading、结果填充与「需手动选择」展示；保存时若有 product_id 为空的条目则 Toast「请为「需手动选择」的条目选择商品」。

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 5 - Story 5.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#智能识图架构；Edge Function 示例]
- [Source: _bmad-output/implementation-artifacts/4-4-photo-recognize-sale.md#拍照识别流程、压缩、invoke、匹配与填充、需手动选择]
- [Source: _bmad-output/implementation-artifacts/5-1-purchase-order-create.md#PurchaseOrderCreateView、usePurchaseOrders.createDraft、供应商/商品选择]
- [Source: _bmad-output/implementation-artifacts/5-2-purchase-order-confirm.md#usePurchaseOrders、详情页]
- [Source: _bmad-output/implementation-artifacts/3-3-supplier-entry-list.md#useSuppliers]
- [Source: _bmad-output/implementation-artifacts/2-2-product-list-search.md#useProducts search]
- [Source: _bmad-output/project-context.md#Supabase 单例、Vant、Toast 中文]

---

## Developer Context (Guardrails)

### Technical Requirements

- **recognize-receipt Edge Function**：已存在（4.4），POST body `{ image_base64: string }`，返回 JSON 含 customer_name、supplier_name、items、total；本 Story 仅使用 supplier_name、items、total。
- **前端调用**：通过 `supabase.functions.invoke('recognize-receipt', { body: { image_base64 } })`，需已登录；返回 data 可能为字符串或对象，需解析；解析异常或 invoke 抛错时 Toast「识别失败，请重新拍照或手动录入」。
- **图片压缩**：与 4.4 一致，前端发送前压缩至 < 1MB（canvas 或相同策略），避免超时与超费。
- **供应商模糊匹配**：suppliers 表 name 字段；可用 `ilike '%' || trim(supplier_name) || '%'` 或前端 fetch 后 filter；取单条作为选中供应商。
- **商品模糊匹配**：products 表 name/spec；每条识别 item 用 name 模糊查商品，匹配到则 product_id + quantity + unit_price（识别值或 product.buy_price）；匹配不到则 UI 显示「需手动选择」并允许用户手动选商品补全。

### Architecture Compliance

- 前端：Vue 3 + Vite + TypeScript，Vant 4；仅从 `src/lib/supabase.ts` 导入 supabase；Composable 在 `src/composables/`，视图在 `src/views/`。
- 密钥：OPENAI_API_KEY 仅存于 Edge Function Secrets，前端不涉及。
- 错误处理：统一 Toast 中文；识别失败不覆盖现有表单；网络错误可重试 1 次（与 project-context 一致）。

### Library & Framework Requirements

| 依赖 | 用途 |
|------|------|
| @supabase/supabase-js | supabase.functions.invoke |
| vant | Button、input file、Loading、Toast、Overlay（若与 4.4 一致） |
| （同 4.4）canvas 或共享压缩逻辑 | 前端图片压缩 < 1MB |

### File Structure Requirements

- `supabase/functions/recognize-receipt/index.ts` — 不修改（已存在）
- `huotong-app/src/composables/usePurchaseOrders.ts` — 修改：新增 recognizeFromImage 及返回类型（或复用 RecognizeReceiptResult，取 supplier_name/items/total）
- `huotong-app/src/views/PurchaseOrderCreateView.vue` — 修改：拍照识别按钮、选图、压缩、调用、Loading、供应商/商品匹配与填充、需手动选择、错误提示
- 可选：若 4.4 已将压缩逻辑抽成 composable 或 util，可复用
- 无需新 Supabase 表或 migration

### Testing Requirements

- 新建进货单页有「拍照识别」按钮，点击可拍照或选图。
- 选图后显示「正在识别...」，请求 Edge Function 成功且返回合法 JSON 时，供应商与商品条目按匹配结果填充；匹配失败处显示「需手动选择」；可编辑后保存/确认进货。
- 识别失败（错误响应、超时、非 JSON）时 Toast「识别失败，请重新拍照或手动录入」，不覆盖当前表单。
- 与 4.4 一致：若 Edge Function 未部署可 mock，保证前端流程与 UI 正确。

---

## Previous Story Intelligence

- **5.1 进货单创建**：PurchaseOrderCreateView、usePurchaseOrders.createDraft、供应商选择（useSuppliers）、商品选择（useProducts）、条目数量/进价编辑、总金额实时计算；保存草稿校验供应商+至少一条条目。
- **5.2 进货单确认**：usePurchaseOrders.confirm、PurchaseOrderDetailView、确认进货与库存/应付联动。
- **5.3 进货单列表与详情**：usePurchaseOrders.list(filters)、PurchaseOrderListView、筛选与下拉刷新。本 Story 不改列表/详情，仅在创建页增加识图入口。
- **4.4 拍照识别出货单**：recognize-receipt Edge Function 已存在并返回 customer_name、supplier_name、items、total；SaleOrderCreateView 已实现拍照、压缩、invoke、客户/商品匹配、需手动选择、Overlay+Loading；可直接复用压缩与调用逻辑，本 Story 改为供应商匹配 + 商品匹配 + 填充进货单表单。

---

## Project Context Reference

- [Source: _bmad-output/project-context.md] — Vue 3.5+、Vite 7.x、Vant 4.9+、Pinia、Vue Router、Supabase 单例从 `src/lib/supabase.ts` 导入；Toast 中文；网络错误重试 1 次；新 Vant 组件需在 main.ts 注册；路由默认需登录。

---

## Dev Agent Record

### Agent Model Used

(实现时由 Agent 填写)

### Debug Log References

### Completion Notes List

- usePurchaseOrders：新增 RecognizeReceiptResult 类型与 recognizeFromImage(imageBase64)，调用 recognize-receipt Edge Function，解析返回 supplier_name、items、total。
- PurchaseOrderCreateView：新增「拍照识别」按钮与隐藏 file input；compressImageToBase64 与 4.4 一致；onPhotoFileChange 调用 recognizeFromImage，供应商模糊匹配（searchSuppliers）、商品模糊匹配（searchProducts），未匹配商品添加「需手动选择：xxx」占位行并支持 openProductPopupForReplace；保存时过滤 product_id 为空的条目并 Toast「请为「需手动选择」的条目选择商品」；van-overlay + Loading「正在识别...」。
- 自测：`npm run build` 通过。

### File List

- huotong-app/src/composables/usePurchaseOrders.ts（修改：RecognizeReceiptResult、recognizeFromImage）
- huotong-app/src/views/PurchaseOrderCreateView.vue（修改：拍照识别、压缩、匹配填充、需手动选择、Overlay）

### Change Log

- 2026-03-10：完成 Story 5.4 实现；复用 recognize-receipt，进货单创建页拍照识别与供应商/商品匹配填充；状态更新为 review。
- 2026-03-10：完成代码审查；修复“供应商未匹配仅 Toast 未显式标记”的交互问题，回归构建通过，状态更新为 done。

### Review Record

- Reviewer: AI Agent
- Date: 2026-03-10
- Findings:
  - High: 0
  - Medium: 1（已修复 1，剩余 0）
  - Low: 0
- Verification:
  - `npm run build`：通过
