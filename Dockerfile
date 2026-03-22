# CloudBase CloudRun Dockerfile
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json
COPY package.json ./

# 安装依赖（不使用 package-lock.json）
RUN npm install --legacy-peer-deps

# 复制所有文件
COPY . .

# 生成 Prisma 客户端
RUN npx prisma generate

# 构建应用
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# 启动命令
CMD ["npm", "start"]
