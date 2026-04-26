#!/bin/bash
set -e

echo "🚀 开始构建部署包..."

cd /Users/henry/projects/weight-tracker-app/wechat-miniprogram

# 检查 node_modules
if [ ! -d "node_modules" ]; then
    echo "❌ 请先运行 npm install"
    exit 1
fi

# 构建
echo "📦 构建项目..."
npm run build

# 进入 standalone 目录
cd .next/standalone

# 确保 package.json 存在
if [ ! -f "package.json" ]; then
echo '{
  "name": "weight-tracker-app",
  "version": "1.0.0",
  "scripts": { "start": "node server.js" },
  "dependencies": {
    "@cloudbase/node-sdk": "^3.4.0",
    "bcryptjs": "^3.0.3",
    "jsonwebtoken": "^9.0.3",
    "next": "14.2.15",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}' > package.json
fi

# 确保 Dockerfile 存在
if [ ! -f "Dockerfile" ]; then
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
fi

# 打包
echo "📦 创建部署包..."
zip -r ../../cloudrun-deploy-v5.zip . -x "*.log" "*.tmp" 

echo "✅ 部署包已创建: cloudrun-deploy-v5.zip"
echo ""
echo "下一步:"
echo "1. 登录腾讯云控制台"
echo "2. 进入 CloudBase → CloudRun"
echo "3. 选择服务 weight-tracker-api"
echo "4. 新建版本 → 上传 cloudrun-deploy-v5.zip"
echo "5. 部署"
