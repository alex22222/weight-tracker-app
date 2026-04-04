# ngrok 内网穿透配置指南

使用 ngrok 可以让微信小程序直接访问你本地的后端服务，无需每次都部署到 CloudBase。

## 快速开始

### 1. 注册 ngrok 账号

访问 https://ngrok.com 注册免费账号

### 2. 获取 Authtoken

登录后访问: https://dashboard.ngrok.com/get-started/your-authtoken

复制你的 authtoken（格式: `2K9...`）

### 3. 配置 ngrok

```bash
ngrok config add-authtoken YOUR_AUTHTOKEN
```

### 4. 启动开发环境

```bash
# 方式1: 使用脚本（推荐）
./scripts/start-dev.sh

# 方式2: 手动启动
# 终端1: 启动后端
npm run dev

# 终端2: 启动 ngrok
ngrok http 3000
```

### 5. 更新小程序配置

启动后会显示公网 URL，例如：`https://xxxx.ngrok-free.app`

修改 `weapp/config.js`:

```javascript
module.exports = {
  apiBaseUrl: 'https://xxxx.ngrok-free.app/api',  // 替换为 ngrok URL
  timeout: 10000,
  version: '1.0.0'
}
```

### 6. 微信开发者工具配置

1. 打开微信开发者工具
2. 点击「详情」→「本地设置」
3. 勾选「不校验合法域名、web-view（业务域名）、TLS版本以及HTTPS证书」

## 常见问题

### Q: ngrok URL 每次都会变？

免费版 ngrok 每次重启 URL 会变。有两种解决方案：

**方案 A: 固定域名（付费功能）**
```bash
ngrok http 3000 --domain=your-domain.ngrok.io
```

**方案 B: 使用 localtunnel（免费固定域名）**
```bash
npx localtunnel --port 3000 --subdomain your-name
```

### Q: 上传图片失败？

确保上传接口能通过 ngrok 访问，检查：
1. 本地服务器正常运行
2. ngrok URL 正确配置在 config.js
3. 微信开发者工具已关闭域名校验

### Q: 速度慢？

ngrok 免费版有带宽限制，可以：
1. 升级到付费版
2. 使用 Cloudflare Tunnel（免费）

## Cloudflare Tunnel 替代方案（免费固定域名）

```bash
# 安装 cloudflared
brew install cloudflared

# 登录
cloudflared tunnel login

# 创建隧道
cloudflared tunnel create weight-tracker

# 运行隧道
cloudflared tunnel run --url http://localhost:3000 weight-tracker
```
