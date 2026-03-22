#!/bin/bash

# CloudBase 部署脚本
# 用法: ./deploy.sh [环境ID]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 获取环境 ID
ENV_ID=${1:-$CLOUDBASE_ENV_ID}

if [ -z "$ENV_ID" ]; then
    echo -e "${RED}❌ 错误: 请提供 CloudBase 环境 ID${NC}"
    echo "用法: ./deploy.sh your-env-id"
    echo "或在环境变量中设置 CLOUDBASE_ENV_ID"
    exit 1
fi

echo -e "${GREEN}🚀 开始部署到 CloudBase...${NC}"
echo -e "${YELLOW}环境 ID: $ENV_ID${NC}"

# 检查是否登录
echo -e "\n${YELLOW}📋 检查登录状态...${NC}"
if ! tcb env:list > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  未登录，执行登录...${NC}"
    tcb login
fi

# 安装依赖
echo -e "\n${YELLOW}📦 安装依赖...${NC}"
npm ci

# 构建项目
echo -e "\n${YELLOW}🔨 构建项目...${NC}"
export NODE_ENV=production
npm run build

# 检查构建输出
if [ ! -d ".next/standalone" ]; then
    echo -e "${RED}❌ 构建失败: 未找到 .next/standalone 目录${NC}"
    exit 1
fi

# 部署到 CloudRun
echo -e "\n${YELLOW}☁️  部署到 CloudRun...${NC}"
tcb cloudrun:deploy \
    --serviceName weight-tracker-api \
    --envId "$ENV_ID" \
    --containerPort 3000 \
    --minNum 0 \
    --maxNum 10 \
    --cpu 0.25 \
    --mem 0.5 \
    -- Dockerfile

# 部署静态资源（可选）
# echo -e "\n${YELLOW}📁 部署静态资源...${NC}"
# tcb hosting:deploy .next/static -e "$ENV_ID"

echo -e "\n${GREEN}✅ 部署完成!${NC}"
echo -e "${GREEN}服务地址: https://weight-tracker-api-$ENV_ID.cloudrun.tencentcloudapi.com${NC}"
echo -e "\n${YELLOW}提示: 更新 weapp/config.js 中的 apiBaseUrl 为上述地址${NC}"
