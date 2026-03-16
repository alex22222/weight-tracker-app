# 微信登录功能重构

## 变更概述

已将登录功能重构为支持**微信一键登录**，用户无需注册账号密码即可使用。

## 主要变更

### 1. 数据库模型更新
- 新增字段：
  - `wechatOpenId` - 微信 OpenID（唯一标识）
  - `wechatUnionId` - 微信 UnionID（跨应用标识）
  - `nickname` - 微信昵称
- 修改字段：
  - `username` - 改为可选（微信用户无用户名）
  - `password` - 改为可选（微信用户无密码）

### 2. 新增 API 接口
- `POST /api/auth/wechat-login` - 微信登录/注册
  - 参数：`{ code: string, userInfo?: object }`
  - 返回：`{ token, user }`

### 3. 小程序登录页面更新
- 新增登录方式切换（微信登录 / 账号密码）
- 微信一键登录按钮
- 支持获取用户头像昵称
- 保持兼容旧版账号密码登录

## 配置步骤

### 1. 配置环境变量

在 `.env` 文件中添加：

```env
WECHAT_APPID=你的微信小程序AppID
WECHAT_SECRET=你的微信小程序AppSecret
```

获取方式：
- 登录[微信公众平台](https://mp.weixin.qq.com/)
- 进入「开发」→「开发管理」→「开发设置」
- 获取 AppID 和 AppSecret

### 2. 配置服务器域名

在小程序后台「开发」→「开发管理」→「开发设置」→「服务器域名」中添加：
- request 合法域名：`https://你的服务器域名`

### 3. 重新编译小程序

```bash
# 在小程序开发工具中
# 1. 清缓存
# 2. 重新编译
```

## 微信登录流程

```
用户点击「微信一键登录」
    ↓
小程序调用 wx.login() 获取 code
    ↓
（可选）调用 wx.getUserProfile() 获取用户信息
    ↓
发送 code + userInfo 到后端 /api/auth/wechat-login
    ↓
后端用 code 请求微信接口获取 openid/session_key
    ↓
根据 openid 查找或创建用户
    ↓
返回 JWT token 和用户信息
    ↓
小程序保存 token，登录成功
```

## 用户信息说明

登录后系统会展示/使用的用户信息：

| 字段 | 来源 | 说明 |
|------|------|------|
| nickname | 微信用户信息 | 微信昵称 |
| avatar | 微信用户信息 | 微信头像 URL |
| gender | 微信用户信息 | 性别（男/女） |
| id | 系统生成 | 用户唯一 ID |
| role | 默认 "user" | 用户角色 |

## 兼容性

- 微信用户和账号密码用户可以共存
- 原有账号密码登录功能保留
- 游客登录功能保留

## 安全说明

1. **code 一次性使用** - 微信登录凭证 code 只能使用一次
2. **session_key 不暴露** - 仅用于后端解密，不返回给前端
3. **JWT Token** - 使用 HMAC-SHA256 签名，7天过期
4. **隐私授权** - 获取用户信息需要用户明确授权

## 后续优化建议

1. 绑定手机号 - 可调用 wx.getPhoneNumber 获取手机号
2. 多端登录 - 使用 UnionID 打通公众号/APP 登录
3. 账号绑定 - 允许微信用户绑定账号密码
