package sync

import (
	"context"
	"time"

	"records/server/internal/tasks"
)

// TaskRepoFromTasksRepo adapts tasks.Repository to sync.TaskRepo.
func TaskRepoFromTasksRepo(repo tasks.Repository) TaskRepo {
	return &tasksRepoAdapter{repo: repo}
}

type tasksRepoAdapter struct {
	repo tasks.Repository
}

func (a *tasksRepoAdapter) CreateTask(ctx context.Context, userID, taskID, title, status string, dueAt *time.Time) (*TaskSnapshot, error) {
	// tasks.Repository.Create generates its own ID; for sync we need to apply with given taskID.
	// So we need a way to create with a specific ID. Check tasks.Repository - it doesn't support that.
	// For phase 1 we can: either add CreateWithID to tasks.Repository, or have sync only support
	// create by payload with generated ID and then store mapping. Simplest: add CreateWithID to tasks.
	t, err := a.repo.CreateWithID(ctx, userID, taskID, title, status, dueAt)
	if err != nil {
		return nil, err
	}
	return taskToSnapshot(t), nil
}

func (a *tasksRepoAdapter) GetTask(ctx context.Context, taskID, userID string) (*TaskSnapshot, error) {
	t, err := a.repo.GetByID(ctx, taskID)
	if err != nil {
		return nil, err
	}
	if t.UserID != userID {
		return nil, tasks.ErrTaskNotFound
	}
	return taskToSnapshot(t), nil
}

func (a *tasksRepoAdapter) UpdateTask(ctx context.Context, snapshot *TaskSnapshot) error {
	t := snapshotToTask(snapshot)
	return a.repo.Update(ctx, t)
}

func (a *tasksRepoAdapter) SoftDeleteTask(ctx context.Context, taskID, userID string) error {
	return a.repo.SoftDelete(ctx, taskID, userID)
}

func taskToSnapshot(t *tasks.Task) *TaskSnapshot {
	return &TaskSnapshot{
		ID:        t.ID,
		UserID:    t.UserID,
		Title:     t.Title,
		Status:    t.Status,
		DueAt:     t.DueAt,
		Version:   t.Version,
		UpdatedAt: t.UpdatedAt,
		DeletedAt: t.DeletedAt,
	}
}

func snapshotToTask(s *TaskSnapshot) *tasks.Task {
	return &tasks.Task{
		ID:        s.ID,
		UserID:    s.UserID,
		Title:     s.Title,
		Status:    s.Status,
		DueAt:     s.DueAt,
		Version:   s.Version,
		UpdatedAt: s.UpdatedAt,
		DeletedAt: s.DeletedAt,
	}
}
