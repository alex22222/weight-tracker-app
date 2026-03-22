#!/bin/bash
# CloudBase 服务创建脚本 - 修正版

echo "========================================"
echo "  CloudBase 服务创建工具 (修正版)"
echo "========================================"
echo ""

ENV_ID="weight-tracker-1ghr085dd7d6cff2"
SERVICE_NAME="weight-tracker-api"

echo "环境ID: $ENV_ID"
echo "服务名: $SERVICE_NAME"
echo ""

# 检查 cloudbase CLI
if ! command -v cloudbase &> /dev/null; then
    echo "正在安装 CloudBase CLI..."
    npm install -g @cloudbase/cli
fi

echo "1. 登录 CloudBase"
cloudbase login

echo ""
echo "2. 查看帮助（确认正确参数）"
cloudbase cloudrun:deploy --help 2>&1 | head -30

echo ""
echo "========================================"
echo "  使用 cloudbase.json 配置部署"
echo "========================================"
echo ""

# 方法1: 使用 cloudbase.json
echo "3. 使用配置文件部署..."
cloudbase deploy --verbose 2>&1

echo ""
echo "========================================"
echo "  备选: 使用 framework 部署"
echo "========================================"
echo ""

# 方法2: 使用 framework 插件
echo "4. 尝试 framework 部署..."
npx @cloudbase/cli framework:deploy --verbose 2>&1

echo ""
echo "========================================"
echo "  完成"
echo "========================================"
echo ""
echo "请检查 CloudBase 控制台:"
echo "https://console.cloud.tencent.com/tcb/env/$ENV_ID/cloudrun"
