package sync

import (
	"context"
	"time"
)

// Service handles sync push (phase 1).
type Service struct {
	TaskRepo   TaskRepo
	CursorRepo CursorRepo
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
			conflicts = append(conflicts, map[string]interface{}{
				"op_id": op.OpID,
				"error": err.Error(),
			})
			continue
		}

		cursor, _ := s.CursorRepo.AdvanceCursor(ctx, userID)
		_ = s.CursorRepo.MarkApplied(ctx, userID, op.OpID, cursor)
		applied = append(applied, op.OpID)
	}

	cursor, _ := s.CursorRepo.GetCursor(ctx, userID)
	return &PushResponse{
		Applied:   applied,
		Conflicts: conflicts,
		NewCursor: string(cursor),
	}, nil
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
	return err
}

func (s *Service) applyUpdate(ctx context.Context, userID string, op *Operation) error {
	cur, err := s.TaskRepo.GetTask(ctx, op.EntityID, userID)
	if err != nil {
		return err
	}
	if op.BaseVersion > 0 && cur.Version != op.BaseVersion {
		return errVersionMismatch
	}
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
