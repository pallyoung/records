package sync

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"records/server/internal/observability"
	"records/server/internal/tasks"
)

func TestHandler_RecordsSyncPushSuccessAndConflict(t *testing.T) {
	taskRepo := TaskRepoFromTasksRepo(tasks.NewInMemoryRepo())
	svc := &Service{
		TaskRepo:      taskRepo,
		CursorRepo:    NewInMemoryCursorRepo(),
		ChangeLogRepo: NewInMemoryChangeLogRepo(),
	}
	metrics := &observability.MemMetrics{}
	h := &Handler{Service: svc, Metrics: metrics}
	userID := "user-1"

	// Push success (create)
	body := `{"operations":[{"op_id":"op1","entity_id":"t1","operation":"create","base_version":0,"payload":{"title":"A","status":"pending"}}]}`
	req := httptest.NewRequest(http.MethodPost, "/sync/push", bytes.NewReader([]byte(body)))
	req = req.WithContext(contextWithUserID(req.Context(), userID))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Push(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("push: %d %s", w.Code, w.Body.String())
	}
	if metrics.SyncPushSuccess != 1 {
		t.Errorf("SyncPushSuccess = %d, want 1", metrics.SyncPushSuccess)
	}

	// Push conflict (stale base version: server has 1, we send 99)
	body2 := `{"operations":[{"op_id":"op2","entity_id":"t1","operation":"update","base_version":99,"payload":{"title":"B","status":"done"}}]}`
	req2 := httptest.NewRequest(http.MethodPost, "/sync/push", bytes.NewReader([]byte(body2)))
	req2 = req2.WithContext(contextWithUserID(req2.Context(), userID))
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	h.Push(w2, req2)
	if w2.Code != http.StatusOK {
		t.Fatalf("push conflict: %d %s", w2.Code, w2.Body.String())
	}
	var resp PushResponse
	_ = json.Unmarshal(w2.Body.Bytes(), &resp)
	if len(resp.Conflicts) != 1 {
		t.Fatalf("expected 1 conflict, got %d", len(resp.Conflicts))
	}
	if metrics.SyncPushConflict != 1 {
		t.Errorf("SyncPushConflict = %d, want 1", metrics.SyncPushConflict)
	}
	if metrics.SyncPushDurationMs < 0 {
		t.Error("expected SyncPushDurationMs >= 0")
	}
}

func TestHandler_RecordsSyncPullSuccess(t *testing.T) {
	taskRepo := TaskRepoFromTasksRepo(tasks.NewInMemoryRepo())
	svc := &Service{
		TaskRepo:      taskRepo,
		CursorRepo:    NewInMemoryCursorRepo(),
		ChangeLogRepo: NewInMemoryChangeLogRepo(),
	}
	metrics := &observability.MemMetrics{}
	h := &Handler{Service: svc, Metrics: metrics}
	userID := "user-1"

	mux := http.NewServeMux()
	mux.HandleFunc("GET /sync/pull", h.Pull)
	req := httptest.NewRequest(http.MethodGet, "http://test/sync/pull?cursor=0&limit=10", nil)
	req = req.WithContext(contextWithUserID(req.Context(), userID))
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("pull: %d %s", w.Code, w.Body.String())
	}
	if metrics.SyncPullSuccess != 1 {
		t.Errorf("SyncPullSuccess = %d, want 1", metrics.SyncPullSuccess)
	}
	if metrics.SyncPullDurationMs < 0 {
		t.Error("expected SyncPullDurationMs >= 0")
	}
}

func TestRetryBudget_RecordsDeadLetterAfterBudgetExceeded(t *testing.T) {
	taskRepo := tasks.NewInMemoryRepo()
	taskRepoAdapter := TaskRepoFromTasksRepo(taskRepo)
	cursorRepo := NewInMemoryCursorRepo()
	changeLogRepo := NewInMemoryChangeLogRepo()
	metrics := &observability.MemMetrics{}
	tracker := NewMemFailureTracker(3)
	svc := &Service{
		TaskRepo:       taskRepoAdapter,
		CursorRepo:     cursorRepo,
		ChangeLogRepo:  changeLogRepo,
		Metrics:        metrics,
		FailureTracker: tracker,
	}
	userID := "user-1"
	ctx := contextWithUserID(context.Background(), userID)

	// Create task at version 1
	_, _ = taskRepo.CreateWithID(ctx, userID, "t1", "Original", "pending", nil)

	// Push update with stale base_version (server has version 1) three times (conflict each time)
	req := PushRequest{Operations: []Operation{
		{OpID: "op-same", EntityID: "t1", Operation: "update", BaseVersion: 99, Payload: map[string]interface{}{"title": "Bad", "status": "done"}},
	}}
	for i := 0; i < 3; i++ {
		resp, err := svc.Push(ctx, userID, req)
		if err != nil {
			t.Fatalf("push %d: %v", i, err)
		}
		if len(resp.Conflicts) != 1 {
			t.Fatalf("push %d: expected 1 conflict, got %d", i, len(resp.Conflicts))
		}
	}
	if metrics.SyncDeadLetter != 1 {
		t.Errorf("SyncDeadLetter = %d, want 1 (after 3 conflicts for same op)", metrics.SyncDeadLetter)
	}
}
