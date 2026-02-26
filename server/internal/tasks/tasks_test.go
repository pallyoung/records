package tasks

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"records/server/internal/auth"
)

func TestTaskCRUDIsUserScoped(t *testing.T) {
	repo := NewInMemoryRepo()
	svc := &Service{Repo: repo}
	h := &Handler{Service: svc}

	userID := "user-a"

	// Create
	body := `{"title":"Task 1","status":"pending"}`
	req := httptest.NewRequest(http.MethodPost, "/tasks", bytes.NewReader([]byte(body)))
	req = req.WithContext(contextWithUserID(req.Context(), userID))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("create: status %d, body %s", w.Code, w.Body.String())
	}
	var task Task
	if err := json.Unmarshal(w.Body.Bytes(), &task); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if task.UserID != userID || task.Title != "Task 1" {
		t.Fatalf("unexpected task: %+v", task)
	}

	// List
	req2 := httptest.NewRequest(http.MethodGet, "/tasks", nil)
	req2 = req2.WithContext(contextWithUserID(req2.Context(), userID))
	w2 := httptest.NewRecorder()
	h.List(w2, req2)
	if w2.Code != http.StatusOK {
		t.Fatalf("list: status %d", w2.Code)
	}
	var list []*Task
	if err := json.Unmarshal(w2.Body.Bytes(), &list); err != nil {
		t.Fatalf("decode list: %v", err)
	}
	if len(list) != 1 || list[0].ID != task.ID {
		t.Fatalf("list: %+v", list)
	}
}

func contextWithUserID(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, auth.UserIDContextKey, userID)
}

