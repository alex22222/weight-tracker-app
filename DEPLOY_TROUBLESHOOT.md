# CloudBase 服务列表为空 - 故障排查

## 可能原因

1. **部署失败** - GitHub Actions 构建或部署步骤出错
2. **服务创建失败** - CloudBase CLI 命令执行失败
3. **查看错误环境** - 登录了错误的环境 ID
4. **区域不匹配** - 服务创建在其他区域

---

## 排查步骤

### 步骤 1: 检查 GitHub Actions 日志

访问：
```
https://github.com/alex22222/weight-tracker-app/actions
```

查看最新的 workflow run：
- ✅ 绿色勾 = 成功
- ❌ 红色叉 = 失败
- 🟡 黄色 = 进行中

**如果显示失败：**
1. 点击失败的 workflow
2. 查看 "Deploy to CloudRun" 步骤的日志
3. 找到错误信息

### 步骤 2: 确认环境 ID

登录 CloudBase 控制台，确认环境：
```
https://console.cloud.tencent.com/tcb
```

应该看到环境：`weight-tracker-1ghr085dd7d6cff2`

**如果没有这个环境：**
- 可能登录了错误的腾讯云账号
- 或者环境被删除了

### 步骤 3: 检查云托管服务

在正确的环境下：

```
CloudBase 控制台
    └── 云托管 (CloudRun)
        └── 服务列表
```

**如果列表为空，说明服务没有创建成功。**

---

## 解决方案

### 方案 1: 等待部署完成

GitHub Actions 部署可能需要 5-10 分钟。

刷新页面查看：
```
https://console.cloud.tencent.com/tcb/env/weight-tracker-1ghr085dd7d6cff2/cloudrun
```

### 方案 2: 手动创建服务

如果自动部署失败，手动在控制台创建：

#### 步骤 1: 创建服务

1. 进入 CloudBase 控制台 → 云托管
2. 点击 **「新建服务」**
3. 选择 **「使用示例模板」**
4. 选择 **Node.js** 模板

#### 步骤 2: 配置服务

| 配置项 | 值 |
|--------|-----|
| 服务名称 | `weight-tracker-api` |
| 监听端口 | `3000` |
| 实例规格 - CPU | 0.25 核 |
| 实例规格 - 内存 | 0.5 GiB |
| 最小实例数 | 0 |
| 最大实例数 | 10 |

#### 步骤 3: 添加环境变量

点击「环境变量」→「编辑」：

```
DB_TYPE=cloudbase
CLOUDBASE_ENV_ID=weight-tracker-1ghr085dd7d6cff2
NODE_ENV=production
PORT=3000
WECHAT_APPID=你的测试号AppID
WECHAT_SECRET=你的测试号AppSecret
```

#### 步骤 4: 开始部署

点击「开始部署」，等待 2-5 分钟。

### 方案 3: 使用 CloudBase CLI 手动部署

在本地终端执行：

```bash
# 1. 安装 CLI
npm install -g @cloudbase/cli

# 2. 登录
cloudbase login

# 3. 进入项目目录
cd /Users/henry/projects/weight-tracker-app/wechat-miniprogram

# 4. 使用 cloudbase.json 部署
cloudbase deploy
```

### 方案 4: 使用 GitHub Actions 重新触发

1. 进入 GitHub Actions 页面
2. 找到 "Deploy to CloudBase"
3. 点击 "Run workflow" 重新运行

---

## 常见问题

### Q: GitHub Actions 显示成功，但服务列表为空

**可能原因：**
- CloudBase CLI 命令格式错误
- 部署到了错误的区域
- 服务名冲突

**解决：**
1. 检查 Actions 日志中的实际输出
2. 手动在控制台创建服务

### Q: 服务创建失败，提示资源不足

**可能原因：**
- 免费版资源额度已用完
- 同一区域服务数量达到上限

**解决：**
1. 检查 CloudBase 费用中心
2. 删除不需要的服务释放资源

### Q: 服务创建成功但无法访问

**检查清单：**
- [ ] 服务状态为「运行中」
- [ ] 端口配置为 3000
- [ ] 健康检查路径正确
- [ ] 环境变量配置正确

---

## 手动创建服务截图指引

```
CloudBase 控制台
    │
    ├── 选择环境: weight-tracker-1ghr085dd7d6cff2
    │
    ├── 点击: 云托管 (CloudRun)
    │       │
    │       └── 点击: [新建服务] 按钮
    │               │
    │               ├── 选择: 使用示例模板
    │               │       └── 选择: Node.js
    │               │
    │               ├── 填写: 服务名称 = weight-tracker-api
    │               ├── 填写: 端口 = 3000
    │               ├── 选择: CPU = 0.25核
    │               ├── 选择: 内存 = 0.5GiB
    │               ├── 填写: 最小实例数 = 0
    │               ├── 填写: 最大实例数 = 10
    │               │
    │               ├── 点击: [环境变量] 展开
    │               │       └── 添加6个环境变量
    │               │
    │               └── 点击: [开始部署]
    │
    └── 等待 2-5 分钟
```

---

## 验证服务创建成功

创建完成后，服务列表应该显示：

```
┌─────────────────────────────────────────┐
│  服务名称         状态      访问链接      │
│  ─────────────────────────────────────  │
│  weight-tracker-api  ✅运行中  https://xx│
└─────────────────────────────────────────┘
```

---

## 需要帮助？

告诉我：
1. GitHub Actions 的状态（成功/失败）
2. CloudBase 控制台能看到环境吗？
3. 有没有错误提示信息？
