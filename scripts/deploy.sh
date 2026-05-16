#!/bin/bash
set -e

ENV_ID="weight-tracker-1ghr085dd7d6cff2"
SERVICE_NAME="weight-tracker-api"

# 检查环境变量中的密钥
if [ -z "$TENCENTCLOUD_SECRET_ID" ]; then
  echo "❌ Error: TENCENTCLOUD_SECRET_ID 环境变量未设置"
  exit 1
fi
if [ -z "$TENCENTCLOUD_SECRET_KEY" ]; then
  echo "❌ Error: TENCENTCLOUD_SECRET_KEY 环境变量未设置"
  exit 1
fi

echo "========================================"
echo "  🚀 CloudBase 自动化部署"
echo "========================================"

echo "🔨 步骤 1/3: 本地构建验证..."
npm run build

echo ""
echo "📦 步骤 2/3: 部署到 CloudBase..."
# 使用 expect 处理交互式提示
expect -c "
set timeout 600
spawn tcb cloudrun deploy -e $ENV_ID -s $SERVICE_NAME --port 80 --source . --force
expect {
    \"是否启用灰度部署\" {
        send \"\r\"
        exp_continue
    }
    \"确认继续部署\" {
        send \"Y\r\"
        exp_continue
    }
    \"部署成功\" {
        puts \"\n✅ 部署成功！\"
    }
    \"提交容器型云托管\" {
        exp_continue
    }
    timeout {
        puts \"\n⏱️ 部署超时！\"
        exit 1
    }
    eof
}
"

echo ""
echo "⏳ 步骤 3/3: 等待服务就绪..."
for i in {1..30}; do
  sleep 5
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "https://$SERVICE_NAME-236729-9-1328081868.sh.run.tcloudbase.com/api/health" 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ]; then
    echo "✅ 服务已就绪！"
    break
  fi
  echo "  [$i/30] 健康检查未通过 (HTTP $STATUS)，继续等待..."
done

echo ""
echo "🔍 部署验证..."
curl -s "https://$SERVICE_NAME-236729-9-1328081868.sh.run.tcloudbase.com/api/health"

echo ""
echo "========================================"
echo "  ✅ 部署流程完成"
echo "========================================"
echo "  访问地址: https://$SERVICE_NAME-236729-9-1328081868.sh.run.tcloudbase.com"
echo "========================================"
