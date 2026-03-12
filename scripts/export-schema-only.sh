#!/usr/bin/env bash
# 货通（HuoTong）数据库结构导出脚本
# 开发阶段无有效业务数据时，优先使用 schema-only 导出，便于迁移到新的 Supabase 环境。
# 使用方式一：Supabase CLI（需先执行 supabase link）
# 使用方式二：pg_dump（需设置环境变量 DATABASE_URL 或 SUPABASE_DB_URL）
# 输出目录：_backups/schema_YYYYMMDD_HHmm.sql

set -e
OUTPUT_DIR="_backups"
TIMESTAMP=$(date +%Y%m%d_%H%M)
OUTPUT_FILE="${OUTPUT_DIR}/schema_${TIMESTAMP}.sql"
mkdir -p "$OUTPUT_DIR"

if [ -n "$SUPABASE_DB_URL" ]; then
  echo "Using pg_dump --schema-only with SUPABASE_DB_URL..."
  pg_dump "$SUPABASE_DB_URL" --schema=public --schema-only --no-owner --no-acl -f "$OUTPUT_FILE"
elif [ -n "$DATABASE_URL" ]; then
  echo "Using pg_dump --schema-only with DATABASE_URL..."
  pg_dump "$DATABASE_URL" --schema=public --schema-only --no-owner --no-acl -f "$OUTPUT_FILE"
elif command -v supabase &>/dev/null && [ -f "supabase/.temp/project-ref" ]; then
  echo "Using supabase db dump --schema-only (linked project)..."
  supabase db dump --schema public --schema-only -f "$OUTPUT_FILE"
else
  echo "错误：请先配置导出方式之一："
  echo "  1) 在项目根执行 'supabase link'（生成 supabase/.temp/project-ref）后直接运行本脚本；或"
  echo "  2) 设置环境变量 DATABASE_URL 或 SUPABASE_DB_URL"
  echo "     export DATABASE_URL='postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres'"
  exit 1
fi

echo "数据库结构已导出: $OUTPUT_FILE"
ls -la "$OUTPUT_FILE"
