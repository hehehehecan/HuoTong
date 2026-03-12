# Story 10.1: 网络异常提示与重试机制

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 家人（用户）,
I want 在网络异常时看到明确提示并能重试,
so that 不会把弱网、超时或后端波动误以为是 App 坏了。

## Acceptance Criteria

1. **Given** Supabase 请求失败或超时 **When** 页面无法完成关键操作（登录、列表加载、保存、确认） **Then** 显示清晰中文错误提示。  
**And** 提供显式的重试入口。
2. **Given** 用户重新连上网络 **When** 点击重试 **Then** 系统重新发起请求。  
**And** 成功后恢复正常页面状态。

## Tasks / Subtasks

- [x] Task 1：建立统一网络异常识别与重试入口（AC: #1, #2）
  - [x] 1.1 在 `huotong-app/src/lib/` 新增网络异常工具模块，统一判断网络错误/超时场景，避免各 composable 重复实现。
  - [x] 1.2 提供“自动重试 1 次 + 手动重试入口”能力：第一次网络失败自动重试 1 次；仍失败时向页面层暴露可再次执行的重试动作。
  - [x] 1.3 统一中文提示文案，至少覆盖“加载失败”“保存失败”“确认失败”“登录失败”的网络失败场景。

- [x] Task 2：覆盖关键操作路径（登录、列表、保存、确认）（AC: #1, #2）
  - [x] 2.1 登录：在 `LoginView.vue` 登录失败时提供明确中文提示与“重试登录”入口。
  - [x] 2.2 列表加载：在至少一个核心列表页（商品/单据）首屏加载失败时提供“重试加载”入口，并保持下拉刷新路径可用。
  - [x] 2.3 保存：在至少一个核心保存页（商品/单据创建）失败时提供“重试保存”入口。
  - [x] 2.4 确认：在至少一个单据确认页失败时提供“重试确认”入口，并与原有业务错误解析兼容（如库存不足、非草稿状态）。

- [x] Task 3：收敛重复重试实现，保持既有能力不回退（AC: #1, #2）
  - [x] 3.1 将 `useProducts`、`useSaleOrders`、`usePurchaseOrders` 中重复的网络重试判断迁移为复用同一工具，减少分散逻辑。
  - [x] 3.2 保留已有“网络重试后状态回查”防误判逻辑（出货/进货确认场景），避免引入回归。

- [x] Task 4：补充回归测试并完成验证（AC: #1, #2）
  - [x] 4.1 增加单元测试覆盖网络错误识别、自动重试 1 次、失败后仍可手动重试的行为。
  - [x] 4.2 增加关键页面层测试（或等价测试）覆盖“失败提示 + 显式重试入口”至少 1 条路径。
  - [x] 4.3 执行 `npm run test:run` 与 `npm run build`，确保无回归。

## Dev Notes

- 该 Story 目标是“首版稳定可用优先”，在弱网场景中给用户确定性反馈，避免无响应或仅失败提示但无下一步动作。
- Android 首版不要求离线能力，策略是“失败可见 + 可重试 + 自动重试一次”。
- 现有代码在部分 composables 已有 `withRetry` 雏形，但实现分散且页面层缺乏统一显式重试入口，需要收敛。
- 需保持 Story 10.2 的降级策略（如 Realtime 关闭）不被影响；网络重试不应重新打开已降级能力。

### Project Structure Notes

- 建议新增：`huotong-app/src/lib/networkRetry.ts`（统一网络错误识别、自动重试和页面重试入口）。
- 重点修改：
  - `huotong-app/src/stores/user.ts`
  - `huotong-app/src/views/LoginView.vue`
  - `huotong-app/src/views/ProductListView.vue`
  - `huotong-app/src/views/ProductFormView.vue`
  - `huotong-app/src/views/SaleOrderDetailView.vue`
  - `huotong-app/src/composables/useProducts.ts`
  - `huotong-app/src/composables/useSaleOrders.ts`
  - `huotong-app/src/composables/usePurchaseOrders.ts`

### References

- [Source: _bmad-output/planning-artifacts/epics.md] Epic 10 / Story 10.1 用户故事与 AC。
- [Source: _bmad-output/planning-artifacts/prd.md] FR47（网络异常提示与重试）与 Android 网络验收风险说明。
- [Source: _bmad-output/planning-artifacts/architecture.md] `NetworkStatusService`、错误处理模式（中文提示 + 自动重试 1 次）。
- [Source: _bmad-output/project-context.md] `src/lib` 统一入口约束、测试与构建要求。
- [Source: _bmad-output/implementation-artifacts/10-2-android-first-release-degrade-entry-shaping.md] Android 首版稳定性优先、能力集中收敛的实现模式。

## Developer Context (Guardrails)

### Technical Requirements

- 仅对网络异常/超时执行自动重试 1 次，不对业务校验错误盲目重试。
- 手动重试入口必须是显式可见操作（如按钮/确认弹窗主按钮），且文案中文清晰。
- 重试成功后应恢复正常页面状态（数据可见、按钮恢复可用、loading 状态正确收口）。
- 保留并复用业务错误解析逻辑，不覆盖库存不足、单据状态变更等业务提示。

### Architecture Compliance

- 网络异常策略统一落在 `src/lib` 与 composable 层，页面层负责展示提示与触发重试，不直接复制重试算法。
- 继续使用 Vue 3 + TypeScript + Vant + Pinia + Vue Router 既有模式，不引入新依赖。
- 保持 Supabase 客户端单例入口（`src/lib/supabase.ts`）不变。

### Library & Framework Requirements

| 依赖/模块 | 用途 |
|------|------|
| `@supabase/supabase-js` | 请求错误对象来源，网络错误识别输入 |
| Vant (`showToast` / `showConfirmDialog`) | 失败提示与显式重试交互 |
| Pinia `user` store | 登录失败重试入口承载 |
| 现有 composables | 列表/保存/确认关键业务路径接入点 |

### File Structure Requirements

- 新增：`huotong-app/src/lib/networkRetry.ts`
- 修改（至少）：
  - `huotong-app/src/composables/useProducts.ts`
  - `huotong-app/src/composables/useSaleOrders.ts`
  - `huotong-app/src/composables/usePurchaseOrders.ts`
  - `huotong-app/src/views/LoginView.vue`
  - `huotong-app/src/views/ProductListView.vue`
  - `huotong-app/src/views/ProductFormView.vue`
  - `huotong-app/src/views/SaleOrderDetailView.vue`

### Testing Requirements

- 网络异常识别：覆盖 fetch/network/timeout 等关键特征。
- 自动重试：首轮失败后自动重试 1 次；二次失败时抛出错误。
- 页面重试入口：至少验证登录、列表、保存、确认中的 1-2 条典型路径。
- 回归通过：`npm run test:run`、`npm run build`。

## Project Context Reference

- [Source: _bmad-output/project-context.md] 项目规则、目录约定、自动化验证与等待策略。

## Dev Agent Record

### Agent Model Used

gpt-5.3-codex

### Debug Log References

- `npm run test:run`
- `npm run build`

### Completion Notes List

- 2026-03-12：Create Story 初始化（ready-for-dev）。
- 2026-03-12：新增 `src/lib/networkRetry.ts`，统一网络错误识别、自动重试 1 次、显式重试确认入口。
- 2026-03-12：`useProducts`、`useSaleOrders`、`usePurchaseOrders` 改为复用统一网络重试工具，保留确认后状态回查防误判逻辑。
- 2026-03-12：关键路径接入显式重试入口：`LoginView`（重试登录）、`ProductListView`（重试加载按钮）、`ProductFormView`（重试保存）、`SaleOrderDetailView` / `PurchaseOrderDetailView`（重试确认）。
- 2026-03-12：补充 `tests/api/networkRetry.spec.ts`，并通过 `npm run test:run` 与 `npm run build`。
- 2026-03-12：CR 修复商品列表首屏读取未接入自动重试的问题，并补齐首屏失败后“重试加载”恢复列表的回归测试。
- 2026-03-12：CR 修复 `ProductListView` 在首屏加载失败与搜索失败时可能留下未处理 Promise rejection 的问题，统一在页面异步入口收口异常。

### File List

- _bmad-output/implementation-artifacts/10-1-network-error-feedback-retry.md（新增）
- _bmad-output/implementation-artifacts/sprint-status.yaml（更新）
- huotong-app/src/lib/networkRetry.ts（新增）
- huotong-app/src/composables/useProducts.ts（更新）
- huotong-app/src/composables/useSaleOrders.ts（更新）
- huotong-app/src/composables/usePurchaseOrders.ts（更新）
- huotong-app/src/stores/user.ts（更新）
- huotong-app/src/views/LoginView.vue（更新）
- huotong-app/src/views/ProductListView.vue（更新）
- huotong-app/src/views/ProductFormView.vue（更新）
- huotong-app/src/views/SaleOrderDetailView.vue（更新）
- huotong-app/src/views/PurchaseOrderDetailView.vue（更新）
- huotong-app/tests/api/networkRetry.spec.ts（新增）
- huotong-app/tests/api/useProducts.networkRetry.spec.ts（新增）
- huotong-app/tests/e2e/product-list.retry.spec.ts（新增）

### Senior Developer Review (AI)

- Reviewer: Hezhangcan
- Date: 2026-03-12
- Outcome: Approved

#### Findings Summary

- High: 0
- Medium: 2
- Low: 0

#### Review Notes

- Medium：商品列表首屏读取仍直接调用 Supabase 查询，未复用统一 `withNetworkRetry()`，导致“自动重试 1 次”没有覆盖 AC 指定的关键列表路径；现已将 `fetchAll`、`search`、`getById` 接入统一网络重试能力，并补充 `tests/api/useProducts.networkRetry.spec.ts`。
- Medium：`ProductListView` 在 `onMounted` 首屏加载失败和搜索输入触发失败时使用 `void runSearch()`，会留下未处理的 Promise rejection，弱网场景下容易产生控制台异常和测试噪音；现已统一 `.catch(() => {})` 收口，并补充 `tests/e2e/product-list.retry.spec.ts` 验证“失败提示 + 重试恢复”路径。

## Change Log

- 2026-03-12：Create Story 初始化，状态设为 ready-for-dev。
- 2026-03-12：完成 DS，实现网络异常统一重试与关键路径显式重试入口，状态更新为 review。
- 2026-03-12：完成 CR，补齐商品列表自动重试与页面异步异常收口，并将状态更新为 done。
