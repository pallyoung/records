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

// ChangeLogRepo stores change entries for pull (phase 2).
type ChangeLogRepo interface {
	Append(ctx context.Context, userID string, entry ChangeEntry) error
	GetAfter(ctx context.Context, userID string, afterCursor string, limit int) ([]ChangeEntry, string, error)
}

// InMemoryChangeLogRepo is an in-memory change log.
type InMemoryChangeLogRepo struct {
	mu     sync.RWMutex
	byUser map[string][]ChangeEntry
}

// NewInMemoryChangeLogRepo returns a new in-memory change log repo.
func NewInMemoryChangeLogRepo() *InMemoryChangeLogRepo {
	return &InMemoryChangeLogRepo{byUser: make(map[string][]ChangeEntry)}
}

func (r *InMemoryChangeLogRepo) Append(ctx context.Context, userID string, entry ChangeEntry) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.byUser[userID] = append(r.byUser[userID], entry)
	return nil
}

func (r *InMemoryChangeLogRepo) GetAfter(ctx context.Context, userID string, afterCursor string, limit int) ([]ChangeEntry, string, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	list := r.byUser[userID]
	if list == nil {
		return nil, afterCursor, nil
	}
	after := parseCursorToInt(afterCursor)
	var out []ChangeEntry
	for _, e := range list {
		cn := parseCursorToInt(e.Cursor)
		if cn > after {
			out = append(out, e)
			if len(out) >= limit {
				return out, e.Cursor, nil
			}
		}
	}
	next := afterCursor
	if len(out) > 0 {
		next = out[len(out)-1].Cursor
	}
	return out, next, nil
}

func parseCursorToInt(c string) int64 {
	if c == "" {
		return 0
	}
	n, _ := strconv.ParseInt(c, 10, 64)
	return n
}
