package db

import (
	"context"
	"database/sql"
	"time"

	_ "github.com/lib/pq"
)

// Open opens a PostgreSQL connection pool. databaseURL must be a valid
// postgres connection string (e.g. postgres://user:pass@host:5432/dbname?sslmode=disable).
func Open(databaseURL string) (*sql.DB, error) {
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)
	return db, nil
}

// Ping verifies the database connection is alive.
func Ping(ctx context.Context, db *sql.DB) error {
	return db.PingContext(ctx)
}
