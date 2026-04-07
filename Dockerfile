# 多阶段构建 Dockerfile for CloudBase
# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制 package.json 到根目录
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY src ./src
COPY prisma ./prisma
COPY next.config.js ./
COPY tsconfig.json ./
COPY postcss.config.cjs ./
COPY tailwind.config.ts ./
COPY .env.production ./.env.production

# 创建 public 目录（如果不存在）
RUN mkdir -p public/uploads

# 复制 public 目录（如果存在）
COPY public ./public

# 构建应用
RUN npm run build

# 生产阶段
FROM node:18-alpine AS runner

WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=80
ENV HOSTNAME=0.0.0.0

# 复制构建产物
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 复制 public 目录（包含上传的文件）
COPY --from=builder /app/public ./public

# 暴露端口
EXPOSE 80

# 启动应用
CMD ["node", "server.js"]
