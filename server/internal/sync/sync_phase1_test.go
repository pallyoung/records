package sync

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"records/server/internal/auth"
	"records/server/internal/tasks"
)

func TestSyncPushStoresOperationsAndUpdatesState(t *testing.T) {
	taskRepo := TaskRepoFromTasksRepo(tasks.NewInMemoryRepo())
	cursorRepo := NewInMemoryCursorRepo()
	svc := &Service{TaskRepo: taskRepo, CursorRepo: cursorRepo}
	h := &Handler{Service: svc}
	userID := "user-1"

	body := `{"operations":[{"op_id":"op1","entity_id":"task1","operation":"create","base_version":0,"payload":{"title":"First","status":"pending"}}]}`
	req := httptest.NewRequest(http.MethodPost, "/sync/push", bytes.NewReader([]byte(body)))
	req = req.WithContext(contextWithUserID(req.Context(), userID))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Push(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("push status %d: %s", w.Code, w.Body.String())
	}
	var resp PushResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(resp.Applied) != 1 || resp.Applied[0] != "op1" {
		t.Fatalf("applied: %+v", resp.Applied)
	}
	if resp.NewCursor == "" {
		t.Fatalf("new_cursor empty")
	}
	if len(resp.Conflicts) != 0 {
		t.Fatalf("conflicts: %+v", resp.Conflicts)
	}

	// Task should exist
	ctx := context.Background()
	task, err := taskRepo.GetTask(ctx, "task1", userID)
	if err != nil || task == nil || task.Title != "First" {
		t.Fatalf("task after push: err=%v task=%+v", err, task)
	}
}

func TestSyncPushDuplicateOpIDIsIdempotent(t *testing.T) {
	taskRepo := TaskRepoFromTasksRepo(tasks.NewInMemoryRepo())
	cursorRepo := NewInMemoryCursorRepo()
	svc := &Service{TaskRepo: taskRepo, CursorRepo: cursorRepo}
	h := &Handler{Service: svc}
	userID := "user-1"

	body := `{"operations":[{"op_id":"op-dup","entity_id":"t1","operation":"create","base_version":0,"payload":{"title":"One","status":"pending"}}]}`
	req1 := httptest.NewRequest(http.MethodPost, "/sync/push", bytes.NewReader([]byte(body)))
	req1 = req1.WithContext(contextWithUserID(req1.Context(), userID))
	req1.Header.Set("Content-Type", "application/json")
	w1 := httptest.NewRecorder()
	h.Push(w1, req1)
	if w1.Code != http.StatusOK {
		t.Fatalf("first push: %d %s", w1.Code, w1.Body.String())
	}
	var resp1 PushResponse
	_ = json.Unmarshal(w1.Body.Bytes(), &resp1)

	// Same op again
	req2 := httptest.NewRequest(http.MethodPost, "/sync/push", bytes.NewReader([]byte(body)))
	req2 = req2.WithContext(contextWithUserID(req2.Context(), userID))
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	h.Push(w2, req2)
	if w2.Code != http.StatusOK {
		t.Fatalf("second push: %d %s", w2.Code, w2.Body.String())
	}
	var resp2 PushResponse
	_ = json.Unmarshal(w2.Body.Bytes(), &resp2)

	if len(resp2.Applied) != 1 || resp2.Applied[0] != "op-dup" {
		t.Fatalf("second applied: %+v", resp2.Applied)
	}
	if len(resp2.Conflicts) != 0 {
		t.Fatalf("second conflicts: %+v", resp2.Conflicts)
	}
	// Task still exists and unchanged
	ctx := context.Background()
	task, _ := taskRepo.GetTask(ctx, "t1", userID)
	if task == nil || task.Title != "One" {
		t.Fatalf("task after duplicate push: %+v", task)
	}
}

func contextWithUserID(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, auth.UserIDContextKey, userID)
}
