#!/bin/bash
# 构建验证脚本 - 在本地验证项目是否可以成功构建

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Weight Tracker - 构建验证脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查环境
echo -e "${YELLOW}[1/8] 检查环境...${NC}"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js 未安装${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}✗ Node.js 版本过低，需要 18.x 或更高${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js 版本: $(node -v)${NC}"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm 未安装${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm 版本: $(npm -v)${NC}"

# 检查 Docker（可选）
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker 版本: $(docker --version)${NC}"
    HAS_DOCKER=true
else
    echo -e "${YELLOW}⚠ Docker 未安装，将跳过 Docker 构建测试${NC}"
    HAS_DOCKER=false
fi

echo ""

# 清理环境变量
echo -e "${YELLOW}[2/8] 清理环境变量...${NC}"
unset __NEXT_PRIVATE_STANDALONE_CONFIG 2>/dev/null || true
unset __NEXT_PRIVATE_ORIGIN 2>/dev/null || true
echo -e "${GREEN}✓ 环境变量已清理${NC}"

echo ""

# 检查项目结构
echo -e "${YELLOW}[3/8] 检查项目结构...${NC}"
REQUIRED_FILES=("package.json" "next.config.js" "Dockerfile" "prisma/schema.prisma")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}✗ 缺少必要文件: $file${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✓ 项目结构检查通过${NC}"

echo ""

# 检查环境变量配置
echo -e "${YELLOW}[4/8] 检查环境变量配置...${NC}"
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠ 未找到 .env.local，使用 .env.example 创建${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
    else
        echo -e "${RED}✗ 缺少环境变量配置文件${NC}"
        exit 1
    fi
fi

# 检查必需的环境变量
if grep -q "CLOUDBASE_ENV_ID=" .env.local && ! grep -q "CLOUDBASE_ENV_ID=your-env-id" .env.local; then
    echo -e "${GREEN}✓ CloudBase 环境 ID 已配置${NC}"
else
    echo -e "${YELLOW}⚠ CloudBase 环境 ID 未配置或使用了默认值${NC}"
fi

echo ""

# 安装依赖
echo -e "${YELLOW}[5/8] 安装依赖...${NC}"
if [ -d "node_modules" ]; then
    echo "node_modules 已存在，跳过安装"
else
    npm install --legacy-peer-deps 2>&1 | tail -5
fi

# 检查关键依赖
if [ ! -d "node_modules/next" ]; then
    echo -e "${RED}✗ Next.js 未正确安装${NC}"
    exit 1
fi
if [ ! -d "node_modules/tailwindcss" ]; then
    echo -e "${RED}✗ Tailwind CSS 未正确安装${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 依赖安装完成${NC}"

echo ""

# 生成 Prisma 客户端
echo -e "${YELLOW}[6/8] 生成 Prisma 客户端...${NC}"
npx prisma generate 2>&1 | tail -3
echo -e "${GREEN}✓ Prisma 客户端已生成${NC}"

echo ""

# 执行构建
echo -e "${YELLOW}[7/8] 执行构建...${NC}"
rm -rf .next

# 设置构建环境变量
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

if npm run build 2>&1; then
    echo -e "${GREEN}✓ 构建成功${NC}"
else
    echo -e "${RED}✗ 构建失败${NC}"
    echo ""
    echo "常见错误及解决方案："
    echo "  1. 'generate is not a function' - 环境变量未清理，重新运行脚本"
    echo "  2. 'Cannot find module tailwindcss' - 依赖安装失败，手动安装: npm install tailwindcss"
    echo "  3. TypeScript 错误 - 检查 src/lib/db-adapter.ts 中的类型定义"
    exit 1
fi

echo ""

# 检查构建输出
echo -e "${YELLOW}[8/8] 检查构建输出...${NC}"

if [ ! -d ".next" ]; then
    echo -e "${RED}✗ 构建输出目录不存在${NC}"
    exit 1
fi

echo "构建输出目录结构："
ls -la .next/ | head -20

echo ""

if [ -d ".next/standalone" ]; then
    echo -e "${GREEN}✓ Standalone 构建成功${NC}"
    echo "Standalone 目录大小: $(du -sh .next/standalone | cut -f1)"
else
    echo -e "${YELLOW}⚠ 未找到 standalone 目录，检查 next.config.js 中的 output 配置${NC}"
fi

# 检查关键文件
if [ -f ".next/server/app/api/health/route.js" ]; then
    echo -e "${GREEN}✓ API 路由构建成功${NC}"
else
    echo -e "${YELLOW}⚠ API 路由可能未正确构建${NC}"
fi

if [ -f ".next/server/app/page.js" ]; then
    echo -e "${GREEN}✓ 页面路由构建成功${NC}"
else
    echo -e "${YELLOW}⚠ 页面路由可能未正确构建${NC}"
fi

echo ""

# Docker 构建测试（可选）
if [ "$HAS_DOCKER" = true ]; then
    echo -e "${YELLOW}[额外] Docker 构建测试...${NC}"
    
    # 检查 Dockerfile
    if docker build -t weight-tracker-test:latest . 2>&1 | tail -10; then
        echo -e "${GREEN}✓ Docker 镜像构建成功${NC}"
        
        # 清理测试镜像
        docker rmi weight-tracker-test:latest 2>/dev/null || true
    else
        echo -e "${RED}✗ Docker 镜像构建失败${NC}"
        echo "请检查 Dockerfile 配置"
    fi
    
    echo ""
fi

# 总结
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}  构建验证完成！${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "下一步操作："
echo "  1. 本地测试: npm start"
echo "  2. Docker 构建: docker build -t weight-tracker-api ."
echo "  3. 部署到腾讯云:"
echo "     - 方式一: 推送镜像到 TCR 并在 CloudBase 部署"
echo "     - 方式二: 提交代码触发 GitHub Actions 自动部署"
echo ""
echo "参考文档："
echo "  - TENCENT_CLOUD_DEPLOYMENT.md - 完整部署指南"
echo "  - QUALITY_ASSESSMENT_REPORT.md - 质量评估报告"
echo ""
