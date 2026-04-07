# 🚀 上线前最终检查清单

## ✅ 已完成
- [x] 小程序备案通过
- [x] 前端代码配置已切换到生产环境
- [x] UI 色调统一为橙色主题
- [x] 小程序名称改为"搭子"

## ⏳ 待完成（按顺序执行）

### 步骤 1：准备腾讯云密钥
```bash
# 1. 访问 https://console.cloud.tencent.com/cam/capi
# 2. 创建 API 密钥
# 3. 编辑 .env.production 文件
```

需要填入：
- `TENCENT_SECRET_ID` - 你的 SecretId
- `TENCENT_SECRET_KEY` - 你的 SecretKey

### 步骤 2：部署后端服务
```bash
cd /Users/henry/projects/weight-tracker-app/wechat-miniprogram

# 方式1：使用脚本（推荐）
./scripts/deploy-cloudbase.sh

# 方式2：手动部署
npm install
npm run build
tcb cloudrun:deploy --envId weight-tracker-1ghr085dd7d6cff2
```

### 步骤 3：配置小程序服务器域名
登录 [微信公众平台](https://mp.weixin.qq.com)

**路径**：开发 → 开发管理 → 开发设置 → 服务器域名

添加以下域名：
```
request合法域名：
✅ https://weight-tracker-api-236729-9-1328081868.sh.run.tcloudbase.com

uploadFile合法域名：
✅ https://weight-tracker-api-236729-9-1328081868.sh.run.tcloudbase.com

downloadFile合法域名：
✅ https://*.tcb.qcloud.la
```

### 步骤 4：配置隐私协议
**路径**：设置 → 基本设置 → 用户隐私保护指引

需要声明的信息：
- [ ] 昵称、头像
- [ ] 体重数据
- [ ] 阅读记录
- [ ] 好友关系
- [ ] 消息通知

### 步骤 5：填写备案号
**路径**：设置 → 基本设置 → 去备案

填写工信部提供的备案号。

### 步骤 6：上传代码
1. 打开微信开发者工具
2. 点击「上传」按钮
3. 版本号：v1.0.0
4. 项目备注：首次发布

### 步骤 7：提交审核
1. 登录 [微信小程序后台](https://mp.weixin.qq.com)
2. 管理 → 版本管理
3. 找到「开发版本」
4. 点击「提交审核」

**审核备注**：
```
体重追踪打卡小程序，主要功能：
1. 健身打卡（体重记录、BMI计算）
2. 读书打卡（阅读时长记录）
3. 一起打卡（邀请好友共同完成任务）
4. 好友系统（添加好友、查看动态）

已工信部备案，备案号：[填写你的备案号]
```

### 步骤 8：等待审核
- 通常 1-3 个工作日
- 关注微信通知

### 步骤 9：发布上线
审核通过后：
1. 登录小程序后台
2. 版本管理 → 审核版本
3. 点击「发布」

## 🎉 上线完成！

分享你的小程序：
- 小程序码下载
- 分享给好友
- 关联公众号

## 📞 遇到问题？

| 问题 | 解决方案 |
|-----|---------|
| 域名不生效 | 等待5-10分钟，重启开发者工具 |
| 部署失败 | 检查腾讯云密钥是否正确 |
| 审核被拒 | 查看拒绝原因，修改后重新提交 |
| 服务访问不了 | 检查 CloudBase 服务状态 |

---
祝上线顺利！🎊
