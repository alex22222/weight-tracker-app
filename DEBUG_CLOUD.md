# CloudBase 连接故障排查

## 🔴 当前问题
```
加载目标失败: Error: 请求失败
```

## 可能原因

### 1. 服务未部署或已停止
检查 CloudBase 服务状态：
```bash
# 登录腾讯云
tcb login

# 查看服务列表
tcb cloudrun:list --envId weight-tracker-1ghr085dd7d6cff2
```

### 2. 域名无法访问
在浏览器中直接访问：
```
https://weight-tracker-api-236729-9-1328081868.sh.run.tcloudbase.com/api/health
```

应该返回：
```json
{"status":"ok"}
```

### 3. 小程序域名未配置
登录[微信公众平台](https://mp.weixin.qq.com)：
- 开发 → 开发管理 → 开发设置
- 服务器域名 → request合法域名
- 添加：`https://weight-tracker-api-236729-9-1328081868.sh.run.tcloudbase.com`

### 4. 环境变量未配置
CloudBase 控制台需要配置：
- `CLOUDBASE_ENV_ID`
- `WECHAT_APPID`
- `WECHAT_SECRET`
- `TENCENT_SECRET_ID`
- `TENCENT_SECRET_KEY`

## 快速修复方案

### 方案 A：使用本地开发（立即恢复）
```bash
# 切换回本地开发
sed -i '' 's/isDevelopment = false/isDevelopment = true/' weapp/config.js

# 启动本地服务
npm run dev
```

### 方案 B：重新部署 CloudBase

#### 步骤 1：配置环境变量
编辑 `.env.production`：
```env
TENCENT_SECRET_ID=AKIDxxxxxxxxxxxxxxxx  # 你的实际 SecretId
TENCENT_SECRET_KEY=xxxxxxxxxxxxxxxx     # 你的实际 SecretKey
```

#### 步骤 2：构建项目
```bash
cd /Users/henry/projects/weight-tracker-app/wechat-miniprogram
npm install
npm run build
```

#### 步骤 3：部署到 CloudBase
```bash
# 使用 CloudBase CLI
tcb cloudrun:deploy --envId weight-tracker-1ghr085dd7d6cff2 --serviceName weight-tracker-api

# 或使用控制台上传 .next/standalone 文件夹
```

#### 步骤 4：配置小程序域名
1. 登录[微信公众平台](https://mp.weixin.qq.com)
2. 开发 → 开发设置 → 服务器域名
3. 添加域名：`https://weight-tracker-api-236729-9-1328081868.sh.run.tcloudbase.com`

### 方案 C：使用临时 ngrok 方案
```bash
# 1. 启动本地服务
npm run dev

# 2. 启动 ngrok（另一个终端）
ngrok http 3000

# 3. 将 ngrok URL 更新到 weapp/config.js
# apiBaseUrl: 'https://xxxx.ngrok-free.app/api'
```

## 推荐操作

1. **立即恢复**：先切回本地开发模式继续工作
2. **稍后部署**：准备好腾讯云密钥后再部署生产环境

```bash
# 立即恢复本地开发
sed -i '' 's/isDevelopment = false/isDevelopment = true/' weapp/config.js
echo "✅ 已切换回本地开发模式"
```
