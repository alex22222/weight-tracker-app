# GitHub Secrets 配置指南

## 配置步骤

### 1. 打开 GitHub Secrets 页面
访问：
```
https://github.com/alex22222/weight-tracker-app/settings/secrets/actions
```

### 2. 添加以下 Secrets

点击 "New repository secret" 按钮，逐一添加：

| Secret Name | 值 | 获取方式 |
|-------------|-----|----------|
| `TENCENT_CLOUD_SECRET_ID` | AKID... | [腾讯云 API 密钥管理](https://console.cloud.tencent.com/cam/capi) |
| `TENCENT_CLOUD_SECRET_KEY` | xxx | 同上 |

### 3. 获取腾讯云凭证

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 访问 [API 密钥管理](https://console.cloud.tencent.com/cam/capi)
3. 点击「新建密钥」
4. 复制 SecretId 和 SecretKey

⚠️ **重要**：SecretKey 只显示一次，请立即复制保存！

### 4. 验证配置

添加完成后，页面应显示：
- ✅ TENCENT_CLOUD_SECRET_ID
- ✅ TENCENT_CLOUD_SECRET_KEY

### 5. 触发部署

配置完成后，部署会自动触发！

查看部署状态：
```
https://github.com/alex22222/weight-tracker-app/actions
```

---

## 快速检查清单

- [ ] 访问 GitHub Secrets 页面
- [ ] 添加 `TENCENT_CLOUD_SECRET_ID`
- [ ] 添加 `TENCENT_CLOUD_SECRET_KEY`
- [ ] 查看 Actions 页面确认部署状态

---

## 故障排查

### 部署失败： secrets.TENCENT_CLOUD_SECRET_ID not found
**原因**：Secrets 未配置或名称错误
**解决**：检查 Secrets 名称是否完全匹配（区分大小写）

### 部署失败：Authentication failed
**原因**：密钥不正确或过期
**解决**：在腾讯云控制台重新创建密钥

### 部署失败：Service already exists
**原因**：服务已存在，可能是首次部署
**解决**：在 CloudBase 控制台删除旧服务或修改服务名
