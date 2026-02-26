# Server

Go API service for auth, tasks, sync, storage, and AI.

## Structure

- `cmd/api`: API entrypoint
- `internal/`: auth, tasks, sync, storage, ai, observability, infra
- `migrations/`: PostgreSQL migrations (golang-migrate format)

## Run locally

```bash
cp .env.example .env   # set PORT, JWT_SECRET
go run ./cmd/api       # or make run
```

Default: in-memory storage (no database required).

## Database migrations (when using PostgreSQL)

1. Install [golang-migrate](https://github.com/golang-migrate/migrate) CLI:
   ```bash
   go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
   ```
2. Set `DATABASE_URL` (e.g. `postgres://user:pass@localhost:5432/dbname?sslmode=disable`).
3. From `server/` directory:
   ```bash
   make migrate-up
   ```
   To roll back one version: `make migrate-down`.
