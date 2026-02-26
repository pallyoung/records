package ai

import (
	"context"
	"database/sql"
)

// PostgresRequestLogRepo implements RequestLogRepo with PostgreSQL ai_request_logs table.
type PostgresRequestLogRepo struct {
	db *sql.DB
}

// NewPostgresRequestLogRepo returns a new PostgreSQL request log repository.
func NewPostgresRequestLogRepo(db *sql.DB) *PostgresRequestLogRepo {
	return &PostgresRequestLogRepo{db: db}
}

func (r *PostgresRequestLogRepo) Append(ctx context.Context, entry RequestLogEntry) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO ai_request_logs (user_id, provider, model, latency_ms, token_usage, status, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		entry.UserID, entry.Provider, entry.Model, entry.LatencyMs, entry.TokenUsage, entry.Status, entry.CreatedAt,
	)
	return err
}
