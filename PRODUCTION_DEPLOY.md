# 线上环境部署指南

## ✅ 前置条件检查

- [x] 域名备案通过
- [x] SSL 证书申请完成
- [x] 代码已修复安全漏洞
- [x] 部署包已准备好

---

## 步骤 1：配置 CloudRun 环境变量

### 1.1 登录腾讯云控制台
访问：https://console.cloud.tencent.com/tcb/cloudrun

### 1.2 进入服务配置
1. 找到 `weight-tracker-api` 服务
2. 点击 **"服务配置"** 或 **"版本管理"**
3. 点击 **"新建版本"**

### 1.3 设置环境变量
在 **"高级配置"** → **"环境变量"** 中添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `JWT_SECRET` | `随机字符串（至少32位）` | 用于Token加密，务必设置强密码 |
| `CLOUDBASE_ENV_ID` | `weight-tracker-1ghr085dd7d6cff2` | 你的CloudBase环境ID |
| `ALLOWED_ORIGINS` | `https://api.spaceflag.site` | 允许跨域的域名 |
| `WECHAT_APPID` | `你的小程序AppID` | 微信小程序ID |
| `WECHAT_SECRET` | `你的小程序AppSecret` | 微信小程序密钥 |

### 1.4 生成随机 JWT_SECRET
在终端执行：
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
复制生成的字符串作为 JWT_SECRET。

---

## 步骤 2：部署后端服务

### 2.1 上传代码包
1. 在新建版本页面
2. 上传 `weight-tracker-app.zip`
3. 构建设置：
   - 构建方式：`Dockerfile`
   - Dockerfile 路径：`./Dockerfile`

### 2.2 配置资源
| 配置项 | 建议值 |
|--------|--------|
| 内存 | 1GB 或 2GB |
| 实例数量 | 最小1，最大10 |
| 超时时间 | 30秒 |

### 2.3 开始部署
点击 **"开始部署"**，等待约 3-5 分钟。

---

## 步骤 3：配置自定义域名

### 3.1 绑定域名（如果还没做）
1. 在服务详情页点击 **"自定义域名"**
2. 添加域名：`api.spaceflag.site`
3. 选择协议：`HTTPS`
4. 证书选择已申请的证书

### 3.2 验证部署
```bash
henry@localhost ~ % curl https://api.spaceflag.site/api/health
curl: (60) SSL: no alternative certificate subject name matches target host name 'api.spaceflag.site'
```
预期返回：`{"status":"ok"}`

---

## 步骤 4：重置 Admin 密码

```bash
curl -X POST https://api.spaceflag.site/api/admin/reset-admin \
  -H "Content-Type: application/json" \
  -d '{"secretKey": "reset-admin-2024", "newPassword": "123123"}'
```

成功返回：
```json
{
  "message": "Admin 密码重置成功",
  "userId": "xxx",
  "passwordType": "bcrypt"
}
```

---

## 步骤 5：配置小程序

### 5.1 配置小程序合法域名

登录 [微信公众平台](https://mp.weixin.qq.com) → 开发 → 开发管理 → 开发设置 → 服务器域名

**request 合法域名：**
```
https://api.spaceflag.site
```

**uploadFile 合法域名：**
```
https://api.spaceflag.site
```

**downloadFile 合法域名：**
```
https://api.spaceflag.site
```

**socket 合法域名：**
```
wss://api.spaceflag.site
```

### 5.2 检查小程序代码配置

确认 `weapp/config.js`：
```javascript
const useCustomDomain = true
const config = {
  apiBaseUrl: 'https://api.spaceflag.site/api'
}
```

### 5.3 清除开发者工具缓存
在微信开发者工具：
- 点击 **"详情"** → **"本地设置"**
- 勾选 **"不校验合法域名、web-view..."**（开发测试用）
- 点击 **"清除缓存"** → **"全部清除"**
- 重新编译

---

## 步骤 6：测试验证

### 6.1 测试登录
```bash
# 测试 admin 登录
curl -X POST https://api.spaceflag.site/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "123123"}'
```

### 6.2 小程序端测试
1. 打开小程序登录页
2. 切换到 **"账号密码"** 登录
3. 输入 `admin` / `123123`
4. 确认登录成功

---

## 步骤 7：安全配置（重要）

### 7.1 关闭调试模式
在小程序代码中确保：
```javascript
// app.js
App({
  onLaunch() {
    // 生产环境关闭调试
    if (process.env.NODE_ENV === 'production') {
      console.log = () => {}
      console.warn = () => {}
    }
  }
})
```

### 7.2 配置业务域名
如果需要 web-view：
微信公众平台 → 开发 → 业务域名 → 添加 `spaceflag.site`

### 7.3 配置用户隐私保护指引
微信公众平台 → 设置 → 用户隐私保护指引 → 更新声明

---

## 🐛 常见问题

### 问题 1：curl 测试返回 502
**原因**：CloudRun 服务未启动完成或服务崩溃
**解决**：查看 CloudRun 日志，检查环境变量是否设置正确

### 问题 2：小程序提示 "不在合法域名列表"
**原因**：域名未配置或配置未生效
**解决**：
1. 检查微信公众平台配置的域名是否正确
2. 等待 5-10 分钟让配置生效
3. 开发者工具清除缓存重新编译

### 问题 3：登录返回 401
**原因**：JWT_SECRET 未设置或 admin 密码未重置
**解决**：
1. 检查 CloudRun 环境变量 JWT_SECRET 是否设置
2. 执行步骤 4 重置 admin 密码

### 问题 4：SSL 证书错误
**原因**：证书未正确绑定
**解决**：
1. 检查 CloudRun 自定义域名页面的证书状态
2. 确认证书域名匹配 `api.spaceflag.site`

---

## 📞 后续维护

### 查看日志
腾讯云控制台 → CloudRun → 服务详情 → 日志

### 更新部署
1. 修改代码后重新打包
2. 上传新版本
3. 环境变量会自动继承

### 监控告警
建议配置：
- 错误率告警（> 5%）
- 响应时间告警（> 2s）
- 内存使用告警（> 80%）
