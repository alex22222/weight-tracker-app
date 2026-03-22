# CloudBase Next.js 模板部署（推荐）

## 为什么用模板？

| 对比 | Docker 构建 | Next.js 模板 |
|------|-------------|--------------|
| 复杂度 | ⭐⭐⭐ 高 | ⭐ 低 |
| 构建时间 | 5-10 分钟 | 2-3 分钟 |
| 成功率 | 容易出错 | ✅ 高 |
| 维护性 | 需要维护 Dockerfile | 平台自动维护 |

## 部署步骤

### 步骤 1: 准备代码

确保代码已推送到 GitHub：
```bash
cd /Users/henry/projects/weight-tracker-app/wechat-miniprogram
git add .
git commit -m "prepare for CloudBase Next.js template deployment"
git push origin wechat-miniprogram  # 或 main
```

### 步骤 2: 在 CloudBase 控制台选择模板

1. 访问：https://console.cloud.tencent.com/tcb/env/weight-tracker-1ghr085dd7d6cff2

2. 找到 **「应用管理」** 或 **「云托管」**

3. 点击 **「新建服务」** 或 **「创建应用」**

4. 选择 **「使用模板创建」** → **「Next.js」**
   ```
   模板市场 / 常用框架
   └── [Next.js] ← 选择这个
   ```

### 步骤 3: 配置部署

#### 基础配置

| 配置项 | 值 |
|--------|-----|
| 服务名称 | `weight-tracker-api` |
| 代码来源 | GitHub |
| 仓库 | `alex22222/weight-tracker-app` |
| 分支 | `wechat-miniprogram` (或 main) |

#### 构建配置（关键！）

| 配置项 | 值 |
|--------|-----|
| 构建命令 | `npm install --legacy-peer-deps && npx prisma generate && npm run build` |
| 输出目录 | `.next` |
| 启动命令 | `npm start` |
| 监听端口 | `3000` |

#### 环境变量

添加以下变量：
```
DB_TYPE=cloudbase
CLOUDBASE_ENV_ID=weight-tracker-1ghr085dd7d6cff2
NODE_ENV=production
PORT=3000
NEXT_TELEMETRY_DISABLED=1
```

#### 实例规格

| 配置项 | 值 |
|--------|-----|
| CPU | 0.25 核 |
| 内存 | 0.5 GiB |
| 最小实例数 | 0 |
| 最大实例数 | 10 |

### 步骤 4: 开始部署

点击 **「创建并部署」** 或 **「开始部署」**

等待 2-5 分钟...

### 步骤 5: 验证部署

部署成功后，你会看到：
```
服务地址: https://weight-tracker-api-xxx.gz.apigw.tencentcs.com
```

测试：
```bash
curl https://xxx.gz.apigw.tencentcs.com/api/health
```

---

## 常见问题

### Q: 找不到 Next.js 模板

**解决**：
- 尝试路径：**应用管理** → **从模板新建** → **框架模板** → **Next.js**
- 或搜索 "Next.js" 或 "next"

### Q: 构建失败

**解决**：
检查构建命令是否正确：
```bash
npm install --legacy-peer-deps && npx prisma generate && npm run build
```

### Q: Prisma 报错

**解决**：
确保构建命令包含 `npx prisma generate`

### Q: 找不到模板入口

**备选方案** - 使用 **CloudBase Framework**：

项目已配置 `cloudbase.json`，直接运行：
```bash
npm install -g @cloudbase/cli
cloudbase login
cloudbase deploy
```

---

## 如果模板也找不到

### 终极方案：使用 Vercel（最简单）

1. 访问 https://vercel.com
2. 导入 GitHub 仓库
3. 自动识别 Next.js
4. 添加环境变量
5. 部署完成！

**5分钟搞定，比 CloudBase 更简单！**

---

## 推荐顺序

1. 🥇 **CloudBase Next.js 模板**（如果找得到）
2. 🥈 **Vercel**（最简单可靠）
3. 🥉 **CloudBase Framework** (`cloudbase deploy`)
4. **CloudBase Docker**（最后选择）

---

**现在去尝试 CloudBase Next.js 模板吧！**
