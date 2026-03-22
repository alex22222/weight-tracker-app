# CloudBase 部署指南

## 📁 部署文件说明

| 文件 | 说明 |
|------|------|
| `cloudbase.json` | CloudBase CLI 配置文件 |
| `Dockerfile` | CloudRun 容器构建文件 |
| `.dockerignore` | Docker 构建忽略文件 |
| `deploy.sh` | 一键部署脚本 |
| `src/app/api/health/route.ts` | 健康检查接口 |

## 🚀 快速部署

### 方式一：使用部署脚本（推荐）

```bash
# 1. 设置环境变量
export CLOUDBASE_ENV_ID=your-env-id

# 2. 执行部署
./deploy.sh

# 或直接在命令行指定环境 ID
./deploy.sh your-env-id
```

### 方式二：手动部署

```bash
# 1. 安装 CloudBase CLI
npm install -g @cloudbase/cli

# 2. 登录
tcb login

# 3. 安装依赖并构建
npm ci
npm run build

# 4. 部署到 CloudRun
tcb cloudrun:deploy \
    --serviceName weight-tracker-api \
    --envId your-env-id \
    --containerPort 3000 \
    --minNum 0 \
    --maxNum 10 \
    --cpu 0.25 \
    --mem 0.5
```

## ⚙️ 配置说明

### 环境变量

部署时会自动注入以下环境变量：

| 变量名 | 说明 |
|--------|------|
| `NODE_ENV` | 固定为 `production` |
| `DB_TYPE` | 固定为 `cloudbase` |
| `CLOUDBASE_ENV_ID` | CloudBase 环境 ID |
| `PORT` | 服务端口，固定为 `3000` |

### CloudRun 资源配置

| 参数 | 值 | 说明 |
|------|-----|------|
| CPU | 0.25 核 | 最低配置，可调整 |
| 内存 | 0.5 GB | 最低配置，可调整 |
| 最小实例 | 0 | 无请求时缩容到 0（省钱） |
| 最大实例 | 10 | 自动扩容上限 |
| 并发 | 单实例并发 1000 | 可根据需要调整 |

## 🔧 自定义配置

### 修改资源配置

编辑 `deploy.sh` 中的以下参数：

```bash
tcb cloudrun:deploy \
    --serviceName weight-tracker-api \
    --envId "$ENV_ID" \
    --containerPort 3000 \
    --minNum 1 \        # 最小实例数（保持常驻）
    --maxNum 20 \       # 最大实例数
    --cpu 0.5 \         # CPU 核数
    --mem 1 \           # 内存 GB
```

### 添加自定义环境变量

编辑 `cloudbase.json`：

```json
"environmentVariables": {
  "NODE_ENV": "production",
  "DB_TYPE": "cloudbase",
  "CLOUDBASE_ENV_ID": "{{env.ENV_ID}}",
  "CUSTOM_VAR": "your-value"
}
```

## 📱 小程序配置

部署完成后，更新小程序配置：

```javascript
// weapp/config.js
const config = {
  // 替换为实际的 CloudRun 服务地址
  apiBaseUrl: 'https://weight-tracker-api-your-env-id.cloudrun.tencentcloudapi.com/api',
  timeout: 10000,
  version: '1.0.0'
}
```

然后在微信公众平台配置服务器域名。

## 🔄 持续部署（CI/CD）

### GitHub Actions 配置

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to CloudBase

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - name: Install CloudBase CLI
        run: npm install -g @cloudbase/cli
        
      - name: Deploy
        env:
          CLOUDBASE_ENV_ID: ${{ secrets.CLOUDBASE_ENV_ID }}
          TENCENTCLOUD_SECRETID: ${{ secrets.TENCENTCLOUD_SECRETID }}
          TENCENTCLOUD_SECRETKEY: ${{ secrets.TENCENTCLOUD_SECRETKEY }}
        run: |
          tcb login --apiKeyId "$TENCENTCLOUD_SECRETID" --apiKey "$TENCENTCLOUD_SECRETKEY"
          ./deploy.sh "$CLOUDBASE_ENV_ID"
```

在 GitHub Settings → Secrets 中添加：
- `CLOUDBASE_ENV_ID`: 你的环境 ID
- `TENCENTCLOUD_SECRETID`: 腾讯云 SecretId
- `TENCENTCLOUD_SECRETKEY`: 腾讯云 SecretKey

## 🐛 故障排查

### 查看日志

```bash
# 查看实时日志
tcb cloudrun:log --serviceName weight-tracker-api --envId your-env-id

# 查看历史日志
tcb cloudrun:log --serviceName weight-tracker-api --envId your-env-id --limit 100
```

### 常见问题

**Q: 部署失败，提示构建错误**
- 检查 `next.config.js` 是否正确配置了 `output: 'standalone'`
- 确认 `Dockerfile` 中的构建命令正确

**Q: 服务启动后无法访问**
- 检查健康检查接口 `/api/health` 是否返回 200
- 确认端口配置正确（默认 3000）
- 查看 CloudRun 日志排查错误

**Q: 数据库连接失败**
- 确认 `CLOUDBASE_ENV_ID` 环境变量正确
- 检查 CloudBase 数据库安全规则
- 确认集合已创建

## 📞 技术支持

- CloudBase 文档: https://docs.cloudbase.net/
- CloudRun 文档: https://docs.cloudbase.net/run/
- 腾讯云控制台: https://console.cloud.tencent.com/
