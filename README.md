# Life Records

前端应用 + Go 后端的 monorepo：任务与事务记录（本地优先，可选云端同步）。

## 仓库结构

```
records/
├── app/                 # 前端应用 (React + Vite + TypeScript)
│   ├── src/
│   ├── public/
│   ├── vite.config.ts
│   └── README.md        # 前端功能、技术栈、开发说明
├── server/              # Go API 服务
│   ├── cmd/api/         # 入口
│   ├── internal/        # auth, tasks, sync, storage, ai, observability, infra
│   ├── docs/            # 服务端文档（含 SCHEMA.md 表结构）
│   ├── migrations/      # 数据库迁移（接入 PostgreSQL 后使用）
│   ├── go.mod
│   ├── Makefile
│   └── README.md
├── shared/              # 跨端契约与生成类型（无业务运行时）
│   ├── contracts/       # OpenAPI、JSON Schema 等
│   ├── types/           # 由 contracts 生成的前端 TypeScript 类型
│   └── README.md
├── scripts/             # 仓库级脚本
│   └── generate-types.sh
├── package.json         # 根 package：前端依赖与脚本
└── README.md            # 本文件
```

- **app/**：本地优先的 SPA，数据存 IndexedDB (Dexie)；配置 `VITE_API_URL` 后可登录并启用云端同步。
- **server/**：认证、任务 CRUD、同步 (push/pull)、OSS 附件、AI 适配等；当前为单进程、内存存储，可后续接 PostgreSQL/Redis。
- **shared/**：仅放契约与生成产物；类型通过 `scripts/generate-types.sh` 从 `shared/contracts/openapi.yaml` 生成到 `shared/types/api.ts`。

## 开发

### 环境要求

- Node.js 18+、pnpm
- Go 1.21+（仅需跑或改 server 时）

### 前端 (app)

在**仓库根目录**执行（根 `package.json` 的脚本已指向 app）：

```bash
pnpm install
pnpm dev      # 开发服务器，默认如 http://localhost:5173
pnpm build    # 构建到 dist/
pnpm lint     # Biome 检查 app/src、app/vite.config.ts
pnpm format   # 格式化
pnpm preview  # 预览构建结果
```

更多说明见 [app/README.md](app/README.md)。

### 后端 (server)

```bash
cd server
cp .env.example .env   # 配置 JWT_SECRET、PORT 等
go run ./cmd/api       # 或 make run
```

默认监听 `:8080`。健康检查：`GET /healthz`。

### 契约与类型 (shared)

修改 `shared/contracts/openapi.yaml` 后，在仓库根目录执行：

```bash
bash scripts/generate-types.sh
```

会更新 `shared/types/api.ts`，供 app 使用。

### 前后端联调

1. 启动 server：`cd server && go run ./cmd/api`
2. 在 app 侧设置 API 地址（构建或 dev 时生效）：
   - 开发：在根目录创建 `app/.env.local`，写 `VITE_API_URL=http://localhost:8080`
   - 或通过对应环境变量传入
3. 启动前端：`pnpm dev`
4. 在应用中注册/登录即可使用云端同步与附件等能力。

## 部署

### 前端

- 构建：在仓库根目录执行 `pnpm build`，产物在 `dist/`（可配置为 app 子目录，以当前 vite 配置为准）。
- 将 `dist/` 部署到任意静态托管或 CDN（如 Nginx、Vercel、OSS 静态站点等）。
- 若需连接自建 API，在构建时通过 `VITE_API_URL` 指定后端地址。

### 后端

- 构建：`cd server && go build -o bin/api ./cmd/api`
- 运行：`./bin/api`，通过环境变量或 `.env` 配置 `PORT`、`JWT_SECRET` 等（参考 `server/.env.example`）。
- 生产建议使用进程管理器（systemd、supervisor）或容器（Docker）部署，并配置 TLS 与反向代理。

### 数据库与 Redis

**未配置 DATABASE_URL 时**：后端使用内存存储，重启后数据丢失，仅适合开发或单机演示。

**使用 PostgreSQL 时**：

1. 在 `server/.env` 中配置 `DATABASE_URL`（如 `postgres://user:pass@host:5432/dbname?sslmode=disable`）。
2. **首次部署或升级前**执行迁移：进入 `server/` 目录，安装 [golang-migrate](https://github.com/golang-migrate/migrate) CLI 后执行 `make migrate-up`（或 `migrate -path migrations -database "$DATABASE_URL" up`）。
3. 启动服务后，用户、任务、同步游标、附件元数据、AI 请求日志等将持久化到 PostgreSQL。

**Redis（可选）**：配置 `REDIS_URL` 后，刷新令牌存于 Redis（便于多实例共享与 TTL）。未配置时刷新令牌存于 PostgreSQL `sessions` 表或内存。

表结构说明见 **[server/docs/SCHEMA.md](server/docs/SCHEMA.md)**；迁移文件位于 `server/migrations/`。

### 环境配置

#### 配置文件示例

| 作用域 | 文件 | 说明 |
|--------|------|------|
| 后端 | `server/.env.example` | 复制为 `server/.env`，按需取消注释并填写 |
| 前端 | `app/.env.example` | 开发时复制为 `app/.env.local`，或构建时传入环境变量 |

#### 后端环境变量（server）

| 变量 | 必填 | 说明 | 默认或行为 |
|------|------|------|------------|
| `PORT` | 否 | 服务监听端口 | 8080 |
| `JWT_SECRET` | 是 | JWT 签名密钥 | 无默认，生产必改 |
| `DATABASE_URL` | 否 | PostgreSQL 连接串 | 不配则内存存储 |
| `REDIS_URL` | 否 | Redis 连接串 | 不配则刷新令牌用 Postgres 或内存 |
| `CORS_ORIGINS` | 否 | CORS 允许来源（逗号分隔） | 空=不启用；`*`=全部 |
| `RATE_LIMIT_AUTH` | 否 | 登录/注册每 IP 每分钟上限 | 0=不限制 |
| `OSS_ENDPOINT` | 否 | 阿里云 OSS Endpoint | 与下两项齐配才启用 OSS |
| `OSS_ACCESS_KEY_ID` | 否 | 阿里云 AccessKey ID | 同上 |
| `OSS_ACCESS_KEY_SECRET` | 否 | 阿里云 AccessKey Secret | 同上 |
| `OSS_BUCKET` | 否 | OSS 桶名 | 不配则用 `attachments` |
| `AI_API_URL` | 否 | OpenAI 兼容 API 根地址 | 与 `AI_API_KEY` 齐配才启用 |
| `AI_API_KEY` | 否 | API Key | 同上 |
| `AI_DEFAULT_MODEL` | 否 | 默认模型名 | 不配则 `gpt-3.5-turbo` |

#### 前端环境变量（app）

| 变量 | 必填 | 说明 |
|------|------|------|
| `VITE_API_URL` | 否 | 后端 API 根地址（如 `http://localhost:8080`）；不配则无法登录与云端同步 |

`.env.example` 不会被加载，仅作模板。复制为 `app/.env.local` 后，由 **Vite** 在 `app/` 目录下自动加载（`root: "app"`）；仅 `VITE_` 前缀变量会暴露给前端。

#### 谁在什么时候加载 .env / .env.local？

| 端 | 谁加载 | 何时、何处 | 控制位置 |
|----|--------|------------|----------|
| **前端** | **Vite** | 启动/构建时，从项目根（本仓库为 `app/`）按顺序读文件，后加载的覆盖先加载的同名变量；已存在的进程环境变量优先级最高 | Vite 内置逻辑，不可配置；见 [Vite Env and Mode](https://vitejs.dev/guide/env-and-mode) |
| **后端** | **godotenv** + **os** | 进程启动时，`main()` 里先执行 `godotenv.Load(".env")`（从**当前工作目录**找 `.env`，可选、不存在不报错），再 `config.Load()` 读 `os.Getenv(...)`；已存在的环境变量不会被 .env 覆盖 | `server/cmd/api/main.go` |

**前端 Vite 加载顺序（后者覆盖前者）：**  
`.env` → `.env.local` → `.env.[mode]`（如 `.env.development`）→ `.env.[mode].local`。  
后端只认当前工作目录下的 `.env`（通常 `cd server` 后运行，即 `server/.env`）；没有 `.env.local` 的区分。

## 文档与规范

- 前端功能与开发细节：[app/README.md](app/README.md)
- 后端目录与规划：[server/README.md](server/README.md)
- **数据模型与表结构**：[server/docs/SCHEMA.md](server/docs/SCHEMA.md)（users、tasks、sync_cursors、sessions、task_attachments、ai_request_logs 等）
- 契约与类型约定：[shared/README.md](shared/README.md)
- 提交信息：不在 commit message 中出现 Cursor/Claude 等 AI 署名（见 `.cursor/rules/commit-message-no-cursor.mdc`）。
