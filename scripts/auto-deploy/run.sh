#!/bin/bash
# 智能自动部署启动脚本

set -e

echo "========================================"
echo "  智能自动化部署系统 v2.0"
echo "========================================"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../.."

echo "📁 项目目录: $(pwd)"
echo ""

# 步骤1: 预修复
echo "🔧 步骤 1/3: 执行预修复..."
node scripts/auto-deploy/fix-common-issues.js

echo ""
echo "⏳ 等待 3 秒..."
sleep 3

# 步骤2: 执行自动部署
echo ""
echo "🚀 步骤 2/3: 开始自动部署..."
echo "   (此过程会自动监控状态、分析错误、修复问题并重试)"
echo ""

node scripts/auto-deploy/auto-deploy-v2.js

# 步骤3: 部署后检查
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 步骤 3/3: 部署成功！"
    echo ""
    echo "执行健康检查..."
    curl -s "https://weight-tracker-api-236729-9-1328081868.sh.run.tcloudbase.com/api/health" | head -1
    echo ""
    echo "========================================"
    echo "  🎉 全部完成！"
    echo "========================================"
else
    echo ""
    echo "❌ 步骤 3/3: 部署失败"
    echo ""
    echo "========================================"
    echo "  请检查上面的日志"
    echo "========================================"
    exit 1
fi
