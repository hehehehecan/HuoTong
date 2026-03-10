# Story 6.3: 账款付款状态管理

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 母亲（用户），
I want 将账款标记为「已付」或「部分付款」，
so that 客户付款后能及时更新记录，保持账目准确。

## Acceptance Criteria

1. **Given** 用户在应收/应付详情中查看某条账款记录
   **When** 点击「标记付款」
   **Then** 弹出付款操作面板，显示应付总额、已付金额，可输入本次付款金额

2. **Given** 用户输入的付款金额等于剩余未付金额
   **When** 确认付款
   **Then** 账款状态更新为「已付」（paid），已付金额更新

3. **Given** 用户输入的付款金额小于剩余未付金额
   **When** 确认付款
   **Then** 账款状态更新为「部分付款」（partial），已付金额累加

4. **Given** 用户输入的付款金额大于剩余未付金额
   **When** 尝试确认
   **Then** 提示「付款金额不能超过未付金额」，不执行操作

## Tasks / Subtasks

- [x] Task 1 (AC: #1 前置) — 确认 receivables / payables 表支持更新
  - [x] 1.1 确认 receivables、payables 表已有 paid_amount、status 字段，且 RLS 允许已认证用户 UPDATE（Story 4.2 / 5.2 已建）
  - [x] 1.2 确认更新逻辑：仅允许更新 paid_amount、status、updated_at，不修改其他字段

- [x] Task 2 (AC: #1–#4) — 扩展 useReceivables 支持记录付款
  - [x] 2.1 在 `useReceivables.ts` 中新增 `recordPayment(id: string, paymentAmount: number): Promise<void>`
  - [x] 2.2 逻辑：根据 id 查询当前记录的 amount、paid_amount；计算剩余未付 = amount - paid_amount；校验 paymentAmount <= 剩余未付（否则 throw 或返回错误信息）；新 paid = paid_amount + paymentAmount；若新 paid >= amount 则 status = 'paid'，否则 status = 'partial'；UPDATE receivables SET paid_amount, status, updated_at WHERE id
  - [x] 2.3 使用 withRetry 与统一错误处理，失败时 Toast 中文提示（含「付款金额不能超过未付金额」等）

- [x] Task 3 (AC: #1–#4) — 扩展 usePayables 支持记录付款
  - [x] 3.1 在 `usePayables.ts` 中新增 `recordPayment(id: string, paymentAmount: number): Promise<void>`
  - [x] 3.2 逻辑与 2.2 一致，操作表为 payables
  - [x] 3.3 错误处理同 2.3

- [x] Task 4 (AC: #1–#4) — 应收账款页增加「标记付款」入口与弹窗
  - [x] 4.1 在 ReceivablesView 每条应收明细（detail-item）上增加「标记付款」按钮（仅当 status 为 unpaid 或 partial 时显示）
  - [x] 4.2 点击后打开 Popup/Dialog，标题「标记付款」；展示：应付总额、已付金额、剩余未付金额；输入框「本次付款金额」；确认 / 取消按钮
  - [x] 4.3 确认时校验：本次金额 > 0 且本次金额 <= 剩余未付；超出则 Toast「付款金额不能超过未付金额」并保持弹窗打开
  - [x] 4.4 校验通过后调用 useReceivables().recordPayment(id, amount)，成功则关闭弹窗、刷新当前客户明细（或整页刷新），Toast「已更新」
  - [x] 4.5 若 recordPayment 抛出/返回错误，Toast 对应中文提示

- [x] Task 5 (AC: #1–#4) — 应付账款页增加「标记付款」入口与弹窗
  - [x] 5.1 在 PayablesView 每条应付明细上增加「标记付款」按钮（仅 unpaid/partial 显示）
  - [x] 5.2 弹窗内容与交互同 Task 4.2–4.5，调用 usePayables().recordPayment

- [x] Task 6 — 自测与回归
  - [x] 6.1 应收列表展开后，对一条未付/部分付记录点击「标记付款」，输入合法金额确认后，列表与汇总更新正确
  - [x] 6.2 输入超过剩余未付金额时提示「付款金额不能超过未付金额」，不更新
  - [x] 6.3 应付页同样流程通过
  - [x] 6.4 `npm run build` 无错误

## Dev Notes

- **本 Story 范围**：仅在现有应收/应付详情列表中增加「标记付款」能力，不包含 Story 6.4 的跳转原始单据、客户/供应商详情页历史汇总。
- **入口位置**：6.1 的 ReceivablesView 与 6.2 的 PayablesView 中，每条明细（detail-item）已有订单号、金额、已付、状态、日期；在本条右侧或底部增加按钮「标记付款」即可。
- **弹窗组件**：使用 Vant 的 van-popup + van-field（数字输入）+ van-button，或 van-dialog；金额输入建议 type="number" 或 digit 键盘，保留两位小数。
- **刷新策略**：付款成功后刷新当前展开的客户/供应商明细（重新调用 listByCustomer/listBySupplier），并可选刷新汇总列表（listGroupedByCustomer/listGroupedBySupplier），以保证汇总金额与笔数更新。
- **已付/已结清**：status = 'paid' 的记录不显示「标记付款」按钮；仅 unpaid、partial 显示。

### Project Structure Notes

- **Composable**：`useReceivables.ts`、`usePayables.ts` — 修改（新增 recordPayment）
- **View**：`ReceivablesView.vue`、`PayablesView.vue` — 修改（按钮 + 付款弹窗）
- **Router / 其他**：无新增路由；如有共用金额校验或格式化可放在现有 utils 或 composable 内

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 6 - Story 6.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture - receivables / payables]
- [Source: _bmad-output/implementation-artifacts/6-1-receivables-list.md#ReceivablesView 明细结构]
- [Source: _bmad-output/implementation-artifacts/6-2-payables-list.md#PayablesView 明细结构]

---

## Developer Context (Guardrails)

### Technical Requirements

- **receivables / payables 表**（已存在）：
  - receivables: id, sale_order_id, customer_id, amount, paid_amount, status, created_at, updated_at
  - payables: id, purchase_order_id, supplier_id, amount, paid_amount, status, created_at, updated_at
  - status 取值：unpaid | partial | paid。更新时仅更新 paid_amount、status、updated_at。

- **付款逻辑**：
  - 剩余未付 = amount - paid_amount
  - 本次付款 paymentAmount 必须满足 0 < paymentAmount <= 剩余未付
  - 新 paid_amount = paid_amount + paymentAmount
  - 若新 paid_amount >= amount，则 status = 'paid'；否则 status = 'partial'
  - updated_at = now()

- **RLS**：Story 4.2 / 5.2 的 migration 已为 receivables / payables 配置 authenticated 用户的 UPDATE 策略，无需新增 migration。

### Architecture Compliance

- 仅从 `src/lib/supabase.ts` 导入 supabase
- 错误与校验失败均通过 Toast 中文提示
- 网络错误可重试 1 次（与现有 withRetry 一致）

### Library & Framework Requirements

| 依赖 | 用途 |
|------|------|
| @supabase/supabase-js | receivables/payables 的 update |
| vant | Popup、Field、Button、Toast（已用） |

### File Structure Requirements

- `huotong-app/src/composables/useReceivables.ts` — 修改：新增 recordPayment(id, paymentAmount)
- `huotong-app/src/composables/usePayables.ts` — 修改：新增 recordPayment(id, paymentAmount)
- `huotong-app/src/views/ReceivablesView.vue` — 修改：标记付款按钮 + 付款弹窗
- `huotong-app/src/views/PayablesView.vue` — 修改：标记付款按钮 + 付款弹窗

### Testing Requirements

- 应收：展开某客户，对一条 unpaid/partial 记录点击「标记付款」，输入金额确认后，该条状态与已付金额更新，汇总刷新；输入超过剩余时提示不执行
- 应付：同上
- 金额等于剩余时状态变为已付；小于剩余时为部分付、已付金额累加
- `npm run build` 通过

---

## Previous Story Intelligence

- **6.1 应收账款**：ReceivablesView 使用 van-collapse，展开后 detail-item 展示 order_no、金额、已付、状态、日期；无「标记付款」按钮。6.3 在同一 detail-item 上增加按钮与弹窗，调用新方法 recordPayment 后刷新当前客户明细。
- **6.2 应付账款**：PayablesView 结构镜像 6.1，onCollapseChange 仅在有 supplierId 时请求 listBySupplier。6.3 在应付明细上增加「标记付款」与 recordPayment，成功后刷新该供应商明细。
- **4.2 / 5.2**：receivables / payables 表与 RLS 已存在，UPDATE 已允许 authenticated；无需新建表或 RLS。

---

## Project Context Reference

- [Source: _bmad-output/project-context.md] — Supabase 单例、Vant、Toast 中文、withRetry；新 Vant 组件需在 main.ts 注册（Popup/Field 等若已注册则无需重复）。

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

(无)

### Completion Notes List

- useReceivables.ts：新增 recordPayment(id, paymentAmount)，先查询当前 amount/paid_amount，校验金额后更新 paid_amount、status、updated_at；超出剩余未付时 throw「付款金额不能超过未付金额」。
- usePayables.ts：同上，操作 payables 表。
- ReceivablesView.vue：每条应收明细（unpaid/partial）增加「标记付款」按钮；底部弹出 van-popup 展示应收总额/已付/剩余未付、本次付款金额输入、确认/取消；确认后调用 recordPayment 并刷新该客户明细与汇总。
- PayablesView.vue：同上，应付总额与 usePayables().recordPayment。
- 自测：npm run build 通过；逻辑覆盖 AC#1–#4。
- CR 修复：统一付款金额按两位小数计算，避免浮点精度导致边界值（如 0.1/0.2）误判“超过未付金额”；已结清记录给出明确提示「该记录已结清」。

### File List

- huotong-app/src/composables/useReceivables.ts（修改）
- huotong-app/src/composables/usePayables.ts（修改）
- huotong-app/src/views/ReceivablesView.vue（修改）
- huotong-app/src/views/PayablesView.vue（修改）

### Change Log

- 2026-03-10：完成 Story 6.3 实现；useReceivables/usePayables 新增 recordPayment；应收/应付页增加标记付款入口与弹窗；状态更新为 review。
- 2026-03-10：完成 Code Review；修复付款金额浮点精度边界问题；状态更新为 done。
