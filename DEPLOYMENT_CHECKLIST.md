# 腾讯云部署检查清单

## 部署前检查

### 代码和配置

- [ ] 代码已提交到 GitHub main 分支
- [ ] `.env.local` 中的环境变量已更新为生产环境值
- [ ] `next.config.js` 配置正确（output: 'standalone'）
- [ ] `Dockerfile` 已更新（如需要自定义构建步骤）
- [ ] `package.json` 依赖版本正确

### 腾讯云资源准备

- [ ] CloudBase 环境已创建（`weight-tracker-1ghr085dd7d6cff2`）
- [ ] 数据库集合已创建：
  - [ ] `weight_entries`
  - [ ] `users`
  - [ ] `user_settings`
  - [ ] `messages`
  - [ ] `friends`
  - [ ] `fitness_channels`
  - [ ] `channel_members`
  - [ ] `channel_comments`
  - [ ] `check_ins`
  - [ ] `leave_requests`
- [ ] 腾讯云 API 密钥已创建（SecretId + SecretKey）
- [ ] 容器镜像服务（TCR）命名空间已创建

### GitHub 仓库配置

- [ ] GitHub Secrets 已配置：
  - [ ] `TENCENT_CLOUD_SECRET_ID`
  - [ ] `TENCENT_CLOUD_SECRET_KEY`
  - [ ] `CLOUDBASE_ENV_ID`
  - [ ] `TCR_USERNAME`（腾讯云账号 ID）
  - [ ] `TCR_PASSWORD`（腾讯云 API 密钥）
  - [ ] `TCR_NAMESPACE`（TCR 命名空间名称）

---

## 部署流程

### 方式一：GitHub Actions 自动部署

```bash
# 1. 确保代码已提交
git add .
git commit -m "deploy: prepare for tencent cloud deployment"
git push origin main

# 2. 在 GitHub 查看 Actions 运行状态
# 访问: https://github.com/<用户名>/<仓库>/actions
```

### 方式二：本地 Docker 构建并推送

```bash
# 1. 登录腾讯云容器镜像服务
docker login ccr.ccs.tencentyun.com --username=<腾讯云账号ID>

# 2. 构建镜像
docker build -t weight-tracker-api:latest .

# 3. 标记镜像
docker tag weight-tracker-api:latest \
  ccr.ccs.tencentyun.com/<命名空间>/weight-tracker-api:latest

# 4. 推送镜像
docker push ccr.ccs.tencentyun.com/<命名空间>/weight-tracker-api:latest

# 5. 在 CloudBase 控制台部署
```

### 方式三：CloudBase CLI 部署

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

## 部署后验证

### 服务状态检查

- [ ] CloudRun 服务状态为「运行中」
- [ ] 服务访问 URL 已生成
- [ ] 健康检查接口返回 200
  ```bash
  curl https://<你的域名>/api/health
  # 预期: {"status":"ok","timestamp":"..."}
  ```

### API 功能测试

- [ ] 登录接口
  ```bash
  curl -X POST https://<你的域名>/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}'
  ```
- [ ] 注册接口
- [ ] 体重记录接口
- [ ] 用户设置接口

### 数据库检查

- [ ] CloudBase 数据库中数据可以正常读写
- [ ] 集合索引已创建（如需优化性能）

### 日志检查

- [ ] CloudBase 控制台日志无错误
- [ ] 应用启动日志正常
- [ ] API 请求日志正常

---

## 微信小程序配置

### 服务器域名配置

登录 [微信小程序后台](https://mp.weixin.qq.com/) → 开发 → 开发设置 → 服务器域名：

- [ ] `request` 合法域名：添加 `https://<你的CloudRun域名>`
- [ ] `uploadFile` 合法域名：（如使用上传功能）
- [ ] `downloadFile` 合法域名：（如使用下载功能）

### 业务域名配置（如需 web-view）

- [ ] 添加业务域名
- [ ] 下载校验文件并上传到服务器

### 小程序代码更新

- [ ] 更新 `weapp/config.js` 中的 API 基础 URL
  ```javascript
  module.exports = {
    apiBaseUrl: 'https://<你的CloudRun域名>/api'
  }
  ```
- [ ] 提交小程序代码审核
- [ ] 发布小程序

---

## 监控和告警配置

### 基础监控

- [ ] CPU 使用率监控
- [ ] 内存使用率监控
- [ ] 请求量监控
- [ ] 响应时间监控
- [ ] 错误率监控

### 告警规则

- [ ] CPU 使用率 > 80% 告警
- [ ] 内存使用率 > 80% 告警
- [ ] 错误率 > 5% 告警
- [ ] 服务不可用告警

### 日志分析

- [ ] 配置日志采集
- [ ] 设置日志保留策略
- [ ] 配置错误日志告警

---

## 安全加固

### 网络安全

- [ ] 配置 WAF 防护（如需）
- [ ] 启用 HTTPS（CloudBase 自动提供）
- [ ] 配置 CORS（如需跨域）

### 访问控制

- [ ] API 密钥定期轮换
- [ ] 管理员密码强度检查
- [ ] JWT Token 过期时间设置合理

### 数据安全

- [ ] 数据库访问权限最小化
- [ ] 敏感数据加密存储
- [ ] 定期备份数据库

---

## 成本优化

### 资源配置

- [ ] 最小实例数设置为 0（无请求时不计费）
- [ ] 最大实例数设置合理（防止突发流量导致费用激增）
- [ ] CPU/内存配置满足需求但不过度配置

### 费用监控

- [ ] 设置费用预算告警
- [ ] 定期检查资源使用情况
- [ ] 优化高资源消耗的 API

---

## 回滚计划

### 快速回滚

如部署出现问题：

1. 在 CloudBase 控制台 → 云托管 → 版本管理
2. 选择上一个稳定版本
3. 点击「回滚到此版本」

### 数据备份

- [ ] 部署前备份数据库
- [ ] 确认可以恢复到之前的状态

---

## 部署完成确认

### 功能验证

- [ ] 用户可以正常注册/登录
- [ ] 体重记录功能正常
- [ ] 数据图表正常显示
- [ ] 社交功能正常（如已启用）

### 性能验证

- [ ] 首页加载时间 < 3 秒
- [ ] API 响应时间 < 500ms
- [ ] 并发用户支持预期数量

### 安全验证

- [ ] HTTPS 正常工作
- [ ] 敏感 API 需要认证
- [ ] 无未授权访问漏洞

---

## 部署后 TODO

- [ ] 更新文档，记录部署详情
- [ ] 通知团队成员部署完成
- [ ] 监控前 24 小时的服务稳定性
- [ ] 收集用户反馈
- [ ] 制定后续优化计划

---

## 紧急联系

### 腾讯云支持

- 控制台工单：[腾讯云工单系统](https://console.cloud.tencent.com/workorder)
- 技术支持电话：4009-100-100

### 项目维护

- 项目负责人：___________
- 技术负责人：___________
- 运维负责人：___________

---

## 备注

### 已知限制

- 免费版 CloudBase 有资源限制
- 数据库操作有 QPS 限制
- 文件存储有容量限制

### 后续优化

- [ ] 启用 CDN 加速静态资源
- [ ] 配置 Redis 缓存
- [ ] 添加应用性能监控（APM）
- [ ] 优化数据库查询性能

---

**部署日期**: _______________

**部署人员**: _______________

**验证人员**: _______________
