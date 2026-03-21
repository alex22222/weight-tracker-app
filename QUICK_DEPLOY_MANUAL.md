# CloudBase 控制台手动部署指南

由于当前环境限制，我们采用 CloudBase 控制台手动部署方式。

## 部署步骤

### 第一步：准备代码

1. **提交所有更改到 Git**
```bash
cd /Users/henry/projects/weight-tracker-app/wechat-miniprogram
git add .
git commit -m "prepare for deployment"
git push origin main
```

2. **在 GitHub 创建 Release**（可选）
- 访问: https://github.com/your-username/your-repo/releases
- 点击 "Create a new release"
- 下载源代码 zip 包

### 第二步：登录 CloudBase 控制台

1. 访问 https://console.cloud.tencent.com/tcb
2. 使用微信扫码或腾讯云账号登录
3. 选择环境: `weight-tracker-1ghr085dd7d6cff2`

### 第三步：创建云托管服务

1. 点击左侧菜单「云托管 (CloudRun)」
2. 点击「新建服务」按钮

#### 配置服务参数：

**基本信息：**
- 服务名称: `weight-tracker-api`
- 所在地域: 广州（或离你最近的）

**镜像来源：**
- 选择「使用示例模板」
- 模板选择: Node.js

**容器配置：**
- 监听端口: `3000`
- 实例规格: 
  - CPU: 0.25 核
  - 内存: 0.5 GiB
- 实例数量:
  - 最小实例数: 0
  - 最大实例数: 10

**环境变量：**
点击「添加环境变量」，添加以下变量：

| 变量名 | 值 |
|--------|-----|
| `DB_TYPE` | `cloudbase` |
| `CLOUDBASE_ENV_ID` | `weight-tracker-1ghr085dd7d6cff2` |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |

**高级设置：**
- 健康检查: 启用
  - 路径: `/api/health`
  - 端口: `3000`

3. 点击「开始部署」

### 第四步：等待部署完成

部署过程大约需要 2-5 分钟。你可以在控制台看到进度：
1. 镜像构建中
2. 服务启动中
3. 健康检查中

### 第五步：验证部署

1. 部署完成后，在服务列表中找到 `weight-tracker-api`
2. 点击「访问链接」复制服务地址
3. 在浏览器或终端测试：

```bash
# 测试健康接口
curl https://your-service-url/api/health

# 预期输出
{"status":"ok","timestamp":"2024-01-20T10:30:00.000Z"}
```

### 第六步：配置数据库

1. 在 CloudBase 控制台点击「数据库」
2. 确认以下集合已存在：
   - `weight_entries`
   - `users`
   - `user_settings`
   - `messages`
   - `friends`
   - `fitness_channels`
   - `channel_members`
   - `channel_comments`
   - `check_ins`
   - `leave_requests`

3. 如缺少集合，点击「创建集合」逐一创建

### 第七步：创建管理员账号

方法 1 - 使用 API 初始化：
```bash
curl -X POST https://your-service-url/api/admin/init
```

方法 2 - 手动在数据库创建：
1. 进入 CloudBase 控制台 → 数据库
2. 选择 `users` 集合
3. 添加文档：
```json
{
  "username": "admin",
  "password": "$2a$10$...", // bcrypt 加密后的密码
  "gender": "other",
  "avatar": "",
  "createdAt": {"$date": "2024-01-20T00:00:00Z"},
  "updatedAt": {"$date": "2024-01-20T00:00:00Z"}
}
```

### 第八步：配置微信小程序

1. 登录 https://mp.weixin.qq.com
2. 开发 → 开发管理 → 开发设置
3. 找到「服务器域名」
4. 在「request 合法域名」中添加你的 CloudRun 服务地址：
   - `https://your-service-url`

### 第九步：更新小程序代码

编辑 `weapp/config.js`：
```javascript
module.exports = {
  apiBaseUrl: 'https://your-service-url/api'
}
```

然后提交小程序代码审核。

---

## 替代方案：使用 CloudBase CLI

如果你希望使用命令行部署：

### 1. 安装 CLI
```bash
npm install -g @cloudbase/cli
```

### 2. 登录
```bash
cloudbase login
```

### 3. 部署
```bash
cloudbase cloudrun:deploy \
  --service weight-tracker-api \
  --env-id weight-tracker-1ghr085dd7d6cff2 \
  --port 3000 \
  --min-num 0 \
  --max-num 10 \
  --cpu 0.25 \
  --mem 0.5 \
  --env-vars DB_TYPE=cloudbase,CLOUDBASE_ENV_ID=weight-tracker-1ghr085dd7d6cff2,NODE_ENV=production,PORT=3000
```

---

## 故障排查

### 问题 1: 服务启动失败

**症状**: 健康检查失败，服务状态为「异常」

**解决方案**:
1. 检查日志：控制台 → 云托管 → 日志
2. 确认环境变量 `DB_TYPE` 设置为 `cloudbase`
3. 确认端口设置为 `3000`

### 问题 2: API 返回 500 错误

**症状**: 可以访问但接口报错

**解决方案**:
1. 检查数据库集合是否已创建
2. 检查 `CLOUDBASE_ENV_ID` 是否正确
3. 查看详细错误日志

### 问题 3: 小程序无法访问

**症状**: 小程序中报网络错误

**解决方案**:
1. 检查小程序后台是否配置了服务器域名
2. 确认域名使用 HTTPS
3. 检查是否添加了 `/api` 路径

---

## 成本说明

使用最小配置（0.25 CPU / 0.5 GiB，最小实例数 0）：

- **开发/测试环境**: ¥0-50/月
- **生产环境**: ¥100-300/月

免费额度包含每月 50,000 次请求，超出后按量计费。

---

## 下一步

部署成功后：
1. ✅ 配置自定义域名（可选）
2. ✅ 启用监控告警
3. ✅ 设置自动扩缩容
4. ✅ 配置 CDN 加速

---

**需要帮助？**
- 查看完整文档: [TENCENT_CLOUD_DEPLOYMENT.md](./TENCENT_CLOUD_DEPLOYMENT.md)
- 腾讯云工单: https://console.cloud.tencent.com/workorder
