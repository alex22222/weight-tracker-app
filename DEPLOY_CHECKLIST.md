# 🚀 CloudBase 正式环境部署检查清单

## 第一步：腾讯云账号准备

- [ ] 注册腾讯云账号（https://cloud.tencent.com/）
- [ ] 完成实名认证（个人/企业）
- [ ] 开通 CloudBase 云开发服务

---

## 第二步：创建 CloudBase 环境

- [ ] 登录 [CloudBase 控制台](https://tcb.cloud.tencent.com/)
- [ ] 创建新环境（建议命名：`weight-tracker-prod`）
- [ ] 记录环境 ID（如：`weight-tracker-xxx`）
- [ ] 开通云存储服务（用于头像上传）

---

## 第三步：创建数据库集合

在 CloudBase 控制台 → 数据库 中创建以下集合：

### 必须创建的集合（10个）
- [ ] `users` - 用户表
- [ ] `user_settings` - 用户设置
- [ ] `weight_entries` - 体重记录
- [ ] `reading_entries` - 读书记录
- [ ] `goals` - 目标
- [ ] `messages` - 消息
- [ ] `friends` - 好友关系
- [ ] `tasks` - 打卡任务
- [ ] `task_members` - 任务成员
- [ ] `task_check_ins` - 任务打卡记录

---

## 第四步：配置数据库安全规则

在 CloudBase 控制台 → 数据库 → 安全规则 中配置：

```javascript
// 所有集合使用以下规则（生产环境严格模式）
{
  "read": "auth != null",
  "write": "auth != null"
}
```

详细的规则配置请参考 `database-rules.md` 文件。

---

## 第五步：配置环境变量

### 1. 修改 `.env.production` 文件

```bash
# 将以下内容替换为实际值
CLOUDBASE_ENV_ID=your-actual-env-id
WECHAT_APPID=your-actual-appid
WECHAT_SECRET=your-actual-secret
```

### 2. 修改小程序配置 `weapp/config.js`

```javascript
const isProduction = true // 改为 true

// 替换为实际的 CloudBase 域名
apiBaseUrl: 'https://your-service-id.ap-shanghai.app.tcloudbase.com/api'
```

---

## 第六步：构建项目

```bash
# 1. 进入项目目录
cd /Users/henry/projects/weight-tracker-app/wechat-miniprogram

# 2. 安装依赖
npm install

# 3. 构建生产版本
npm run build

# 4. 确认构建成功
ls -la .next/
```

---

## 第七步：部署后端服务

### 方式一：CloudBase CLI 部署

```bash
# 1. 安装 CloudBase CLI
npm install -g @cloudbase/cli

# 2. 登录
cloudbase login

# 3. 修改 cloudbase.json 中的 envId
# "envId": "your-actual-env-id"

# 4. 部署
cloudbase framework deploy
```

### 方式二：控制台部署

1. 进入 CloudBase 控制台
2. 选择环境 → 云托管
3. 新建服务
4. 上传代码或关联 Git 仓库
5. 配置环境变量：
   - `DB_TYPE=cloudbase`
   - `CLOUDBASE_ENV_ID=your-env-id`
   - `WECHAT_APPID=your-appid`
   - `WECHAT_SECRET=your-secret`
6. 部署服务

---

## 第八步：配置微信小程序

### 1. 服务器域名配置

登录 [微信公众平台](https://mp.weixin.qq.com/) → 开发 → 开发管理 → 开发设置：

- [ ] `request合法域名`: 添加 CloudBase 服务域名
  - 示例：`https://your-service-id.ap-shanghai.app.tcloudbase.com`
- [ ] `uploadFile合法域名`: 添加 CloudBase 存储域名
  - 示例：`https://your-env-id.tcb.qcloud.la`
- [ ] `downloadFile合法域名`: 同上

### 2. 下载生产配置

- [ ] 下载小程序生产环境代码
- [ ] 确认 `config.js` 中 `isProduction = true`
- [ ] 确认 `apiBaseUrl` 已替换为生产域名

---

## 第九步：测试验证

### 基础功能测试
- [ ] 用户注册/登录
- [ ] 体重记录添加/查看
- [ ] 读书记录添加/查看
- [ ] 目标创建/打卡
- [ ] 好友添加/消息
- [ ] 头像上传

### 一起打卡功能测试
- [ ] 创建打卡任务
- [ ] 邀请好友
- [ ] 接受邀请
- [ ] 同步打卡记录

---

## 第十步：监控与维护

- [ ] 配置 CloudBase 告警通知
- [ ] 设置数据库自动备份
- [ ] 配置日志收集
- [ ] 设置性能监控

---

## 🚨 重要提醒

1. **不要将敏感信息提交到 Git**
   - `.env.production` 已添加到 `.gitignore`
   - 小程序 `config.js` 中的生产域名可以提交

2. **生产环境必须使用 CloudBase 数据库**
   - 不能使用 SQLite
   - 必须创建所有集合

3. **安全规则要严格**
   - 生产环境不能设置为 `true`
   - 要限制用户只能访问自己的数据

4. **小程序需要重新提交审核**
   - 修改服务器域名后需要重新提交
   - 审核通过后才能正式使用

---

## 📞 技术支持

- CloudBase 文档：https://docs.cloudbase.net/
- 微信小程序文档：https://developers.weixin.qq.com/
- 腾讯云工单：https://console.cloud.tencent.com/workorder
