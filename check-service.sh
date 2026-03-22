#!/bin/bash
# 检查 CloudBase 服务状态

echo "========================================"
echo "  CloudBase 服务诊断工具"
echo "========================================"
echo ""

ENV_ID="weight-tracker-1ghr085dd7d6cff2"
SERVICE_NAME="weight-tracker-api"

echo "1. 检查 CLI 版本"
cloudbase --version
echo ""

echo "2. 检查当前登录状态"
cloudbase env:list
echo ""

echo "3. 尝试列出所有服务（带详细输出）"
cloudbase cloudrun:list --envId $ENV_ID --verbose 2>&1
echo ""

echo "4. 检查特定服务是否存在"
cloudbase cloudrun:detail --envId $ENV_ID --serviceName $SERVICE_NAME 2>&1 || echo "服务不存在，需要创建"
echo ""

echo "========================================"
echo "  如果服务不存在，执行创建:"
echo "========================================"
echo ""

# 创建服务（带错误输出）
echo "5. 创建服务..."
cloudbase cloudrun:create \
    --envId $ENV_ID \
    --serviceName $SERVICE_NAME \
    --containerPort 3000 \
    --minNum 0 \
    --maxNum 10 \
    --cpu 0.25 \
    --mem 0.5 \
    --verbose 2>&1

echo ""
echo "6. 再次检查服务列表"
cloudbase cloudrun:list --envId $ENV_ID 2>&1

echo ""
echo "========================================"
echo "  诊断完成"
echo "========================================"
