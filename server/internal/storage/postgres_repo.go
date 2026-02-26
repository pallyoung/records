package storage

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

// PostgresFileRepo implements FileRepository with PostgreSQL task_attachments table.
type PostgresFileRepo struct {
	db *sql.DB
}

// NewPostgresFileRepo returns a new PostgreSQL file metadata repository.
func NewPostgresFileRepo(db *sql.DB) *PostgresFileRepo {
	return &PostgresFileRepo{db: db}
}

func (r *PostgresFileRepo) Create(ctx context.Context, f *FileMetadata) error {
	if f.ID == "" {
		f.ID = mustGenID()
	}
	f.CreatedAt = time.Now().UTC()
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO task_attachments (id, task_id, owner_id, bucket, object_key, mime_type, size, sha256, created_at)
		 VALUES ($1, NULLIF($2, ''), $3, $4, $5, $6, $7, NULLIF($8, ''), $9)`,
		f.ID, f.TaskID, f.OwnerID, f.Bucket, f.ObjectKey, f.MimeType, f.Size, f.SHA256, f.CreatedAt,
	)
	return err
}

func (r *PostgresFileRepo) GetByID(ctx context.Context, id string) (*FileMetadata, error) {
	var f FileMetadata
	var sha256 sql.NullString
	var taskID sql.NullString
	err := r.db.QueryRowContext(ctx,
		`SELECT id, task_id, owner_id, bucket, object_key, mime_type, size, sha256, created_at
		 FROM task_attachments WHERE id = $1`,
		id,
	).Scan(&f.ID, &taskID, &f.OwnerID, &f.Bucket, &f.ObjectKey, &f.MimeType, &f.Size, &sha256, &f.CreatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrFileNotFound
		}
		return nil, err
	}
	if sha256.Valid {
		f.SHA256 = sha256.String
	}
	if taskID.Valid {
		f.TaskID = taskID.String
	}
	return &f, nil
}

func (r *PostgresFileRepo) LinkToTask(ctx context.Context, fileID, taskID, userID string) error {
	res, err := r.db.ExecContext(ctx,
		`UPDATE task_attachments SET task_id = $1 WHERE id = $2 AND owner_id = $3`,
		toNullUUID(taskID), fileID, userID,
	)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrFileNotFound
	}
	return nil
}

func (r *PostgresFileRepo) UnlinkFromTask(ctx context.Context, fileID, userID string) error {
	res, err := r.db.ExecContext(ctx,
		`UPDATE task_attachments SET task_id = NULL WHERE id = $1 AND owner_id = $2`,
		fileID, userID,
	)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrFileNotFound
	}
	return nil
}

func (r *PostgresFileRepo) ListIDsByTaskID(ctx context.Context, taskID string) ([]string, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id FROM task_attachments WHERE task_id = $1`,
		taskID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

func toNullUUID(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}
