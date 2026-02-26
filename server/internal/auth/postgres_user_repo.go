package auth

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

// PostgresUserRepo implements UserRepository with PostgreSQL.
type PostgresUserRepo struct {
	db *sql.DB
}

// NewPostgresUserRepo returns a new PostgreSQL user repository.
func NewPostgresUserRepo(db *sql.DB) *PostgresUserRepo {
	return &PostgresUserRepo{db: db}
}

func (r *PostgresUserRepo) Create(ctx context.Context, email, passwordHash string) (*User, error) {
	var id string
	var createdAt time.Time
	err := r.db.QueryRowContext(ctx,
		`INSERT INTO users (email, password_hash, created_at, updated_at)
		 VALUES ($1, $2, now(), now())
		 ON CONFLICT (email) DO NOTHING
		 RETURNING id, created_at`,
		email, passwordHash,
	).Scan(&id, &createdAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrEmailExists
		}
		return nil, err
	}
	return &User{
		ID:           id,
		Email:        email,
		PasswordHash: passwordHash,
		CreatedAt:    createdAt,
	}, nil
}

func (r *PostgresUserRepo) GetByID(ctx context.Context, id string) (*User, error) {
	var u User
	err := r.db.QueryRowContext(ctx,
		`SELECT id, email, password_hash, created_at FROM users WHERE id = $1`,
		id,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.CreatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &u, nil
}

func (r *PostgresUserRepo) GetByEmail(ctx context.Context, email string) (*User, error) {
	var u User
	err := r.db.QueryRowContext(ctx,
		`SELECT id, email, password_hash, created_at FROM users WHERE email = $1`,
		email,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.CreatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &u, nil
}
