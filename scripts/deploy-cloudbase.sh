#!/bin/bash

# CloudBase 部署脚本
# 用法: ./deploy-cloudbase.sh

set -e

echo "🚀 开始部署到 CloudBase..."

# 检查环境变量
if [ ! -f ".env.production" ]; then
    echo "❌ 错误: .env.production 文件不存在"
    exit 1
fi

# 检查必要的配置
if grep -q "你的SecretId" .env.production; then
    echo "❌ 错误: 请先配置 TENCENT_SECRET_ID"
    echo "请编辑 .env.production 文件，填入你的腾讯云密钥"
    exit 1
fi

if grep -q "你的SecretKey" .env.production; then
    echo "❌ 错误: 请先配置 TENCENT_SECRET_KEY"
    echo "请编辑 .env.production 文件，填入你的腾讯云密钥"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 构建项目
echo "🔨 构建项目..."
npm run build

# 检查构建结果
if [ ! -d ".next/standalone" ]; then
    echo "❌ 错误: 构建失败，.next/standalone 目录不存在"
    exit 1
fi

echo "✅ 构建成功"

# 复制必要文件到 standalone 目录
echo "📋 复制静态资源..."
cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
cp -r public .next/standalone/ 2>/dev/null || true

# 部署到 CloudBase（需要提前安装 CloudBase CLI）
echo "☁️ 部署到 CloudBase..."
echo "请确保已安装 CloudBase CLI: npm install -g @cloudbase/cli"
echo "请确保已登录: tcb login"

tcb cloudrun:deploy \
    --envId weight-tracker-1ghr085dd7d6cff2 \
    --serviceName weight-tracker-api \
    --dir .next/standalone \
    --containerPort 80

echo "✅ 部署完成"
echo ""
echo "📝 后续步骤:"
echo "1. 登录 CloudBase 控制台检查服务状态"
echo "2. 配置小程序服务器域名"
echo "3. 切换小程序 config.js 到生产环境"
