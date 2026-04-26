# 紧急：使用 HTTP 临时方案

## 🔴 SSL 证书完全失效

无论是 `spaceflag.site` 还是 `www.spaceflag.site` 都报证书错误。

**可能原因**：
1. 证书根本没申请成功
2. 证书审核中
3. 证书绑定到了错误的域名

---

## ✅ 临时解决方案：使用 HTTP

微信小程序**开发环境**支持 HTTP，可以临时测试。

### 步骤 1：修改配置使用 HTTP

`weapp/config.js`：
```javascript
const config = {
  apiBaseUrl: 'http://spaceflag.site/api',  // 临时使用 HTTP
}
```

### 步骤 2：关闭开发者工具 HTTPS 验证

微信开发者工具：
- 点击右上角 **"详情"**
- 勾选 **"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"**
- 重新编译

### 步骤 3：测试

```bash
curl http://spaceflag.site/api/health
```

---

## 🔧 同时修复 SSL 证书

### 方案 1：检查现有证书（腾讯云）

1. 登录 https://console.cloud.tencent.com/ssl
2. 查看证书列表
3. 确认证书状态是 **"已签发"**（不是"审核中"）
4. 点击证书查看详情，确认包含的域名

### 方案 2：重新申请免费证书

1. 腾讯云 SSL 控制台
2. 点击 **"申请免费证书"**
3. 域名填：`spaceflag.site`
4. 验证方式：DNS 验证
5. 在 DNSPod 添加指定的 TXT 记录
6. 等待 5-10 分钟，状态变为 **"已签发"**
7. CloudRun 绑定域名时选择新证书

### 方案 3：使用 Cloudflare（推荐长期方案）

1. 注册 Cloudflare：https://dash.cloudflare.com
2. 添加站点：`spaceflag.site`
3. 按指引修改 DNS 服务器为 Cloudflare
4. 开启 **"Proxy"**（橙色云图标）
5. 自动获得 SSL 证书

---

## 📋 完整检查清单

### 证书申请检查
- [ ] 证书状态是"已签发"，不是"审核中"
- [ ] 证书包含正确的域名
- [ ] DNS 验证记录已添加
- [ ] 证书已关联到 CloudRun 服务

### CloudRun 检查
- [ ] 自定义域名已添加
- [ ] 选择了正确的证书
- [ ] 服务状态是"正常"

---

## 🆘 如果以上都不行

告诉我：
1. **你的域名是在哪里购买的？**（阿里云/腾讯云/GoDaddy/其他）
2. **证书申请页面显示什么状态？**
3. **能截图给我看看 SSL 证书控制台吗？**
