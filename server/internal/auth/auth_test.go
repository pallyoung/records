package auth

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestRegisterCreatesUserAndReturnsTokens(t *testing.T) {
	svc := &AuthService{
		Users:      NewInMemoryUserRepo(),
		Tokens:     NewInMemoryRefreshRepo(),
		JWTSecret:  "test-secret",
	}
	h := &Handler{Service: svc}

	body := `{"email":"u@example.com","password":"pass123"}`
	req := httptest.NewRequest(http.MethodPost, "/auth/register", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	h.Register(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected status 201, got %d: %s", w.Code, w.Body.String())
	}
	var resp AuthTokenResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.AccessToken == "" || resp.RefreshToken == "" {
		t.Fatalf("expected non-empty tokens, got access=%q refresh=%q", resp.AccessToken, resp.RefreshToken)
	}
}

func TestLoginReturnsTokens(t *testing.T) {
	userRepo := NewInMemoryUserRepo()
	hash, _ := HashPassword("pass123")
	_, _ = userRepo.Create(context.Background(), "u@example.com", hash)

	svc := &AuthService{
		Users:     userRepo,
		Tokens:    NewInMemoryRefreshRepo(),
		JWTSecret: "test-secret",
	}
	h := &Handler{Service: svc}

	body := `{"email":"u@example.com","password":"pass123"}`
	req := httptest.NewRequest(http.MethodPost, "/auth/login", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	h.Login(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", w.Code, w.Body.String())
	}
	var resp AuthTokenResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.AccessToken == "" || resp.RefreshToken == "" {
		t.Fatalf("expected non-empty tokens, got access=%q refresh=%q", resp.AccessToken, resp.RefreshToken)
	}
}

func TestRefreshRotatesToken(t *testing.T) {
	userRepo := NewInMemoryUserRepo()
	hash, _ := HashPassword("pass123")
	_, _ = userRepo.Create(context.Background(), "u@example.com", hash)

	tokenRepo := NewInMemoryRefreshRepo()
	svc := &AuthService{
		Users:     userRepo,
		Tokens:    tokenRepo,
		JWTSecret: "test-secret",
	}
	resp, err := svc.Login(context.Background(), LoginRequest{Email: "u@example.com", Password: "pass123"})
	if err != nil {
		t.Fatalf("login: %v", err)
	}
	oldRefresh := resp.RefreshToken

	// Refresh
	h := &Handler{Service: svc}
	body := `{"refresh_token":"` + oldRefresh + `"}`
	req := httptest.NewRequest(http.MethodPost, "/auth/refresh", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Refresh(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", w.Code, w.Body.String())
	}
	var newResp AuthTokenResponse
	if err := json.Unmarshal(w.Body.Bytes(), &newResp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if newResp.RefreshToken == oldRefresh {
		t.Error("expected new refresh token (rotation)")
	}
}

func TestLogoutRevokesRefreshToken(t *testing.T) {
	userRepo := NewInMemoryUserRepo()
	hash, _ := HashPassword("pass123")
	_, _ = userRepo.Create(context.Background(), "u@example.com", hash)

	tokenRepo := NewInMemoryRefreshRepo()
	svc := &AuthService{
		Users:     userRepo,
		Tokens:    tokenRepo,
		JWTSecret: "test-secret",
	}
	resp, err := svc.Login(context.Background(), LoginRequest{Email: "u@example.com", Password: "pass123"})
	if err != nil {
		t.Fatalf("login: %v", err)
	}

	err = svc.Logout(context.Background(), resp.RefreshToken)
	if err != nil {
		t.Fatalf("logout: %v", err)
	}

	// Using same refresh token should fail
	_, err = svc.Refresh(context.Background(), RefreshRequest{RefreshToken: resp.RefreshToken})
	if err != ErrRefreshTokenInvalid {
		t.Fatalf("expected ErrRefreshTokenInvalid after logout, got %v", err)
	}
}
