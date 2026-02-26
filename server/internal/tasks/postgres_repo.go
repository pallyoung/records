package tasks

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

// PostgresRepo implements Repository with PostgreSQL.
type PostgresRepo struct {
	db *sql.DB
}

// NewPostgresRepo returns a new PostgreSQL task repository.
func NewPostgresRepo(db *sql.DB) *PostgresRepo {
	return &PostgresRepo{db: db}
}

func (r *PostgresRepo) Create(ctx context.Context, userID, title, status string, dueAt *time.Time) (*Task, error) {
	return r.CreateWithID(ctx, userID, mustGenID(), title, status, dueAt)
}

func (r *PostgresRepo) CreateWithID(ctx context.Context, userID, id, title, status string, dueAt *time.Time) (*Task, error) {
	var dueAtVal interface{}
	if dueAt != nil {
		dueAtVal = *dueAt
	}
	var updatedAt time.Time
	err := r.db.QueryRowContext(ctx,
		`INSERT INTO tasks (id, user_id, title, status, due_at, version, updated_at)
		 VALUES ($1, $2, $3, $4, $5, 1, now())
		 RETURNING updated_at`,
		id, userID, title, status, dueAtVal,
	).Scan(&updatedAt)
	if err != nil {
		return nil, err
	}
	t := &Task{
		ID:        id,
		UserID:    userID,
		Title:     title,
		Status:    status,
		DueAt:     dueAt,
		Version:   1,
		UpdatedAt: updatedAt,
	}
	return t, nil
}

func (r *PostgresRepo) GetByID(ctx context.Context, id string) (*Task, error) {
	var t Task
	var dueAt, deletedAt sql.NullTime
	err := r.db.QueryRowContext(ctx,
		`SELECT id, user_id, title, status, due_at, version, updated_at, deleted_at
		 FROM tasks WHERE id = $1`,
		id,
	).Scan(&t.ID, &t.UserID, &t.Title, &t.Status, &dueAt, &t.Version, &t.UpdatedAt, &deletedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrTaskNotFound
		}
		return nil, err
	}
	if deletedAt.Valid {
		return nil, ErrTaskNotFound
	}
	if dueAt.Valid {
		t.DueAt = &dueAt.Time
	}
	return &t, nil
}

func (r *PostgresRepo) ListByUserID(ctx context.Context, userID string) ([]*Task, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, user_id, title, status, due_at, version, updated_at, deleted_at
		 FROM tasks WHERE user_id = $1 AND deleted_at IS NULL
		 ORDER BY updated_at DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*Task
	for rows.Next() {
		var t Task
		var dueAt, deletedAt sql.NullTime
		if err := rows.Scan(&t.ID, &t.UserID, &t.Title, &t.Status, &dueAt, &t.Version, &t.UpdatedAt, &deletedAt); err != nil {
			return nil, err
		}
		if dueAt.Valid {
			t.DueAt = &dueAt.Time
		}
		out = append(out, &t)
	}
	return out, rows.Err()
}

func (r *PostgresRepo) Update(ctx context.Context, task *Task) error {
	var dueAtVal interface{}
	if task.DueAt != nil {
		dueAtVal = *task.DueAt
	}
	res, err := r.db.ExecContext(ctx,
		`UPDATE tasks SET title = $1, status = $2, due_at = $3, version = $4, updated_at = now()
		 WHERE id = $5 AND user_id = $6 AND deleted_at IS NULL`,
		task.Title, task.Status, dueAtVal, task.Version, task.ID, task.UserID,
	)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrTaskNotFound
	}
	return nil
}

func (r *PostgresRepo) SoftDelete(ctx context.Context, id, userID string) error {
	res, err := r.db.ExecContext(ctx,
		`UPDATE tasks SET deleted_at = now(), version = version + 1, updated_at = now()
		 WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
		id, userID,
	)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrTaskNotFound
	}
	return nil
}
