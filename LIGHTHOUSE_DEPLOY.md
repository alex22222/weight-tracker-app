# 腾讯云轻量服务器部署指南

## 什么是轻量服务器？

**轻量应用服务器（Lighthouse）** 是腾讯云的 VPS（虚拟专用服务器）产品：

- ✅ 可以部署和运行任何代码
- ✅ 有独立的公网 IP
- ✅ 可以安装 Node.js、数据库等
- ✅ 有 root 权限，完全控制
- ✅ 价格：约 40-100 元/月

对比：
| 产品 | 特点 | 价格 |
|------|------|------|
| **CloudBase 云托管** |  serverless，自动扩缩容 | 按量计费 |
| **轻量服务器** | 传统 VPS，持续运行 | 固定月费 |

---

## 为什么现在推荐轻量服务器？

### 优势
1. **简单直接** - 买了就能用，没有复杂的创建流程
2. **完全控制** - 可以 SSH 登录，安装任何软件
3. **固定 IP** - 有独立公网 IP，方便配置域名
4. **预装环境** - 可以选择 Node.js 镜像，开箱即用
5. **可迁移** - 以后可以迁移到 CloudBase 或其他平台

### 适用场景
- CloudBase 控制台找不到入口
- 需要快速部署验证
- 开发和测试阶段
- 小型项目上线

---

## 部署步骤（预计 10 分钟）

### 步骤 1：购买轻量服务器

1. 访问：https://console.cloud.tencent.com/lighthouse
2. 点击「**新建**」或「**创建实例**」
3. 选择配置：

| 配置项 | 推荐选择 |
|--------|----------|
| 地域 | 广州/上海/北京（离你最近）|
| 镜像 | **应用镜像** → **Node.js 18** |
| 套餐 | 最低配（2核2G 或 1核2G）|
| 时长 | 1个月（先试用）|
| 数量 | 1台 |

4. 点击「立即购买」，支付（约 40-100 元）

### 步骤 2：获取服务器信息

购买完成后，在控制台看到：

```
实例名称: lighthouse-xxx
公网 IP: 123.123.123.123  ← 记住这个IP
内网 IP: 10.0.0.x
状态: 运行中
```

**重置密码**（首次需要）：
1. 点击实例名称进入详情
2. 找到「重置密码」
3. 设置 root 密码（记住！）

### 步骤 3：连接服务器

#### 方式 A：浏览器登录（最简单）

1. 在轻量服务器控制台
2. 找到你的实例
3. 点击「登录」按钮
4. 直接在浏览器中打开终端

#### 方式 B：本地终端登录

```bash
# Mac/Linux
ssh root@123.123.123.123

# 输入密码（你重置的密码）
```

Windows 用户使用 PuTTY 或 Git Bash

### 步骤 4：部署代码

登录服务器后，执行：

```bash
# 1. 进入主目录
cd ~

# 2. 克隆你的代码（需要git，如果没有先安装）
git clone https://github.com/alex22222/weight-tracker-app.git

# 如果 git 不可用，用 zip 上传：
# 在本地：scp deploy.zip root@123.123.123.123:/root/

# 3. 进入项目目录
cd weight-tracker-app/wechat-miniprogram

# 4. 安装依赖（Node.js 镜像已预装 npm）
npm install --legacy-peer-deps

# 5. 生成 Prisma 客户端
npx prisma generate

# 6. 构建项目
npm run build

# 7. 安装 PM2（进程管理器）
npm install -g pm2

# 8. 启动服务（使用 PM2 后台运行）
pm2 start npm --name "weight-tracker" -- start

# 9. 保存 PM2 配置
pm2 save
pm2 startup
```

### 步骤 5：配置环境变量

创建 .env 文件：

```bash
cd ~/weight-tracker-app/wechat-miniprogram

cat > .env << 'EOF'
DB_TYPE=cloudbase
CLOUDBASE_ENV_ID=weight-tracker-1ghr085dd7d6cff2
NODE_ENV=production
PORT=3000
WECHAT_APPID=你的测试号AppID
WECHAT_SECRET=你的测试号AppSecret
TENCENTCLOUD_SECRETID=你的腾讯云SecretId
TENCENTCLOUD_SECRETKEY=你的腾讯云SecretKey
EOF

# 重启服务
pm2 restart weight-tracker
```

### 步骤 6：验证部署

```bash
# 测试本地运行
curl http://localhost:3000/api/health

# 应该返回 {"status":"ok",...}
```

### 步骤 7：配置防火墙

在轻量服务器控制台：
1. 找到「防火墙」标签
2. 添加规则：
   - 协议：TCP
   - 端口：3000
   - 策略：允许

或者直接用 80/443 端口（推荐）：
```bash
# 使用 Nginx 反向代理
sudo apt-get install nginx

# 配置 Nginx
sudo tee /etc/nginx/sites-available/weight-tracker << 'EOF'
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/weight-tracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 步骤 8：配置微信小程序

现在你的服务器可以通过公网 IP 访问了：

```
http://123.123.123.123/api/health
```

在小程序后台配置服务器域名：
- request 合法域名：`http://123.123.123.123` 或你的域名

更新小程序代码：
```javascript
// weapp/config.js
module.exports = {
  apiBaseUrl: 'http://123.123.123.123/api'
}
```

---

## 费用说明

| 配置 | 月费 | 适合场景 |
|------|------|----------|
| 1核2G 5M | ~40元 | 开发测试 |
| 2核4G 8M | ~100元 | 小型生产环境 |

**首单通常有优惠，可能低至 10-20 元/月**

---

## 维护命令

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs weight-tracker

# 重启服务
pm2 restart weight-tracker

# 停止服务
pm2 stop weight-tracker

# 更新代码后
git pull
npm install
npm run build
pm2 restart weight-tracker
```

---

## 与 CloudBase 的对比

| 特性 | 轻量服务器 | CloudBase 云托管 |
|------|-----------|------------------|
| 部署难度 | ⭐⭐ 中等 | ⭐⭐⭐ 较难（目前）|
| 运维复杂度 | ⭐⭐⭐ 需要维护 | ⭐ 免运维 |
| 自动扩缩容 | ❌ 手动 | ✅ 自动 |
| 费用模式 | 固定月费 | 按量计费 |
| 适合阶段 | 开发/小项目 | 生产/大流量 |

**建议**：
- 现在用轻量服务器快速上线
- 后期流量大了再迁移到 CloudBase

---

## 开始部署吗？

如果你决定用轻量服务器：

1. 访问 https://console.cloud.tencent.com/lighthouse
2. 点击「新建」，按上面步骤选择配置
3. 支付后告诉我公网 IP，我帮你完成后续部署！

或者我直接给你一步一步的购买截图指引？
