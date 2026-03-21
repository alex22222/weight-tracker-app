# CloudBase CLI 部署修复总结

## 问题

CloudBase CLI 2.12.7 的命令参数与文档不符，出现以下错误：
- `error: unknown option '--service'`
- `error: unknown option '--envId'`

## 解决方案

### 方案 1: 使用 cloudbase.json 配置（当前主方案）

通过 `cloudbase.json` 文件配置部署参数，然后运行简单的 `cloudbase deploy` 命令：

```json
{
  "version": "2.0",
  "envId": "weight-tracker-1ghr085dd7d6cff2",
  "cloudRun": [{
    "serviceName": "weight-tracker-api",
    "containerPort": 3000,
    ...
  }]
}
```

**命令:**
```bash
cloudbase deploy --verbose
```

### 方案 2: 使用 Docker 镜像部署（备选）

1. 构建 Docker 镜像并推送到腾讯云容器镜像服务 (TCR)
2. 在 CloudBase 控制台手动选择镜像部署

**触发方式:**
- 手动触发: `.github/workflows/deploy-alternative.yml`

### 方案 3: 手动控制台部署（兜底方案）

直接在 CloudBase 控制台创建服务：
1. 访问 https://console.cloud.tencent.com/tcb
2. 进入「云托管 (CloudRun)」
3. 点击「新建服务」
4. 使用示例模板（Node.js）
5. 配置环境变量和端口

## 当前状态

| 工作流 | 方案 | 状态 |
|--------|------|------|
| `deploy.yml` | cloudbase.json | 🔄 等待测试 |
| `deploy-alternative.yml` | Docker + TCR | 🔄 备选方案 |

## 如果 deploy.yml 仍然失败

### 选项 A: 手动触发备选方案

1. 进入 GitHub Actions 页面
2. 选择 "Deploy to CloudBase (Alternative)" 
3. 点击 "Run workflow"

### 选项 B: 直接使用 CloudBase 控制台

参考 `QUICK_DEPLOY_MANUAL.md` 进行手动部署。

### 选项 C: 本地 CLI 部署

```bash
# 安装 CLI
npm install -g @cloudbase/cli

# 登录
cloudbase login

# 尝试不同命令格式
cloudbase cloudrun:list

# 查看帮助找到正确语法
cloudbase cloudrun:deploy --help
```

## 查看部署状态

```
https://github.com/alex22222/weight-tracker-app/actions
```

## CloudBase 控制台

```
https://console.cloud.tencent.com/tcb/env/weight-tracker-1ghr085dd7d6cff2/cloudrun
```

---

**最新提交:** `9c8d759` - 包含 cloudbase.json 部署配置
