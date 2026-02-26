# 数据模型与表结构

当前服务端使用**内存存储**（无持久化数据库）。以下为规划中的 PostgreSQL 表结构，待接入数据库时按此建表并配合 `server/migrations/` 做迁移。

## 核心表

### users

| 列名           | 类型         | 说明     |
|----------------|--------------|----------|
| id             | 主键 (UUID)  | 用户 ID  |
| email          | 字符串       | 登录邮箱（或 phone） |
| password_hash  | 字符串       | Argon2id 哈希 |
| created_at     | timestamptz  | 创建时间 |
| updated_at     | timestamptz  | 更新时间 |

### sessions（刷新令牌）

| 列名       | 类型         | 说明       |
|------------|--------------|------------|
| id         | 主键         | 记录 ID    |
| user_id    | 外键 → users | 用户       |
| device_id  | 字符串(可选) | 设备标识   |
| token_hash | 字符串       | 刷新令牌哈希 |
| expires_at | timestamptz  | 过期时间   |
| revoked_at | timestamptz  | 撤销时间(空=有效) |

### tasks

| 列名       | 类型         | 说明           |
|------------|--------------|----------------|
| id         | 主键 (UUID)  | 任务 ID        |
| user_id    | 外键 → users | 所属用户       |
| title      | 字符串       | 标题           |
| status     | 字符串       | 状态(pending/done 等) |
| due_at     | timestamptz  | 截止时间(可空) |
| version    | bigint       | 乐观锁版本     |
| updated_at | timestamptz  | 更新时间       |
| deleted_at | timestamptz  | 软删时间(空=未删) |

### sync_cursors

| 列名        | 类型        | 说明           |
|-------------|-------------|----------------|
| user_id     | 外键/键     | 用户           |
| device_id   | 字符串(可选) | 设备           |
| last_cursor | 字符串      | 拉取游标       |

### task_attachments

| 列名       | 类型        | 说明           |
|------------|-------------|----------------|
| id         | 主键        | 附件 ID       |
| task_id    | 外键 → tasks| 关联任务       |
| owner_id   | 外键 → users| 所属用户       |
| bucket     | 字符串      | OSS bucket    |
| object_key | 字符串      | OSS 对象键    |
| mime_type  | 字符串      | MIME 类型     |
| size       | bigint      | 大小(字节)     |
| sha256     | 字符串(可选)| 内容哈希       |
| created_at | timestamptz | 创建时间       |

### ai_request_logs

| 列名        | 类型        | 说明         |
|-------------|-------------|--------------|
| id          | 主键        | 记录 ID      |
| user_id     | 外键 → users| 用户         |
| provider    | 字符串      | AI 提供商    |
| model       | 字符串      | 模型名       |
| latency_ms  | int         | 耗时(毫秒)   |
| token_usage | int/JSON(可选)| 用量       |
| status      | 字符串      | 成功/失败    |
| created_at  | timestamptz | 创建时间     |

## 数据归属

- 所有业务表均按 `user_id` 做租户隔离，查询与写入时需校验 `user_id = 当前用户`。
- 附件默认私有，仅通过服务端签发的短期 URL 访问。

## 迁移

接入 PostgreSQL 后，迁移脚本将放在 `server/migrations/`，按版本顺序执行（如 golang-migrate、goose 等）。
