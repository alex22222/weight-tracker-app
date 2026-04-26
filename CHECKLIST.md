# 上线检查清单

## ✅ 已完成

- [x] DNS 配置生效
- [x] SSL 证书申请
- [x] 代码安全修复
- [x] 部署包准备

## 🚀 立即执行

### 步骤 1：设置环境变量（CloudRun 控制台）

| 变量名 | 值 | 是否必填 |
|--------|-----|---------|
| `JWT_SECRET` | `随机32位字符串` | ✅ 必填 |
| `CLOUDBASE_ENV_ID` | `weight-tracker-1ghr085dd7d6cff2` | ✅ 必填 |
| `WECHAT_APPID` | `你的小程序AppID` | 微信登录必填 |
| `WECHAT_SECRET` | `你的小程序AppSecret` | 微信登录必填 |

生成 JWT_SECRET：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 步骤 2：部署后端

1. CloudRun 新建版本
2. 上传 `weight-tracker-app.zip`
3. 确认环境变量已设置
4. 开始部署

### 步骤 3：验证部署

```bash
# 测试 1：健康检查
curl https://spaceflag.site/api/health
# 预期：{"status":"ok",...}

# 测试 2：重置 admin 密码
curl -X POST https://spaceflag.site/api/admin/reset-admin \
  -H "Content-Type: application/json" \
  -d '{"secretKey": "reset-admin-2024", "newPassword": "123123"}'
# 预期：{"message": "Admin 密码重置成功"}

# 测试 3：登录
curl -X POST https://spaceflag.site/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "123123"}'
# 预期：返回 token
```

### 步骤 4：配置小程序

微信公众平台 → 开发设置 → 服务器域名：
```
https://spaceflag.site
```

### 步骤 5：测试小程序

1. 清除开发者工具缓存
2. 重新编译
3. 测试登录

## 🎉 上线成功标志

- [x] `curl https://spaceflag.site/api/health` 返回 ok
- [x] admin 能正常登录
- [x] 小程序能正常访问 API
