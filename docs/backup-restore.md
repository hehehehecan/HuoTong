# 货通（HuoTong）数据备份与恢复

## 概述

- **备份**：将 Supabase PostgreSQL 的 public schema 导出为 SQL 文件，便于定期归档或灾难恢复。
- **恢复**：使用备份的 SQL 文件将数据库恢复到备份时的状态（会覆盖当前数据，仅建议在测试环境或灾难恢复时使用）。
- **应用内导出**：在「更多」页点击「导出数据」可下载当前业务数据的 JSON 副本（商品、客户、供应商、出货单、进货单、应收、应付、库存变动），供本地留档或迁移参考。

Supabase 免费版不提供自动备份，需定期手动执行备份脚本或通过 cron 调度。

---

## 备份

### 方式一：Supabase CLI（推荐，已 link 项目时）

1. 安装 [Supabase CLI](https://supabase.com/docs/guides/cli)。
2. 在项目根目录执行 `supabase link`，按提示选择项目并输入数据库密码。
3. 执行备份脚本：
   ```bash
   chmod +x scripts/backup-db.sh
   ./scripts/backup-db.sh
   ```
4. 备份文件生成在 `_backups/dump_YYYYMMDD_HHmm.sql`。

### 方式二：pg_dump + 连接串

1. 在 Supabase Dashboard → **Project Settings** → **Database** 获取连接串（Connection string），格式示例：
   ```text
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
2. 设置环境变量并执行脚本（请勿将含密码的 URL 提交到 Git）：
   ```bash
   export DATABASE_URL='postgresql://postgres.xxx:yourpassword@aws-0-xx.pooler.supabase.com:6543/postgres'
   ./scripts/backup-db.sh
   ```
3. 备份文件同样输出到 `_backups/dump_YYYYMMDD_HHmm.sql`。

### 建议备份频率

- 开发/测试：按需手动执行。
- 生产：建议每日或每周执行一次，可通过 cron 调用 `scripts/backup-db.sh`，并将 `_backups/` 目录同步到外部存储（如云盘或对象存储）。

---

## 恢复

恢复会**覆盖**当前数据库中的数据，仅限灾难恢复或测试环境使用。生产恢复前请务必确认备份文件与目标环境。

### 使用 psql

1. 获取数据库连接串（同上）。
2. 若需清空当前 public schema 再导入（可选，谨慎使用）：
   ```sql
   -- 在 Supabase SQL Editor 或 psql 中执行前请确认环境
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   GRANT ALL ON SCHEMA public TO postgres;
   GRANT ALL ON SCHEMA public TO public;
   ```
3. 使用备份文件恢复：
   ```bash
   psql "$DATABASE_URL" -f _backups/dump_YYYYMMDD_HHmm.sql
   ```

### 使用 Supabase Dashboard

1. 打开 Supabase Dashboard → **SQL Editor**。
2. 将备份 SQL 文件内容粘贴到编辑器（若文件过大可分段执行或使用 psql）。
3. 执行前请确认当前项目为测试/恢复用，避免覆盖生产数据。

### 可选：恢复脚本

若需一键恢复，可复制并修改以下示例（请勿将含密码的 URL 写入脚本或提交到仓库）：

```bash
# scripts/restore-db.sh 示例
# 用法: RESTORE_FILE=_backups/dump_20260101_1200.sql ./scripts/restore-db.sh
if [ -z "$RESTORE_FILE" ] || [ ! -f "$RESTORE_FILE" ]; then
  echo "请设置 RESTORE_FILE 为备份 SQL 文件路径"
  exit 1
fi
if [ -z "$DATABASE_URL" ]; then
  echo "请设置 DATABASE_URL"
  exit 1
fi
psql "$DATABASE_URL" -f "$RESTORE_FILE"
```

---

## 应用内「导出数据」

- 路径：**更多**（Tab 栏）→ **导出数据**。
- 行为：将当前用户可见的业务数据（遵守 RLS）导出为 JSON 并触发浏览器下载，文件名形如 `huotong-export-YYYYMMDD-HHmmss.json`。
- 包含表：`products`、`customers`、`suppliers`、`sale_orders`、`sale_order_items`、`purchase_orders`、`purchase_order_items`、`receivables`、`payables`、`stock_logs`。
- 用途：本地留档、迁移参考；完整库级备份仍建议使用上述 SQL 备份脚本。

---

## 安全与注意事项

- 备份脚本和文档中不要提交数据库密码或带密码的 `DATABASE_URL`；使用环境变量或本地 `.env`（并加入 `.gitignore`）。
- `_backups/` 目录建议加入 `.gitignore`，避免将 SQL 备份文件提交到仓库。
- 恢复前请确认备份文件与目标环境一致，避免误覆盖生产数据。
