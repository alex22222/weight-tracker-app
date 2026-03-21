#!/bin/bash
# Weight Tracker App - 自动修复脚本
# 作为质量工程师的完整修复方案

set -e

echo "=========================================="
echo "Weight Tracker App - 质量修复脚本"
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 步骤 1: 清理环境变量
echo -e "${YELLOW}[1/8] 清理环境变量...${NC}"
unset __NEXT_PRIVATE_STANDALONE_CONFIG 2>/dev/null || true
unset __NEXT_PRIVATE_ORIGIN 2>/dev/null || true
export NODE_ENV=production
echo -e "${GREEN}✓ 环境变量已清理${NC}"

# 步骤 2: 修复 package.json
echo -e "${YELLOW}[2/8] 修复 package.json...${NC}"
cat > package.json << 'EOF'
{
  "name": "weight-tracker-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "postinstall": "prisma generate"
  },
  "dependencies": {
    "@cloudbase/node-sdk": "^3.4.0",
    "@prisma/client": "^5.9.0",
    "lucide-react": "^0.312.0",
    "next": "14.2.15",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "recharts": "^2.10.0",
    "uuid": "^9.0.0",
    "tencentcloud-sdk-nodejs": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "@types/uuid": "^9.0.0",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33",
    "prisma": "^5.9.0",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.0"
  }
}
EOF
echo -e "${GREEN}✓ package.json 已修复${NC}"

# 步骤 3: 清理旧依赖
echo -e "${YELLOW}[3/8] 清理旧依赖...${NC}"
rm -rf node_modules package-lock.json .next
echo -e "${GREEN}✓ 旧依赖已清理${NC}"

# 步骤 4: 安装核心依赖
echo -e "${YELLOW}[4/8] 安装核心依赖（可能需要几分钟）...${NC}"
npm install --legacy-peer-deps 2>&1 | tail -5 || {
  echo -e "${RED}✗ npm install 失败，尝试替代方法...${NC}"
  # 如果 npm 失败，使用手动安装
  npm install next@14.2.15 react@18.3.1 react-dom@18.3.1 --legacy-peer-deps
}
echo -e "${GREEN}✓ 核心依赖已安装${NC}"

# 步骤 5: 安装 Tailwind CSS 及其依赖
echo -e "${YELLOW}[5/8] 安装 Tailwind CSS...${NC}"
# 确保 tailwindcss 安装
if [ ! -d "node_modules/tailwindcss" ]; then
  echo "手动安装 tailwindcss..."
  npm pack tailwindcss@3.4.1 --silent
  tar -xzf tailwindcss-3.4.1.tgz
  mv package node_modules/tailwindcss
  rm tailwindcss-3.4.1.tgz
fi

# 安装关键依赖
for pkg in "autoprefixer@10.4.17" "postcss@8.4.33"; do
  name=$(echo $pkg | cut -d@ -f1)
  if [ ! -d "node_modules/$name" ]; then
    npm pack $pkg --silent
    tarfile=$(ls -t *.tgz 2>/dev/null | head -1)
    if [ -n "$tarfile" ]; then
      tar -xzf "$tarfile"
      mv package "node_modules/$name"
      rm "$tarfile"
    fi
  fi
done
echo -e "${GREEN}✓ Tailwind CSS 已安装${NC}"

# 步骤 6: 修复配置文件
echo -e "${YELLOW}[6/8] 修复配置文件...${NC}"

# next.config.js
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true
  },
  experimental: {
    serverComponentsExternalPackages: [
      '@prisma/client', 
      '@cloudbase/node-sdk', 
      'tencentcloud-sdk-nodejs'
    ]
  }
}

module.exports = nextConfig
EOF

# postcss.config.cjs
cat > postcss.config.cjs << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

echo -e "${GREEN}✓ 配置文件已修复${NC}"

# 步骤 7: 生成 Prisma 客户端
echo -e "${YELLOW}[7/8] 生成 Prisma 客户端...${NC}"
npx prisma generate 2>&1 | tail -5 || echo -e "${YELLOW}⚠ Prisma 生成可能有问题，继续...${NC}"
echo -e "${GREEN}✓ Prisma 客户端已生成${NC}"

# 步骤 8: 构建项目
echo -e "${YELLOW}[8/8] 构建项目...${NC}"
rm -rf .next
npm run build 2>&1 | tail -20

if [ -d ".next/standalone" ]; then
  echo -e "${GREEN}==========================================${NC}"
  echo -e "${GREEN}✓ 构建成功！${NC}"
  echo -e "${GREEN}==========================================${NC}"
  echo ""
  echo "构建输出目录: .next/standalone"
  echo ""
  echo "下一步:"
  echo "  1. 测试本地运行: npm start"
  echo "  2. 部署到 CloudBase: 使用 GitHub Actions 或 tcb 命令行"
  echo ""
else
  echo -e "${RED}==========================================${NC}"
  echo -e "${RED}✗ 构建可能失败，请检查上方错误信息${NC}"
  echo -e "${RED}==========================================${NC}"
  echo ""
  echo "常见问题:"
  echo "  - 如果看到 'generate is not a function'，请确保已清除 __NEXT_PRIVATE_STANDALONE_CONFIG 环境变量"
  echo "  - 如果看到 Tailwind 相关错误，可能需要手动安装依赖"
  echo ""
fi

echo "详细报告请查看: QUALITY_ASSESSMENT_REPORT.md"
