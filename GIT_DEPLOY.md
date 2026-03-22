# Git 平台部署方案

## 方案 1: CloudBase Git 平台部署（推荐尝试）

CloudBase 支持直接从 GitHub/GitLab 导入代码部署。

### 步骤 1: 准备代码

确保代码已推送到 GitHub：
```bash
cd /Users/henry/projects/weight-tracker-app/wechat-miniprogram
git add .
git commit -m "prepare for git deployment"
git push origin main
```

### 步骤 2: 在 CloudBase 控制台找到 Git 部署入口

尝试以下路径：

#### 路径 A: 应用管理 → 创建应用 → 从 Git 导入
```
CloudBase 控制台
    └── 应用管理
            └── 创建应用
                    └── 从 Git 平台导入
                            └── 选择 GitHub
                                    └── 授权并选择仓库
```

#### 路径 B: 云托管 → 新建服务 → 从 Git 导入
```
CloudBase 控制台
    └── 云托管
            └── 新建服务
                    └── 代码来源: 从 Git 仓库导入
```

#### 路径 C: 持续集成/部署
```
CloudBase 控制台
    └── 持续集成
            └── 创建流水线
                    └── 关联 GitHub 仓库
```

### 步骤 3: 配置构建设置

选择 Git 仓库后，配置：

| 配置项 | 值 |
|--------|-----|
| 构建命令 | `npm install && npm run build` |
| 启动命令 | `npm start` |
| 输出目录 | `.next/standalone` 或 `.` |
| 监听端口 | `3000` |

### 步骤 4: 添加环境变量

在部署配置中添加：
```
DB_TYPE=cloudbase
CLOUDBASE_ENV_ID=weight-tracker-1ghr085dd7d6cff2
NODE_ENV=production
PORT=3000
```

---

## 方案 2: Vercel Git 部署（最简单）

Vercel 是专为前端/Next.js 优化的平台，支持一键 Git 部署。

### 步骤 1: 访问 Vercel

https://vercel.com

### 步骤 2: 导入 GitHub 仓库

1. 点击 "Add New..." → "Project"
2. 选择 "Import Git Repository"
3. 授权 GitHub 账号
4. 选择 `weight-tracker-app` 仓库

### 步骤 3: 配置项目

Vercel 会自动识别 Next.js 项目，配置：

| 配置项 | 值 |
|--------|-----|
| Framework Preset | Next.js |
| Root Directory | `wechat-miniprogram` （因为你的代码在这个子目录）|
| Build Command | `npm run build` |
| Output Directory | `.next` |

### 步骤 4: 添加环境变量

点击 "Environment Variables"，添加：
```
DB_TYPE=cloudbase
CLOUDBASE_ENV_ID=weight-tracker-1ghr085dd7d6cff2
NODE_ENV=production
PORT=3000
```

### 步骤 5: 部署

点击 "Deploy"，等待 2-3 分钟。

部署成功后，Vercel 会给你 `.vercel.app` 域名。

---

## 方案 3: Railway Git 部署（推荐）

Railway 是开发者友好的 PaaS 平台，支持 Git 自动部署。

### 步骤 1: 访问 Railway

https://railway.app

### 步骤 2: 新建项目

1. 点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 选择你的仓库

### 步骤 3: 配置变量

添加环境变量：
```
DB_TYPE=cloudbase
CLOUDBASE_ENV_ID=weight-tracker-1ghr085dd7d6cff2
NODE_ENV=production
PORT=3000
```

### 步骤 4: 自动部署

Railway 会自动检测 package.json 并部署。

部署成功后获得 `.railway.app` 域名。

---

## 方案 4: Render Git 部署

Render 是另一个流行的 PaaS 平台。

### 步骤 1: 访问 Render

https://render.com

### 步骤 2: 创建 Web Service

1. 点击 "New" → "Web Service"
2. 连接 GitHub 仓库
3. 选择 `weight-tracker-app`

### 步骤 3: 配置

| 配置项 | 值 |
|--------|-----|
| Name | weight-tracker-api |
| Root Directory | `wechat-miniprogram` |
| Runtime | Node |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |

### 步骤 4: 添加环境变量

在 "Environment" 标签添加变量。

---

## 方案对比

| 平台 | 费用 | 难度 | 适合 |
|------|------|------|------|
| **CloudBase** | 免费额度 | ⭐⭐⭐ | 腾讯云生态 |
| **Vercel** | 免费（ hobby ）| ⭐ | Next.js 最佳 |
| **Railway** | 免费（ $5/月额度）| ⭐⭐ | 开发者友好 |
| **Render** | 免费 | ⭐⭐ | 简单稳定 |

---

## 推荐方案

### 🥇 首选：Vercel
- 对 Next.js 支持最好
- 完全免费（hobby 计划）
- 全球 CDN 加速
- 自动 HTTPS

### 🥈 备选：Railway
- 免费额度足够小项目
- 支持多种数据库
- 部署简单

---

## 现在执行

### 立即部署到 Vercel（推荐）：

1. 访问 https://vercel.com
2. 用 GitHub 登录
3. 点击 "Add New Project"
4. 导入 `weight-tracker-app` 仓库
5. 配置 Root Directory 为 `wechat-miniprogram`
6. 添加环境变量
7. 点击 Deploy

**需要我一步步截图指导吗？**

或者你已经在 CloudBase 控制台看到了 "从 Git 导入" 的入口？
