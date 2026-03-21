#!/bin/bash

cd "$(dirname "$0")"

# 创建必要的目录
mkdir -p node_modules/@alloc

# 定义要安装的包（格式：包名|版本|目标路径）
declare -a packages=(
  "@alloc/quick-lru|5.2.0|node_modules/@alloc/quick-lru"
  "arg|5.0.2|node_modules/arg"
  "chokidar|3.6.0|node_modules/chokidar"
  "didyoumean|1.2.2|node_modules/didyoumean"
  "dlv|1.1.3|node_modules/dlv"
  "fast-glob|3.3.2|node_modules/fast-glob"
  "glob-parent|6.0.2|node_modules/glob-parent"
  "is-glob|4.0.3|node_modules/is-glob"
  "jiti|1.21.0|node_modules/jiti"
  "lilconfig|2.1.0|node_modules/lilconfig"
  "micromatch|4.0.5|node_modules/micromatch"
  "normalize-path|3.0.0|node_modules/normalize-path"
  "object-hash|3.0.0|node_modules/object-hash"
  "picocolors|1.0.0|node_modules/picocolors"
  "postcss-import|15.1.0|node_modules/postcss-import"
  "postcss-js|4.0.1|node_modules/postcss-js"
  "postcss-load-config|4.0.2|node_modules/postcss-load-config"
  "postcss-nested|6.0.1|node_modules/postcss-nested"
  "postcss-selector-parser|6.0.15|node_modules/postcss-selector-parser"
  "resolve|1.22.8|node_modules/resolve"
  "sucrase|3.35.0|node_modules/sucrase"
  "postcss|8.4.33|node_modules/postcss"
  "autoprefixer|10.4.17|node_modules/autoprefixer"
)

for item in "${packages[@]}"; do
  IFS='|' read -r name version dest <<< "$item"
  
  echo "Installing $name@$version..."
  
  # 下载包
  npm pack "${name}@${version}" --silent 2>/dev/null
  
  # 找到下载的文件
  tarfile=$(ls -t *.tgz 2>/dev/null | head -1)
  
  if [ -n "$tarfile" ] && [ -f "$tarfile" ]; then
    # 删除旧版本
    rm -rf "$dest"
    
    # 解压到新位置
    tar -xzf "$tarfile"
    mkdir -p "$(dirname "$dest")"
    mv package "$dest"
    rm "$tarfile"
    
    echo "  ✓ $name@$version installed to $dest"
  else
    echo "  ✗ Failed to download $name@$version"
  fi
done

echo "Done!"
