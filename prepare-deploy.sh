#!/bin/bash
# 准备 CloudBase 部署包

echo "========================================"
echo "  准备 CloudBase 部署包"
echo "========================================"
echo ""

# 清理旧文件
echo "1. 清理旧文件..."
rm -rf deploy/
rm -f deploy.zip

# 创建部署目录
echo "2. 创建部署目录..."
mkdir -p deploy

# 复制必要文件
echo "3. 复制项目文件..."
cp -r src deploy/
cp -r prisma deploy/
cp -r public deploy/ 2>/dev/null || true
cp package.json deploy/
cp package-lock.json deploy/ 2>/dev/null || true
cp next.config.js deploy/
cp postcss.config.cjs deploy/ 2>/dev/null || true
cp tailwind.config.ts deploy/ 2>/dev/null || true
cp tsconfig.json deploy/ 2>/dev/null || true
cp .env.local deploy/.env.example 2>/dev/null || true

# 创建部署说明
cat > deploy/DEPLOY_README.txt << 'DEPLOYEOF'
CloudBase 部署说明
==================

1. 上传本目录所有文件到 CloudBase
2. 构建命令: npm install --legacy-peer-deps && npx prisma generate && npm run build
3. 启动命令: npm start
4. 端口: 3000

环境变量需要设置:
- DB_TYPE=cloudbase
- CLOUDBASE_ENV_ID=weight-tracker-1ghr085dd7d6cff2
- NODE_ENV=production
- PORT=3000
DEPLOYEOF

echo "4. 创建 zip 包..."
zip -r deploy.zip deploy/ -x "*.git*" -x "node_modules/*" -x ".next/*"

echo ""
echo "========================================"
echo "  部署包已创建: deploy.zip"
echo "========================================"
echo ""
echo "文件大小:"
ls -lh deploy.zip
echo ""
echo "下一步:"
echo "1. 在 CloudBase 控制台选择「上传代码」"
echo "2. 上传 deploy.zip 文件"
echo "3. 按 DEPLOY_README.txt 配置"
