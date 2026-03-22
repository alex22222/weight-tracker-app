# CI/CD 配置指南

本文档介绍如何配置 GitHub Actions 自动部署到腾讯云 CloudBase。

## 📁 工作流文件

| 文件 | 触发条件 | 功能 |
|------|---------|------|
| `deploy-backend.yml` | Push 到 main/master，修改后端代码 | 自动部署后端到 CloudRun |
| `deploy-weapp.yml` | Push 到 main/master，修改小程序代码 | 自动上传小程序代码 |
| `init-database.yml` | 手动触发 | 初始化 CloudBase 数据库 |
| `pr-check.yml` | 提交 Pull Request | 代码检查和构建测试 |

## 🔐 必要的 Secrets

在 GitHub 仓库 Settings → Secrets and variables → Actions 中添加以下密钥：

### 必需配置

| Secret 名称 | 获取方式 | 说明 |
|------------|---------|------|
| `CLOUDBASE_ENV_ID` | CloudBase 控制台 | 云开发环境 ID，如 `cloud1-xxx` |
| `TENCENTCLOUD_SECRETID` | 腾讯云控制台 → API密钥管理 | 腾讯云 SecretId |
| `TENCENTCLOUD_SECRETKEY` | 腾讯云控制台 → API密钥管理 | 腾讯云 SecretKey |

### 小程序部署（可选）

| Secret 名称 | 获取方式 | 说明 |
|------------|---------|------|
| `WECHAT_APPID` | 微信公众平台 | 小程序 AppID |
| `WECHAT_PRIVATE_KEY` | 微信公众平台 → 开发 → 开发设置 | 下载的代码上传密钥 |

## 🚀 快速配置步骤

### 1. 获取腾讯云 API 密钥

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 访问「访问管理」→「API 密钥管理」
3. 创建新的密钥对
4. 复制 `SecretId` 和 `SecretKey`

### 2. 配置 GitHub Secrets

```bash
# 在 GitHub 仓库页面操作：
# Settings → Secrets and variables → Actions → New repository secret

CLOUDBASE_ENV_ID=your-env-id-here
TENCENTCLOUD_SECRETID=your-secret-id
TENCENTCLOUD_SECRETKEY=your-secret-key
```

### 3. 获取小程序上传密钥（如需自动部署小程序）

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 开发 → 开发设置 → 代码上传密钥
3. 生成并下载密钥文件
4. 将密钥内容复制到 `WECHAT_PRIVATE_KEY` Secret

## 📝 工作流程说明

### 后端自动部署

当以下文件变更并推送到 `main` 分支时，自动触发部署：

```yaml
paths:
  - 'src/**'
  - 'package*.json'
  - 'next.config.js'
  - 'Dockerfile'
  - 'prisma/**'
```

部署流程：
1. 检出代码
2. 安装 Node.js 依赖
3. 运行测试（如有）
4. 构建 Next.js 项目
5. 安装 CloudBase CLI
6. 登录腾讯云
7. 部署到 CloudRun

### 小程序自动部署

当 `weapp/**` 目录变更时，自动触发：

- **非 main 分支**: 上传为预览版
- **main 分支**: 上传为体验版/正式版

### 手动初始化数据库

```bash
# 在 GitHub 仓库页面操作：
# Actions → Initialize CloudBase Database → Run workflow
```

## 🔄 部署状态通知

部署完成后，GitHub Actions 会在 Commit 下添加评论：

- ✅ Backend deployed successfully
- ❌ Deployment failed

## 🛠️ 本地测试工作流

使用 [act](https://github.com/nektos/act) 本地测试：

```bash
# 安装 act
brew install act

# 测试 PR 检查
act pull_request

# 测试部署（需要设置 secrets）
act push --secret-file .secrets
```

## 🐛 故障排查

### 部署失败：权限错误

```
Error: 没有权限执行此操作
```

**解决方案**：
1. 检查 `TENCENTCLOUD_SECRETID` 和 `TENCENTCLOUD_SECRETKEY` 是否正确
2. 确认密钥有 CloudBase 操作权限
3. 在腾讯云控制台检查密钥状态

### 部署失败：环境不存在

```
Error: 环境不存在
```

**解决方案**：
1. 检查 `CLOUDBASE_ENV_ID` 是否正确
2. 确认环境已开通 CloudRun 服务

### 构建失败

```
Error: Build failed
```

**解决方案**：
1. 检查 `next.config.js` 配置
2. 确认所有依赖已正确安装
3. 本地运行 `npm run build` 测试

### 小程序上传失败

```
Error: 代码上传失败
```

**解决方案**：
1. 检查 `WECHAT_APPID` 和 `WECHAT_PRIVATE_KEY`
2. 确认密钥未过期
3. 检查小程序代码大小限制（2MB）

## 📚 相关文档

- [CloudBase CLI 文档](https://docs.cloudbase.net/cli/intro)
- [GitHub Actions 文档](https://docs.github.com/cn/actions)
- [微信小程序 CI 文档](https://developers.weixin.qq.com/miniprogram/dev/devtools/ci.html)

## 💡 最佳实践

1. **保护密钥**: 永远不要将密钥提交到代码仓库
2. **分支保护**: 为 `main` 分支启用保护规则，要求 PR 通过检查
3. **版本管理**: 使用语义化版本号（如 1.2.3）
4. **回滚准备**: 保留历史版本，便于快速回滚
5. **监控告警**: 配置部署失败通知（邮件/钉钉/企业微信）
