package sync

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"records/server/internal/tasks"
)

func TestSyncPullReturnsChangesAfterCursor(t *testing.T) {
	taskRepo := TaskRepoFromTasksRepo(tasks.NewInMemoryRepo())
	cursorRepo := NewInMemoryCursorRepo()
	changeLogRepo := NewInMemoryChangeLogRepo()
	svc := &Service{
		TaskRepo:      taskRepo,
		CursorRepo:    cursorRepo,
		ChangeLogRepo: changeLogRepo,
	}
	h := &Handler{Service: svc}
	userID := "user-1"

	// Push a create
	pushBody := `{"operations":[{"op_id":"op1","entity_id":"t1","operation":"create","base_version":0,"payload":{"title":"Task","status":"pending"}}]}`
	pushReq := httptest.NewRequest(http.MethodPost, "/sync/push", bytes.NewReader([]byte(pushBody)))
	pushReq = pushReq.WithContext(contextWithUserID(pushReq.Context(), userID))
	pushReq.Header.Set("Content-Type", "application/json")
	pushW := httptest.NewRecorder()
	h.Push(pushW, pushReq)
	if pushW.Code != http.StatusOK {
		t.Fatalf("push: %d %s", pushW.Code, pushW.Body.String())
	}
	var pushResp PushResponse
	_ = json.Unmarshal(pushW.Body.Bytes(), &pushResp)

	// Pull from cursor "0" should return the change
	mux := http.NewServeMux()
	mux.HandleFunc("GET /sync/pull", h.Pull)
	pullReq := httptest.NewRequest(http.MethodGet, "http://test/sync/pull?cursor=0&limit=10", nil)
	pullReq = pullReq.WithContext(contextWithUserID(pullReq.Context(), userID))
	pullW := httptest.NewRecorder()
	mux.ServeHTTP(pullW, pullReq)
	if pullW.Code != http.StatusOK {
		t.Fatalf("pull: %d %s", pullW.Code, pullW.Body.String())
	}
	var pullResp PullResponse
	if err := json.Unmarshal(pullW.Body.Bytes(), &pullResp); err != nil {
		t.Fatalf("decode pull: %v", err)
	}
	if len(pullResp.Changes) != 1 {
		t.Fatalf("expected 1 change, got %d", len(pullResp.Changes))
	}
	if pullResp.Changes[0].EntityID != "t1" || pullResp.Changes[0].Operation != "create" {
		t.Fatalf("change: %+v", pullResp.Changes[0])
	}
	if pullResp.Changes[0].Snapshot == nil || pullResp.Changes[0].Snapshot.Title != "Task" {
		t.Fatalf("snapshot: %+v", pullResp.Changes[0].Snapshot)
	}
}

func TestStaleBaseVersionReturnsConflictWithLatest(t *testing.T) {
	taskRepo := tasks.NewInMemoryRepo()
	taskRepoAdapter := TaskRepoFromTasksRepo(taskRepo)
	cursorRepo := NewInMemoryCursorRepo()
	changeLogRepo := NewInMemoryChangeLogRepo()
	svc := &Service{
		TaskRepo:      taskRepoAdapter,
		CursorRepo:    cursorRepo,
		ChangeLogRepo: changeLogRepo,
	}
	h := &Handler{Service: svc}
	userID := "user-1"
	ctx := context.Background()

	// Create task via repo (version 1)
	task, _ := taskRepo.CreateWithID(ctx, userID, "t1", "Original", "pending", nil)

	// Push update with base_version=1 (ok)
	push1 := `{"operations":[{"op_id":"op2","entity_id":"t1","operation":"update","base_version":1,"payload":{"title":"Updated"}}]}`
	req1 := httptest.NewRequest(http.MethodPost, "/sync/push", bytes.NewReader([]byte(push1)))
	req1 = req1.WithContext(contextWithUserID(req1.Context(), userID))
	req1.Header.Set("Content-Type", "application/json")
	w1 := httptest.NewRecorder()
	h.Push(w1, req1)
	if w1.Code != http.StatusOK {
		t.Fatalf("first push: %d %s", w1.Code, w1.Body.String())
	}

	// Push again with stale base_version=1 (server is now version 2) -> conflict with latest
	push2 := `{"operations":[{"op_id":"op3","entity_id":"t1","operation":"update","base_version":1,"payload":{"title":"Stale"}}]}`
	req2 := httptest.NewRequest(http.MethodPost, "/sync/push", bytes.NewReader([]byte(push2)))
	req2 = req2.WithContext(contextWithUserID(req2.Context(), userID))
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	h.Push(w2, req2)
	if w2.Code != http.StatusOK {
		t.Fatalf("second push: %d %s", w2.Code, w2.Body.String())
	}
	var resp2 PushResponse
	_ = json.Unmarshal(w2.Body.Bytes(), &resp2)
	if len(resp2.Conflicts) != 1 {
		t.Fatalf("expected 1 conflict, got %d", len(resp2.Conflicts))
	}
	conf, _ := resp2.Conflicts[0].(map[string]interface{})
	if conf["error"] != "version mismatch" {
		t.Fatalf("conflict error: %v", conf["error"])
	}
	latest, ok := conf["latest"].(map[string]interface{})
	if !ok {
		t.Fatalf("conflict latest: %v", conf["latest"])
	}
	if latest["Title"] != "Updated" {
		t.Fatalf("conflict latest title: %v", latest["Title"])
	}
	_ = task
}

func TestTwoDevicesConvergeAfterPushPull(t *testing.T) {
	taskRepo := TaskRepoFromTasksRepo(tasks.NewInMemoryRepo())
	cursorRepo := NewInMemoryCursorRepo()
	changeLogRepo := NewInMemoryChangeLogRepo()
	svc := &Service{
		TaskRepo:      taskRepo,
		CursorRepo:    cursorRepo,
		ChangeLogRepo: changeLogRepo,
	}
	h := &Handler{Service: svc}
	userID := "u"

	mux := http.NewServeMux()
	mux.HandleFunc("POST /sync/push", h.Push)
	mux.HandleFunc("GET /sync/pull", h.Pull)
	ctx := contextWithUserID(context.Background(), userID)

	// Device A: push create
	pushA := `{"operations":[{"op_id":"a1","entity_id":"task1","operation":"create","base_version":0,"payload":{"title":"From A","status":"pending"}}]}`
	reqA := httptest.NewRequest(http.MethodPost, "/sync/push", bytes.NewReader([]byte(pushA)))
	reqA = reqA.WithContext(ctx)
	reqA.Header.Set("Content-Type", "application/json")
	wA := httptest.NewRecorder()
	mux.ServeHTTP(wA, reqA)
	if wA.Code != http.StatusOK {
		t.Fatalf("A push: %d %s", wA.Code, wA.Body.String())
	}
	var respA PushResponse
	_ = json.Unmarshal(wA.Body.Bytes(), &respA)

	// Device B: pull (gets A's change)
	pullB := httptest.NewRequest(http.MethodGet, "http://test/sync/pull?cursor=0&limit=10", nil)
	pullB = pullB.WithContext(ctx)
	wB := httptest.NewRecorder()
	mux.ServeHTTP(wB, pullB)
	if wB.Code != http.StatusOK {
		t.Fatalf("B pull: %d %s", wB.Code, wB.Body.String())
	}
	var pullRespB PullResponse
	_ = json.Unmarshal(wB.Body.Bytes(), &pullRespB)
	if len(pullRespB.Changes) != 1 || pullRespB.Changes[0].Snapshot.Title != "From A" {
		t.Fatalf("B pull changes: %+v", pullRespB.Changes)
	}

	// Device B: push update
	pushB := `{"operations":[{"op_id":"b1","entity_id":"task1","operation":"update","base_version":1,"payload":{"title":"From B"}}]}`
	reqB := httptest.NewRequest(http.MethodPost, "/sync/push", bytes.NewReader([]byte(pushB)))
	reqB = reqB.WithContext(ctx)
	reqB.Header.Set("Content-Type", "application/json")
	wB2 := httptest.NewRecorder()
	mux.ServeHTTP(wB2, reqB)
	if wB2.Code != http.StatusOK {
		t.Fatalf("B push: %d %s", wB2.Code, wB2.Body.String())
	}

	// Device A: pull (gets B's update)
	pullA := httptest.NewRequest(http.MethodGet, "http://test/sync/pull?cursor="+respA.NewCursor+"&limit=10", nil)
	pullA = pullA.WithContext(ctx)
	wA2 := httptest.NewRecorder()
	mux.ServeHTTP(wA2, pullA)
	if wA2.Code != http.StatusOK {
		t.Fatalf("A pull: %d %s", wA2.Code, wA2.Body.String())
	}
	var pullRespA PullResponse
	_ = json.Unmarshal(wA2.Body.Bytes(), &pullRespA)
	if len(pullRespA.Changes) != 1 || pullRespA.Changes[0].Operation != "update" {
		t.Fatalf("A pull changes: %+v", pullRespA.Changes)
	}
	if pullRespA.Changes[0].Snapshot == nil || pullRespA.Changes[0].Snapshot.Title != "From B" {
		t.Fatalf("A pull snapshot: %+v", pullRespA.Changes[0].Snapshot)
	}
}
