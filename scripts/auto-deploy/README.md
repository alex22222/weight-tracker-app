# 自动化部署系统

## 功能

- 自动上传部署包到 CloudBase
- 监控部署状态
- 自动分析部署错误
- 自动修复常见问题
- 自动重试直到成功

## 使用方法

### 1. 快速修复（部署前）

```bash
cd scripts/auto-deploy
node quick-fix.js
```

这会：
- 修复导入路径错误
- 修复重复变量定义
- 检查缺少的 API
- 重新打包

### 2. 全自动部署

```bash
cd scripts/auto-deploy
node deploy.js
```

这会：
- 检查 CloudBase CLI
- 登录 CloudBase
- 上传部署包
- 监控部署状态
- 分析错误
- 自动修复
- 重试直到成功

### 3. 仅监控

```bash
cd scripts/auto-deploy
bash monitor.sh
```

## 自动修复的错误类型

1. **导入路径错误** - 自动修正 `../../../lib/` 层级
2. **重复变量定义** - 自动删除重复的 `const` 定义
3. **语法错误** - 标记需要手动修复
4. **类型错误** - 标记需要手动修复

## 配置

编辑 `deploy.js` 中的 `CONFIG` 对象：

```javascript
const CONFIG = {
  envId: 'weight-tracker-1ghr085dd7d6cff2',  // 环境ID
  serviceName: 'weight-tracker-api',           // 服务名称
  region: 'ap-shanghai',                       // 地域
  maxRetries: 5,                               // 最大重试次数
  retryDelay: 30000,                           // 重试间隔(毫秒)
  deployPackage: 'deploy-v5.8-final.zip'       // 部署包名
};
```

## 日志

部署日志会输出到控制台，包含：
- 每个步骤的详细信息
- 错误分析结果
- 修复操作记录
- 部署状态变更

## 手动干预

如果自动修复无法解决问题，脚本会停止并提示：
- 错误类型
- 错误位置
- 建议的修复方案

此时需要手动修改代码后重新运行部署。

## 注意事项

1. 确保已安装 CloudBase CLI: `npm install -g @cloudbase/cli`
2. 确保已登录: `tcb login`
3. 确保部署包存在
4. 自动修复会修改源代码，建议先提交到 Git
