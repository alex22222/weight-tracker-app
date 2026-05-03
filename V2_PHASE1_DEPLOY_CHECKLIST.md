# V2.0 Phase 1 部署检查清单

## 📋 部署前检查

### 1. 环境准备
- [ ] Node.js 18+ 已安装
- [ ] 执行 `npm install` 安装依赖
- [ ] 腾讯云 CLI 已配置

### 2. 数据库初始化
```bash
node scripts/init-points-system.js
```
- [ ] points_logs 集合已创建
- [ ] user_streaks 集合已创建
- [ ] point_rules 集合已创建
- [ ] 积分规则已插入

### 3. 环境变量检查
```bash
# 必须设置的环境变量
JWT_SECRET=                    # 至少32位随机字符串
WECHAT_APPID=wxa3591edcdc8d4551
WECHAT_SECRET=                 # 微信小程序Secret
CLOUDBASE_ENV_ID=weight-tracker-1ghr085dd7d6cff2
```

### 4. 构建测试
```bash
npm run build
```
- [ ] 构建成功，无 TypeScript 错误
- [ ] 无 ESLint 错误

### 5. 小程序上传
- [ ] 微信开发者工具版本最新
- [ ] 项目配置正确（appid: wxa3591edcdc8d4551）
- [ ] 上传代码，版本号 2.0.0
- [ ] 上传成功，无编译错误

---

## 🚀 部署步骤

### Step 1: 后端部署
```bash
# 1. 安装依赖
npm install

# 2. 构建
npm run build

# 3. 部署到 CloudBase
# 使用 CloudBase CLI 或控制台上传
```

### Step 2: 数据库初始化
```bash
node scripts/init-points-system.js
```

### Step 3: 小程序上传
1. 打开微信开发者工具
2. 点击"上传"
3. 填写版本号：2.0.0
4. 填写项目备注：Phase 1 - 积分体系+UI优化
5. 上传

### Step 4: 微信公众平台配置
1. 进入 https://mp.weixin.qq.com
2. 开发管理 → 版本管理
3. 将 2.0.0 设为体验版
4. 邀请测试人员

---

## ✅ 功能验证

### 登录模块
- [ ] 微信登录正常
- [ ] 账号密码登录正常
- [ ] 密码显示/隐藏切换正常
- [ ] 错误提示友好

### 积分模块
- [ ] 登录获得5积分
- [ ] 积分统计显示正确
- [ ] 积分记录页面正常
- [ ] 连续打卡显示正确

### 打卡模块
- [ ] 健身打卡显示上次记录
- [ ] 读书打卡显示上次记录
- [ ] 今日已打卡状态正确
- [ ] 打卡获得积分

### 好友模块
- [ ] Tab显示"我的"
- [ ] 好友列表显示正常
- [ ] 添加好友功能正常

### UI/UX
- [ ] 输入框聚焦有样式变化
- [ ] 按钮点击有反馈
- [ ] 消息删除按钮点击区域足够大

---

## 🐛 已知问题

### 待修复
1. 依赖未安装（npm install 超时）
2. 部分页面缺少加载状态组件引用

### 不影响上线
1. 邮箱注册功能未实现（Phase 2）
2. Admin系统未实现（Phase 3）

---

## 📞 回滚方案

如发现问题，回滚到 v1.x：
1. CloudRun 控制台回滚到上一个版本
2. 小程序版本管理回滚

---

**部署日期**: 2026-04-26  
**部署人员**:  
**验证人员**:
