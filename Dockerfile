# CloudRun 云端完整构建版本
FROM node:18-alpine AS builder

WORKDIR /app

# 安装依赖（使用 npm ci 确保干净）
COPY package.json package-lock.json ./
RUN npm ci

# 强制 bust 缓存（确保源代码最新）
ARG CACHE_BUST=default
RUN echo "Cache bust: ${CACHE_BUST}"

# 从 GitHub 克隆最新代码（完全绕过构建缓存）
RUN apk add --no-cache git && \
    git clone --depth 1 -b wechat-miniprogram https://github.com/alex22222/weight-tracker-app.git /tmp/repo && \
    rm -rf /app/* && cp -r /tmp/repo/* /app/ && rm -rf /tmp/repo

# 强制从 GitHub 拉取最新 cloudbase.ts（绕过构建缓存问题）
ARG CREDENTIALS_VERSION=default
RUN curl -sSL "https://raw.githubusercontent.com/alex22222/weight-tracker-app/wechat-miniprogram/src/lib/cloudbase.ts?v=${CREDENTIALS_VERSION}" -o /app/src/lib/cloudbase.ts && grep "AKID" /app/src/lib/cloudbase.ts || exit 1

# 确保干净构建 - 强制使用新的构建缓存
ARG BUILD_ID=default
ENV BUILD_ID=${BUILD_ID}
RUN echo "Building with ID: ${BUILD_ID}" && rm -rf .next

# 验证关键配置文件存在
RUN echo "=== postcss.config.cjs ===" && cat /app/postcss.config.cjs
RUN echo "=== globals.css head ===" && head -5 /app/src/app/globals.css
RUN echo "=== tailwind.config.ts exists ===" && ls -la /app/tailwind.config.ts

# Patch Next.js 14.2.15 build bugs for CloudRun Linux environment
# Fix 1: handle undefined generateBuildId (Next.js config loading bug)
RUN node -e "const fs=require('fs'),p='/app/node_modules/next/dist/build/generate-build-id.js',c=fs.readFileSync(p,'utf8');fs.writeFileSync(p,c.replace('async function generateBuildId(generate, fallback) {','async function generateBuildId(generate, fallback) { if (typeof generate !== \"function\") { generate = fallback; }'))"
# Fix 2: ignore missing next-server.js.nft.json during standalone copy
RUN node -e "const fs=require('fs'),p='/app/node_modules/next/dist/build/utils.js',c=fs.readFileSync(p,'utf8');fs.writeFileSync(p,c.replace('await handleTraceFiles(_path.default.join(distDir, \"next-server.js.nft.json\"));','await handleTraceFiles(_path.default.join(distDir, \"next-server.js.nft.json\")).catch(()=>{});'))"

# 构建
RUN rm -rf node_modules/.cache .next/cache && npm run build

# 验证 CSS 文件大小（Tailwind 应该生成 >30KB 的 CSS）
RUN echo "=== CSS files ===" && ls -la /app/.next/static/css/ && \
    CSS_SIZE=$(stat -c%s /app/.next/static/css/*.css 2>/dev/null || stat -f%z /app/.next/static/css/*.css) && \
    echo "CSS size: ${CSS_SIZE} bytes" && \
    if [ "$CSS_SIZE" -lt 10000 ]; then echo "ERROR: CSS too small, Tailwind may not be working!"; exit 1; fi

# 验证关键路由文件存在
RUN ls -la /app/.next/standalone/.next/server/app/api/points/route.js
RUN ls -la /app/.next/standalone/.next/server/app/api/points/ranking/route.js
RUN ls -la /app/.next/standalone/.next/server/app/api/reading/recommendations/route.js
RUN ls -la /app/.next/standalone/.next/server/app/api/feedback/route.js

# 检查 chunks 是否存在（Next.js standalone 可能遗漏 shared chunks）
RUN if [ -d /app/.next/server/chunks ]; then echo "Copying server chunks..."; ls -la /app/.next/server/chunks/; else echo "No server chunks found"; fi

# 生产环境
FROM node:18-alpine

WORKDIR /app

# 只复制生产需要的文件
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules/
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# 确保 shared chunks 也被复制（Next.js 14 standalone 模式下可能遗漏）
COPY --from=builder /app/.next/server/chunks ./.next/server/chunks

ENV NODE_ENV=production
ENV PORT=80
ENV HOSTNAME=0.0.0.0
ENV CLOUDBASE_ENV_ID=weight-tracker-1ghr085dd7d6cff2
ENV WECHAT_SECRET=ba3a06ee13ac030da702d31cb3799280
ENV TENCENT_SECRET_ID=AKIDlhNtN4-hwzBgDIt1Md0j9NyNOaPA1A3T7MGmVwll2Wx8vaqDKKjE4MeYJtkY8zV3
ENV TENCENT_SECRET_KEY=khikgrrb/VDlpEljCYQYjVvSk0zSvHz36gQWiw1uFCI=

EXPOSE 80

CMD ["sh", "-c", "node -e \"const fs=require('fs'),f='/app/src/lib/cloudbase.ts',c=fs.readFileSync(f,'utf8'),sid=process.env.CLOUDBASE_SECRET_ID||'',sk=process.env.CLOUDBASE_SECRET_KEY||'',st=process.env.CLOUDBASE_SESSION_TOKEN||'';if(sid){fs.writeFileSync(f,c.replace(/const secretId = '.*?'/,\"const secretId = '\"+sid+\"'\").replace(/const secretKey = '.*?'/,\"const secretKey = '\"+sk+\"'\").replace(/const sessionToken = '.*?'/,\"const sessionToken = '\"+st+\"'\"));console.log('Updated cloudbase.ts from env vars')}\" && node server.js"]
