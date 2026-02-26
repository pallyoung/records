package auth

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

// PostgresRefreshRepo implements RefreshTokenRepository with PostgreSQL sessions table.
type PostgresRefreshRepo struct {
	db *sql.DB
}

// NewPostgresRefreshRepo returns a new PostgreSQL refresh token repository.
func NewPostgresRefreshRepo(db *sql.DB) *PostgresRefreshRepo {
	return &PostgresRefreshRepo{db: db}
}

func (r *PostgresRefreshRepo) Store(ctx context.Context, tokenHash, userID string, expiresAt time.Time) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO sessions (user_id, device_id, token_hash, expires_at)
		 VALUES ($1, '', $2, $3)`,
		userID, tokenHash, expiresAt,
	)
	return err
}

func (r *PostgresRefreshRepo) Get(ctx context.Context, tokenHash string) (*RefreshTokenRecord, error) {
	var userID string
	var expiresAt time.Time
	var revokedAt sql.NullTime
	err := r.db.QueryRowContext(ctx,
		`SELECT user_id, expires_at, revoked_at FROM sessions WHERE token_hash = $1`,
		tokenHash,
	).Scan(&userID, &expiresAt, &revokedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrRefreshTokenInvalid
		}
		return nil, err
	}
	if revokedAt.Valid || time.Now().After(expiresAt) {
		return nil, ErrRefreshTokenInvalid
	}
	return &RefreshTokenRecord{
		UserID:    userID,
		ExpiresAt: expiresAt,
		Revoked:   revokedAt.Valid,
	}, nil
}

func (r *PostgresRefreshRepo) Revoke(ctx context.Context, tokenHash string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE sessions SET revoked_at = now() WHERE token_hash = $1`,
		tokenHash,
	)
	return err
}
