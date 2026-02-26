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

### 环境变量摘要

| 作用域   | 变量           | 说明                    |
|----------|----------------|-------------------------|
| 前端构建/开发 | `VITE_API_URL` | 后端 API 根地址，如 `https://api.example.com` |
| 后端     | `PORT`         | 服务监听端口，默认 8080 |
| 后端     | `JWT_SECRET`   | JWT 签名密钥，必填       |

更多后端配置见 `server/.env.example`。

## 文档与规范

- 前端功能与开发细节：[app/README.md](app/README.md)
- 后端目录与规划：[server/README.md](server/README.md)
- 契约与类型约定：[shared/README.md](shared/README.md)
- 提交信息：不在 commit message 中出现 Cursor/Claude 等 AI 署名（见 `.cursor/rules/commit-message-no-cursor.mdc`）。
