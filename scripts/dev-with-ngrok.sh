#!/bin/bash

# 智能开发脚本 - 自动启动 ngrok 并更新配置

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}  🚀 体重管理助手 - 智能开发环境${NC}"
echo -e "${BLUE}==========================================${NC}"
echo ""

# 检查 ngrok
if ! command -v ngrok &> /dev/null; then
    echo -e "${RED}❌ ngrok 未安装${NC}"
    echo ""
    echo "安装命令:"
    echo "  brew install ngrok"
    echo ""
    echo "然后配置 authtoken:"
    echo "  ngrok config add-authtoken YOUR_TOKEN"
    echo ""
    echo "获取 token: https://dashboard.ngrok.com/get-started/your-authtoken"
    exit 1
fi

# 检查配置
if ! ngrok config check &> /dev/null 2>&1; then
    echo -e "${RED}❌ ngrok 未配置 authtoken${NC}"
    echo ""
    echo "请执行:"
    echo "  ngrok config add-authtoken YOUR_TOKEN"
    exit 1
fi

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 安装依赖...${NC}"
    npm install
fi

# 清理旧进程
echo -e "${YELLOW}🧹 清理旧进程...${NC}"
pkill -f "next dev" 2>/dev/null || true
pkill -f "ngrok http 3000" 2>/dev/null || true
sleep 2

echo ""
echo -e "${GREEN}🚀 启动 Next.js 开发服务器...${NC}"
npm run dev > /tmp/next-dev.log 2>&1 &
NEXT_PID=$!

echo -e "${YELLOW}⏳ 等待服务启动...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 服务已就绪${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ 服务启动超时${NC}"
        cat /tmp/next-dev.log
        exit 1
    fi
done

echo ""
echo -e "${GREEN}🌐 启动 ngrok...${NC}"
ngrok http 3000 --log=stdout > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!

echo -e "${YELLOW}⏳ 等待 ngrok 就绪...${NC}"
sleep 5

# 获取 ngrok URL
NGROK_URL=""
for i in {1..20}; do
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | grep -o 'https://[^"]*' | head -1)
    if [ ! -z "$NGROK_URL" ]; then
        break
    fi
    sleep 1
done

if [ -z "$NGROK_URL" ]; then
    echo -e "${RED}❌ 无法获取 ngrok URL${NC}"
    echo "日志:"
    tail -20 /tmp/ngrok.log
    kill $NEXT_PID 2>/dev/null || true
    kill $NGROK_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo -e "${GREEN}✅ ngrok 已启动${NC}"
echo -e "   公网地址: ${BLUE}$NGROK_URL${NC}"
echo ""

# 自动更新小程序配置
echo -e "${YELLOW}📝 更新小程序配置...${NC}"
node scripts/update-ngrok-url.js "$NGROK_URL"

echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}  ✅ 开发环境已就绪！${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo -e "📱 ${YELLOW}小程序配置已自动更新${NC}"
echo -e "🌐 API 地址: ${BLUE}$NGROK_URL/api${NC}"
echo ""
echo "📊 管理界面:"
echo "   - ngrok: http://localhost:4040"
echo "   - 本地服务: http://localhost:3000"
echo ""
echo "⚠️  注意事项:"
echo "   1. 在微信开发者工具中重新编译 (Cmd+R)"
echo "   2. 确保开启「不校验合法域名」"
echo "   3. 此窗口关闭后服务会停止"
echo ""
echo "🛑 按 Ctrl+C 停止服务"
echo ""

# 显示实时日志
tail -f /tmp/next-dev.log &
TAIL_PID=$!

trap "kill $NEXT_PID $NGROK_PID $TAIL_PID 2>/dev/null; echo -e '\n${YELLOW}👋 服务已停止${NC}'; exit 0" INT

wait
