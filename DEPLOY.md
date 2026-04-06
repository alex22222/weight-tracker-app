# CloudBase 正式环境部署指南

## 📋 部署前检查清单

### 1. 环境准备

- [ ] 注册腾讯云账号并完成实名认证
- [ ] 开通 CloudBase 云开发环境
- [ ] 记录环境 ID（格式如：`your-app-xxx`）
- [ ] 开通 CloudBase 云存储（用于头像上传）

### 2. 微信小程序配置

- [ ] 注册微信小程序账号
- [ ] 获取小程序 AppID
- [ ] 获取小程序 AppSecret
- [ ] 配置服务器域名（CloudBase 分配的域名）

---

## 🚀 部署步骤

### 步骤 1: 配置环境变量

创建 `.env.production` 文件：

```env
# 数据库配置 - 正式环境必须使用 cloudbase
DB_TYPE=cloudbase
CLOUDBASE_ENV_ID=your-production-env-id

# Next.js 配置
NODE_ENV=production
PORT=3000

# 微信登录配置（正式小程序）
WECHAT_APPID=your-production-appid
WECHAT_SECRET=your-production-secret
```

> ⚠️ **重要**: 生产环境必须使用 `DB_TYPE=cloudbase`，不能使用 SQLite

---

### 步骤 2: 创建 CloudBase 集合

在 CloudBase 控制台创建以下 10 个必要集合：

```bash
1. users          # 用户表
2. user_settings  # 用户设置
3. weight_entries # 体重记录
4. reading_entries# 读书记录
5. goals          # 目标
6. messages       # 消息
7. friends        # 好友关系
8. tasks          # 打卡任务
9. task_members   # 任务成员
10. task_check_ins # 任务打卡记录
```

**安全规则配置（生产环境）**:

```javascript
// users 集合
{
  "read": "auth != null",
  "write": "auth != null && (doc._openid == auth.openid || doc.userId == auth.userId)"
}

// weight_entries 集合
{
  "read": "auth != null && doc.userId == auth.userId",
  "write": "auth != null && doc.userId == auth.userId"
}

// 其他集合类似，根据业务需求调整
```

---

### 步骤 3: 配置安全规则

#### 生产环境推荐安全规则

```javascript
// 通用规则 - 只允许登录用户访问自己的数据
{
  "read": "auth != null",
  "write": "auth != null"
}

// 或者更严格的规则 - 只能访问自己的数据
{
  "read": "doc._openid == auth.openid || doc.userId == auth.userId",
  "write": "doc._openid == auth.openid || doc.userId == auth.userId"
}
```

---

### 步骤 4: 构建项目

```bash
# 1. 安装依赖
npm install

# 2. 构建生产版本
npm run build

# 3. 检查构建输出
ls -la .next/
```

---

### 步骤 5: 部署到 CloudBase

#### 方式一: 使用 CloudBase CLI

```bash
# 1. 安装 CloudBase CLI
npm install -g @cloudbase/cli

# 2. 登录
cloudbase login

# 3. 初始化项目（首次）
cloudbase init

# 4. 部署
cloudbase framework deploy
```

#### 方式二: 使用 CloudBase 控制台

1. 进入 [CloudBase 控制台](https://tcb.cloud.tencent.com/)
2. 选择环境 → 云托管/云开发
3. 上传代码或使用 Git 仓库部署
4. 配置环境变量
5. 启动服务

---

### 步骤 6: 配置小程序

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 开发 → 开发管理 → 开发设置
3. 配置服务器域名:
   - `request合法域名`: 添加 CloudBase 分配的域名
   - `uploadFile合法域名`: 添加 CloudBase 存储域名
4. 下载生产环境小程序代码
5. 修改 `app.js` 中的 API 地址为生产环境地址

---

## 🔧 生产环境配置

### next.config.js 生产配置

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
    domains: ['your-env-id.tcb.qcloud.la'] // 允许 CloudBase 存储域名
  },
  experimental: {
    serverComponentsExternalPackages: ['@cloudbase/node-sdk']
  },
  // 生产环境禁用控制台日志
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  }
}

module.exports = nextConfig
```

---

## 📊 生产环境监控

### 1. 日志监控

在 CloudBase 控制台查看:
- 云函数日志
- 数据库慢查询
- 错误告警

### 2. 性能优化

- 启用 CDN 加速
- 配置数据库索引
- 定期清理过期数据

---

## 🔒 安全建议

1. **数据库安全**: 严格配置安全规则，防止数据泄露
2. **接口安全**: 所有接口验证用户身份
3. **文件上传**: 限制文件类型和大小
4. **敏感信息**: 不要将密钥提交到代码仓库

---

## 🐛 常见问题

### 问题 1: 部署后数据库连接失败
**解决**: 检查 `CLOUDBASE_ENV_ID` 是否正确配置

### 问题 2: 文件上传失败
**解决**: 确认已开通云存储，并配置正确的存储路径

### 问题 3: 小程序无法访问
**解决**: 检查服务器域名白名单配置

---

## 📞 技术支持

- CloudBase 文档: https://docs.cloudbase.net/
- 微信小程序文档: https://developers.weixin.qq.com/miniprogram/dev/
