# CloudBase CLI 命令修复指南

## 问题

CloudBase CLI 2.12.7 版本的 `cloudrun:deploy` 命令语法已变更。

**错误命令（旧版）:**
```bash
tcb cloudrun:deploy --service weight-tracker-api --env-id xxx
```

## 解决方案

### 方案 1: 使用新版命令格式

```bash
# 新版语法（CLI 2.x）
cloudbase cloudrun:deploy \
  --envId weight-tracker-1ghr085dd7d6cff2 \
  --serviceName weight-tracker-api \
  --containerPort 3000 \
  --minNum 0 \
  --maxNum 10 \
  --cpu 0.25 \
  --mem 0.5 \
  --envParams '{"DB_TYPE":"cloudbase","NODE_ENV":"production"}'
```

### 方案 2: 使用 cloudbase.json 配置文件

创建 `cloudbase.json`:
```json
{
  "envId": "weight-tracker-1ghr085dd7d6cff2",
  "cloudRunRoot": "./",
  "cloudRun": [
    {
      "serviceName": "weight-tracker-api",
      "servicePath": "/",
      "containerPort": 3000,
      "minNum": 0,
      "maxNum": 10,
      "cpu": 0.25,
      "mem": 0.5,
      "environmentVariables": {
        "DB_TYPE": "cloudbase",
        "CLOUDBASE_ENV_ID": "weight-tracker-1ghr085dd7d6cff2",
        "NODE_ENV": "production",
        "PORT": "3000"
      }
    }
  ]
}
```

然后运行:
```bash
cloudbase deploy
```

### 方案 3: 使用 Docker 镜像部署（推荐）

1. **在 GitHub Actions 构建并推送镜像**

```yaml
# .github/workflows/deploy-docker.yml
name: Deploy with Docker

on:
  push:
    branches: [main]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to Tencent Container Registry
        uses: docker/login-action@v3
        with:
          registry: ccr.ccs.tencentyun.com
          username: ${{ secrets.TCR_USERNAME }}
          password: ${{ secrets.TCR_PASSWORD }}
      
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ccr.ccs.tencentyun.com/${{ secrets.TCR_NAMESPACE }}/weight-tracker-api:${{ github.sha }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Install CloudBase CLI
        run: npm install -g @cloudbase/cli
      
      - name: Deploy to CloudRun
        run: |
          cloudbase cloudrun:deploy \
            --envId ${{ secrets.CLOUDBASE_ENV_ID }} \
            --serviceName weight-tracker-api \
            --containerImage ccr.ccs.tencentyun.com/${{ secrets.TCR_NAMESPACE }}/weight-tracker-api:${{ github.sha }} \
            --containerPort 3000
```

2. **在 CloudBase 控制台手动选择镜像部署**

### 方案 4: 使用腾讯云 CLI (tccli)

```bash
# 安装腾讯云 CLI
pip install tccli

# 配置凭证
tccli configure

# 部署到 CloudRun
tccli tcb CreateCloudRunServer \
  --EnvId weight-tracker-1ghr085dd7d6cff2 \
  --ServerName weight-tracker-api \
  --ContainerPort 3000 \
  --MinNum 0 \
  --MaxNum 10 \
  --Cpu 0.25 \
  --Mem 0.5
```

## 推荐的 GitHub Actions 工作流

使用方案 2 (cloudbase.json) 最简单:

```yaml
name: Deploy to CloudBase

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install CloudBase CLI
        run: npm install -g @cloudbase/cli
      
      - name: Configure credentials
        run: |
          mkdir -p ~/.config/cloudbase
          echo '{"version":"2.0","credentials":{"weight-tracker-1ghr085dd7d6cff2":{"secretId":"'${{ secrets.TENCENT_CLOUD_SECRET_ID }}'","secretKey":"'${{ secrets.TENCENT_CLOUD_SECRET_KEY }}'"}}}' > ~/.config/cloudbase/credentials.json
      
      - name: Deploy
        run: cloudbase deploy --verbose
```

## 查看 CloudBase CLI 帮助

```bash
# 查看所有命令
cloudbase --help

# 查看 cloudrun 相关命令
cloudbase cloudrun --help

# 查看 deploy 命令帮助
cloudbase cloudrun:deploy --help
```

## 常用 CloudBase CLI 命令

```bash
# 登录
cloudbase login

# 列出环境
cloudbase env:list

# 列出云托管服务
cloudbase cloudrun:list --envId weight-tracker-1ghr085dd7d6cff2

# 查看服务详情
cloudbase cloudrun:detail \
  --envId weight-tracker-1ghr085dd7d6cff2 \
  --serviceName weight-tracker-api

# 查看日志
cloudbase cloudrun:log \
  --envId weight-tracker-1ghr085dd7d6cff2 \
  --serviceName weight-tracker-api

# 更新服务流量
cloudbase cloudrun:release \
  --envId weight-tracker-1ghr085dd7d6cff2 \
  --serviceName weight-tracker-api \
  --versionName xxx \
  --flowRatio 100
```

## 参考

- [CloudBase CLI 文档](https://docs.cloudbase.net/cli/intro.html)
- [CloudRun 部署文档](https://docs.cloudbase.net/run/deploy-cli.html)
