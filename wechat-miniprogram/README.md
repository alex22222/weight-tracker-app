# 体重管理器 - 微信小程序版

基于原 Next.js 项目的微信小程序适配版本。

## 功能特性

- ✅ 体重记录添加（日期、体重、备注）
- ✅ BMI 自动计算与分类显示
- ✅ 目标体重追踪
- ✅ 体重趋势图表（Canvas 绘制）
- ✅ 历史记录列表
- ✅ 个人设置（身高、目标体重）
- ✅ 数据本地存储（wx.storage）

## 项目结构

```
wechat-miniprogram/
├── app.js              # 小程序入口
├── app.json            # 全局配置
├── app.wxss            # 全局样式
├── project.config.json # 项目配置
├── sitemap.json        # 站点地图
├── utils/
│   └── util.js         # 工具函数（BMI计算、日期格式化等）
└── pages/
    ├── index/          # 首页（记录页）
    │   ├── index.js
    │   ├── index.json
    │   ├── index.wxml
    │   └── index.wxss
    └── logs/           # 历史记录页
        ├── logs.js
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
| 登录 | 表单登录 | 无需登录 |

## 使用说明

1. 打开微信开发者工具
2. 导入项目，选择 `wechat-miniprogram` 文件夹
3. 在 `project.config.json` 中填入你的小程序 AppID
4. 点击编译预览

## 注意事项

- 数据存储在本地，卸载小程序会丢失数据
- 如需云端同步，需要额外接入云开发或自建后端
- 图表使用 Canvas 2D 绘制，支持触摸交互扩展
