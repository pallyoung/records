package tasks

import (
	"context"
	"sync"
	"time"
)

// Task is the task entity.
type Task struct {
	ID        string     `json:"id"`
	UserID    string     `json:"user_id"`
	Title     string     `json:"title"`
	Status    string     `json:"status"`
	DueAt     *time.Time `json:"due_at,omitempty"`
	Version   int64      `json:"version"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty"`
}

// Repository abstracts task persistence.
type Repository interface {
	Create(ctx context.Context, userID, title, status string, dueAt *time.Time) (*Task, error)
	CreateWithID(ctx context.Context, userID, id, title, status string, dueAt *time.Time) (*Task, error)
	GetByID(ctx context.Context, id string) (*Task, error)
	ListByUserID(ctx context.Context, userID string) ([]*Task, error)
	Update(ctx context.Context, task *Task) error
	SoftDelete(ctx context.Context, id, userID string) error
}

// InMemoryRepo is an in-memory task repository.
type InMemoryRepo struct {
	mu    sync.RWMutex
	byID  map[string]*Task
	byUser map[string][]string
}

// NewInMemoryRepo returns a new in-memory task repository.
func NewInMemoryRepo() *InMemoryRepo {
	return &InMemoryRepo{
		byID:   make(map[string]*Task),
		byUser: make(map[string][]string),
	}
}

func (r *InMemoryRepo) Create(ctx context.Context, userID, title, status string, dueAt *time.Time) (*Task, error) {
	return r.CreateWithID(ctx, userID, mustGenID(), title, status, dueAt)
}

func (r *InMemoryRepo) CreateWithID(ctx context.Context, userID, id, title, status string, dueAt *time.Time) (*Task, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, exists := r.byID[id]; exists {
		return nil, ErrTaskNotFound
	}
	now := time.Now().UTC()
	t := &Task{
		ID:        id,
		UserID:    userID,
		Title:     title,
		Status:    status,
		DueAt:     dueAt,
		Version:   1,
		UpdatedAt: now,
	}
	r.byID[id] = t
	r.byUser[userID] = append(r.byUser[userID], id)
	return t, nil
}

func (r *InMemoryRepo) GetByID(ctx context.Context, id string) (*Task, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	t, ok := r.byID[id]
	if !ok || t.DeletedAt != nil {
		return nil, ErrTaskNotFound
	}
	return t, nil
}

func (r *InMemoryRepo) ListByUserID(ctx context.Context, userID string) ([]*Task, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	ids := r.byUser[userID]
	var out []*Task
	for _, id := range ids {
		if t, ok := r.byID[id]; ok && t.DeletedAt == nil {
			out = append(out, t)
		}
	}
	return out, nil
}

func (r *InMemoryRepo) Update(ctx context.Context, task *Task) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	existing, ok := r.byID[task.ID]
	if !ok || existing.DeletedAt != nil {
		return ErrTaskNotFound
	}
	if existing.UserID != task.UserID {
		return ErrTaskNotFound
	}
	task.UpdatedAt = time.Now().UTC()
	task.Version = existing.Version + 1
	r.byID[task.ID] = task
	return nil
}

func (r *InMemoryRepo) SoftDelete(ctx context.Context, id, userID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	t, ok := r.byID[id]
	if !ok || t.DeletedAt != nil {
		return ErrTaskNotFound
	}
	if t.UserID != userID {
		return ErrTaskNotFound
	}
	now := time.Now().UTC()
	t.DeletedAt = &now
	t.Version++
	t.UpdatedAt = now
	return nil
}
