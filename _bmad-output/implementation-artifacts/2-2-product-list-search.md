# Story 2.2: 商品列表与模糊搜索

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 父亲（用户），
I want 通过关键字快速搜索商品并查看价格，
so that 接到客户电话时能在几秒内查到商品价格。

## Acceptance Criteria

1. **Given** 系统中已有商品数据  
   **When** 用户进入商品列表页  
   **Then** 显示所有商品，每条显示名称、规格、售价，按名称排序  
   **And** 列表支持下拉刷新

2. **Given** 用户在搜索栏输入关键字（如「锅」）  
   **When** 输入后自动触发搜索（防抖 300ms）  
   **Then** 列表实时过滤，显示名称或规格中包含该关键字的商品  
   **And** 搜索响应时间 < 500 毫秒

3. **Given** 搜索结果为空  
   **When** 用户查看列表  
   **Then** 显示友好的空状态提示「没有找到相关商品」

## Tasks / Subtasks

- [x] Task 1 (AC: #2) — 搜索栏与防抖
  - [x] 1.1 在商品列表页顶部增加搜索栏（Vant Search 或 Field），占位文案「搜索商品名称或规格」
  - [x] 1.2 绑定搜索关键字到本地 ref，输入时防抖 300ms 后触发过滤/查询
  - [x] 1.3 清空搜索框时恢复显示全部商品
- [x] Task 2 (AC: #2,#3) — 列表过滤与空状态
  - [x] 2.1 在 useProducts 中增加 search(keyword) 或 fetchFiltered(keyword)：Supabase 使用 ilike 对 name、spec 模糊查询（或前端在 fetchAll 后过滤），保证响应 < 500ms
  - [x] 2.2 列表数据源改为「搜索关键字存在时用搜索结果，否则用全部列表」；保持按名称排序
  - [x] 2.3 当搜索结果为空时，显示空状态组件，文案「没有找到相关商品」
- [x] Task 3 (AC: #1) — 保持现有列表与下拉刷新
  - [x] 3.1 确认列表仍显示名称、规格、售价，按名称排序；下拉刷新时根据当前是否有搜索关键字重新拉取全部或搜索结果

## Dev Notes

- **本 Story 范围**：在 Story 2.1 已有商品列表页基础上，增加搜索栏、防抖、模糊过滤（名称/规格）、空状态提示；不改变新增商品、路由、表结构。
- **性能**：NFR2 要求搜索响应 < 500ms；优先使用 Supabase 的 ilike 在数据库侧过滤，若数据量很小也可前端过滤，需满足 500ms 内更新列表。
- **复用**：沿用 `useProducts`、`ProductListView.vue`、路由 `/products`；不在其他 composable 或视图重复实现搜索逻辑。

### Project Structure Notes

- 视图：继续使用 `src/views/ProductListView.vue`，在其内增加搜索栏与空状态。
- Composable：在 `src/composables/useProducts.ts` 中增加 `search(keyword: string)` 或扩展 `fetchAll` 支持可选 keyword 参数；保持单例 supabase 从 `lib/supabase.ts` 导入。

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2 - Story 2.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture, Implementation Patterns]
- [Source: _bmad-output/implementation-artifacts/2-1-product-data-entry.md#Dev Notes, File List]

---

## Developer Context (Guardrails)

### Technical Requirements

- **搜索实现**：Supabase 查询使用 `or()` + `ilike('%keyword%')` 对 `name`、`spec` 两列模糊匹配；或 `fetchAll()` 后在前端用 `filter(p => name/spec 包含 keyword)`，需在 500ms 内完成并更新列表。
- **防抖**：用户输入后 300ms 无新输入再触发搜索；可用 VueUse `useDebounceFn` 或手写 setTimeout 防抖，避免每键触发请求。
- **空状态**：当过滤/搜索结果为空时显示 Vant Empty 或自定义空状态，文案严格为「没有找到相关商品」。
- **列表与刷新**：有搜索关键字时下拉刷新重新执行搜索；无关键字时下拉刷新拉取全部商品；列表始终按 name 排序。

### Architecture Compliance

- 前端：Vue 3 + Vite + TypeScript；UI：Vant 4；业务数据通过 composable 直连 Supabase；仅从 `src/lib/supabase.ts` 导入 supabase。
- 不新增路由；不修改 products 表结构或 RLS。

### Library & Framework Requirements

| 依赖 | 用途 | 说明 |
|------|------|------|
| @supabase/supabase-js | 模糊查询 ilike / or | 已有，在 useProducts 内使用 |
| vant | Search/Field、Empty、List、PullRefresh | 若用 VanSearch 需在 main.ts 注册 Search、Empty |
| @vueuse/core（可选） | useDebounceFn | 防抖；若无则手写 300ms debounce |

### File Structure Requirements

- `huotong-app/src/composables/useProducts.ts`：增加 `search(keyword: string)` 或 `fetchAll(keyword?: string)`，返回匹配 name/spec 的商品列表；内部用 supabase.from('products').select().or(\`name.ilike.%${keyword}%,spec.ilike.%${keyword}%\`).order('name') 或等价。
- `huotong-app/src/views/ProductListView.vue`：增加搜索输入框（防抖 300ms）、绑定搜索关键字、列表数据源改为搜索结果/全部；空结果时显示「没有找到相关商品」；下拉刷新逻辑与当前搜索状态一致。

### Testing Requirements

- 人工验收：进入商品列表，输入关键字后约 300ms 列表过滤；清空后恢复全部；无结果时显示「没有找到相关商品」；下拉刷新行为正确；搜索响应无明显延迟（< 500ms 体感）。
- 自动化：`npm run build` 通过。

### Previous Story Intelligence

- **Story 2.1**：`useProducts` 已有 `fetchAll()`、`create()`；`ProductListView.vue` 已有列表展示（名称、规格、售价）、按 name 排序、下拉刷新、FAB 新增商品。本 Story 仅在此基础上增加搜索栏、防抖、模糊过滤与空状态，不删除或替换现有列表/刷新逻辑。
- **main.ts**：已注册 List、Cell、CellGroup、PullRefresh 等；若使用 VanSearch、Empty 需补充注册。首次加载失败时已有 Toast「加载商品失败，请下拉重试」，保留不改动。

### Project Context Reference

- 前端入口：huotong-app/src/main.ts；Supabase 单例仅从 lib/supabase.ts 导入；Vant 组件需在 main.ts 注册后使用；路由 /products 已存在，不需改。

---

## Dev Agent Record

### Agent Model Used

(本循环由 Agent 实现)

### Debug Log References

- `npm run build` 通过

### Completion Notes List

- Task 1：商品列表页顶部增加 van-search，placeholder「搜索商品名称或规格」，v-model 绑定 searchKeyword，@update:model-value 触发 300ms 防抖后执行 runSearch；清空时 runSearch 调用 fetchAll 恢复全部列表。
- Task 2：useProducts 新增 search(keyword)，Supabase .or(\`name.ilike.${quoted},spec.ilike.${quoted}\`) 模糊匹配 name/spec，escapeIlike 转义 %、_、双引号；列表有关键字时用搜索结果、无关键字用全部；空结果且有关键字时显示「没有找到相关商品」。
- Task 3：列表仍显示名称、规格、售价、按 name 排序；下拉刷新调用 runSearch（有关键字则 search，否则 fetchAll）。
- main.ts 注册 Search 组件。

### File List

- huotong-app/src/composables/useProducts.ts（修改：escapeIlike、search、latestQueryId 防竞态覆盖）
- huotong-app/src/views/ProductListView.vue（修改：搜索栏、防抖、空状态、onRefresh 用 runSearch）
- huotong-app/src/main.ts（修改：注册 Search）
- _bmad-output/implementation-artifacts/2-2-product-list-search.md（修改：任务勾选、状态、Dev Agent Record）
- _bmad-output/implementation-artifacts/sprint-status.yaml（修改：2-2-product-list-search 状态）

### Senior Developer Review (AI)

- Review Date: 2026-03-10
- Reviewer: Hezhangcan (AI)
- Outcome: Approve after fixes

#### Findings

- High: 1
  - 搜索请求存在竞态条件，旧请求可能覆盖新关键字结果，导致列表与输入不一致（已修复）
- Medium: 2
  - 防抖定时器未在页面卸载时清理，可能触发卸载后的异步更新（已修复）
  - `runSearch` 在内部吞错导致刷新流程无法感知失败，错误反馈链路不一致（已修复）
- Low: 1
  - 文档中的 `useProducts.ts` 变更描述未反映竞态防护细节（已修复）

#### Fix Summary

- 在 `useProducts` 中引入请求序号保护，仅应用最新查询结果，避免结果回退。
- 在 `ProductListView` 中补充 `onUnmounted` 清理防抖定时器。
- 调整 `runSearch` 错误处理：区分静默模式，刷新路径可正确捕获失败并提示。
- 已执行 `npm run build`，构建通过。

### Change Log

- 2026-03-10: 完成代码审查，修复 1 个 High 和 2 个 Medium 问题；回归构建通过；状态更新为 done。
