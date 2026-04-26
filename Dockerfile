# CloudRun 云端完整构建版本
FROM node:18-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package.json ./
RUN npm install

# 复制源代码并构建
COPY . .
RUN npm run build

# 生产环境
FROM node:18-alpine

WORKDIR /app

# 只复制生产需要的文件
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules/
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

ENV NODE_ENV=production
ENV PORT=80
ENV HOSTNAME=0.0.0.0

EXPOSE 80

CMD ["node", "server.js"]
