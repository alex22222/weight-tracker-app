#!/bin/bash
# 部署监控脚本

ENV_ID="weight-tracker-1ghr085dd7d6cff2"
SERVICE_NAME="weight-tracker-api"
REGION="ap-shanghai"
HEALTH_URL="https://${SERVICE_NAME}-${ENV_ID}.sh.run.tcloudbase.com/api/health"

echo "========================================"
echo "  部署监控系统"
echo "========================================"
echo ""

# 检查服务状态
echo "检查服务状态..."
tcb cloudrun:list --envId $ENV_ID --region $REGION

echo ""
echo "检查健康状态..."
for i in {1..10}; do
  response=$(curl -s $HEALTH_URL -m 5)
  if echo "$response" | grep -q '"status":"ok"'; then
    echo "✅ 健康检查通过！"
    echo "响应: $response"
    exit 0
  fi
  echo "⏳ 重试 $i/10..."
  sleep 5
done

echo "❌ 健康检查失败"
exit 1
