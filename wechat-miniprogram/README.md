# 体重管理器 - 微信小程序版

基于原 Next.js 项目的微信小程序适配版本，已同步 main 分支的最新功能。

## 功能特性

- ✅ **用户认证系统**
  - 用户注册（本地存储）
  - 用户登录/登出
  - 游客访问模式
  - 登录状态持久化
- ✅ **体重记录**
  - 添加体重记录（日期、体重、备注）
  - 历史记录列表
  - 删除单条记录
  - 清空所有记录
- ✅ **数据分析**
  - BMI 自动计算与分类显示
  - 目标体重追踪
  - 体重趋势图表（Canvas 2D 绘制）
- ✅ **个人设置**
  - 身高设置
  - 目标体重设置
- ✅ **数据存储**
  - 本地存储（wx.storage）
  - 按用户隔离数据

## 项目结构

```
wechat-miniprogram/
├── app.js                 # 小程序入口（含登录状态管理）
├── app.json               # 全局配置
├── app.wxss               # 全局样式
├── project.config.json    # 项目配置
├── sitemap.json           # 站点地图
├── utils/
│   └── util.js            # 工具函数（BMI计算、日期格式化等）
└── pages/
    ├── login/             # 登录/注册页（新增）
    │   ├── login.js
    │   ├── login.json
    │   ├── login.wxml
    │   └── login.wxss
    ├── index/             # 首页（记录页）
    │   ├── index.js       # 已添加登录检查、登出功能
    │   ├── index.json
    │   ├── index.wxml     # 已添加用户信息、登出按钮
    │   └── index.wxss     # 已更新导航栏样式
    └── logs/              # 历史记录页
        ├── logs.js        # 已添加登录检查
        ├── logs.json
        ├── logs.wxml
        └── logs.wxss
```

## 与原项目的差异

| 功能 | Next.js 版 | 微信小程序版 |
|------|-----------|-------------|
| 状态管理 | React useState | Page data |
| 样式方案 | Tailwind CSS | WXSS |
| 数据存储 | API + Database | wx.storage |
| 图表 | Recharts | Canvas 2D |
| 路由 | Next.js Router | 小程序路由 |
| 用户认证 | API 认证 | 本地存储模拟 |

## 使用说明

1. 打开微信开发者工具
2. 导入项目，选择 `wechat-miniprogram` 文件夹
3. 在 `project.config.json` 中填入你的小程序 AppID
4. 点击编译预览

## 注意事项

- 数据存储在本地，卸载小程序会丢失数据
- 用户密码以明文存储（演示用途），生产环境需加密
- 如需云端同步，需要额外接入云开发或自建后端

## 更新日志

### 2026-03-01
- 合并 main 分支最新代码
- 新增用户登录/注册系统
- 新增登出功能
- 添加登录状态检查
- 更新页面导航栏样式
