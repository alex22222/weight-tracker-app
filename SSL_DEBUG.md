# SSL 证书问题诊断

## 🔴 问题
`curl: (60) SSL: no alternative certificate subject name matches target host name 'spaceflag.site'`

说明证书不包含 `spaceflag.site` 这个域名。

---

## 🔍 诊断步骤

### 步骤 1：检查证书包含哪些域名

```bash
# 查看证书信息（不验证）
openssl s_client -connect spaceflag.site:443 -servername spaceflag.site 2>/dev/null | openssl x509 -noout -text | grep -A1 "Subject Alternative Name"
```

或者在线工具：https://www.ssllabs.com/ssltest/analyze.html?d=spaceflag.site

### 步骤 2：确认证书绑定的域名

登录 [腾讯云 SSL 证书控制台](https://console.cloud.tencent.com/ssl)
- 查看你的证书详情
- 确认"通用名称"包含哪些域名

可能的情况：
- 证书只包含 `www.spaceflag.site`
- 证书包含 `spaceflag.site` 和 `www.spaceflag.site`

---

## ✅ 解决方案

### 方案 A：证书只包含 www.spaceflag.site

修改配置使用 www 子域名：

**1. DNS 配置**（DNSPod）
添加记录：
| 主机记录 | 记录类型 | 记录值 |
|---------|---------|--------|
| `www` | CNAME | `weight-tracker-api-236729-9-1328081868.sh.run.tcloudbase.com` |

**2. 修改小程序配置** `weapp/config.js`：
```javascript
apiBaseUrl: 'https://www.spaceflag.site/api'
```

**3. CloudRun 绑定域名**：`www.spaceflag.site`

**4. 测试**：
```bash
curl https://www.spaceflag.site/api/health
```

---

### 方案 B：申请包含根域名的证书（推荐）

重新申请证书，域名填写：
```
spaceflag.site
www.spaceflag.site
```

或者申请通配符证书：
```
*.spaceflag.site
spaceflag.site
```

---

### 方案 C：使用 Cloudflare 免费证书（备选）

1. 域名 DNS 改为 Cloudflare
2. 开启代理（橙色云）
3. 自动获得 SSL 证书

---

## 🚀 快速修复（推荐方案 B）

1. 登录 https://console.cloud.tencent.com/ssl
2. 点击 **"申请免费证书"**
3. 域名 1：`spaceflag.site`
4. 域名 2：`www.spaceflag.site`
5. DNS 验证
6. 等待签发（5-10分钟）
7. CloudRun 绑定 `spaceflag.site` 使用新证书

---

## ❓ 请确认

你的证书详情里显示包含哪些域名？
- 只有 `www.spaceflag.site`？
- 有 `spaceflag.site` 但配置没生效？

截图给我看你的 SSL 证书详情页面！
