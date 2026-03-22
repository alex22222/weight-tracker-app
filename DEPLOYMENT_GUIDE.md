# 微信小程序 + CloudBase 部署指南

## 项目结构

```
wechat-miniprogram/
├── src/                    # Next.js Web 版本（不部署）
├── weapp/                  # 微信小程序源码
├── weapp-deploy/           # 小程序部署包（已配置生产环境）
└── deploy-final.zip        # 后端 API 部署包（CloudBase）
```

## 部署步骤

### 第一步：部署后端 API 到 CloudBase

1. 登录 [CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 进入环境：`weight-tracker-1ghr085dd7d6cff2`
3. 点击「云托管」→「创建服务」
4. 上传 `deploy-final.zip`
5. 配置环境变量：
   ```
   NODE_ENV=production
   DB_TYPE=cloudbase
   CLOUDBASE_ENV_ID=weight-tracker-1ghr085dd7d6cff2
   PORT=80
   HOSTNAME=0.0.0.0
   WECHAT_APPID=wxa3591edcdc8d4551
   WECHAT_SECRET=aa7938406a3ed28f4680152cbb2a4084
   ```
6. 部署完成后，记录服务域名，例如：
   ```
   https://weight-tracker-api-xxx.ap-shanghai.app.tcloudbase.com
   ```

### 第二步：更新小程序 API 地址

编辑 `weapp-deploy/config.js`：

```javascript
apiBaseUrl: 'https://weight-tracker-api-236729-9-1328081868.sh.run.tcloudbase.com/api'
```

### 第三步：配置微信安全域名

1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 进入「开发」→「开发管理」→「开发设置」
3. 在「服务器域名」中添加：
   - request 合法域名：`https://你的服务域名`
   - 确保已勾选「不校验合法域名」选项（开发阶段）

### 第四步：上传微信小程序

1. 打开「微信开发者工具」
2. 导入项目，选择 `weapp-deploy` 目录
3. 修改 appid：`wxa3591edcdc8d4551`
4. 点击「上传」按钮
5. 填写版本号和项目备注
6. 上传成功后，登录微信公众平台提交审核

## 小程序功能

- ✅ 微信一键登录
- ✅ 体重记录
- ✅ 健身频道
- ✅ 好友系统
- ✅ 消息通知

## 注意事项

1. **必须先部署后端 API**，小程序才能正常工作
2. **WECHAT_SECRET** 需要从微信公众平台获取
3. **安全域名** 必须在小程序后台配置
4. **审核前** 确保所有功能测试正常

## 文件说明

| 文件 | 说明 |
|------|------|
| `deploy-final.zip` | 后端 API 部署包 |
| `weapp-deploy/` | 微信小程序部署目录 |
| `weapp/config.js` | API 地址配置 |
