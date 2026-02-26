package sync

import (
	"context"
	"time"

	"records/server/internal/observability"
)

// AttachmentLinker links file metadata to tasks (for sync attachment_ids).
type AttachmentLinker interface {
	LinkToTask(ctx context.Context, fileID, taskID, userID string) error
	UnlinkFromTask(ctx context.Context, fileID, userID string) error
	ListIDsByTaskID(ctx context.Context, taskID string) ([]string, error)
}

// Service handles sync push and pull (phase 1 + 2).
type Service struct {
	TaskRepo        TaskRepo
	CursorRepo      CursorRepo
	ChangeLogRepo   ChangeLogRepo
	AttachmentLinker AttachmentLinker // optional: links files to tasks when payload has attachment_ids
	Metrics         observability.SyncMetrics
	FailureTracker  FailureTracker
}

// Push applies a batch of operations for the user. Idempotent by op_id.
func (s *Service) Push(ctx context.Context, userID string, req PushRequest) (*PushResponse, error) {
	applied := make([]string, 0)
	conflicts := make([]interface{}, 0)

	for _, op := range req.Operations {
		if op.OpID == "" {
			continue
		}
		if _, ok := s.CursorRepo.WasApplied(ctx, userID, op.OpID); ok {
			applied = append(applied, op.OpID)
			// Keep cursor as-is for idempotent reply; we'll set new_cursor at the end
			continue
		}

		var err error
		switch op.Operation {
		case "create":
			err = s.applyCreate(ctx, userID, &op)
		case "update":
			err = s.applyUpdate(ctx, userID, &op)
		case "delete":
			err = s.applyDelete(ctx, userID, &op)
		default:
			continue
		}

		if err != nil {
			if s.FailureTracker != nil {
				s.FailureTracker.RecordFailure(ctx, userID, op.OpID)
				if s.FailureTracker.ShouldDeadLetter(ctx, userID, op.OpID) {
					s.FailureTracker.MarkDeadLetter(ctx, userID, op.OpID)
					if s.Metrics != nil {
						s.Metrics.RecordSyncDeadLetter()
					}
				}
			}
			ce := map[string]interface{}{"op_id": op.OpID, "error": err.Error()}
			if err == errVersionMismatch {
				if latest, _ := s.TaskRepo.GetTask(ctx, op.EntityID, userID); latest != nil {
					ce["latest"] = latest
				}
			}
			conflicts = append(conflicts, ce)
			continue
		}

		cursor, _ := s.CursorRepo.AdvanceCursor(ctx, userID)
		_ = s.CursorRepo.MarkApplied(ctx, userID, op.OpID, cursor)
		applied = append(applied, op.OpID)

		// Append to change log for pull (phase 2)
		if s.ChangeLogRepo != nil {
			entry := s.makeChangeEntry(ctx, userID, op.Operation, op.EntityID, cursor)
			_ = s.ChangeLogRepo.Append(ctx, userID, entry)
		}
	}

	cursor, _ := s.CursorRepo.GetCursor(ctx, userID)
	return &PushResponse{
		Applied:   applied,
		Conflicts: conflicts,
		NewCursor: string(cursor),
	}, nil
}

const defaultPullLimit = 200
const maxPullLimit = 200

// Pull returns changes after the given cursor for the user.
func (s *Service) Pull(ctx context.Context, userID string, cursor string, limit int) (*PullResponse, error) {
	if s.ChangeLogRepo == nil {
		return &PullResponse{Changes: nil, NextCursor: cursor}, nil
	}
	if limit <= 0 {
		limit = defaultPullLimit
	}
	if limit > maxPullLimit {
		limit = maxPullLimit
	}
	changes, nextCursor, err := s.ChangeLogRepo.GetAfter(ctx, userID, cursor, limit)
	if err != nil {
		return nil, err
	}
	return &PullResponse{Changes: changes, NextCursor: nextCursor}, nil
}

func (s *Service) applyCreate(ctx context.Context, userID string, op *Operation) error {
	title, _ := strPayload(op.Payload, "title")
	status, _ := strPayload(op.Payload, "status")
	if title == "" {
		title = "Untitled"
	}
	if status == "" {
		status = "pending"
	}
	var dueAt *time.Time
	if d, ok := timePayload(op.Payload, "due_at"); ok {
		dueAt = &d
	}
	_, err := s.TaskRepo.CreateTask(ctx, userID, op.EntityID, title, status, dueAt)
	if err != nil {
		return err
	}
	// Link attachments when payload includes attachment_ids
	if s.AttachmentLinker != nil {
		for _, fileID := range strSlicePayload(op.Payload, "attachment_ids") {
			_ = s.AttachmentLinker.LinkToTask(ctx, fileID, op.EntityID, userID)
		}
	}
	return nil
}

func (s *Service) applyUpdate(ctx context.Context, userID string, op *Operation) error {
	cur, err := s.TaskRepo.GetTask(ctx, op.EntityID, userID)
	if err != nil {
		return err
	}
	if op.BaseVersion > 0 && cur.Version != op.BaseVersion {
		return errVersionMismatch
	}
	// Update attachment links when payload explicitly includes attachment_ids
	if s.AttachmentLinker != nil && op.Payload != nil {
		if _, hasKey := op.Payload["attachment_ids"]; hasKey {
			newIDs := strSlicePayload(op.Payload, "attachment_ids")
			curIDs, _ := s.AttachmentLinker.ListIDsByTaskID(ctx, op.EntityID)
			curSet := make(map[string]bool)
			for _, id := range curIDs {
				curSet[id] = true
			}
			newSet := make(map[string]bool)
			for _, id := range newIDs {
				newSet[id] = true
			}
			for _, id := range curIDs {
				if !newSet[id] {
					_ = s.AttachmentLinker.UnlinkFromTask(ctx, id, userID)
				}
			}
			for _, id := range newIDs {
				if !curSet[id] {
					_ = s.AttachmentLinker.LinkToTask(ctx, id, op.EntityID, userID)
				}
			}
		}
	}
	// Copy so we don't mutate before UpdateTask
	cur = copySnapshot(cur)
	if v, ok := strPayload(op.Payload, "title"); ok && v != "" {
		cur.Title = v
	}
	if v, ok := strPayload(op.Payload, "status"); ok && v != "" {
		cur.Status = v
	}
	if v, ok := timePayload(op.Payload, "due_at"); ok {
		cur.DueAt = &v
	}
	cur.UpdatedAt = time.Now().UTC()
	cur.Version++
	return s.TaskRepo.UpdateTask(ctx, cur)
}

func (s *Service) applyDelete(ctx context.Context, userID string, op *Operation) error {
	return s.TaskRepo.SoftDeleteTask(ctx, op.EntityID, userID)
}

func (s *Service) makeChangeEntry(ctx context.Context, userID string, operation, entityID string, cursor Cursor) ChangeEntry {
	entry := ChangeEntry{Cursor: string(cursor), EntityID: entityID, Operation: operation}
	if operation == "delete" {
		entry.Deleted = true
		return entry
	}
	snap, _ := s.TaskRepo.GetTask(ctx, entityID, userID)
	if snap != nil {
		entry.Snapshot = copySnapshot(snap)
		if entry.Snapshot != nil && s.AttachmentLinker != nil {
			entry.Snapshot.AttachmentIDs, _ = s.AttachmentLinker.ListIDsByTaskID(ctx, entityID)
		}
	}
	return entry
}

func copySnapshot(s *TaskSnapshot) *TaskSnapshot {
	if s == nil {
		return nil
	}
	t := *s
	var due *time.Time
	if s.DueAt != nil {
		t2 := *s.DueAt
		due = &t2
	}
	t.DueAt = due
	var deleted *time.Time
	if s.DeletedAt != nil {
		t3 := *s.DeletedAt
		deleted = &t3
	}
	t.DeletedAt = deleted
	if s.AttachmentIDs != nil {
		t.AttachmentIDs = append([]string(nil), s.AttachmentIDs...)
	}
	return &t
}

func strPayload(p map[string]interface{}, key string) (string, bool) {
	if p == nil {
		return "", false
	}
	v, ok := p[key]
	if !ok {
		return "", false
	}
	s, _ := v.(string)
	return s, true
}

func timePayload(p map[string]interface{}, key string) (time.Time, bool) {
	if p == nil {
		return time.Time{}, false
	}
	v, ok := p[key]
	if !ok {
		return time.Time{}, false
	}
	switch t := v.(type) {
	case string:
		parsed, err := time.Parse(time.RFC3339, t)
		return parsed, err == nil
	case float64:
		// Unix ms
		return time.Unix(0, int64(t)*int64(time.Millisecond)), true
	default:
		return time.Time{}, false
	}
}

func strSlicePayload(p map[string]interface{}, key string) []string {
	if p == nil {
		return nil
	}
	v, ok := p[key]
	if !ok {
		return nil
	}
	sl, ok := v.([]interface{})
	if !ok {
		return nil
	}
	var out []string
	for _, e := range sl {
		if s, ok := e.(string); ok && s != "" {
			out = append(out, s)
		}
	}
	return out
}
