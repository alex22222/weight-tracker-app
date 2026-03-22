#!/bin/bash
set -e

echo "=================================="
echo "🛡️  安全漏洞修复验证测试"
echo "=================================="
echo ""

BASE_URL="http://localhost:3000/api"

# 1. 测试未认证访问体重记录（应该被拒绝）
echo "[测试 1] 未认证访问体重记录"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/weight")
CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$CODE" = "401" ]; then
    echo "✅ PASS: 未认证请求被正确拒绝 (401)"
else
    echo "❌ FAIL: 预期 401，实际 $CODE"
fi
echo ""

# 2. 测试速率限制
echo "[测试 2] 登录速率限制"
for i in {1..6}; do
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"username":"testuser'$i'","password":"wrong"}')
    CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$i" -eq 6 ] && [ "$CODE" = "429" ]; then
        echo "✅ PASS: 第6次请求被速率限制 (429)"
        break
    fi
done
echo ""

# 3. 注册用户
echo "[测试 3] 注册新用户"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"username":"testuser_$(date +%s)","password":"testpass123"}')
echo "注册响应: $REGISTER_RESPONSE"
echo ""

# 4. 测试登录
echo "[测试 4] 用户登录"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"testuser1","password":"testpass123"}')
echo "登录响应: $LOGIN_RESPONSE"
echo ""

echo "=================================="
echo "测试完成"
echo "=================================="
