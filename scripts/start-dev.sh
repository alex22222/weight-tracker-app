#!/bin/bash

# 开发环境启动脚本 - 使用 ngrok 内网穿透

set -e

echo "=========================================="
echo "  体重管理助手 - 开发环境启动脚本"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 ngrok 是否安装
if ! command -v ngrok &> /dev/null; then
    echo -e "${RED}❌ ngrok 未安装${NC}"
    echo ""
    echo "请按以下步骤安装："
    echo "1. 访问 https://ngrok.com 注册账号"
    echo "2. 获取 authtoken"
    echo "3. 安装 ngrok:"
    echo "   brew install ngrok    # macOS"
    echo "   或下载: https://ngrok.com/download"
    echo "4. 配置 authtoken:"
    echo "   ngrok config add-authtoken YOUR_TOKEN"
    exit 1
fi

# 检查 ngrok 是否已配置
echo -e "${YELLOW}🔍 检查 ngrok 配置...${NC}"
if ! ngrok config check &> /dev/null; then
    echo -e "${RED}❌ ngrok 未配置 authtoken${NC}"
    echo ""
    echo "请执行: ngrok config add-authtoken YOUR_TOKEN"
    echo "获取 token: https://dashboard.ngrok.com/get-started/your-authtoken"
    exit 1
fi

echo -e "${GREEN}✅ ngrok 已配置${NC}"
echo ""

# 检查 node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 安装依赖...${NC}"
    npm install
fi

# 杀死已存在的进程
echo -e "${YELLOW}🧹 清理旧进程...${NC}"
pkill -f "next dev" 2>/dev/null || true
pkill -f "ngrok http 3000" 2>/dev/null || true
sleep 2

echo ""
echo -e "${GREEN}🚀 启动开发服务器...${NC}"
echo ""

# 启动 Next.js 开发服务器
npm run dev &
NEXT_PID=$!

# 等待服务启动
echo -e "${YELLOW}⏳ 等待服务启动 (5秒)...${NC}"
sleep 5

echo ""
echo -e "${GREEN}🌐 启动 ngrok 内网穿透...${NC}"
echo ""

# 启动 ngrok 并捕获 URL
ngrok http 3000 --log=stdout --log-format=logfmt > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!

# 等待 ngrok 启动
echo -e "${YELLOW}⏳ 等待 ngrok 启动 (5秒)...${NC}"
sleep 5

# 获取 ngrok URL
NGROK_URL=""
for i in {1..10}; do
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | grep -o 'https://[^"]*' | head -1)
    if [ ! -z "$NGROK_URL" ]; then
        break
    fi
    sleep 2
done

if [ -z "$NGROK_URL" ]; then
    echo -e "${RED}❌ 无法获取 ngrok URL${NC}"
    echo "请检查 ngrok 是否正常运行"
    kill $NEXT_PID 2>/dev/null || true
    kill $NGROK_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ 开发环境已启动！${NC}"
echo "=========================================="
echo ""
echo -e "🌐 公网访问地址: ${GREEN}$NGROK_URL/api${NC}"
echo ""
echo "📱 请修改 weapp/config.js:"
echo "   apiBaseUrl: '$NGROK_URL/api'"
echo ""
echo "📊 管理界面: http://localhost:4040"
echo ""
echo "⚠️  注意:"
echo "   - 每次重启 ngrok URL 会变，需要更新 config.js"
echo "   - 按 Ctrl+C 停止服务"
echo ""
echo "=========================================="

# 保存 URL 到文件
echo "$NGROK_URL/api" > /tmp/ngrok_url.txt

# 等待用户中断
trap "kill $NEXT_PID 2>/dev/null; kill $NGROK_PID 2>/dev/null; echo -e '\n${YELLOW}👋 服务已停止${NC}'; exit 0" INT

wait
