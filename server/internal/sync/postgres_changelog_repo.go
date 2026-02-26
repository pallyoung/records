package sync

import (
	"context"
	"database/sql"
	"encoding/json"
	"strconv"
)

// PostgresChangeLogRepo implements ChangeLogRepo with PostgreSQL.
type PostgresChangeLogRepo struct {
	db *sql.DB
}

// NewPostgresChangeLogRepo returns a new PostgreSQL change log repository.
func NewPostgresChangeLogRepo(db *sql.DB) *PostgresChangeLogRepo {
	return &PostgresChangeLogRepo{db: db}
}

func (r *PostgresChangeLogRepo) Append(ctx context.Context, userID string, entry ChangeEntry) error {
	var snapshotJSON []byte
	if entry.Snapshot != nil {
		var err error
		snapshotJSON, err = json.Marshal(entry.Snapshot)
		if err != nil {
			return err
		}
	}
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO sync_change_log (user_id, cursor, entity_id, operation, deleted, snapshot)
		 VALUES ($1, $2, $3, $4, $5, $6)`,
		userID, entry.Cursor, entry.EntityID, entry.Operation, entry.Deleted, snapshotJSON,
	)
	return err
}

func (r *PostgresChangeLogRepo) GetAfter(ctx context.Context, userID string, afterCursor string, limit int) ([]ChangeEntry, string, error) {
	afterNum, _ := strconv.ParseInt(afterCursor, 10, 64)
	rows, err := r.db.QueryContext(ctx,
		`SELECT cursor, entity_id, operation, deleted, snapshot
		 FROM sync_change_log
		 WHERE user_id = $1 AND (cursor::bigint) > $2
		 ORDER BY (cursor::bigint) ASC
		 LIMIT $3`,
		userID, afterNum, limit,
	)
	if err != nil {
		return nil, afterCursor, err
	}
	defer rows.Close()
	var out []ChangeEntry
	var lastCursor string
	for rows.Next() {
		var e ChangeEntry
		var snapshotJSON sql.NullString
		if err := rows.Scan(&e.Cursor, &e.EntityID, &e.Operation, &e.Deleted, &snapshotJSON); err != nil {
			return nil, afterCursor, err
		}
		lastCursor = e.Cursor
		if snapshotJSON.Valid && snapshotJSON.String != "" {
			var snap TaskSnapshot
			if err := json.Unmarshal([]byte(snapshotJSON.String), &snap); err == nil {
				e.Snapshot = &snap
			}
		}
		out = append(out, e)
	}
	if err := rows.Err(); err != nil {
		return nil, afterCursor, err
	}
	nextCursor := afterCursor
	if len(out) > 0 {
		nextCursor = lastCursor
	}
	return out, nextCursor, nil
}
