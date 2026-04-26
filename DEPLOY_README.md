# 体重追踪应用 - 部署指南

## 📦 文件说明

| 文件 | 说明 |
|------|------|
| `src/` | Next.js 后端源码（已修复登录问题） |
| `package.json` | 依赖配置（已修复版本） |
| `Dockerfile` | 云端构建版本（推荐） |
| `Dockerfile.localbuild` | 本地预构建版本 |
| `next.config.js` | Next.js 配置 |
| `BUILD_AND_DEPLOY.sh` | 本地构建脚本 |

## 🚀 部署方式

### 方式一：云端构建（推荐 - 无需本地 npm）

直接上传 `weight-tracker-app.zip` 到腾讯云 CloudRun：

1. 登录 [腾讯云 CloudRun 控制台](https://console.cloud.tencent.com/tcb/cloudrun)
2. 选择服务 `weight-tracker-api`
3. 点击 **"新建版本"**
4. 上传 `weight-tracker-app.zip`
5. 构建设置：
   - **构建方式**: Dockerfile
   - **Dockerfile 路径**: `./Dockerfile`
6. 点击 **"开始部署"**

> ⚠️ **注意**: 云端构建需要约 2-3 分钟，请确保构建资源配置至少有 1GB 内存。

### 方式二：本地构建后上传

如果你有正常的 npm 环境：

```bash
# 1. 解压
unzip weight-tracker-app.zip
cd weight-tracker-app

# 2. 安装依赖并构建
npm install --legacy-peer-deps
npm run build

# 3. 使用本地构建专用 Dockerfile
cp Dockerfile.localbuild Dockerfile

# 4. 重新打包只包含必要文件
cd .next/standalone
cat > package.json << 'EOF'
{
  "name": "weight-tracker-app",
  "version": "1.0.0",
  "scripts": { "start": "node server.js" },
  "dependencies": {
    "@cloudbase/node-sdk": "^3.4.0",
    "bcryptjs": "^3.0.3",
    "jsonwebtoken": "^9.0.3",
    "next": "14.2.15",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}
EOF

# 5. 创建部署包
zip -r ../../cloudrun-deploy.zip .

# 6. 上传 cloudrun-deploy.zip 到 CloudRun
```

## 🔧 关键修复说明

### 登录问题修复
- **SHA256 密码兼容**: 支持旧版 admin 用户 (密码: 123123)
- **bcrypt 密码验证**: 新注册用户
- **明文密码兼容**: 开发测试用户
- **自动密码升级**: 登录后自动转为 bcrypt

### API 修复
- `POST /api/auth/login` - 增强日志，修复密码验证
- `POST /api/auth/register` - 使用 bcrypt
- `POST /api/auth/wechat-login` - 修复 Token 参数顺序
- `POST /api/auth/guest` - 使用 JWT 替代 Base64
- `POST /api/admin/init` - 使用 bcrypt 替代 SHA256

## 📝 环境变量

在 CloudRun 控制台设置：

```
JWT_SECRET=your-secret-key
CLOUDBASE_ENV_ID=weight-tracker-1ghr085dd7d6cff2
TCB_SECRET_ID=your-secret-id
TCB_SECRET_KEY=your-secret-key
WECHAT_APPID=your-appid
WECHAT_SECRET=your-secret
```

## 🧪 测试账号

部署后使用以下账号测试：

| 用户名 | 密码 | 说明 |
|--------|------|------|
| admin | 123123 | 管理员，首次登录后密码自动升级 |

## 🔍 故障排除

### 构建失败
如果云端构建失败，可能是内存不足：
1. 在 CloudRun 构建设置中增加内存（建议 2GB）
2. 或使用方式二本地构建

### 401 登录失败
1. 检查 CloudRun 日志中的 `[Login]` 开头日志
2. 确认数据库中用户密码格式
3. 首次部署后 admin 密码会从 SHA256 自动升级

### 端口错误
确保 Dockerfile 中 `EXPOSE 80` 与 CloudRun 端口设置一致。
