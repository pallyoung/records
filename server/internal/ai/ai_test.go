package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"records/server/internal/auth"
)

func TestAIChatAcceptsValidRequest(t *testing.T) {
	provider := &MockProvider{Content: "Hello, world!", TokenUsage: 42, Model: "test-model"}
	logRepo := NewInMemoryRequestLogRepo()
	svc := &Service{Provider: provider, LogRepo: logRepo}
	h := &Handler{Service: svc}
	userID := "user-1"

	body := `{"message":"Hi"}`
	req := httptest.NewRequest(http.MethodPost, "/ai/chat", bytes.NewReader([]byte(body)))
	req = req.WithContext(contextWithUserID(req.Context(), userID))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Chat(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var resp ChatResponseDTO
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.Content != "Hello, world!" {
		t.Fatalf("content: %q", resp.Content)
	}
}

func TestAIProviderTimeoutReturnsControlledError(t *testing.T) {
	// Provider that blocks until context is cancelled
	blockingProvider := &blockingProvider{}
	svc := &Service{Provider: blockingProvider, Timeout: 10 * time.Millisecond}
	h := &Handler{Service: svc}
	userID := "user-1"

	body := `{"message":"Hi"}`
	req := httptest.NewRequest(http.MethodPost, "/ai/chat", bytes.NewReader([]byte(body)))
	req = req.WithContext(contextWithUserID(req.Context(), userID))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Chat(w, req)

	if w.Code != http.StatusGatewayTimeout {
		t.Fatalf("expected 504, got %d: %s", w.Code, w.Body.String())
	}
	var errBody map[string]string
	_ = json.Unmarshal(w.Body.Bytes(), &errBody)
	if errBody["error"] != "provider timeout" {
		t.Fatalf("error body: %v", errBody)
	}
}

type blockingProvider struct{}

func (blockingProvider) Chat(ctx context.Context, req ChatRequest) (*ChatResponse, error) {
	<-ctx.Done()
	return nil, ctx.Err()
}

func TestAIRequestLogCapturesFields(t *testing.T) {
	provider := &MockProvider{Content: "ok", TokenUsage: 100, Model: "gpt-4"}
	logRepo := NewInMemoryRequestLogRepo()
	svc := &Service{Provider: provider, LogRepo: logRepo}
	h := &Handler{Service: svc}
	userID := "user-2"

	body := `{"message":"test","provider":"openai","model":"gpt-4"}`
	req := httptest.NewRequest(http.MethodPost, "/ai/chat", bytes.NewReader([]byte(body)))
	req = req.WithContext(contextWithUserID(req.Context(), userID))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Chat(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("chat: %d %s", w.Code, w.Body.String())
	}

	entry, ok := logRepo.Last()
	if !ok {
		t.Fatal("no log entry")
	}
	if entry.UserID != userID || entry.Provider != "openai" || entry.Model != "gpt-4" {
		t.Fatalf("entry user/provider/model: %s %s %s", entry.UserID, entry.Provider, entry.Model)
	}
	if entry.TokenUsage != 100 {
		t.Fatalf("token usage: %d", entry.TokenUsage)
	}
	if entry.LatencyMs < 0 || entry.Status != "ok" {
		t.Fatalf("latency or status: %d %s", entry.LatencyMs, entry.Status)
	}
}

func contextWithUserID(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, auth.UserIDContextKey, userID)
}
