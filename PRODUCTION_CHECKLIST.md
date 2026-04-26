# 小程序上线生产环境检查清单

## 🚀 上线前必须完成的事项

---

## 1. 微信小程序端配置

### 1.1 微信公众平台配置
- [ ] 服务器域名配置完整（已完成 ✅）
  - request: `https://www.spaceflag.site`
  - uploadFile: `https://www.spaceflag.site`
  - downloadFile: `https://www.spaceflag.site`
- [ ] 业务域名配置（如有 web-view）
- [ ] 小程序类目设置正确
- [ ] 小程序名称和简介完善
- [ ] 隐私政策/用户协议页面

### 1.2 小程序代码检查
- [ ] `weapp/config.js` 使用生产环境配置
- [ ] 移除所有 `console.log` 调试代码
- [ ] 确保所有页面路径正确
- [ ] 真机测试通过

---

## 2. 后端服务配置（CloudRun）

### 2.1 环境变量（必须设置！）
登录 CloudBase 控制台 → 云函数/托管/主机 → weight-tracker-api → 环境变量

| 变量名 | 说明 | 是否必须 |
|--------|------|----------|
| `JWT_SECRET` | 至少32位随机字符串 | ✅ 必须 |
| `WECHAT_APPID` | 微信小程序 AppID | ✅ 必须 |
| `WECHAT_SECRET` | 微信小程序 Secret | ✅ 必须 |
| `CLOUDBASE_ENV_ID` | `weight-tracker-1ghr085dd7d6cff2` | ✅ 必须 |

### 2.2 服务状态检查
- [ ] CloudRun 服务运行状态：正常
- [ ] HTTP 访问服务：域名绑定正常
- [ ] SSL 证书：有效期内且完整
- [ ] 数据库连接：正常

### 2.3 API 测试
```bash
# 测试健康检查
curl https://www.spaceflag.site/api/health

# 测试登录接口（需要 valid code）
curl -X POST https://www.spaceflag.site/api/auth/wechat-login \
  -H "Content-Type: application/json" \
  -d '{"code":"test"}'
```

---

## 3. 数据库配置

### 3.1 CloudBase 数据库
- [ ] 集合 `users` 已创建
- [ ] 集合 `weight_records` 已创建
- [ ] 索引已创建（如需要）
- [ ] 数据库权限：所有用户可读可写

---

## 4. 上线流程

### 4.1 提交审核
1. 微信开发者工具 → 上传代码
2. 微信公众平台 → 版本管理 → 提交审核
3. 填写审核信息：
   - 功能描述
   - 测试账号（如有登录功能）
   - 测试备注

### 4.2 审核通过后
- [ ] 发布上线
- [ ] 配置灰度发布（可选）

---

## 5. 监控与运维

### 5.1 日志监控
- CloudBase 控制台 → 日志监控
- 关注错误率和响应时间

### 5.2 告警设置
- 服务异常时接收通知

---

## ⚠️ 重要提醒

1. **首次审核可能需要 1-3 个工作日**
2. **确保所有功能在真机上测试通过**
3. **保留测试账号供审核员使用**
4. **不要包含测试数据或敏感信息**

---

## 🔗 相关链接

- 微信公众平台：https://mp.weixin.qq.com
- 腾讯云 CloudBase：https://console.cloud.tencent.com/tcb
- SSL 证书管理：https://console.cloud.tencent.com/ssl
