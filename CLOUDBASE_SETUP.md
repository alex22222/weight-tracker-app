# CloudBase 数据库迁移指南

本项目已支持在 **Prisma (SQLite)** 和 **CloudBase 数据库**之间无缝切换。

## 当前配置

默认使用 **Prisma + SQLite**（本地文件数据库），无需额外配置即可运行。

## 切换到 CloudBase 数据库

### 前提条件

1. 注册腾讯云账号
2. 开通 CloudBase 云开发环境
3. 获取环境 ID

### 步骤 1: 创建 CloudBase 环境

访问 [CloudBase 控制台](https://tcb.cloud.tencent.com/) 并：

1. 创建新环境或使用现有环境
2. 记录 **环境 ID**（格式：`cloud1-xxx` 或 `your-env-id`）

### 步骤 2: 配置数据库集合

在 CloudBase 控制台中，创建以下集合（collections）：

- `weight_entries` - 存储体重记录
- `users` - 存储用户信息
- `user_settings` - 存储用户设置

### 步骤 3: 配置项目

1. 复制环境配置文件：
```bash
cp .env.example .env.local
```

2. 编辑 `.env.local` 文件：
```env
# 切换到 cloudbase 数据库
DB_TYPE=cloudbase

# 填写你的 CloudBase 环境 ID
CLOUDBASE_ENV_ID=your-env-id-here
```

### 步骤 4: 重新启动服务

```bash
npm run dev
```

## 数据库架构

### weight_entries 集合

```json
{
  "_id": "string",
  "weight": "number",
  "note": "string (optional)",
  "date": "timestamp",
  "createdAt": "timestamp",
  "_openid": "string (optional - 用户标识)"
}
```

### users 集合

```json
{
  "_id": "string",
  "username": "string",
  "password": "string (hashed)",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "_openid": "string (optional - 用户标识)"
}
```

### user_settings 集合

```json
{
  "_id": "string",
  "height": "number",
  "targetWeight": "number",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "_openid": "string (optional - 用户标识)"
}
```

## 安全规则配置

### weight_entries 集合

```javascript
{
  "read": true,
  "write": true
}
```

### users 集合

```javascript
{
  "read": true,
  "write": true
}
```

### user_settings 集合

```javascript
{
  "read": true,
  "write": true
}
```

> **注意**: 生产环境应配置更严格的安全规则，限制数据访问权限。

## 开发说明

### 数据库适配器

项目使用数据库适配器模式 (`src/lib/db-adapter.ts`)，支持在不修改业务代码的情况下切换数据库。

### 当前使用的数据库

可以通过以下方式查看当前使用的数据库类型：

```typescript
import { CURRENT_DB } from '@/lib/db-adapter'

console.log(`当前数据库: ${CURRENT_DB}`) // "prisma" 或 "cloudbase"
```

## 故障排除

### 问题 1: 无法连接到 CloudBase

**症状**: API 请求失败，提示环境 ID 错误

**解决方案**:
1. 检查 `.env.local` 中的 `CLOUDBASE_ENV_ID` 是否正确
2. 确认 CloudBase 环境已开通
3. 检查网络连接

### 问题 2: 权限不足

**症状**: 数据库操作失败，提示权限错误

**解决方案**:
1. 在 CloudBase 控制台检查集合的安全规则
2. 确保已启用读写权限
3. 如果使用用户认证，配置 `_openid` 字段权限

### 问题 3: 数据迁移

如果需要将现有 SQLite 数据迁移到 CloudBase，可以使用数据导出/导入工具或编写迁移脚本。

## 技术支持

- CloudBase 文档: https://docs.cloudbase.net/
- 腾讯云控制台: https://cloud.tencent.com/
