# CloudBase Git 平台部署详细步骤

## 步骤 1: 确保代码已推送到 GitHub

```bash
cd /Users/henry/projects/weight-tracker-app/wechat-miniprogram

git add .
git commit -m "prepare for cloudbase git deployment"
git push origin main
```

---

## 步骤 2: 在 CloudBase 控制台找到 Git 部署入口

访问：
```
https://console.cloud.tencent.com/tcb/env/weight-tracker-1ghr085dd7d6cff2
```

### 尝试以下路径找到 Git 部署：

#### 🔍 路径 A: 应用管理 → 从 Git 导入

```
左侧菜单
    └── 应用管理（或"应用"）
            ├── [创建应用] 按钮
            │       └── 选择 "从 Git 平台导入"
            │               └── 选择 GitHub
            │                       └── 授权并选择仓库
            │
            或
            
            └── [新建应用] 按钮
                    └── 代码来源: 选择 "Git 仓库"
```

#### 🔍 路径 B: 云托管 → Git 导入

```
左侧菜单
    └── 云托管 / CloudRun / 服务
            └── [新建服务] 或 [创建服务]
                    └── 部署方式: 选择 "从 Git 仓库导入"
                            └── 选择 GitHub
```

#### 🔍 路径 C: 持续集成/部署

```
左侧菜单
    └── 持续集成 / CI/CD
            └── [创建流水线] 或 [新建构建]
                    └── 代码源: 选择 "GitHub"
```

#### 🔍 路径 D: 直接搜索

在 CloudBase 控制台顶部搜索框输入：
```
Git
GitHub
导入
应用
```

---

## 步骤 3: 授权 GitHub

第一次使用需要授权 CloudBase 访问你的 GitHub：

1. 点击 "GitHub" 图标
2. 跳转到 GitHub 授权页面
3. 点击 "Authorize TencentCloudBase"
4. 选择要部署的仓库 `weight-tracker-app`

---

## 步骤 4: 配置构建设置

选择仓库后，配置以下参数：

### 基本信息

| 配置项 | 值 |
|--------|-----|
| 服务名称 | `weight-tracker-api` |
| 所在地域 | 广州（或离你最近的）|

### 构建设置

| 配置项 | 值 |
|--------|-----|
| 构建环境 | Node.js 18 |
| 构建命令 | `npm install --legacy-peer-deps && npm run build` |
| 启动命令 | `npm start` |
| 输出目录 | `.` 或留空 |
| 监听端口 | `3000` |

### 实例规格

| 配置项 | 值 |
|--------|-----|
| CPU | 0.25 核 |
| 内存 | 0.5 GiB |
| 最小实例数 | 0 |
| 最大实例数 | 10 |

---

## 步骤 5: 添加环境变量

在部署配置页面，找到「环境变量」或「变量配置」：

点击「添加变量」，逐一添加：

```
DB_TYPE=cloudbase
CLOUDBASE_ENV_ID=weight-tracker-1ghr085dd7d6cff2
NODE_ENV=production
PORT=3000
```

> 注意：微信小程序配置（WECHAT_APPID 等）可以后续再添加

---

## 步骤 6: 开始部署

点击以下按钮之一：
- 「开始部署」
- 「创建并部署」
- 「确认部署」

等待 3-10 分钟，部署完成。

---

## 步骤 7: 验证部署

部署完成后，在控制台看到：

```
服务名称: weight-tracker-api
状态: ✅ 运行中
访问链接: https://weight-tracker-api-xxx.gz.apigw.tencentcs.com
```

测试：
```bash
curl https://weight-tracker-api-xxx.gz.apigw.tencentcs.com/api/health

# 预期输出
{"status":"ok","timestamp":"..."}
```

---

## 常见问题

### Q: 找不到 Git 导入选项

**解决**: 
- 尝试切换旧版控制台（页面底部找「切换旧版」）
- 或者直接访问: https://console.cloud.tencent.com/tcb/env/weight-tracker-1ghr085dd7d6cff2/app

### Q: GitHub 授权失败

**解决**:
- 确保 GitHub 账号已登录
- 检查是否有权限访问该仓库
- 如果是私有仓库，需要给 CloudBase 授权访问私有仓库

### Q: 构建失败

**解决**:
- 检查构建命令是否正确
- 查看构建日志中的错误信息
- 确保 package.json 中有 build 和 start 脚本

### Q: 部署成功但无法访问

**解决**:
- 检查端口是否为 3000
- 检查环境变量是否配置正确
- 查看服务日志排查错误

---

## 如果还是找不到 Git 入口

请告诉我：
1. **当前页面的完整 URL**
2. **左侧菜单有哪些选项**
3. **点击了哪些菜单**

或者截图当前页面，我帮你定位！

---

## 备选：使用 CloudBase Framework

如果 Git 导入找不到，尝试 Framework 部署：

项目根目录已有 `cloudbase.json`，直接运行：

```bash
# 本地安装 CLI
npm install -g @cloudbase/cli

# 登录
cloudbase login

# 直接部署（会自动读取 cloudbase.json）
cloudbase deploy
```

---

**开始操作吧！有问题随时告诉我！** 🚀
