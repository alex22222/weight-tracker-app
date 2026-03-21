# 腾讯云快速部署指南

> 5 分钟内完成部署到腾讯云 CloudBase

## 前提条件

- GitHub 账号
- 腾讯云账号
- 已安装 Node.js 18+ 和 Docker

---

## 步骤 1: 准备代码（1 分钟）

```bash
# 进入项目目录
cd /Users/henry/projects/weight-tracker-app/wechat-miniprogram

# 确保修复脚本已执行
chmod +x fix-all-issues.sh
./fix-all-issues.sh

# 或者手动构建验证
chmod +x scripts/verify-build.sh
./scripts/verify-build.sh
```

---

## 步骤 2: 配置 GitHub Secrets（2 分钟）

### 2.1 获取腾讯云凭证

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 进入 [API 密钥管理](https://console.cloud.tencent.com/cam/capi)
3. 创建密钥，记录 `SecretId` 和 `SecretKey`

### 2.2 配置容器镜像服务

1. 进入 [容器镜像服务 TCR](https://console.cloud.tencent.com/tcr)
2. 创建个人版实例（如未创建）
3. 创建命名空间，例如 `weight-tracker`
4. 记录命名空间名称

### 2.3 在 GitHub 设置 Secrets

进入 GitHub 仓库 → Settings → Secrets and variables → Actions → New repository secret：

| Secret Name | Value | 说明 |
|-------------|-------|------|
| `TENCENT_CLOUD_SECRET_ID` | AKID... | 腾讯云 API SecretId |
| `TENCENT_CLOUD_SECRET_KEY` | xxx | 腾讯云 API SecretKey |
| `CLOUDBASE_ENV_ID` | weight-tracker-1ghr085dd7d6cff2 | CloudBase 环境 ID |
| `TCR_USERNAME` | 1000xxxxxx | 腾讯云账号 ID（数字） |
| `TCR_PASSWORD` | xxx | 腾讯云 API SecretKey（同上） |
| `TCR_NAMESPACE` | weight-tracker | TCR 命名空间 |

> 💡 提示：TCR 用户名通常是 10 位数字的腾讯云账号 ID，在[账号信息](https://console.cloud.tencent.com/developer)页面查看。

---

## 步骤 3: 推送代码触发部署（1 分钟）

```bash
# 提交所有更改
git add .
git commit -m "deploy: deploy to tencent cloudbase"

# 推送到 main 分支
git push origin main
```

---

## 步骤 4: 查看部署状态（1 分钟）

### 4.1 GitHub Actions

1. 打开 GitHub 仓库页面
2. 点击 Actions 标签
3. 查看 `Deploy to Tencent CloudBase` 工作流运行状态

### 4.2 CloudBase 控制台

1. 登录 [CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 选择环境 `weight-tracker-1ghr085dd7d6cff2`
3. 进入「云托管 (CloudRun)」
4. 查看服务 `weight-tracker-api` 状态

---

## 步骤 5: 验证部署（1 分钟）

### 5.1 获取访问地址

在 CloudBase 控制台 → 云托管 → 服务详情中，找到「访问链接」。

### 5.2 测试健康接口

```bash
# 替换为你的服务地址
SERVICE_URL="https://weight-tracker-api-xxx.gz.apigw.tencentcs.com"

# 测试健康检查
curl "$SERVICE_URL/api/health"

# 预期输出
{"status":"ok","timestamp":"2024-01-20T10:30:00.000Z"}
```

### 5.3 测试登录接口

```bash
curl -X POST "$SERVICE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## 常见问题

### Q: GitHub Actions 运行失败

**检查清单：**
- [ ] 所有 Secrets 已正确配置
- [ ] Secret 名称拼写正确（区分大小写）
- [ ] 腾讯云账号有权限访问 CloudBase 和 TCR
- [ ] TCR 命名空间已创建

**查看日志：**
1. 进入 GitHub Actions 页面
2. 点击失败的工作流运行
3. 查看具体步骤的日志

### Q: 镜像推送成功但部署失败

**可能原因：**
- CloudRun 没有权限拉取镜像
- 服务端口配置错误（应为 3000）
- 环境变量未正确设置

**解决方案：**
1. 在 CloudBase 控制台检查服务日志
2. 确认 Dockerfile 中 `EXPOSE 3000`
3. 检查环境变量 `DB_TYPE` 设置为 `cloudbase`

### Q: 服务启动但 API 返回错误

**排查步骤：**

1. 检查数据库连接：
```bash
curl "$SERVICE_URL/api/health"
# 如果返回错误，检查环境变量配置
```

2. 查看 CloudBase 日志：
   - 进入 CloudBase 控制台
   - 云托管 → 服务 → 日志

3. 检查数据库集合是否存在：
   - CloudBase 控制台 → 数据库
   - 确认所有集合已创建

---

## 手动部署（备选方案）

如果 GitHub Actions 不可用，可以手动部署：

### 方式 1: Docker 本地构建推送

```bash
# 1. 登录 TCR
docker login ccr.ccs.tencentyun.com --username=<腾讯云账号ID>

# 2. 构建
docker build -t weight-tracker-api:latest .

# 3. 标记
docker tag weight-tracker-api:latest \
  ccr.ccs.tencentyun.com/<命名空间>/weight-tracker-api:latest

# 4. 推送
docker push ccr.ccs.tencentyun.com/<命名空间>/weight-tracker-api:latest

# 5. 在 CloudBase 控制台创建服务，选择镜像部署
```

### 方式 2: CloudBase CLI

```bash
# 1. 安装 CLI
npm install -g @cloudbase/cli

# 2. 登录
cloudbase login

# 3. 部署
cloudbase cloudrun:deploy \
  --service weight-tracker-api \
  --env-id weight-tracker-1ghr085dd7d6cff2 \
  --port 3000
```

---

## 部署后配置

### 配置小程序

1. 登录 [微信小程序后台](https://mp.weixin.qq.com/)
2. 开发 → 开发设置 → 服务器域名
3. 添加 `request` 合法域名：你的 CloudRun 访问地址

### 更新小程序代码

编辑 `weapp/config.js`：

```javascript
module.exports = {
  apiBaseUrl: 'https://<你的CloudRun域名>/api'
}
```

---

## 成本说明

### 免费额度

CloudBase 免费版包含：
- 数据库：5GB 存储，每日 10,000 次读取
- 云托管：每月 50,000 次请求
- 流量：每月 1GB 出网流量

### 付费预估

超出免费额度后，以最小配置（0.25 CPU / 0.5 GiB）：
- 持续运行：约 ¥200/月
- 按量计费（无请求时 0 实例）：约 ¥50-100/月

> 💡 建议：开发测试阶段设置最小实例数为 0，生产环境根据需要调整。

---

## 下一步

- [ ] 配置自定义域名
- [ ] 启用 HTTPS 证书
- [ ] 配置监控告警
- [ ] 设置自动扩缩容
- [ ] 优化数据库性能

---

## 获取帮助

- 📖 完整部署文档：[TENCENT_CLOUD_DEPLOYMENT.md](./TENCENT_CLOUD_DEPLOYMENT.md)
- ✅ 部署检查清单：[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- 🔧 构建验证脚本：`scripts/verify-build.sh`
- 🐛 问题反馈：提交 GitHub Issue

---

**预计总耗时：5-10 分钟**