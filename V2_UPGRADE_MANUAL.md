# V2.0 重大升级实施手册

## 📊 实施进度跟踪

### ✅ 已完成 (2/17)
- [x] **需求2**: Tab "搭子" → "我的" (含页面重命名、路径更新)
- [x] **需求10**: 登录页优化 (密码显隐切换、友好错误提示)

### 🚧 进行中 (1/17)
- [ ] **需求5**: 积分体系设计实现

### ⏳ 待开始 (14/17)
- [ ] 需求1: 展示上次打卡时间
- [ ] 需求3: 推荐书本给好友
- [ ] 需求4: 好友阅读走马灯
- [ ] 需求6: 上传食物图片
- [ ] 需求7: 个人设置展示积分
- [ ] 需求8: 消息清空功能
- [ ] 需求9: Admin 重构
- [ ] 需求11: 注册填写邮箱
- [ ] 需求12: 邮箱找回密码
- [ ] 需求13: 问题反馈功能
- [ ] 需求14: Admin PC 版
- [ ] 需求15: UI 全面优化
- [ ] 需求16: 编写 Test Case
- [ ] 需求17: 修复所有问题

---

## 📝 详细实施记录

### Phase 1: 基础框架优化 (Week 1)

#### Day 1: Tab 重命名 + 登录优化 ✅
**改动文件**:
- `weapp/app.json` - 修改 tabBar 配置
- `weapp/pages/friends/` → `weapp/pages/my/` - 目录重命名
- `weapp/pages/my/my.js/wxml/wxss/json` - 文件重命名+注释更新
- `weapp/pages/login/login.wxml` - 添加密码显隐切换
- `weapp/pages/login/login.wxss` - 添加错误提示框样式
- `weapp/pages/messages/messages.js` - 更新跳转路径
- `weapp/pages/home/home.js` - 更新跳转路径

**测试要点**:
- [ ] Tab 栏显示"我的"而非"好友"
- [ ] 点击 Tab 正常跳转
- [ ] 其他页面跳转链接正常
- [ ] 密码输入框默认可切换显隐
- [ ] 错误提示样式醒目

---

## 🏗️ 技术架构规划

### 数据库新增集合
```javascript
// 1. points_logs - 积分记录
collection: points_logs
fields: {
  userId: string,
  type: 'login' | 'checkin' | 'continuous' | 'admin',
  points: number,
  description: string,
  createdAt: Date
}

// 2. user_streaks - 连续打卡记录
collection: user_streaks
fields: {
  userId: string,
  type: 'fitness' | 'reading',
  currentStreak: number,
  maxStreak: number,
  lastCheckIn: Date
}

// 3. food_records - 食物图片记录
collection: food_records
fields: {
  userId: string,
  channelId: string,
  imageUrl: string,
  description: string,
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  createdAt: Date
}

// 4. book_recommendations - 图书推荐
collection: book_recommendations
fields: {
  fromUserId: string,
  toUserId: string,
  bookName: string,
  author: string,
  reason: string,
  status: 'pending' | 'accepted',
  createdAt: Date
}

// 5. user_feedback - 用户反馈
collection: user_feedback
fields: {
  userId: string,
  type: 'bug' | 'feature' | 'other',
  content: string,
  contact: string,
  status: 'pending' | 'processing' | 'resolved',
  adminReply: string,
  createdAt: Date,
  updatedAt: Date
}

// 6. admin_logs - 管理员操作日志
collection: admin_logs
fields: {
  adminId: string,
  action: string,
  targetUserId: string,
  details: object,
  createdAt: Date
}
```

### API 接口规划

#### 积分相关
```javascript
// 赚取积分
POST   /api/points/earn
body: { type: 'login' | 'checkin', channelType?: 'fitness' | 'reading' }

// 查询积分余额
GET    /api/points/balance
response: { totalPoints: number }

// 积分记录
GET    /api/points/logs?page=1&limit=20
response: { logs: [], total: number }
```

#### 连续打卡
```javascript
// 查询连续打卡
GET    /api/streaks
response: { fitness: {}, reading: {} }
```

#### 食物图片
```javascript
// 上传食物图片
POST   /api/food/upload
body: FormData { image, channelId, mealType, description }

// 获取某频道的食物图片
GET    /api/food/channel/:channelId
```

#### 图书推荐
```javascript
// 推荐书本给好友
POST   /api/books/recommend
body: { toUserId, bookName, author, reason }

// 获取好友阅读列表（走马灯）
GET    /api/books/friends-reading
response: { books: [] }

// 接受/拒绝推荐
PATCH  /api/books/recommendation/:id
body: { action: 'accept' | 'reject' }
```

#### 反馈系统
```javascript
// 提交反馈
POST   /api/feedback
body: { type, content, contact }

// 获取我的反馈
GET    /api/feedback/my

// Admin: 获取所有反馈
GET    /api/admin/feedback

// Admin: 回复反馈
PATCH  /api/admin/feedback/:id
body: { status, adminReply }
```

#### Admin 功能
```javascript
// 初始化用户密码
POST   /api/admin/users/:id/reset-password
body: { newPassword: '111111' }

// 停用/启用用户
PATCH  /api/admin/users/:id/status
body: { status: 'active' | 'disabled' }

// 修改用户积分
PATCH  /api/admin/users/:id/points
body: { points: number, reason: string }

// 获取用户上传的图片
GET    /api/admin/users/:id/images

// 删除图片
DELETE /api/admin/images/:id

// 数据备份
POST   /api/admin/backup
response: { downloadUrl: string }

// 获取统计数据
GET    /api/admin/statistics
```

#### 消息系统增强
```javascript
// 清空消息
DELETE /api/messages/clear
body: { type?: 'all' | 'system' | 'friend' }
```

#### 邮箱相关
```javascript
// 注册时发送邮箱验证码
POST   /api/auth/send-email-code
body: { email }

// 验证邮箱验证码
POST   /api/auth/verify-email
body: { email, code }

// 忘记密码 - 发送重置邮件
POST   /api/auth/forgot-password
body: { email }

// 重置密码
POST   /api/auth/reset-password
body: { token, newPassword }
```

---

## 🎨 UI 优化清单 (需求15)

### 全局优化
- [ ] 统一按钮样式 (圆角、阴影、点击态)
- [ ] 统一卡片样式 (圆角、背景、阴影)
- [ ] 统一输入框样式 (聚焦态、错误态)
- [ ] 统一字体层级 (标题、正文、辅助文字)
- [ ] 统一间距规范 (8rpx 倍数)
- [ ] 统一颜色规范 (主色、辅助色、功能色)

### 页面级优化

#### 登录页
- [x] 密码显隐切换 ✅
- [x] 友好错误提示 ✅
- [ ] 添加邮箱输入框 (需求11)
- [ ] 添加"忘记密码"链接 (需求12)

#### 首页 (原搭子页)
- [ ] 展示上次打卡时间 (需求1)
- [ ] 显示当前积分
- [ ] 连续打卡标识

#### 健身打卡页
- [ ] 上次打卡时间
- [ ] 上传食物图片入口 (需求6)
- [ ] 连续打卡天数展示

#### 读书打卡页
- [ ] 上次打卡时间
- [ ] 推荐书本给好友按钮 (需求3)
- [ ] 好友阅读走马灯 (需求4)

#### 我的页面 (原好友页)
- [ ] 个人资料卡片 (头像、昵称、积分)
- [ ] 积分入口
- [ ] 问题反馈入口 (需求13)
- [ ] 设置入口

#### 个人设置页
- [ ] 显示当前积分 (需求7)
- [ ] 绑定邮箱 (需求11)
- [ ] 修改密码
- [ ] 关于我们

#### 消息页
- [ ] 积分变动消息 (需求7)
- [ ] 一键清空按钮 (需求8)

---

## 🧪 Test Case 规划 (需求16)

### 登录模块
```
TC-LOGIN-001: 微信登录正常流程
TC-LOGIN-002: 账号密码登录成功
TC-LOGIN-003: 账号密码登录失败-错误提示友好
TC-LOGIN-004: 密码输入框默认识密文，可切换明文
TC-LOGIN-005: 游客登录
TC-LOGIN-006: 注册新账号
TC-LOGIN-007: 注册时两次密码不一致提示
TC-LOGIN-008: 注册后自动登录跳转
```

### 积分模块
```
TC-POINTS-001: 每日登录获得积分
TC-POINTS-002: 健身打卡获得积分
TC-POINTS-003: 读书打卡获得积分
TC-POINTS-004: 连续打卡积分加成
TC-POINTS-005: 积分记录查询
TC-POINTS-006: 个人设置页显示积分
TC-POINTS-007: 积分变动消息通知
```

### 好友模块
```
TC-FRIENDS-001: 查看好友列表
TC-FRIENDS-002: 添加好友请求
TC-FRIENDS-003: 接受好友请求
TC-FRIENDS-004: 拒绝好友请求
TC-FRIENDS-005: 删除好友
TC-FRIENDS-006: 推荐书本给好友
TC-FRIENDS-007: 查看好友阅读走马灯
```

### Admin 模块
```
TC-ADMIN-001: Admin 登录
TC-ADMIN-002: 初始化用户密码
TC-ADMIN-003: 停用用户
TC-ADMIN-004: 启用用户
TC-ADMIN-005: 修改用户积分
TC-ADMIN-006: 查看用户上传图片
TC-ADMIN-007: 删除用户图片
TC-ADMIN-008: 数据备份
TC-ADMIN-009: 查看用户反馈
TC-ADMIN-010: 回复用户反馈
```

### 消息模块
```
TC-MESSAGES-001: 接收系统消息
TC-MESSAGES-002: 接收好友请求消息
TC-MESSAGES-003: 接收积分变动消息
TC-MESSAGES-004: 清空全部消息
TC-MESSAGES-005: 清空某类型消息
```

---

## 📅 实施时间表

### Week 1: 基础框架 (Day 1-7)
| 天数 | 任务 | 产出 |
|-----|------|------|
| Day 1 | Tab 改名 + 登录优化 | ✅ 已完成 |
| Day 2-3 | 积分体系设计实现 | 进行中 |
| Day 4 | 个人设置展示积分 | 待开始 |
| Day 5 | 展示上次打卡时间 | 待开始 |
| Day 6 | UI 全面审查 | 待开始 |
| Day 7 | 测试与修复 | 待开始 |

### Week 2: 功能增强 (Day 8-14)
| 天数 | 任务 | 产出 |
|-----|------|------|
| Day 8-9 | 消息清空 + 问题反馈 | 待开始 |
| Day 10-11 | 邮箱注册 + 找回密码 | 待开始 |
| Day 12 | 上传食物图片 | 待开始 |
| Day 13 | 编写 Test Case | 待开始 |
| Day 14 | 测试与修复 | 待开始 |

### Week 3: Admin 系统 (Day 15-21)
| 天数 | 任务 | 产出 |
|-----|------|------|
| Day 15-17 | Admin 后端重构 | 待开始 |
| Day 18-20 | Admin PC 版开发 | 待开始 |
| Day 21 | Admin 功能测试 | 待开始 |

### Week 4: 社交功能 + 上线 (Day 22-28)
| 天数 | 任务 | 产出 |
|-----|------|------|
| Day 22-23 | 推荐书本 + 走马灯 | 待开始 |
| Day 24-25 | 全面测试 | 待开始 |
| Day 26-27 | Bug 修复 | 待开始 |
| Day 28 | 上线发布 | 待开始 |

---

## 🔧 技术注意事项

### 1. 图片上传
- 使用腾讯云 COS 存储
- 压缩图片后再上传 (最大 5MB)
- 生成缩略图用于列表展示

### 2. 积分计算
- 使用事务确保积分一致性
- 并发时加锁防止超发
- 记录积分日志便于审计

### 3. 连续打卡
- 每日凌晨重置连续打卡判断
- 时区统一使用东八区
- 缓存最近打卡状态

### 4. 邮箱服务
- 使用腾讯云 SES 或 SendGrid
- 验证码有效期 5 分钟
- 同一邮箱每日最多发送 5 次

### 5. 数据备份
- 每日凌晨自动备份
- 保留最近 7 天备份
- 支持手动触发备份

---

## 📞 沟通机制

- **每日站会**: 同步进度、阻塞问题
- **周会**: Review 本周完成、规划下周
- **紧急通道**: 严重 Bug 随时沟通

---

**创建时间**: 2026-04-26  
**最后更新**: 2026-04-26  
**版本**: v2.0.0-beta
