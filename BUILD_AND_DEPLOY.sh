#!/bin/bash
# 构建和部署脚本
# 在有正常 npm 环境的服务器上运行

set -e

echo "🚀 开始构建体重追踪应用..."

# 1. 安装依赖
echo "📦 安装依赖..."
npm install --legacy-peer-deps

# 2. 构建项目
echo "🔨 构建项目..."
npm run build

# 3. 准备 standalone 目录
echo "📂 准备部署文件..."
cd .next/standalone

# 创建 package.json
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

# 4. 打包
echo "📦 创建部署包..."
zip -r ../../cloudrun-deploy.zip . -x "*.log" "*.tmp"

cd ../..

echo ""
echo "✅ 构建完成！"
echo "📦 部署包: cloudrun-deploy.zip"
echo ""
echo "上传到腾讯云 CloudRun:"
echo "https://console.cloud.tencent.com/tcb/cloudrun"
