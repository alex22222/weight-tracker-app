# 腾讯云 CloudBase 部署完整指南

## 部署方式选择

本项目支持三种部署方式：

| 方式 | 适用场景 | 复杂度 | 推荐度 |
|------|----------|--------|--------|
| **Docker 部署** | 生产环境 | 中 | ⭐⭐⭐⭐⭐ |
| **GitHub Actions 自动部署** | CI/CD 流程 | 中 | ⭐⭐⭐⭐⭐ |
| **CLI 手动部署** | 测试/调试 | 低 | ⭐⭐⭐ |

---

## 方式一：Docker 部署（推荐）

### 1. 本地构建并推送镜像

```bash
# 1. 确保 Docker 已安装
docker --version

# 2. 登录腾讯云容器镜像服务 (TCR)
# 在腾讯云控制台创建命名空间和镜像仓库后执行：
docker login ccr.ccs.tencentyun.com --username=<你的腾讯云账号ID>

# 3. 构建镜像
docker build -t weight-tracker-api:latest .

# 4. 标记镜像
docker tag weight-tracker-api:latest ccr.ccs.tencentyun.com/<命名空间>/weight-tracker-api:latest

# 5. 推送镜像
docker push ccr.ccs.tencentyun.com/<命名空间>/weight-tracker-api:latest
```

### 2. 在 CloudBase 控制台部署

1. 登录 [CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 选择环境 `weight-tracker-1ghr085dd7d6cff2`
3. 进入「云托管 (CloudRun)」
4. 点击「新建服务」
5. 选择「使用镜像部署」
6. 配置参数：
   - **服务名称**: `weight-tracker-api`
   - **镜像**: 选择你推送的镜像地址
   - **端口**: `3000`
   - **实例规格**: 0.25 CPU / 0.5 GiB 内存（可根据需求调整）
   - **自动扩缩容**: 最小 0 实例，最大 10 实例
   - **环境变量**:
     ```
     DB_TYPE=cloudbase
     CLOUDBASE_ENV_ID=weight-tracker-1ghr085dd7d6cff2
     TENCENTCLOUD_SECRETID=<你的 SecretId>
     TENCENTCLOUD_SECRETKEY=<你的 SecretKey>
     NODE_ENV=production
     PORT=3000
     ```

---

## 方式二：GitHub Actions 自动部署

### 1. 配置 GitHub Secrets

在 GitHub 仓库设置中添加以下 Secrets：

| Secret Name | 说明 | 获取方式 |
|-------------|------|----------|
| `TENCENT_CLOUD_SECRET_ID` | 腾讯云 API 密钥 ID | [API 密钥管理](https://console.cloud.tencent.com/cam/capi) |
| `TENCENT_CLOUD_SECRET_KEY` | 腾讯云 API 密钥 | [API 密钥管理](https://console.cloud.tencent.com/cam/capi) |
| `CLOUDBASE_ENV_ID` | CloudBase 环境 ID | CloudBase 控制台 |
| `TCR_USERNAME` | 容器镜像仓库用户名 | 腾讯云账号 ID |
| `TCR_PASSWORD` | 容器镜像仓库密码 | 腾讯云 API 密钥 |

### 2. 创建工作流文件

已创建 `.github/workflows/deploy.yml`，包含以下步骤：

1. 代码检出
2. 设置 Docker Buildx
3. 登录腾讯云容器镜像服务
4. 构建并推送镜像
5. 部署到 CloudBase CloudRun

### 3. 触发部署

```bash
# 推送代码到 main 分支自动触发
git add .
git commit -m "feat: deploy to tencent cloud"
git push origin main
```

---

## 方式三：CLI 手动部署

### 1. 安装 CloudBase CLI

```bash
# 全局安装
npm install -g @cloudbase/cli

# 登录
cloudbase login
```

### 2. 初始化项目（如未初始化）

```bash
cloudbase init
```

### 3. 部署

```bash
# 部署云函数（如有）
cloudbase functions:deploy

# 部署云托管服务
cloudbase cloudrun:deploy \
  --service weight-tracker-api \
  --env-id weight-tracker-1ghr085dd7d6cff2 \
  --port 3000
```

---

## 环境变量配置

### 必需的环境变量

```bash
# 数据库类型: prisma 或 cloudbase
DB_TYPE=cloudbase

# CloudBase 环境 ID
CLOUDBASE_ENV_ID=weight-tracker-1ghr085dd7d6cff2

# 腾讯云 API 凭证（用于服务端访问 CloudBase）
TENCENTCLOUD_SECRETID=<你的 SecretId>
TENCENTCLOUD_SECRETKEY=<你的 SecretKey>

# Node.js 环境
NODE_ENV=production
PORT=3000
```

### 可选的环境变量

```bash
# 微信小程序配置（用于微信登录）
WECHAT_APPID=<小程序 AppID>
WECHAT_SECRET=<小程序 AppSecret>

# JWT 密钥（用于 Token 签名）
JWT_SECRET=<随机字符串>

# 日志级别
LOG_LEVEL=info
```

---

## 数据库初始化

### 1. CloudBase 数据库集合

确保以下集合已创建：

```javascript
// 使用 CloudBase CLI 创建集合
cloudbase database:create weight_entries
cloudbase database:create users
cloudbase database:create user_settings
cloudbase database:create messages
cloudbase database:create friends
cloudbase database:create fitness_channels
cloudbase database:create channel_members
cloudbase database:create channel_comments
cloudbase database:create check_ins
cloudbase database:create leave_requests
```

### 2. 创建管理员账号

部署后访问初始化接口：

```bash
curl -X POST https://<你的服务域名>/api/admin/init
```

或在 CloudBase 控制台直接操作数据库创建管理员用户。

---

## 验证部署

### 1. 健康检查

```bash
# 测试健康接口
curl https://<你的服务域名>/api/health

# 预期响应
{"status":"ok","timestamp":"2024-01-20T10:30:00.000Z"}
```

### 2. API 测试

```bash
# 测试登录接口
curl -X POST https://<你的服务域名>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 3. 日志查看

在 CloudBase 控制台查看：
1. 进入「云托管 (CloudRun)」
2. 选择服务 `weight-tracker-api`
3. 点击「日志」查看实时日志

---

## 域名配置

### 1. 绑定自定义域名（可选）

1. 在 CloudBase 控制台进入「云托管」
2. 选择服务 → 「服务设置」
3. 点击「添加域名」
4. 按指引配置 DNS 解析

### 2. 配置 HTTPS

CloudBase 自动提供 HTTPS 证书，无需额外配置。

---

## 监控与告警

### 1. 基础监控

CloudBase 控制台提供：
- CPU/内存使用率
- 请求量/QPS
- 响应时间
- 错误率

### 2. 配置告警

1. 进入 CloudBase 控制台「告警管理」
2. 创建告警策略：
   - 条件：CPU 使用率 > 80%
   - 通知方式：短信/邮件/微信

---

## 常见问题

### Q1: 部署失败，提示 "image pull failed"

**解决**：
- 检查镜像是否正确推送到 TCR
- 确认 CloudRun 有权限拉取镜像
- 检查镜像标签是否正确

### Q2: 服务启动后无法访问

**解决**：
- 检查健康检查接口 `/api/health` 是否正常
- 查看日志确认服务启动无错误
- 确认端口配置正确（默认 3000）

### Q3: 数据库连接失败

**解决**：
- 确认 `DB_TYPE` 设置为 `cloudbase`
- 检查 `CLOUDBASE_ENV_ID` 是否正确
- 确认 `TENCENTCLOUD_SECRETID/SECRETKEY` 有权限访问数据库

### Q4: 微信小程序无法访问 API

**解决**：
- 在小程序管理后台配置 request 合法域名
- 确保域名支持 HTTPS
- 检查 CORS 配置（如需跨域）

---

## 回滚操作

如部署失败，可在 CloudBase 控制台：
1. 进入「云托管」→ 「版本管理」
2. 选择上一个正常版本
3. 点击「回滚到此版本」

---

## 成本估算

以最小配置（0.25 CPU / 0.5 GiB）为例：

| 资源 | 单价 | 月费用（按 24h 运行） |
|------|------|----------------------|
| CPU | ¥0.0001/核/秒 | ~¥65 |
| 内存 | ¥0.0001/GiB/秒 | ~¥130 |
| 出网流量 | ¥0.8/GB | 按实际使用 |
| **总计** | - | **~¥200/月** |

> 注：实际费用取决于请求量和运行时长。设置最小实例数为 0 可大幅降低成本（无请求时不计费）。

---

## 后续优化建议

1. **性能优化**
   - 启用 CloudBase CDN 加速静态资源
   - 配置 Redis 缓存（CloudBase 提供）
   - 开启数据库索引优化查询

2. **安全加固**
   - 配置 WAF 防护
   - 启用请求频率限制
   - 定期轮换 API 密钥

3. **高可用**
   - 配置多可用区部署
   - 设置自动扩缩容策略
   - 配置数据库备份

---

## 相关文档

- [CloudBase 官方文档](https://docs.cloudbase.net/)
- [CloudRun 使用指南](https://docs.cloudbase.net/run/intro.html)
- [腾讯云 API 密钥管理](https://console.cloud.tencent.com/cam/capi)
- [项目质量评估报告](./QUALITY_ASSESSMENT_REPORT.md)
