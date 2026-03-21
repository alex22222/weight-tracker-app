# 🎉 部署成功！下一步指南

## ✅ 部署完成确认

GitHub Actions 工作流已完成，服务应该已经成功部署到 CloudBase！

---

## 🔍 步骤1: 验证服务状态

### 1.1 查看 CloudBase 控制台

访问：
```
https://console.cloud.tencent.com/tcb/env/weight-tracker-1ghr085dd7d6cff2/cloudrun
```

确认：
- [ ] 服务 `weight-tracker-api` 状态为「运行中」
- [ ] 显示访问链接
- [ ] 无错误日志

### 1.2 获取服务访问地址

在控制台找到类似这样的地址：
```
https://weight-tracker-api-xxx.gz.apigw.tencentcs.com
```

### 1.3 测试健康检查

```bash
# 替换为你的实际服务地址
curl https://<你的服务地址>/api/health

# 预期输出
{"status":"ok","timestamp":"2024-01-20T10:30:00.000Z"}
```

### 1.4 测试登录接口

```bash
# 测试登录
curl -X POST https://<你的服务地址>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## 🔧 步骤2: 初始化数据库

### 2.1 创建数据库集合

在 CloudBase 控制台 → 数据库，创建以下集合：

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

### 2.2 创建管理员账号

方法1 - 使用初始化接口：
```bash
curl -X POST https://<你的服务地址>/api/admin/init
```

方法2 - 手动创建：
1. 进入 CloudBase 控制台 → 数据库
2. 选择 `users` 集合
3. 添加文档（参考项目文档）

---

## 📱 步骤3: 配置微信小程序

### 3.1 配置服务器域名

1. 登录 https://mp.weixin.qq.com
2. 开发 → 开发管理 → 开发设置
3. 服务器域名 → request 合法域名
4. 添加你的 CloudBase 服务地址：
   ```
   https://weight-tracker-api-xxx.gz.apigw.tencentcs.com
   ```

### 3.2 更新小程序代码

编辑 `weapp/config.js`：
```javascript
module.exports = {
  apiBaseUrl: 'https://<你的服务地址>/api'
}
```

### 3.3 提交审核

1. 微信开发者工具上传代码
2. 提交版本审核
3. 发布小程序

---

## 🔒 步骤4: 安全加固（可选）

### 4.1 HTTPS 配置
- ✅ CloudBase 自动提供 HTTPS

### 4.2 CORS 配置（如需）
在代码中添加允许的域名：
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [{
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'https://mp.weixin.qq.com' }
      ]
    }]
  }
}
```

---

## 📊 步骤5: 监控配置（可选）

### 5.1 CloudBase 监控
- 进入 CloudBase 控制台 → 监控
- 查看 CPU、内存、请求量

### 5.2 告警配置
- 设置 CPU > 80% 告警
- 设置内存 > 80% 告警
- 设置错误率 > 5% 告警

---

## 🧪 完整功能测试

### 测试清单

| 功能 | 测试步骤 | 预期结果 |
|------|----------|----------|
| 用户注册 | 调用 POST /api/auth/register | 返回用户信息和 token |
| 用户登录 | 调用 POST /api/auth/login | 返回用户信息和 token |
| 记录体重 | 调用 POST /api/weight | 成功创建记录 |
| 获取体重列表 | 调用 GET /api/weight | 返回记录列表 |
| 用户设置 | 调用 GET/POST /api/settings | 正常读写 |

---

## 💰 成本优化

### 当前配置
- 最小实例数：0（无请求时不计费）
- CPU：0.25 核
- 内存：0.5 GiB

### 预估费用
- 开发测试：¥0-50/月
- 生产环境：¥100-300/月

### 优化建议
1. 保持最小实例数为 0（开发环境）
2. 设置最大实例数限制（防止突发流量）
3. 配置 CDN 加速（减少流量费用）

---

## 🚀 后续优化

### 性能优化
- [ ] 启用 CloudBase CDN
- [ ] 配置 Redis 缓存
- [ ] 添加数据库索引

### 功能扩展
- [ ] 添加统计分析
- [ ] 添加数据导出
- [ ] 添加消息推送

### 安全增强
- [ ] 配置 WAF
- [ ] 定期轮换密钥
- [ ] 添加操作日志

---

## 📞 故障排查

### 服务无法访问
1. 检查 CloudBase 控制台服务状态
2. 查看服务日志是否有错误
3. 确认环境变量配置正确

### API 返回 500
1. 检查数据库集合是否创建
2. 检查数据库权限
3. 查看详细错误日志

### 小程序无法连接
1. 检查服务器域名配置
2. 确认 HTTPS 正常工作
3. 检查 CORS 配置

---

## 📚 参考文档

- [完整部署指南](./TENCENT_CLOUD_DEPLOYMENT.md)
- [快速部署指南](./QUICK_START_DEPLOY.md)
- [质量评估报告](./QUALITY_ASSESSMENT_REPORT.md)

---

## 🎊 恭喜！

你的体重追踪应用已成功部署到腾讯云 CloudBase！

**下一步：** 完成上述验证步骤，确保一切正常工作。

---

*部署完成时间：$(date)*
