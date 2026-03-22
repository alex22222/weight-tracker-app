#!/bin/bash
set -e

echo "=== 完整修复脚本 ==="

# 1. 修复 package.json
cat > package.json << 'EOF'
{
  "name": "weight-tracker-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
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

# 2. 清理并重新安装
echo "清理 node_modules..."
rm -rf node_modules package-lock.json .next

echo "安装依赖..."
npm install 2>&1 | tail -5

# 3. 修复 postcss 配置
cat > postcss.config.cjs << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# 4. 确保 tailwindcss 安装
if [ ! -d "node_modules/tailwindcss" ]; then
  echo "手动安装 tailwindcss..."
  npm pack tailwindcss@3.4.1 --silent
  tar -xzf tailwindcss-3.4.1.tgz
  mv package node_modules/tailwindcss
  rm tailwindcss-3.4.1.tgz
fi

# 5. 安装 Tailwind 依赖
echo "安装 Tailwind 依赖..."
for pkg in "@alloc/quick-lru@5.2.0" "arg@5.0.2" "chokidar@3.6.0" "didyoumean@1.2.2" "dlv@1.1.3" "fast-glob@3.3.2" "glob-parent@6.0.2" "is-glob@4.0.3" "jiti@1.21.0" "lilconfig@2.1.0" "micromatch@4.0.5" "normalize-path@3.0.0" "object-hash@3.0.0" "picocolors@1.0.0" "postcss-import@15.1.0" "postcss-js@4.0.1" "postcss-load-config@4.0.2" "postcss-nested@6.0.1" "postcss-selector-parser@6.0.15" "resolve@1.22.8" "sucrase@3.35.0" "cssesc@3.0.0" "util-deprecate@1.0.2"; do
  name=$(echo $pkg | cut -d@ -f1)
  version=$(echo $pkg | cut -d@ -f2)
  
  # 处理 scoped packages
  if [[ $name == @* ]]; then
    dir="node_modules/$name"
    mkdir -p "$(dirname "$dir")"
  else
    dir="node_modules/$name"
  fi
  
  if [ ! -d "$dir" ]; then
    npm pack "$pkg" --silent 2>/dev/null || true
    tarfile=$(ls -t *.tgz 2>/dev/null | head -1)
    if [ -n "$tarfile" ] && [ -f "$tarfile" ]; then
      tar -xzf "$tarfile" 2>/dev/null
      mv package "$dir" 2>/dev/null || true
      rm "$tarfile" 2>/dev/null || true
    fi
  fi
done

echo "=== 修复完成 ==="
