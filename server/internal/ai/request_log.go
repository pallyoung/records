package ai

import (
	"context"
	"sync"
	"time"
)

// RequestLogEntry records one AI request for observability and cost.
type RequestLogEntry struct {
	UserID     string
	Provider   string
	Model      string
	TokenUsage int64
	LatencyMs  int64
	Status     string
	CreatedAt  time.Time
}

// RequestLogRepo stores log entries (in-memory for tests, can be replaced by DB).
type RequestLogRepo interface {
	Append(ctx context.Context, entry RequestLogEntry) error
}

// InMemoryRequestLogRepo keeps entries in memory for tests.
type InMemoryRequestLogRepo struct {
	mu     sync.RWMutex
	entries []RequestLogEntry
}

func NewInMemoryRequestLogRepo() *InMemoryRequestLogRepo {
	return &InMemoryRequestLogRepo{entries: make([]RequestLogEntry, 0)}
}

func (r *InMemoryRequestLogRepo) Append(ctx context.Context, entry RequestLogEntry) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.entries = append(r.entries, entry)
	return nil
}

func (r *InMemoryRequestLogRepo) Last() (RequestLogEntry, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	if len(r.entries) == 0 {
		return RequestLogEntry{}, false
	}
	return r.entries[len(r.entries)-1], true
}

func (r *InMemoryRequestLogRepo) Entries() []RequestLogEntry {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]RequestLogEntry, len(r.entries))
	copy(out, r.entries)
	return out
}
