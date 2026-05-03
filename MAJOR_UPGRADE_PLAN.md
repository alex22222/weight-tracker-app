# 搭子小程序重大升级计划

## 📋 项目概述

**版本**: v2.0.0  
**目标**: 从单一体重管理升级为综合健康社交平台  
**预计工期**: 3-4 周  
**涉及模块**: 17 个功能模块

---

## 🗂️ 需求清单与优先级

### P0 - 核心功能（必须完成）
| 序号 | 需求 | 复杂度 | 预估工期 |
|-----|------|--------|---------|
| 2 | Tab "搭子" 改 "我的" | ⭐ | 1h |
| 5 | 积分体系 | ⭐⭐⭐ | 2d |
| 7 | 个人设置展示积分 | ⭐ | 4h |
| 10 | 优化登录页（密文、提示） | ⭐⭐ | 4h |
| 15 | UI 全面优化 | ⭐⭐⭐ | 3d |
| 16 | 编写 Test Case | ⭐⭐⭐ | 2d |
| 17 | 修复所有问题 | ⭐⭐⭐⭐ | 3d |

### P1 - 重要功能（建议完成）
| 序号 | 需求 | 复杂度 | 预估工期 |
|-----|------|--------|---------|
| 1 | 展示上次打卡时间 | ⭐⭐ | 4h |
| 8 | 消息清空功能 | ⭐⭐ | 4h |
| 9 | Admin 重构 | ⭐⭐⭐⭐ | 5d |
| 13 | 问题反馈功能 | ⭐⭐ | 1d |
| 14 | Admin PC 版 | ⭐⭐⭐⭐⭐ | 7d |

### P2 - 增强功能（可选）
| 序号 | 需求 | 复杂度 | 预估工期 |
|-----|------|--------|---------|
| 3 | 推荐书本给好友 | ⭐⭐⭐ | 2d |
| 4 | 好友阅读走马灯 | ⭐⭐⭐ | 2d |
| 6 | 上传食物图片 | ⭐⭐⭐ | 2d |
| 11 | 注册填写邮箱 | ⭐⭐ | 1d |
| 12 | 邮箱找回密码 | ⭐⭐⭐ | 2d |

---

## 📅 实施阶段规划

### 第一阶段：基础优化（Week 1）
**目标**: 完成核心基础功能

- [ ] Day 1-2: UI 全面审查与优化（需求15）
- [ ] Day 2-3: 积分体系设计实现（需求5）
- [ ] Day 3-4: 个人设置展示积分（需求7）
- [ ] Day 4-5: Tab 修改 + 登录优化（需求2、10）
- [ ] Day 5-6: 编写 Test Case（需求16）

### 第二阶段：核心功能（Week 2）
**目标**: 完成打卡增强和消息功能

- [ ] Day 1-2: 展示上次打卡时间（需求1）
- [ ] Day 2-3: 消息清空功能（需求8）
- [ ] Day 3-4: 问题反馈功能（需求13）
- [ ] Day 4-5: 修复 UI 问题（需求17）
- [ ] Day 5-6: 第一阶段测试与修复

### 第三阶段：Admin 系统（Week 3）
**目标**: 重构 Admin 功能

- [ ] Day 1-2: Admin 后端重构（需求9）
- [ ] Day 2-4: Admin PC 版开发（需求14）
- [ ] Day 4-5: Admin 功能测试
- [ ] Day 5-6: 集成测试

### 第四阶段：高级功能（Week 4）
**目标**: 社交功能增强

- [ ] Day 1-2: 推荐书本 + 走马灯（需求3、4）
- [ ] Day 2-4: 邮箱注册 + 找回密码（需求11、12）
- [ ] Day 4-5: 上传食物图片（需求6）
- [ ] Day 5-7: 全面测试与上线准备

---

## 🏗️ 技术架构调整

### 数据库集合新增
```
points_log          # 积分记录
point_rules         # 积分规则
user_streaks        # 连续打卡记录
food_records        # 食物图片记录
book_recommendations # 图书推荐
user_feedback       # 用户反馈
admin_logs          # 管理员操作日志
```

### API 接口新增
```
POST   /api/points/earn          # 赚取积分
GET    /api/points/balance       # 查询积分
GET    /api/points/logs          # 积分记录
POST   /api/books/recommend      # 推荐书本
GET    /api/books/friends-reading # 好友阅读列表
POST   /api/food/upload          # 上传食物图片
POST   /api/feedback             # 提交反馈
GET    /api/admin/users          # 管理用户列表
PATCH  /api/admin/users/:id      # 修改用户状态/积分
DELETE /api/admin/images/:id     # 删除图片
POST   /api/admin/backup         # 数据备份
```

### 页面结构调整
```
pages/
├── my/                      # 原 friends 改为 my（我的）
│   ├── index.wxml           # 我的主页
│   ├── points.wxml          # 积分明细（新增）
│   └── feedback.wxml        # 问题反馈（新增）
├── login/
│   └── index.wxml           # 优化登录页
├── register/
│   └── index.wxml           # 增加邮箱字段
├── forgot-password/
│   └── index.wxml           # 邮箱找回密码（新增）
├── reading/
│   └── recommend.wxml       # 推荐书本（新增）
└── admin-pc/                # Admin PC版（新增）
    ├── index.html
    ├── users.html
    ├── points.html
    ├── feedback.html
    └── backup.html
```

---

## 📁 实施手册

### Step 1: 创建项目分支
```bash
git checkout -b v2.0-major-upgrade
git push -u origin v2.0-major-upgrade
```

### Step 2: 数据库初始化
```bash
# 执行数据库迁移脚本
node scripts/migrate-v2.0.js
```

### Step 3: 分模块实施
按照阶段规划，每个功能完成后：
1. 编写/更新 Test Case
2. 本地测试通过
3. 提交代码
4. 更新实施手册

### Step 4: 集成测试
```bash
npm run test:integration
npm run build
# 确保无编译错误
```

### Step 5: 部署上线
```bash
# 1. 部署后端
npm run deploy:backend

# 2. 部署小程序
npm run deploy:weapp

# 3. 部署 Admin PC 版
npm run deploy:admin
```

---

## ✅ 验收标准

### 功能验收
- [ ] 所有 P0 需求完成
- [ ] Test Case 覆盖率 > 80%
- [ ] 无严重 Bug

### 性能验收
- [ ] 页面加载时间 < 2s
- [ ] 接口响应时间 < 500ms
- [ ] 图片加载优化

### 安全验收
- [ ] 密码密文传输
- [ ] 邮箱验证机制
- [ ] Admin 权限控制

---

## 📚 相关文档

- [UI 设计规范](./UI_DESIGN_SPEC.md)
- [API 接口文档](./API_DOCUMENTATION.md)
- [Test Case 清单](./TEST_CASES.md)
- [部署手册](./DEPLOYMENT_MANUAL.md)

---

**制定日期**: 2026-04-26  
**负责人**: Kimi Code  
**审核人**: 待定
