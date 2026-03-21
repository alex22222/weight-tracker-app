# 腾讯云部署方案总结

## 📋 生成的部署文件

本次更新生成了以下部署相关文件：

| 文件 | 说明 | 优先级 |
|------|------|--------|
| `TENCENT_CLOUD_DEPLOYMENT.md` | 完整部署指南 | ⭐⭐⭐⭐⭐ |
| `QUICK_START_DEPLOY.md` | 5 分钟快速部署 | ⭐⭐⭐⭐⭐ |
| `DEPLOYMENT_CHECKLIST.md` | 部署检查清单 | ⭐⭐⭐⭐ |
| `.github/workflows/deploy.yml` | GitHub Actions 自动部署 | ⭐⭐⭐⭐⭐ |
| `scripts/verify-build.sh` | 本地构建验证脚本 | ⭐⭐⭐⭐ |

---

## 🚀 快速开始（推荐）

### 方式一：GitHub Actions 自动部署（最简单）

```bash
# 1. 配置 GitHub Secrets（一次性设置）
# 详见 QUICK_START_DEPLOY.md

# 2. 推送代码自动部署
git add .
git commit -m "deploy: deploy to tencent cloud"
git push origin main

# 3. 在 GitHub Actions 查看部署状态
```

### 方式二：本地 Docker 构建

```bash
# 1. 验证构建
./scripts/verify-build.sh

# 2. 登录腾讯云镜像仓库
docker login ccr.ccs.tencentyun.com --username=<账号ID>

# 3. 构建并推送
docker build -t weight-tracker-api:latest .
docker tag weight-tracker-api:latest ccr.ccs.tencentyun.com/<命名空间>/weight-tracker-api:latest
docker push ccr.ccs.tencentyun.com/<命名空间>/weight-tracker-api:latest

# 4. 在 CloudBase 控制台部署镜像
```

---

## 📖 文档阅读顺序

1. **首次部署**: 
   - [QUICK_START_DEPLOY.md](./QUICK_START_DEPLOY.md) - 5 分钟快速上手
   - [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - 逐项检查

2. **遇到问题**:
   - [TENCENT_CLOUD_DEPLOYMENT.md](./TENCENT_CLOUD_DEPLOYMENT.md) - 详细故障排查
   - [QUALITY_ASSESSMENT_REPORT.md](./QUALITY_ASSESSMENT_REPORT.md) - 项目质量报告

3. **日常维护**:
   - 查看 GitHub Actions 运行状态
   - 使用 CloudBase 控制台监控服务

---

## 🔧 部署前准备

### 1. 腾讯云资源

- [x] CloudBase 环境已创建: `weight-tracker-1ghr085dd7d6cff2`
- [ ] 容器镜像服务命名空间（需创建）
- [ ] API 密钥（需创建）

### 2. GitHub 配置

- [ ] 配置 6 个 Secrets（详见 QUICK_START_DEPLOY.md）
- [ ] 确认工作流文件已提交

### 3. 代码检查

```bash
# 运行验证脚本
./scripts/verify-build.sh

# 预期输出：
# ✓ Node.js 版本: v18.x.x
# ✓ 依赖安装完成
# ✓ Prisma 客户端已生成
# ✓ 构建成功
# ✓ Standalone 构建成功
```

---

## 🌐 部署后配置

### 微信小程序

```javascript
// weapp/config.js
module.exports = {
  apiBaseUrl: 'https://<你的CloudRun域名>/api'
}
```

### 环境变量

CloudBase CloudRun 中配置的环境变量：

```bash
DB_TYPE=cloudbase
CLOUDBASE_ENV_ID=weight-tracker-1ghr085dd7d6cff2
TENCENTCLOUD_SECRETID=<SecretId>
TENCENTCLOUD_SECRETKEY=<SecretKey>
NODE_ENV=production
PORT=3000
```

---

## 📊 部署流程图

```
┌─────────────────────────────────────────────────────────────┐
│                        开始部署                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  1. 本地验证                                                  │
│     ./scripts/verify-build.sh                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. 选择部署方式                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ GitHub       │  │ Docker       │  │ CLI          │      │
│  │ Actions      │  │ Build        │  │ Manual       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. 构建 Docker 镜像                                           │
│     docker build -t weight-tracker-api .                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4. 推送镜像到 TCR                                            │
│     docker push ccr.ccs.tencentyun.com/.../weight-tracker-api│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  5. 部署到 CloudBase CloudRun                                 │
│     自动/手动更新服务                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  6. 验证部署                                                   │
│     curl https://<域名>/api/health                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        部署完成 ✓                            │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚠️ 常见问题

### 构建阶段

| 问题 | 解决方案 |
|------|----------|
| `generate is not a function` | 清理环境变量 `unset __NEXT_PRIVATE_STANDALONE_CONFIG` |
| `Cannot find module tailwindcss` | 运行 `./fix-all-issues.sh` |
| Prisma 生成失败 | 检查 `prisma/schema.prisma` 语法 |

### 部署阶段

| 问题 | 解决方案 |
|------|----------|
| GitHub Actions 失败 | 检查 Secrets 配置 |
| 镜像推送失败 | 检查 TCR 登录凭证 |
| 服务启动失败 | 查看 CloudBase 日志 |
| API 返回 500 | 检查环境变量配置 |

### 运行阶段

| 问题 | 解决方案 |
|------|----------|
| 数据库连接失败 | 检查 `DB_TYPE` 和 `CLOUDBASE_ENV_ID` |
| 微信登录失败 | 检查小程序 AppID/Secret |
| 性能问题 | 调整 CPU/内存配置 |

---

## 💰 成本优化建议

### 开发/测试环境

```yaml
# 最小成本配置
min-num: 0          # 无请求时 0 实例
max-num: 2          # 最多 2 实例
cpu: 0.25           # 最小 CPU
mem: 0.5            # 最小内存
```

**预估成本**: ¥0-50/月（取决于请求量）

### 生产环境

```yaml
# 稳定运行配置
min-num: 1          # 至少 1 实例（避免冷启动）
max-num: 10         # 根据流量调整
cpu: 0.5            # 适当提升
cpu: 1.0            # 根据负载调整
```

**预估成本**: ¥100-500/月（取决于流量）

---

## 🔐 安全建议

1. **密钥管理**
   - 定期轮换腾讯云 API 密钥
   - 使用 GitHub Secrets 管理敏感信息
   - 不要在代码中硬编码密钥

2. **网络安全**
   - 启用 HTTPS（CloudBase 自动提供）
   - 配置 CORS 白名单
   - 考虑启用 WAF

3. **数据安全**
   - 定期备份数据库
   - 敏感数据加密存储
   - 配置访问控制

---

## 📞 获取帮助

### 自助排查

1. 查看 GitHub Actions 日志
2. 查看 CloudBase 服务日志
3. 运行 `./scripts/verify-build.sh` 检查本地构建

### 官方文档

- [CloudBase 文档](https://docs.cloudbase.net/)
- [CloudRun 指南](https://docs.cloudbase.net/run/intro.html)
- [腾讯云 API](https://cloud.tencent.com/document/api)

### 社区支持

- 提交 GitHub Issue
- 腾讯云工单系统

---

## ✅ 部署成功标志

当你看到以下输出时，表示部署成功：

```bash
# 健康检查
curl https://<your-domain>/api/health
{"status":"ok","timestamp":"2024-01-20T10:30:00.000Z"}

# 登录测试
curl -X POST https://<your-domain>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
{"token":"eyJ...","user":{"id":1,"username":"admin"}}
```

---

## 🎉 恭喜！

完成部署后，你的体重追踪应用就运行在腾讯云上了！

**下一步**：
- 配置自定义域名
- 设置监控告警
- 优化小程序体验
- 邀请用户试用

---

*最后更新: 2024-03-21*
