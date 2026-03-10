# Story 7.5: 数据备份与恢复

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 女儿（开发者/管理员）,
I want 能够备份和恢复系统数据,
so that 商业数据不会因意外而永久丢失。

## Acceptance Criteria

1. **Given** 开发者需要备份数据 **When** 执行备份脚本（通过 Supabase CLI 或 pg_dump） **Then** 导出包含所有表数据的 SQL dump 文件，保存到指定位置。
2. **Given** 系统数据需要恢复 **When** 开发者使用备份文件执行恢复操作 **Then** 数据库恢复到备份时的状态，所有业务数据完好。
3. **Given** 应用管理页面（「更多」栏目） **When** 用户点击「导出数据」 **Then** 系统将关键业务数据导出为 JSON 文件供下载 **And** 导出文件包含商品、客户、供应商、出货单、进货单、应收、应付、库存变动数据。

## Tasks / Subtasks

- [x] Task 1：开发者备份脚本与文档 (AC: #1)
  - [x] 1.1 在项目根或 `scripts/` 下新增备份脚本（如 `scripts/backup-db.sh` 或 `scripts/backup-db.js`），使用 Supabase CLI（`supabase db dump`）或 pg_dump（需 DATABASE_URL），将 public schema 导出为 SQL 文件，输出路径可配置（如 `_backups/dump_YYYYMMDD_HHmm.sql`）。
  - [x] 1.2 在 `docs/` 或 README 中说明：如何配置 Supabase 连接（项目 ref、数据库密码或 service_role）、如何执行备份脚本、建议的备份频率（如每日/每周）；注明免费版无自动备份，需定期手动执行或通过 cron 调度。
- [x] Task 2：开发者恢复流程与文档 (AC: #2)
  - [x] 2.1 提供恢复说明文档：使用 `psql` 或 Supabase SQL Editor 执行备份 SQL 的步骤；警告「恢复会覆盖当前数据，仅限灾难恢复或测试环境」。
  - [x] 2.2 可选：在 `scripts/` 下新增 `restore-db.sh`（或等价脚本），接收备份文件路径，执行恢复（需 DATABASE_URL 或 Supabase 项目配置）；若仅文档说明即可满足 AC，可只写文档不写自动化脚本。
- [x] Task 3：应用内「导出数据」功能 (AC: #3)
  - [x] 3.1 在「更多」页（`/more`，当前为 `PlaceholderView.vue`）增加「导出数据」入口（如 van-cell「导出数据」），点击后触发导出流程。
  - [x] 3.2 实现导出逻辑：使用 Supabase 客户端按 RLS 当前用户可见范围查询以下表并组装为单一 JSON：products、customers、suppliers、sale_orders、sale_order_items、purchase_orders、purchase_order_items、receivables、payables、stock_logs。JSON 结构清晰（如按表名分 key），含导出时间戳；触发浏览器下载（如 `data:application/json` + 下载文件名 `huotong-export-YYYYMMDD-HHmmss.json`）。
  - [x] 3.3 导出过程显示加载态（如 Toast「正在导出…」），数据量较大时避免阻塞 UI（可分批查询再合并，或使用 Promise 链）；导出失败时提示「导出失败，请重试」。
- [x] Task 4：自测与验收 (AC: #1, #2, #3)
  - [x] 4.1 本地 `npm run build` 通过；未登录访问 `/more` 被重定向到登录页。
  - [x] 4.2 已登录下进入「更多」页，点击「导出数据」，确认生成并下载 JSON 文件，且包含上述所有业务表数据。
  - [x] 4.3 开发者侧：在具备 Supabase 连接的环境执行备份脚本，确认生成 SQL 文件；按文档执行恢复（可在测试项目或本地 Supabase 验证），确认数据恢复一致。

## Dev Notes

- **FR/NFR 依据**：FR41「用户可以备份和恢复数据」；NFR14「数据不丢失」、NFR15「定期自动备份机制」。Architecture 明确「备份策略：定期导出 SQL dump（免费版），后续可升级 Supabase Pro 获得自动备份」。
- **数据范围**：业务表见 architecture 数据模型——products, customers, suppliers, sale_orders, sale_order_items, purchase_orders, purchase_order_items, receivables, payables, stock_logs。导出 JSON 时与 RLS 一致，仅导出当前用户有权访问的行（Supabase 客户端默认遵守 RLS）；本项目家人共享数据，通常即全部业务数据。导出结构中每张表对应一个 key，无数据时为该 key 的空数组 `[]`，便于校验完整性。单表数据量较大时（如 stock_logs）可分批 `.select()` 再合并，避免单次请求过大。
- **与 7.1–7.4 关系**：7.1–7.4 已实现库存总览、调整、变动记录、实时同步；本 Story 不改变现有 composable 业务逻辑，仅在「更多」页增加导出入口，并新增脚本/文档供开发者做完整库备份与恢复。
- **Supabase CLI**：`supabase db dump -f dump.sql` 需在已 link 的项目下执行；若使用 pg_dump，需从 Supabase Dashboard → Settings → Database 获取 connection string（含密码）。

### Project Structure Notes

- 新建：`scripts/backup-db.sh` 或 `scripts/backup-db.js`（备份）、可选 `scripts/restore-db.sh`；`docs/backup-restore.md` 或 README 中备份/恢复章节。
- 修改：`huotong-app/src/views/PlaceholderView.vue`（/more 页）— 增加「导出数据」van-cell，点击后调用导出逻辑；可选新建 `huotong-app/src/composables/useExportData.ts` 封装「查询各表 → 组装 JSON → 触发下载」。
- 导出为前端能力，不新增后端 API；备份/恢复脚本为本地或 CI 环境使用，不部署到 Vercel。

### References

- [Source: _bmad-output/planning-artifacts/epics.md] Epic 7, Story 7.5 用户故事与 AC；FR41、NFR14、NFR15。
- [Source: _bmad-output/planning-artifacts/architecture.md] 数据模型各表结构；备份策略说明；Infrastructure & Deployment 节。
- [Source: _bmad-output/implementation-artifacts/7-4-realtime-sync.md] 前序 Story 7.4 的 composable 与 Realtime 约定；更多页未改，本 Story 在 PlaceholderView 增加导出入口。
- [Source: _bmad-output/project-context.md] Supabase 单例、composables 目录、路由与认证约定；测试账号与浏览器自动化注意点。

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

- scripts/backup-db.sh：支持 DATABASE_URL/SUPABASE_DB_URL 或 supabase link 后 `supabase db dump`，输出 _backups/dump_YYYYMMDD_HHmm.sql。
- docs/backup-restore.md：备份/恢复步骤、应用内导出说明、安全注意；恢复脚本以文档示例给出。
- useExportData.ts：10 表分批 range 查询后组装 JSON，触发下载；PlaceholderView 增加「导出数据」入口与 Toast 加载/成功/失败。
- npm run build 与 npm run test -- --run（13 tests）通过。
- CR 修复后复验：`npm run test -- --run`（13 tests）与 `npm run build` 通过。

### Completion Notes List

- Task 1–2：备份脚本 + 恢复文档完成；_backups 已加入 .gitignore。
- Task 3：useExportData 封装导出，PlaceholderView 增加「导出数据」cell 与 handleExportData（LoadingToast/Success/Fail）。
- Task 4：build 与全量测试通过；导出 API 单测 useExportData.spec.ts 覆盖「10 表下载」与「某表失败抛出错误」。
- CR 修复：backup 脚本仅在检测到 `supabase/.temp/project-ref` 时才走 CLI dump，避免“仅有 supabase 目录未 link”导致误判；并显式 `--schema public`。
- CR 修复：导出文件名调整为 AC 约定 `huotong-export-YYYYMMDD-HHmmss.json`，并延迟释放 object URL 提升下载兼容性。
- CR 修复：文档补齐应用内导出覆盖的 10 张表全量清单。

### File List

- scripts/backup-db.sh（新增）
- docs/backup-restore.md（新增）
- .gitignore（修改：增加 _backups/）
- huotong-app/src/composables/useExportData.ts（新增）
- huotong-app/src/views/PlaceholderView.vue（修改：导出数据入口与 Toast）
- huotong-app/tests/api/useExportData.spec.ts（新增）

## Review Results

### Code Review Summary (2026-03-10)

- Reviewer: AI CR Agent
- Scope: Story 7.5 备份脚本、恢复文档、应用内导出与测试覆盖

### Findings

1. **Medium**：`backup-db.sh` 对 Supabase CLI 可用性的判断过宽（仅有 `supabase/` 目录也会尝试 `supabase db dump`），在未 link 场景会直接失败。
   - 处理结果：已修复（改为要求 `supabase/.temp/project-ref` 存在）。
2. **Medium**：导出文件命名与 AC 约定不一致（缺少日期时间分隔 `-`），影响验收一致性。
   - 处理结果：已修复（统一为 `YYYYMMDD-HHmmss`）。
3. **Low**：文档“应用内导出包含表”描述不完整，遗漏明细表名称。
   - 处理结果：已修复（补齐 10 张表）。
