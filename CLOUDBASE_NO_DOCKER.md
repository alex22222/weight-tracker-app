# CloudBase 非 Docker 部署方案（推荐）

## 问题分析

Docker 部署复杂，容易出现：
- 端口映射问题
- 健康检查失败
- 文件路径问题
- 内存限制问题

## 推荐：使用 CloudBase 原生 Node.js 运行环境

### 步骤 1: 在 CloudBase 控制台

1. 进入 **「云托管」** → **「新建服务」**
2. 选择 **「不使用 Dockerfile」** 或 **「自定义构建」**

### 步骤 2: 配置构建

| 配置项 | 值 |
|--------|-----|
| **运行环境** | Node.js 18 |
| **构建命令** | `npm install --legacy-peer-deps && npx prisma generate && npm run build` |
| **启动命令** | `npm start` |
| **监听端口** | `3000` |

### 步骤 3: 上传代码

上传 `deploy-fixed.zip` 文件

### 步骤 4: 环境变量

```
DB_TYPE=cloudbase
CLOUDBASE_ENV_ID=weight-tracker-1ghr085dd7d6cff2
NODE_ENV=production
PORT=3000
```

### 步骤 5: 健康检查配置

| 配置项 | 值 |
|--------|-----|
| **健康检查端口** | `3000` |
| **健康检查路径** | `/api/health` |
| **协议** | HTTP |

### 步骤 6: 部署

点击「开始部署」

---

## 备选：使用 CloudBase Framework

在本地执行：
```bash
cd /Users/henry/projects/weight-tracker-app/wechat-miniprogram

# 安装 CLI
npm install -g @cloudbase/cli

# 登录
cloudbase login

# 直接部署（使用 cloudbase.json 配置）
cloudbase deploy
```

---

## 最简方案：使用 Vercel

如果 CloudBase 持续失败，建议使用 Vercel：

```bash
npm install -g vercel
vercel login
vercel --prod
```

5分钟搞定，自动配置健康检查和 HTTPS。

---

## 建议

**立即停止 Docker 方案**，改用：
1. CloudBase 原生 Node.js 运行环境（非 Docker）
2. 或 Vercel 一键部署

这样可以避免 Docker 的所有配置问题！
