# 404 错误诊断指南

## 🔍 问题原因

`POST https://api.spaceflag.site/api/auth/wechat-login 404`

说明后端服务没有正确部署，或者部署后路由未生效。

---

## 🛠️ 诊断步骤

### 步骤 1：检查基础服务是否运行

浏览器访问：
```
https://api.spaceflag.site/api/health
```

**预期结果**：
```json
{"status":"ok","timestamp":"2024-...","version":"1.0.0"}
```

**如果也是 404**：说明整个后端服务都没部署成功

---

### 步骤 2：检查 CloudRun 部署状态

1. 登录 https://console.cloud.tencent.com/tcb/cloudrun
2. 找到 `weight-tracker-api` 服务
3. 查看 **"版本管理"**
4. 确认最新版本状态是 **"正常"**（绿色）

**如果状态是"异常"**：
- 点击版本查看日志
- 检查是否有构建错误

---

### 步骤 3：检查 CloudRun 日志

在 CloudRun 控制台 → 日志，查看是否有以下错误：

```
# 正常启动日志
Ready on port 80

# 错误示例
Error: Cannot find module 'next'
Error: JWT_SECRET is required
```

---

### 步骤 4：常见 404 原因

#### 原因 1：环境变量未设置
检查 CloudRun 环境变量是否设置了：
```
JWT_SECRET=xxx
CLOUDBASE_ENV_ID=weight-tracker-1ghr085dd7d6cff2
```

#### 原因 2：构建失败
重新上传部署包并部署

#### 原因 3：路由未正确生成
Next.js 构建问题，需要重新构建

---

## 🚀 快速修复

### 方案 A：重新部署（推荐）

1. **下载最新部署包**：`weight-tracker-app.zip`

2. **上传到 CloudRun**：
   - 新建版本
   - 上传 zip 文件
   - Dockerfile 路径：`./Dockerfile`

3. **设置环境变量**（必须）：
   ```
   JWT_SECRET=随机生成的32位字符串
   CLOUDBASE_ENV_ID=weight-tracker-1ghr085dd7d6cff2
   ```

4. **部署**

5. **测试**：
   ```bash
   curl https://api.spaceflag.site/api/health
   ```

### 方案 B：检查现有部署

如果已经部署过，检查：

```bash
# 测试健康检查
curl -v https://api.spaceflag.site/api/health

# 测试登录（应该返回 401 而不是 404）
curl -X POST https://api.spaceflag.site/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

**如果 login 返回 401**：说明服务正常，只是密码错误
**如果 login 返回 404**：说明服务没部署好

---

## 📞 获取帮助

如果以上步骤无法解决：

1. 打开 CloudRun 控制台
2. 复制最新的错误日志
3. 把日志内容发给我

常见错误日志关键字：
- `Cannot find module`
- `JWT_SECRET`
- `EACCES`
- `port already in use`
