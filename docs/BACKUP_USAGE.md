# L1 全量备份使用指南

## 环境变量

```bash
# 数据库文件路径
DATABASE_URL=file:./prisma/dev.db

# 备份存储目录（默认: ./backups）
BACKUP_DIR=./backups

# 备份保留天数（默认: 30）
BACKUP_RETENTION_DAYS=30
```

## 手动执行备份

```bash
# SQLite 开发环境
node scripts/backup-database.js

# CloudBase 生产环境
NODE_ENV=production \
  CLOUDBASE_ENV_ID=xxx \
  CB_SECRET_ID=xxx \
  CB_SECRET_KEY=xxx \
  node scripts/backup-database.js
```

## 自动定时任务

### GitHub Actions（推荐）

项目已配置 `.github/workflows/backup-database.yml`：
- **自动执行**: 每2天北京时间 03:00 (UTC 19:00)
- **手动触发**: Actions → L1 Full Database Backup → Run workflow
- **备份保留**: GitHub Artifacts 保留 30 天

### Linux/macOS Cron

```bash
crontab -e

# 每2天凌晨 3 点执行
0 3 */2 * * cd /path/to/app && node scripts/backup-database.js >> logs/backup.log 2>&1
```

### Windows 任务计划程序

创建任务，每2天执行一次：
```
node scripts/backup-database.js
```

## 数据恢复

### SQLite 恢复

```bash
# 从数据库文件恢复
node scripts/restore-database.js backups/2026-05-11

# 从 SQL 转储恢复
node scripts/restore-database.js backups/2026-05-11/dev_xxx.sql --from-sql
```

### CloudBase 恢复

```bash
NODE_ENV=production \
  CLOUDBASE_ENV_ID=xxx \
  CB_SECRET_ID=xxx \
  CB_SECRET_KEY=xxx \
  node scripts/restore-database.js backups/2026-05-11 --cloudbase
```

⚠️ 恢复脚本会要求 `yes/no` 确认，并自动备份当前数据库后再覆盖。

## 备份目录结构

```
backups/
├── 2026-05-11/
│   ├── dev_2026-05-11T03-00-00-000Z.db     # SQLite 数据库副本
│   ├── dev_2026-05-11T03-00-00-000Z.sql     # SQL 转储文件
│   └── backup-meta.json                      # 备份元数据
├── 2026-05-09/
│   ├── users.json
│   ├── weight_entries.json
│   ├── ...
│   └── backup-meta.json
├── 2026-05-07/
│   └── ...
└── 2026-04-01/      # 月度归档（保留）
    └── ...
```

## 故障排查

**备份失败**

1. 检查数据库文件是否存在
   ```bash
   ls -la prisma/dev.db
   ```

2. 检查备份目录权限
   ```bash
   mkdir -p backups && chmod 755 backups
   ```

3. 检查 CloudBase 凭证
   ```bash
   node -e "console.log('CB_SECRET_ID:', !!process.env.CB_SECRET_ID)"
   ```

**恢复失败**

1. 检查备份文件完整性
   ```bash
   sqlite3 backups/2026-05-11/dev_xxx.db "SELECT COUNT(*) FROM sqlite_master;"
   ```

2. 检查目标数据库权限
   ```bash
   ls -la prisma/dev.db
   ```
