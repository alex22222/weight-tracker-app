#!/bin/bash

# 需要手动安装的包列表
packages=(
  "tailwindcss@3.4.1"
  "typescript@5.3.3"
  "autoprefixer@10.4.27"
  "postcss@8.4.33"
  "@types/node@20.19.35"
  "@types/react@18.3.28"
  "@types/react-dom@18.2.0"
  "@types/uuid@9.0.0"
)

for pkg in "${packages[@]}"; do
  name=$(echo $pkg | cut -d@ -f1)
  version=$(echo $pkg | cut -d@ -f2-)
  
  echo "Installing $name@$version..."
  
  # 下载并解压
  npm pack "${name}@${version}" --silent
  tarfile="${name}-${version}.tgz"
  
  if [ -f "$tarfile" ]; then
    tar -xzf "$tarfile"
    rm -rf "node_modules/$name"
    mv package "node_modules/$name"
    rm "$tarfile"
    echo "  ✓ $name installed"
  else
    # 尝试去掉 .0 后缀
    version_short=$(echo $version | sed 's/\.0$//')
    tarfile="${name}-${version_short}.tgz"
    if [ -f "$tarfile" ]; then
      tar -xzf "$tarfile"
      rm -rf "node_modules/$name"
      mv package "node_modules/$name"
      rm "$tarfile"
      echo "  ✓ $name installed (short version)"
    else
      echo "  ✗ Failed to install $name"
    fi
  fi
done

echo "Done!"
