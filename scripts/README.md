# 开发脚本使用指南

## 快速开始（推荐）

### 方式1: 一键启动（智能脚本）⭐

```bash
./scripts/dev-with-ngrok.sh
```

这个脚本会：
1. 自动检查 ngrok 配置
2. 启动 Next.js 开发服务器
3. 启动 ngrok 内网穿透
4. **自动获取 ngrok URL**
5. **自动更新小程序配置**
6. 显示访问信息

### 方式2: 分步手动启动

```bash
# 1. 安装并配置 ngrok（只需一次）
brew install ngrok
ngrok config add-authtoken YOUR_TOKEN

# 2. 启动后端
npm run dev

# 3. 另开终端，启动 ngrok
ngrok http 3000

# 4. 复制 ngrok URL，更新小程序配置
# 例如: https://abcd1234.ngrok-free.app
# 修改 weapp/config.js 中的 apiBaseUrl
```

## 脚本说明

| 脚本 | 用途 |
|-----|------|
| `dev-with-ngrok.sh` | 一键启动开发环境（推荐） |
| `start-dev.sh` | 基础启动脚本 |
| `update-ngrok-url.js` | 自动更新 ngrok URL 到配置 |

## 配置检查清单

- [ ] 已安装 ngrok: `brew install ngrok`
- [ ] 已注册 ngrok 账号: https://ngrok.com
- [ ] 已获取 authtoken: https://dashboard.ngrok.com/get-started/your-authtoken
- [ ] 已配置 authtoken: `ngrok config add-authtoken YOUR_TOKEN`
- [ ] 微信开发者工具已开启「不校验合法域名」

## 常见问题

### ngrok 安装失败？

```bash
# 备用安装方法
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | \
  sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && \
  echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | \
  sudo tee /etc/apt/sources.list.d/ngrok.list && \
  sudo apt update && sudo apt install ngrok
```

### URL 更新后小程序还是访问旧地址？

1. 在微信开发者工具中按 `Cmd+R` (Mac) 或 `Ctrl+R` (Windows) 重新编译
2. 检查 `weapp/config.js` 是否已更新
3. 清除缓存：工具 → 清除缓存 → 全部清除

### 上传图片失败？

确保 ngrok URL 已正确配置，且微信开发者工具已关闭域名校验。
