package tasks

import (
	"context"
	"time"
)

// Service handles task business logic.
type Service struct {
	Repo Repository
}

// CreateTaskRequest is the payload for creating a task.
type CreateTaskRequest struct {
	Title  string     `json:"title"`
	Status string     `json:"status"`
	DueAt  *time.Time `json:"due_at,omitempty"`
}

// UpdateTaskRequest is the payload for updating a task.
type UpdateTaskRequest struct {
	Title  *string    `json:"title,omitempty"`
	Status *string    `json:"status,omitempty"`
	DueAt  *time.Time `json:"due_at,omitempty"`
}

// Create creates a task for the user.
func (s *Service) Create(ctx context.Context, userID string, req CreateTaskRequest) (*Task, error) {
	if req.Title == "" {
		req.Title = "Untitled"
	}
	if req.Status == "" {
		req.Status = "pending"
	}
	return s.Repo.Create(ctx, userID, req.Title, req.Status, req.DueAt)
}

// Get returns a task by ID if it belongs to the user.
func (s *Service) Get(ctx context.Context, id, userID string) (*Task, error) {
	t, err := s.Repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if t.UserID != userID {
		return nil, ErrTaskNotFound
	}
	return t, nil
}

// List returns all non-deleted tasks for the user.
func (s *Service) List(ctx context.Context, userID string) ([]*Task, error) {
	return s.Repo.ListByUserID(ctx, userID)
}

// Update updates a task if it belongs to the user.
func (s *Service) Update(ctx context.Context, id, userID string, req UpdateTaskRequest) (*Task, error) {
	t, err := s.Get(ctx, id, userID)
	if err != nil {
		return nil, err
	}
	if req.Title != nil {
		t.Title = *req.Title
	}
	if req.Status != nil {
		t.Status = *req.Status
	}
	if req.DueAt != nil {
		t.DueAt = req.DueAt
	}
	if err := s.Repo.Update(ctx, t); err != nil {
		return nil, err
	}
	return t, nil
}

// Delete soft-deletes a task if it belongs to the user.
func (s *Service) Delete(ctx context.Context, id, userID string) error {
	return s.Repo.SoftDelete(ctx, id, userID)
}
