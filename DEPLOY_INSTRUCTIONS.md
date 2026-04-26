# 部署指南

## 1. 修复 npm 权限并安装依赖

```bash
cd /Users/henry/projects/weight-tracker-app/wechat-miniprogram

# 修复权限
sudo chown -R $(whoami) ~/.npm

# 清理并安装
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

## 2. 构建项目

```bash
npm run build
```

## 3. 打包部署文件

```bash
cd .next/standalone

# 更新 package.json
cat > package.json << 'PACKAGEJSON'
{
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
}
PACKAGEJSON

# 更新 Dockerfile
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
zip -r ../../cloudrun-deploy-v5.zip . -x "*.log" "*.tmp"
```

## 4. 上传到 CloudRun

1. 登录腾讯云控制台 → CloudBase → CloudRun
2. 选择服务 `weight-tracker-api`
3. 新建版本 → 上传 `cloudrun-deploy-v5.zip`
4. 部署

## 验证

部署后测试：
- 用户名: `admin`
- 密码: `123123`

登录成功后，密码会自动升级为 bcrypt 格式。
