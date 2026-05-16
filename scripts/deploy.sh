#!/bin/bash
set -e

ENV_ID="weight-tracker-1ghr085dd7d6cff2"
SERVICE_NAME="weight-tracker-api"
HEALTH_URL="https://${SERVICE_NAME}-${ENV_ID}.sh.run.tcloudbase.com/api/health"

echo "========================================"
echo "  🚀 CloudBase 自动化部署"
echo "========================================"
echo ""

# 1. 本地构建验证
echo "🔨 步骤 1/3: 本地构建验证..."
npm run build

echo "✅ 本地构建成功"

# 2. 本地验证
echo ""
echo "🔍 步骤 2/3: 本地验证启动..."
PORT=3456 npx next start &
LOCAL_PID=$!
sleep 5
LOCAL_OK=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3456/api/health" || echo "000")
kill $LOCAL_PID 2>/dev/null || true
wait $LOCAL_PID 2>/dev/null || true

if [ "$LOCAL_OK" != "200" ]; then
    echo "❌ 本地验证失败 (HTTP $LOCAL_OK)"
    exit 1
fi
echo "✅ 本地验证通过"

# 3. 部署
echo ""
echo "☁️ 步骤 3/3: 提交部署到 CloudBase..."
echo "   (云端将执行 npm ci + npm run build，约需 5-10 分钟)"
echo ""

echo "n" | tcb cloudrun deploy \
    -e "$ENV_ID" \
    -s "$SERVICE_NAME" \
    --port 80 \
    --source . \
    --force

echo ""
echo "✅ 部署已提交！"
echo ""
echo "📋 请通过以下链接查看构建状态和日志："
echo "https://tcb.cloud.tencent.com/dev?envId=$ENV_ID#/platform-run/service/detail?serverName=$SERVICE_NAME&tabId=deploy"
echo ""
echo "⏳ 云端构建和启动通常需要 5-10 分钟..."
echo ""
