#!/bin/bash

# 快速部署脚本 - 方案 1
# 使用方法：在 Mac 终端执行 ./deploy-quick.sh

set -e

echo "🚀 开始构建部署包..."
echo ""

# 进入项目目录
cd "$(dirname "$0")"

echo "📦 步骤 1/5: 清理旧依赖..."
rm -rf node_modules package-lock.json .next

echo "📦 步骤 2/5: 安装依赖（可能需要 2-5 分钟）..."
npm install --progress=false

echo "🔨 步骤 3/5: 构建项目..."
npm run build

echo "📋 步骤 4/5: 复制静态资源..."
mkdir -p .next/standalone/.next/static
cp -r .next/static/* .next/standalone/.next/static/ 2>/dev/null || true

if [ -d "public" ]; then
    cp -r public .next/standalone/
fi

echo "📦 步骤 5/5: 创建部署包..."
cd .next/standalone
zip -r ../../deploy-cloudbase.zip . -q

cd ../..

# 检查文件大小
FILE_SIZE=$(ls -lh deploy-cloudbase.zip | awk '{ print $5 }')

echo ""
echo "✅ 构建完成！"
echo ""
echo "📦 部署包信息："
echo "   文件名: deploy-cloudbase.zip"
echo "   大小: $FILE_SIZE"
echo "   位置: $(pwd)/deploy-cloudbase.zip"
echo ""
echo "👉 接下来请上传到 CloudBase 控制台："
echo "   1. 访问 https://console.cloud.tencent.com/tcb"
echo "   2. 进入环境: weight-tracker-1ghr085dd7d6cff2"
echo "   3. 点击「云托管」→「服务列表」"
echo "   4. 新建服务或更新现有服务"
echo "   5. 上传 deploy-cloudbase.zip"
echo "   6. 端口设置为 80"
echo ""
echo "📖 详细步骤请查看: MANUAL_DEPLOY.md"
