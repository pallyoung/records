package storage

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"sync"
	"time"
)

// FileMetadata is the stored file record (owner, object key, size, etc.).
type FileMetadata struct {
	ID        string    `json:"id"`
	OwnerID   string    `json:"owner_id"`
	TaskID    string    `json:"task_id,omitempty"` // optional link to task
	Bucket    string    `json:"bucket"`
	ObjectKey string    `json:"object_key"`
	MimeType  string    `json:"mime_type"`
	Size      int64     `json:"size"`
	SHA256    string    `json:"sha256,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

// FileRepository persists file metadata.
type FileRepository interface {
	Create(ctx context.Context, f *FileMetadata) error
	GetByID(ctx context.Context, id string) (*FileMetadata, error)
	LinkToTask(ctx context.Context, fileID, taskID, userID string) error
	UnlinkFromTask(ctx context.Context, fileID, userID string) error
	ListIDsByTaskID(ctx context.Context, taskID string) ([]string, error)
}

// InMemoryFileRepo is an in-memory file metadata store.
type InMemoryFileRepo struct {
	mu   sync.RWMutex
	byID map[string]*FileMetadata
}

// NewInMemoryFileRepo returns a new in-memory file repository.
func NewInMemoryFileRepo() *InMemoryFileRepo {
	return &InMemoryFileRepo{byID: make(map[string]*FileMetadata)}
}

func (r *InMemoryFileRepo) Create(ctx context.Context, f *FileMetadata) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if f.ID == "" {
		f.ID = mustGenID()
	}
	f.CreatedAt = time.Now().UTC()
	r.byID[f.ID] = f
	return nil
}

func (r *InMemoryFileRepo) GetByID(ctx context.Context, id string) (*FileMetadata, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	f, ok := r.byID[id]
	if !ok {
		return nil, ErrFileNotFound
	}
	return f, nil
}

func (r *InMemoryFileRepo) LinkToTask(ctx context.Context, fileID, taskID, userID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	f, ok := r.byID[fileID]
	if !ok {
		return ErrFileNotFound
	}
	if f.OwnerID != userID {
		return ErrFileNotFound
	}
	f.TaskID = taskID
	return nil
}

func (r *InMemoryFileRepo) UnlinkFromTask(ctx context.Context, fileID, userID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	f, ok := r.byID[fileID]
	if !ok {
		return ErrFileNotFound
	}
	if f.OwnerID != userID {
		return ErrFileNotFound
	}
	f.TaskID = ""
	return nil
}

func (r *InMemoryFileRepo) ListIDsByTaskID(ctx context.Context, taskID string) ([]string, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var ids []string
	for id, f := range r.byID {
		if f.TaskID == taskID {
			ids = append(ids, id)
		}
	}
	return ids, nil
}

func mustGenID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
