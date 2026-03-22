#!/bin/bash
# CloudBase 服务创建脚本

echo "========================================"
echo "  CloudBase 服务创建工具"
echo "========================================"
echo ""

# 配置
ENV_ID="weight-tracker-1ghr085dd7d6cff2"
SERVICE_NAME="weight-tracker-api"

echo "环境ID: $ENV_ID"
echo "服务名: $SERVICE_NAME"
echo ""

# 检查 cloudbase CLI
if ! command -v cloudbase &> /dev/null; then
    echo "正在安装 CloudBase CLI..."
    npm install -g @cloudbase/cli
fi

echo "1. 登录 CloudBase"
cloudbase login

echo ""
echo "2. 查看现有服务"
cloudbase cloudrun:list --envId $ENV_ID

echo ""
echo "3. 创建服务"
cloudbase cloudrun:create \
    --envId $ENV_ID \
    --serviceName $SERVICE_NAME \
    --containerPort 3000 \
    --minNum 0 \
    --maxNum 10 \
    --cpu 0.25 \
    --mem 0.5

echo ""
echo "4. 配置环境变量"
cloudbase cloudrun:update \
    --envId $ENV_ID \
    --serviceName $SERVICE_NAME \
    --envParams '{"DB_TYPE":"cloudbase","CLOUDBASE_ENV_ID":"weight-tracker-1ghr085dd7d6cff2","NODE_ENV":"production","PORT":"3000"}'

echo ""
echo "========================================"
echo "  服务创建完成！"
echo "========================================"
echo ""
echo "请在 CloudBase 控制台查看服务状态"
echo "https://console.cloud.tencent.com/tcb/env/$ENV_ID/cloudrun"
