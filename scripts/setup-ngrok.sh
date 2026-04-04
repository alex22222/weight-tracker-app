#!/bin/bash

# ngrok 配置向导

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}  🔧 ngrok 配置向导${NC}"
echo -e "${BLUE}==========================================${NC}"
echo ""

# 检查 ngrok 是否安装
if ! command -v ngrok &> /dev/null; then
    echo -e "${YELLOW}📦 ngrok 未安装，正在安装...${NC}"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install ngrok
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "请手动安装 ngrok:"
        echo "  sudo apt install ngrok  或访问 https://ngrok.com/download"
        exit 1
    else
        echo "请访问 https://ngrok.com/download 下载安装"
        exit 1
    fi
fi

echo -e "${GREEN}✅ ngrok 已安装${NC}"
echo ""

# 检查是否已配置
if ngrok config check &> /dev/null 2>&1; then
    echo -e "${GREEN}✅ ngrok 已配置${NC}"
    echo ""
    echo "可以直接运行:"
    echo "  ./scripts/dev-with-ngrok.sh"
    exit 0
fi

echo -e "${YELLOW}⚠️  ngrok 需要配置 authtoken${NC}"
echo ""
echo "请按以下步骤操作："
echo ""
echo "1️⃣  访问 ${BLUE}https://ngrok.com${NC} 注册账号"
echo "    (可以使用 GitHub/Google 账号快速登录)"
echo ""
echo "2️⃣  获取 authtoken"
echo "    访问: ${BLUE}https://dashboard.ngrok.com/get-started/your-authtoken${NC}"
echo ""
echo "3️⃣  复制 authtoken (格式: 2K9xxxxxxxxxx)"
echo ""

# 提示输入 authtoken
echo -n "请输入你的 ngrok authtoken: "
read -s AUTHTOKEN
echo ""

if [ -z "$AUTHTOKEN" ]; then
    echo -e "${RED}❌ authtoken 不能为空${NC}"
    exit 1
fi

echo -e "${YELLOW}🔧 正在配置...${NC}"
ngrok config add-authtoken "$AUTHTOKEN"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ ngrok 配置成功！${NC}"
    echo ""
    echo "现在可以运行:"
    echo "  ${BLUE}./scripts/dev-with-ngrok.sh${NC}"
else
    echo -e "${RED}❌ 配置失败，请检查 authtoken 是否正确${NC}"
    exit 1
fi
