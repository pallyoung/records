package sync

import (
	"context"
	"database/sql"
	"strconv"
)

// PostgresCursorRepo implements CursorRepo with PostgreSQL.
type PostgresCursorRepo struct {
	db *sql.DB
}

// NewPostgresCursorRepo returns a new PostgreSQL cursor repository.
func NewPostgresCursorRepo(db *sql.DB) *PostgresCursorRepo {
	return &PostgresCursorRepo{db: db}
}

func (r *PostgresCursorRepo) GetCursor(ctx context.Context, userID string) (Cursor, error) {
	var n int64
	err := r.db.QueryRowContext(ctx,
		`SELECT last_cursor FROM sync_cursors WHERE user_id = $1`,
		userID,
	).Scan(&n)
	if err != nil {
		if err == sql.ErrNoRows {
			return "0", nil
		}
		return "", err
	}
	return Cursor(strconv.FormatInt(n, 10)), nil
}

func (r *PostgresCursorRepo) AdvanceCursor(ctx context.Context, userID string) (Cursor, error) {
	var n int64
	err := r.db.QueryRowContext(ctx,
		`INSERT INTO sync_cursors (user_id, last_cursor) VALUES ($1, 1)
		 ON CONFLICT (user_id) DO UPDATE SET last_cursor = sync_cursors.last_cursor + 1
		 RETURNING last_cursor`,
		userID,
	).Scan(&n)
	if err != nil {
		return "", err
	}
	return Cursor(strconv.FormatInt(n, 10)), nil
}

func (r *PostgresCursorRepo) MarkApplied(ctx context.Context, userID string, opID string, c Cursor) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO sync_applied_ops (user_id, op_id, cursor) VALUES ($1, $2, $3)
		 ON CONFLICT (user_id, op_id) DO UPDATE SET cursor = $3`,
		userID, opID, string(c),
	)
	return err
}

func (r *PostgresCursorRepo) WasApplied(ctx context.Context, userID string, opID string) (Cursor, bool) {
	var c string
	err := r.db.QueryRowContext(ctx,
		`SELECT cursor FROM sync_applied_ops WHERE user_id = $1 AND op_id = $2`,
		userID, opID,
	).Scan(&c)
	if err != nil {
		return "", false
	}
	return Cursor(c), true
}
