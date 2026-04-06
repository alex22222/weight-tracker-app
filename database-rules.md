# CloudBase 数据库安全规则（生产环境）

## 安全规则配置

在 CloudBase 控制台 → 数据库 → 安全规则 中配置以下内容：

---

### 1. users 集合（用户表）

```json
{
  "read": "auth != null",
  "write": "auth != null && doc._openid == auth.openid"
}
```

---

### 2. user_settings 集合（用户设置）

```json
{
  "read": "auth != null && (doc.userId == auth.userId || doc._openid == auth.openid)",
  "write": "auth != null && (doc.userId == auth.userId || doc._openid == auth.openid)"
}
```

---

### 3. weight_entries 集合（体重记录）

```json
{
  "read": "auth != null && doc.userId == auth.userId",
  "write": "auth != null && doc.userId == auth.userId"
}
```

---

### 4. reading_entries 集合（读书记录）

```json
{
  "read": "auth != null && doc.userId == auth.userId",
  "write": "auth != null && doc.userId == auth.userId"
}
```

---

### 5. goals 集合（目标）

```json
{
  "read": "auth != null && doc.userId == auth.userId",
  "write": "auth != null && doc.userId == auth.userId"
}
```

---

### 6. messages 集合（消息）

```json
{
  "read": "auth != null && (doc.receiverId == auth.userId || doc.senderId == auth.userId)",
  "write": "auth != null && doc.senderId == auth.userId"
}
```

---

### 7. friends 集合（好友关系）

```json
{
  "read": "auth != null && (doc.userId == auth.userId || doc.friendId == auth.userId)",
  "write": "auth != null && (doc.userId == auth.userId || doc.friendId == auth.userId)"
}
```

---

### 8. tasks 集合（打卡任务）

```json
{
  "read": "auth != null",
  "write": "auth != null && doc.creatorId == auth.userId"
}
```

---

### 9. task_members 集合（任务成员）

```json
{
  "read": "auth != null && doc.userId == auth.userId",
  "write": "auth != null && doc.userId == auth.userId"
}
```

---

### 10. task_check_ins 集合（任务打卡记录）

```json
{
  "read": "auth != null",
  "write": "auth != null && doc.userId == auth.userId"
}
```

---

## 规则说明

| 变量 | 含义 |
|-----|------|
| `auth` | 当前登录用户的信息 |
| `auth.openid` | 用户的 OpenID |
| `auth.userId` | 用户的 UserID（通过 token 解析） |
| `doc` | 当前操作的文档 |
| `doc._openid` | 文档创建者的 OpenID |
| `doc.userId` | 文档关联的用户ID |

## 建议

1. **生产环境**使用严格规则，只允许用户访问自己的数据
2. **开发环境**可以暂时设置为 `true` 方便调试
3. 定期审查安全规则，确保数据安全
