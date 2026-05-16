#!/bin/bash
set -e

ENV_ID="weight-tracker-1ghr085dd7d6cff2"
SERVICE_NAME="weight-tracker-api"
HEALTH_URL="https://${SERVICE_NAME}-${ENV_ID}.sh.run.tcloudbase.com/api/health"

echo "========================================"
echo "  🚀 CloudBase 自动化部署"
echo "========================================"
echo ""

# 1. 构建
echo "🔨 步骤 1/5: 本地构建项目..."
npm run build

if [ ! -d ".next/standalone" ]; then
    echo "❌ 构建失败: .next/standalone 目录不存在"
    exit 1
fi
echo "✅ 构建成功"

# 2. 准备 standalone
echo ""
echo "📦 步骤 2/5: 准备 standalone 目录..."
cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
cp -r public .next/standalone/ 2>/dev/null || true

# 写入 Dockerfile（强制 PORT=80，避免被外部环境变量覆盖）
cat > .next/standalone/Dockerfile << 'DOCKERFILE'
FROM node:18-alpine
WORKDIR /app
COPY . .
ENV NODE_ENV=production HOSTNAME=0.0.0.0
EXPOSE 80
CMD ["sh", "-c", "PORT=80 node server.js"]
DOCKERFILE

echo "✅ standalone 准备完成"

# 3. 本地验证
echo ""
echo "🔍 步骤 3/5: 本地验证启动..."
cd .next/standalone
PORT=3456 node server.js &
LOCAL_PID=$!
cd ../..

sleep 3
LOCAL_OK=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3456/api/health" || echo "000")
kill $LOCAL_PID 2>/dev/null || true
wait $LOCAL_PID 2>/dev/null || true

if [ "$LOCAL_OK" != "200" ]; then
    echo "❌ 本地验证失败: standalone 服务无法启动 (HTTP $LOCAL_OK)"
    exit 1
fi
echo "✅ 本地验证通过"

# 4. 部署
echo ""
echo "☁️ 步骤 4/5: 提交部署到 CloudBase..."
cd .next/standalone
echo "n" | tcb cloudrun deploy \
    -e "$ENV_ID" \
    -s "$SERVICE_NAME" \
    --port 80 \
    --source . \
    --force
cd ../..

echo "✅ 部署已提交"

# 5. 等待并验证
echo ""
echo "⏳ 步骤 5/5: 等待 CloudBase 容器启动 (最多 5 分钟)..."
for i in 1 2 3 4 5 6 7 8 9 10; do
    sleep 30
    REMOTE_OK=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || echo "000")
    if [ "$REMOTE_OK" = "200" ]; then
        echo ""
        echo "========================================"
        echo "  ✅ 部署成功！"
        echo "========================================"
        echo ""
        echo "🔗 访问地址: https://${SERVICE_NAME}-${ENV_ID}.sh.run.tcloudbase.com"
        echo ""
        exit 0
    fi
    echo "  [$i/10] 健康检查 HTTP $REMOTE_OK，继续等待..."
done

echo ""
echo "⚠️ 远程健康检查未通过，但部署可能仍在进行中。"
echo "   请通过 CloudBase 控制台查看构建日志："
echo "   https://tcb.cloud.tencent.com/dev?envId=${ENV_ID}#/platform-run/service/detail?serverName=${SERVICE_NAME}&tabId=deploy"
echo ""
