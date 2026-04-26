# DNS 配置指南

## 🔧 需要添加的 CNAME 记录

### 根域名方式（推荐）

登录 [腾讯云 DNSPod](https://console.dnspod.cn/dns/list) → 点击 `spaceflag.site` 后面的 **"解析"**

添加记录：

| 主机记录 | 记录类型 | 记录值 |
|---------|---------|--------|
| `@` | CNAME | `weight-tracker-api-236729-9-1328081868.sh.run.tcloudbase.com` |

**说明**：`@` 表示根域名，配置后 `spaceflag.site` 指向 CloudRun 服务

---

### 子域名方式（api.spaceflag.site）

如果你坚持用子域名，添加：

| 主机记录 | 记录类型 | 记录值 |
|---------|---------|--------|
| `api` | CNAME | `weight-tracker-api-236729-9-1328081868.sh.run.tcloudbase.com` |

**说明**：配置后 `api.spaceflag.site` 指向 CloudRun 服务

---

## 📋 详细步骤（腾讯云 DNSPod）

### 步骤 1：进入 DNS 解析

1. 访问 https://console.dnspod.cn/dns/list
2. 找到 `spaceflag.site`，点击 **"解析"**

### 步骤 2：添加 CNAME 记录

1. 点击 **"添加记录"** 按钮
2. 填写信息：
   - **主机记录**：`@`（根域名）或 `api`（子域名）
   - **记录类型**：`CNAME`
   - **线路类型**：`默认`
   - **记录值**：`weight-tracker-api-236729-9-1328081868.sh.run.tcloudbase.com`
   - **TTL**：`600`（10分钟）

3. 点击 **"确认"**

### 步骤 3：等待生效

- DNS 生效时间：**10-30 分钟**
- 全球生效时间：最长 **48 小时**

---

## ✅ 验证 DNS 配置

### 方法 1：命令行
```bash
# 根域名
nslookup spaceflag.site

# 应该返回类似
# weight-tracker-api-236729-9-1328081868.sh.run.tcloudbase.com
```

### 方法 2：在线工具
访问 https://www.itdog.cn/nslookup/
- 输入 `spaceflag.site`
- 查询类型选 `CNAME`
- 点击查询

---

## 🔍 常见问题

### Q: 提示"CNAME 记录与 MX 记录冲突"
**原因**：根域名已经有 MX 记录（邮件记录）
**解决**：使用子域名 `api.spaceflag.site`，或者删除 MX 记录（不影响网站）

### Q: 已经添加了但还不生效
**解决**：
1. 检查记录值是否完整（不要漏掉 `sh.run.tcloudbase.com` 部分）
2. 等待 30 分钟
3. 清除本地 DNS 缓存：`sudo killall -HUP mDNSResponder` (Mac)

### Q: 想用 https://www.spaceflag.site
**解决**：添加两条记录：

| 主机记录 | 记录类型 | 记录值 |
|---------|---------|--------|
| `@` | CNAME | `weight-tracker-api-236729-9-1328081868.sh.run.tcloudbase.com` |
| `www` | CNAME | `weight-tracker-api-236729-9-1328081868.sh.run.tcloudbase.com` |

---

## 🚀 配置完成后

等待 30 分钟后测试：
```bash
curl https://spaceflag.site/api/health
```

预期返回：
```json
{"status":"ok","timestamp":"...","version":"1.0.0"}
```
