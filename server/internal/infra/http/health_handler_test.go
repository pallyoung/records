package http

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHealthEndpointReturnsOK(t *testing.T) {
	router := NewRouter(RouterDeps{})

	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, resp.Code)
	}

	var payload map[string]string
	if err := json.Unmarshal(resp.Body.Bytes(), &payload); err != nil {
		t.Fatalf("failed to parse response JSON: %v", err)
	}

	if payload["status"] != "ok" {
		t.Fatalf("expected status payload 'ok', got %q", payload["status"])
	}
}
