# 腾讯云 CloudBase CloudRun 完整部署指南

## 📋 目录
1. [架构概述](#架构概述)
2. [正确配置流程](#正确配置流程)
3. [遇到的问题及解决方案](#遇到的问题及解决方案)
4. [关键概念解释](#关键概念解释)
5. [检查清单](#检查清单)
6. [故障排查](#故障排查)

---

## 架构概述

### 腾讯云提供了两种接入方式

| 方式 | 适用场景 | DNS 指向 | 证书绑定位置 |
|------|---------|----------|-------------|
| **CloudRun 自定义域名** | 直接访问 CloudRun 服务 | `*.sh.run.tcloudbase.com` | CloudRun 服务页 |
| **HTTP 访问服务** ⭐推荐 | 多服务路由、统一网关 | `*.tcbaccess.tencentcloudbase.com` | HTTP 访问服务页 |

### 本项目采用架构
```
用户 → https://www.spaceflag.site
    → DNS (CNAME) → www.spaceflag.site.tcbaccess.tencentcloudbase.com
    → HTTP 访问服务 (SSL 终止、路由)
    → 路由规则: / → CloudRun: weight-tracker-api
    → 后端服务
```

---

## 正确配置流程

### 步骤 1: 申请 SSL 证书

1. 访问 https://console.cloud.tencent.com/ssl
2. 点击 **"申请免费证书"**
3. 填写域名：`www.spaceflag.site`（也可包含根域名 `spaceflag.site`）
4. 验证方式：
   - **自动 DNS 验证**（推荐，DNS 在腾讯云/DNSPod 时可用）
   - **手动 DNS 验证**（需要手动添加 TXT 记录）
5. 等待状态变为 **"已签发"**

⚠️ **注意**：证书包含的域名必须与访问域名完全匹配（包括 www）

---

### 步骤 2: 配置 HTTP 访问服务

1. 访问 https://console.cloud.tencent.com/tcb
2. 进入环境 → **环境管理** → **HTTP 访问服务**
3. 开启 **HTTP 访问服务**开关
4. 点击 **"添加自定义域名"**
5. 填写配置：
   ```
   域名: www.spaceflag.site
   证书: 选择步骤1申请的证书
   接入方式: 默认接入
   协议类型: Http & Https
   域名启用: 开启
   ```
6. 保存后记录 **CName** 值（如：`www.spaceflag.site.tcbaccess.tencentcloudbase.com`）

---

### 步骤 3: 配置路由规则

在 HTTP 访问服务页面：

1. 展开域名 `www.spaceflag.site`
2. 点击 **"+ 添加该域名路由"**
3. 配置路由：
   ```
   路径: /              (匹配所有请求)
   资源类型: 云托管
   资源对象: weight-tracker-api
   路径透传: 开启
   ```

---

### 步骤 4: 配置 DNS 解析

1. 访问 https://www.dnspod.cn 或腾讯云 DNS 解析
2. 找到域名 `spaceflag.site`
3. 添加/修改 CNAME 记录：
   ```
   主机记录: www
   记录类型: CNAME
   记录值: www.spaceflag.site.tcbaccess.tencentcloudbase.com
   TTL: 600
   ```

⚠️ **关键**：记录值必须是 HTTP 访问服务提供的 CName，不能是 CloudRun 直接地址！

---

### 步骤 5: 配置 CloudRun 环境变量

1. 访问 **云函数/托管/主机** → **服务管理**
2. 进入 `weight-tracker-api` 服务
3. **服务配置** → **环境变量**
4. 添加以下变量：
   ```bash
   JWT_SECRET=your_random_secret_min_32_chars
   WECHAT_APPID=wxa3591edcdc8d4551
   WECHAT_SECRET=your_wechat_app_secret
   CLOUDBASE_ENV_ID=weight-tracker-1ghr085dd7d6cff2
   ```
5. 保存并重启服务

---

### 步骤 6: 微信小程序配置

1. 访问 https://mp.weixin.qq.com
2. **开发** → **开发管理** → **服务器域名**
3. 添加：
   ```
   request合法域名: https://www.spaceflag.site
   uploadFile合法域名: https://www.spaceflag.site
   downloadFile合法域名: https://www.spaceflag.site
   ```

---

## 遇到的问题及解决方案

### 问题 1: SSL 证书不匹配 (curl 60 错误)

**症状**：
```bash
curl: (60) SSL: no alternative certificate subject name matches target host name 'www.spaceflag.site'
```

**原因**：
1. 证书申请时未包含 `www.spaceflag.site`
2. 证书未正确绑定到服务
3. DNS 指向错误，绕过了证书配置

**解决**：
1. 确认证书包含正确域名（SSL 控制台查看）
2. 确认 DNS CNAME 指向 HTTP 访问服务的地址，而非 CloudRun 直接地址
3. 重新在 HTTP 访问服务中绑定域名和证书

---

### 问题 2: 证书链不完整（微信小程序提示"证书无效"）

**症状**：
```
对应的服务器证书无效
```

**原因**：
1. 服务器只发送了服务器证书，缺少中间证书
2. TrustAsia 证书的根证书变更（USERTrust → DigiCert）

**解决**：
1. 使用 `openssl s_client` 检查证书链是否完整
2. 在 HTTP 访问服务中重新部署证书（会自动补全链）
3. 如仍有问题，申请新的 Let's Encrypt 证书（兼容性更好）

---

### 问题 3: DNS 解析错误

**症状**：证书正确但访问仍报错

**原因**：DNS 记录指向了 CloudRun 直接地址而非 HTTP 访问服务地址

**错误的 DNS 配置**：
```
www CNAME weight-tracker-api-xxx.sh.run.tcloudbase.com  ❌
```

**正确的 DNS 配置**：
```
www CNAME www.spaceflag.site.tcbaccess.tencentcloudbase.com  ✅
```

**解决**：
1. 在 HTTP 访问服务页面查看正确的 CName 值
2. 到 DNSPod 修改为正确的 CName
3. 等待 DNS 生效（TTL 600 秒，通常 2-5 分钟）

---

### 问题 4: CloudRun 服务暂停

**症状**：`运行状态: 已暂停`

**原因**：
1. 长时间无访问自动休眠
2. 手动暂停
3. 部署失败

**解决**：
1. 在服务详情页点击 **"启动服务"**
2. 检查部署日志排除错误

---

### 问题 5: 域名配置位置错误

**误区**：
- 在 **CloudRun 服务页** 的"自定义域名"配置（跳转到了 HTTP 访问服务）
- 以为这是 CloudRun 直接绑定

**实际情况**：
- CloudBase 的 CloudRun 自定义域名统一在 **HTTP 访问服务** 管理
- 这是网关模式，不是直接绑定

**解决**：
- 统一在 **环境管理** → **HTTP 访问服务** 配置域名和路由

---

### 问题 6: 微信小程序域名校验失败

**症状**：
```
https://www.spaceflag.site 不在以下 request 合法域名列表中
```

**原因**：
1. 小程序后台未添加域名
2. 添加的是根域名 `spaceflag.site` 但请求的是子域名 `www.spaceflag.site`
3. 开发者工具缓存

**解决**：
1. 在微信公众平台添加完整域名 `https://www.spaceflag.site`
2. 根域名和子域名需分别添加
3. 开发者工具 → 详情 → 清除缓存 → 重新编译

---

### 问题 7: access_token missing 错误

**症状**：微信登录失败，提示 access_token 相关错误

**原因**：后端缺少微信 AppID 和 Secret 环境变量

**解决**：
1. 在 CloudRun 环境变量中添加 `WECHAT_APPID` 和 `WECHAT_SECRET`
2. 从小程序后台获取正确的 AppSecret
3. 重启服务

---

## 关键概念解释

### CName vs A 记录
- **CNAME**：域名指向另一个域名（本项目使用）
- **A 记录**：域名指向 IP 地址

### 证书托管 vs 未托管
- **未托管**：证书已签发但未绑定到任何云服务
- **已托管**：证书已绑定到服务（如 HTTP 访问服务）

### 路径透传
- 开启后，`/api/health` 会原样转发给后端，不会截断 `/api`
- 本项目需要开启，因为后端 API 都以 `/api` 开头

### 证书链
- **服务器证书**：你的域名证书
- **中间证书**：CA 机构的中间证书
- **根证书**：操作系统/浏览器内置的受信任根证书
- 必须完整发送整个链，否则客户端无法验证

---

## 检查清单

### 部署前检查
- [ ] 证书已签发且包含正确域名
- [ ] HTTP 访问服务已开启
- [ ] 域名已绑定证书和路由
- [ ] DNS CNAME 指向 HTTP 访问服务地址
- [ ] CloudRun 服务运行状态正常
- [ ] 环境变量已配置（JWT_SECRET, WECHAT_APPID, WECHAT_SECRET）

### 部署后检查
- [ ] `curl -I https://www.spaceflag.site/api/health` 返回 200
- [ ] 微信小程序后台已添加域名
- [ ] 真机测试登录、数据提交正常
- [ ] SSL 证书链完整（可用 https://www.ssllabs.com/ssltest 检查）

---

## 故障排查

### 快速诊断命令

```bash
# 1. 检查 DNS 解析
nslookup www.spaceflag.site

# 2. 检查证书
openssl s_client -connect www.spaceflag.site:443 -servername www.spaceflag.site 2>/dev/null | openssl x509 -noout -text | grep "Subject Alternative Name"

# 3. 检查证书链完整性
echo | openssl s_client -connect www.spaceflag.site:443 -servername www.spaceflag.site 2>&1 | grep -A3 "Certificate chain"

# 4. 测试 API
curl -I https://www.spaceflag.site/api/health
```

### 常见错误码

| 错误 | 可能原因 | 解决 |
|------|---------|------|
| curl (60) | 证书域名不匹配 | 检查证书和 DNS |
| 404 | 路由配置错误 | 检查 HTTP 访问服务路由 |
| 502/503 | 后端服务异常 | 检查 CloudRun 日志 |
| request:fail | 小程序域名未配置 | 检查微信公众平台设置 |

---

## 相关链接

- 腾讯云 SSL 证书：https://console.cloud.tencent.com/ssl
- CloudBase 控制台：https://console.cloud.tencent.com/tcb
- DNSPod：https://www.dnspod.cn
- 微信公众平台：https://mp.weixin.qq.com
- SSL 测试：https://www.ssllabs.com/ssltest

---

**文档版本**: 1.0  
**最后更新**: 2026-04-26  
**适用项目**: weight-tracker-app (搭子小程序)
