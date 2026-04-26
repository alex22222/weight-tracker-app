#!/bin/bash
set -e

echo "🚀 开始构建并打包部署..."

cd /Users/henry/projects/weight-tracker-app/wechat-miniprogram

# 检查 node_modules
if [ ! -d "node_modules" ]; then
    echo "⚠️ 未找到 node_modules，尝试安装..."
    npm install --legacy-peer-deps || {
        echo "❌ npm install 失败，尝试修复权限..."
        sudo chown -R $(whoami) ~/.npm 2>/dev/null || true
        npm install --legacy-peer-deps
    }
fi

# 构建
echo "📦 构建项目..."
rm -rf .next
npm run build

# 检查构建结果
if [ ! -d ".next/standalone" ]; then
    echo "❌ 构建失败， standalone 目录不存在"
    exit 1
fi

# 进入 standalone 目录
cd .next/standalone

# 创建 package.json
echo "📝 创建 package.json..."
cat > package.json << 'PACKAGEJSON'
{
  "name": "weight-tracker-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "@cloudbase/node-sdk": "^3.4.0",
    "@prisma/client": "^5.9.0",
    "bcryptjs": "^3.0.3",
    "jsonwebtoken": "^9.0.3",
    "next": "14.2.15",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "uuid": "^9.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
PACKAGEJSON

# 创建 Dockerfile
echo "📝 创建 Dockerfile..."
cat > Dockerfile << 'DOCKERFILE'
FROM node:18-alpine
WORKDIR /app
COPY package.json ./
COPY node_modules ./node_modules/
COPY . .
RUN if [ ! -d "node_modules/next" ]; then npm install; fi
ENV NODE_ENV=production
ENV PORT=80
ENV HOSTNAME=0.0.0.0
EXPOSE 80
CMD ["node", "server.js"]
DOCKERFILE

# 打包
echo "📦 创建部署包..."
zip -r ../../cloudrun-deploy-v5.zip . -x "*.log" "*.tmp" 

cd ../..

echo ""
echo "✅ 部署包已创建: cloudrun-deploy-v5.zip ($(ls -lh cloudrun-deploy-v5.zip | awk '{print $5}'))"
echo ""
echo "🚀 下一步：上传到腾讯云 CloudRun"
echo ""
echo "操作步骤："
echo "1. 访问 https://console.cloud.tencent.com/tcb/cloudrun"
echo "2. 选择服务: weight-tracker-api"
echo "3. 点击'新建版本'"
echo "4. 上传文件: $(pwd)/cloudrun-deploy-v5.zip"
echo "5. 端口设置: 80"
echo "6. 点击'开始部署'"
echo ""
