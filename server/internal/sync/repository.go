package sync

import (
	"context"
	"strconv"
	"sync"
	"time"
)

// Cursor is an opaque cursor value for pull (phase 1: we use a sequence number).
type Cursor string

// AppliedOp records an applied operation for idempotency.
type AppliedOp struct {
	OpID   string
	Cursor Cursor
}

// TaskRepo is the minimal task interface needed by sync to apply operations.
type TaskRepo interface {
	CreateTask(ctx context.Context, userID, taskID, title, status string, dueAt *time.Time) (*TaskSnapshot, error)
	GetTask(ctx context.Context, taskID, userID string) (*TaskSnapshot, error)
	UpdateTask(ctx context.Context, snapshot *TaskSnapshot) error
	SoftDeleteTask(ctx context.Context, taskID, userID string) error
}

// TaskSnapshot is the task shape used by sync (id, version, fields).
type TaskSnapshot struct {
	ID        string
	UserID    string
	Title     string
	Status    string
	DueAt     *time.Time
	Version   int64
	UpdatedAt time.Time
	DeletedAt *time.Time
}

// CursorRepo stores and advances cursor per user, and tracks applied op_id for idempotency.
type CursorRepo interface {
	GetCursor(ctx context.Context, userID string) (Cursor, error)
	AdvanceCursor(ctx context.Context, userID string) (Cursor, error)
	MarkApplied(ctx context.Context, userID string, opID string, c Cursor) error
	WasApplied(ctx context.Context, userID string, opID string) (Cursor, bool)
}

// InMemoryCursorRepo is an in-memory cursor and idempotency store.
type InMemoryCursorRepo struct {
	mu        sync.RWMutex
	cursor    map[string]int64
	applied   map[string]map[string]Cursor // userID -> opID -> cursor
}

// NewInMemoryCursorRepo returns a new in-memory cursor repo.
func NewInMemoryCursorRepo() *InMemoryCursorRepo {
	return &InMemoryCursorRepo{
		cursor:  make(map[string]int64),
		applied: make(map[string]map[string]Cursor),
	}
}

func (r *InMemoryCursorRepo) GetCursor(ctx context.Context, userID string) (Cursor, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	n := r.cursor[userID]
	return Cursor(intToCursor(n)), nil
}

func (r *InMemoryCursorRepo) AdvanceCursor(ctx context.Context, userID string) (Cursor, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.cursor[userID]++
	n := r.cursor[userID]
	return Cursor(intToCursor(n)), nil
}

func (r *InMemoryCursorRepo) MarkApplied(ctx context.Context, userID string, opID string, c Cursor) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.applied[userID] == nil {
		r.applied[userID] = make(map[string]Cursor)
	}
	r.applied[userID][opID] = c
	return nil
}

func (r *InMemoryCursorRepo) WasApplied(ctx context.Context, userID string, opID string) (Cursor, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	if r.applied[userID] == nil {
		return "", false
	}
	c, ok := r.applied[userID][opID]
	return c, ok
}

func intToCursor(n int64) string {
	return strconv.FormatInt(n, 10)
}
