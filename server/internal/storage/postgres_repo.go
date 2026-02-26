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
		 VALUES ($1, NULL, $2, $3, $4, $5, $6, NULLIF($7, ''), $8)`,
		f.ID, f.OwnerID, f.Bucket, f.ObjectKey, f.MimeType, f.Size, f.SHA256, f.CreatedAt,
	)
	return err
}

func (r *PostgresFileRepo) GetByID(ctx context.Context, id string) (*FileMetadata, error) {
	var f FileMetadata
	var sha256 sql.NullString
	err := r.db.QueryRowContext(ctx,
		`SELECT id, owner_id, bucket, object_key, mime_type, size, sha256, created_at
		 FROM task_attachments WHERE id = $1`,
		id,
	).Scan(&f.ID, &f.OwnerID, &f.Bucket, &f.ObjectKey, &f.MimeType, &f.Size, &sha256, &f.CreatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrFileNotFound
		}
		return nil, err
	}
	if sha256.Valid {
		f.SHA256 = sha256.String
	}
	return &f, nil
}
