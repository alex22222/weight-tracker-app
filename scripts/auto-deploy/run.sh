#!/bin/bash
# CloudBase 自动化部署启动脚本 v3.0

set -e

echo "========================================"
echo "  🚀 CloudBase 自动化部署系统 v3.0"
echo "========================================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../.."

echo "📁 项目目录: $(pwd)"
echo ""

# 步骤1: 部署前检查
echo "🔧 步骤 1/2: 执行部署前检查..."
node scripts/auto-deploy/fix-common-issues.js

echo ""
echo "⏳ 等待 2 秒..."
sleep 2

# 步骤2: 执行自动部署
echo ""
echo "🚀 步骤 2/2: 开始自动部署..."
echo "   (本地构建 standalone → 上传 → 健康检查)"
echo ""

node scripts/auto-deploy/auto-deploy-v2.js

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "  🎉 全部完成！"
    echo "========================================"
else
    echo ""
    echo "========================================"
    echo "  ❌ 部署遇到问题"
    echo "========================================"
    echo ""
    echo "建议操作："
    echo "1. 查看上方日志中的错误信息"
    echo "2. 登录 CloudBase 控制台查看构建日志："
    echo "   https://tcb.cloud.tencent.com/dev?envId=weight-tracker-1ghr085dd7d6cff2#/platform-run/service/detail?serverName=weight-tracker-api&tabId=deploy"
    echo "3. 或直接使用简化脚本部署："
    echo "   bash scripts/deploy.sh"
    exit 1
fi
