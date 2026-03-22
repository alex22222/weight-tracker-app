# 最终部署方案 - 最简单可靠

## 推荐方案：手动上传代码到 CloudBase

既然 CLI 命令有兼容性问题，使用 CloudBase 控制台的「上传代码」功能。

---

## 步骤 1: 准备代码包

在本地终端执行：

```bash
cd /Users/henry/projects/weight-tracker-app/wechat-miniprogram

# 清理不需要的文件
rm -rf node_modules .next

# 创建部署包
zip -r deploy.zip . -x "*.git*" -x "node_modules/*" -x ".next/*"

# 检查包大小
ls -lh deploy.zip
```

---

## 步骤 2: 在 CloudBase 控制台创建服务

### 2.1 找到创建入口

访问：
```
https://console.cloud.tencent.com/tcb/env/weight-tracker-1ghr085dd7d6cff2
```

尝试找到以下菜单之一：
- 「应用管理」→「创建应用」
- 「云托管」→「新建服务」
- 「云开发」→「服务列表」→「创建」
- 或者直接搜索「云托管」

### 2.2 选择创建方式

选择 **「上传代码」** 或 **「导入项目」**：

1. 点击「上传代码」
2. 选择刚才创建的 `deploy.zip` 文件
3. 或者选择「从 GitHub 导入」，绑定你的仓库

### 2.3 配置服务

填写以下信息：

| 配置项 | 值 |
|--------|-----|
| 服务名称 | `weight-tracker-api` |
| 运行环境 | Node.js 18 |
| 启动命令 | `npm install && npm run build && npm start` |
| 监听端口 | `3000` |
| 实例规格 - CPU | 0.25 核 |
| 实例规格 - 内存 | 0.5 GiB |
| 最小实例数 | 0 |
| 最大实例数 | 10 |

### 2.4 添加环境变量

添加以下环境变量：

```
DB_TYPE=cloudbase
CLOUDBASE_ENV_ID=weight-tracker-1ghr085dd7d6cff2
NODE_ENV=production
PORT=3000
WECHAT_APPID=你的测试号AppID
WECHAT_SECRET=你的测试号AppSecret
```

### 2.5 开始部署

点击「开始部署」或「创建并部署」，等待 3-5 分钟。

---

## 备选方案：使用腾讯云轻量应用服务器

如果 CloudBase 实在无法部署，使用轻量服务器（最简单）：

### 步骤 1: 购买服务器

1. 访问 https://console.cloud.tencent.com/lighthouse
2. 购买最便宜的套餐（约 50元/月）
3. 选择「Node.js」镜像或「Ubuntu」系统

### 步骤 2: 部署代码

```bash
# SSH 登录服务器
ssh root@你的服务器IP

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 克隆代码
git clone https://github.com/alex22222/weight-tracker-app.git
cd weight-tracker-app/wechat-miniprogram

# 安装依赖
npm install

# 构建
npm run build

# 启动服务
npm start
```

### 步骤 3: 配置域名（可选）

使用服务器 IP 直接访问，或绑定域名。

---

## 超级备选：使用 Railway（免费）

Railway 是免费的 PaaS 平台，支持一键部署：

### 步骤 1: 注册 Railway

访问 https://railway.app，用 GitHub 账号登录。

### 步骤 2: 部署项目

1. 点击「New Project」
2. 选择「Deploy from GitHub repo」
3. 选择你的仓库
4. 添加环境变量（同上）
5. 自动部署

### 步骤 3: 获取域名

Railway 会自动给你一个 `.railway.app` 域名。

---

## 快速决策

| 方案 | 难度 | 费用 | 推荐度 |
|------|------|------|--------|
| **CloudBase 手动上传** | ⭐⭐ | 免费额度 | ⭐⭐⭐⭐⭐ |
| **腾讯云轻量服务器** | ⭐⭐⭐ | ~50元/月 | ⭐⭐⭐⭐ |
| **Railway** | ⭐ | 免费 | ⭐⭐⭐⭐⭐ |

---

## 我的建议

### 最快方案（5分钟）：Railway

```
1. 访问 https://railway.app
2. 用 GitHub 登录
3. 导入你的仓库
4. 添加环境变量
5. 完成部署
```

### 最稳方案（15分钟）：CloudBase 手动上传

```
1. 准备 deploy.zip
2. 控制台上传代码
3. 配置参数
4. 部署完成
```

---

## 需要帮助？

如果你还是无法找到 CloudBase 的创建入口，建议：

1. **截图** CloudBase 控制台的完整界面
2. 或者 **直接联系腾讯云客服**：
   - 电话：4009-100-100
   - 工单：https://console.cloud.tencent.com/workorder

3. **使用 Railway**（最简单）：https://railway.app

---

**你想尝试哪个方案？我可以一步步带你完成！**
