#!/bin/bash
# CloudBase 部署脚本

set -e

echo "🚀 开始部署体重追踪应用到 CloudBase..."

# 检查参数
if [ -z "$1" ]; then
  echo "❌ 请提供 CloudBase 环境 ID"
  echo "用法: ./deploy.sh your-env-id"
  exit 1
fi

ENV_ID=$1

echo "📦 步骤 1: 安装依赖..."
npm install

echo "🔧 步骤 2: 构建项目..."
npm run build

echo "☁️ 步骤 3: 检查 CloudBase CLI..."
if ! command -v cloudbase &> /dev/null; then
  echo "安装 CloudBase CLI..."
  npm install -g @cloudbase/cli
fi

echo "🔐 步骤 4: 检查登录状态..."
cloudbase env:list

echo "📝 步骤 5: 更新配置文件..."
# 更新 cloudbase.json
sed -i '' "s/{{env.ENV_ID}}/$ENV_ID/g" cloudbase.json 2>/dev/null || sed -i "s/{{env.ENV_ID}}/$ENV_ID/g" cloudbase.json

echo "🚀 步骤 6: 部署到 CloudBase..."
cloudbase framework deploy

echo "✅ 部署完成！"
echo ""
echo "请访问 CloudBase 控制台查看服务状态:"
echo "https://tcb.cloud.tencent.com/"
