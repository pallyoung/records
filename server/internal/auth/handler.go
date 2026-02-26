package auth

import (
	"encoding/json"
	"net/http"
)

// Handler exposes auth HTTP endpoints.
type Handler struct {
	Service *AuthService
}

// Register handles POST /auth/register.
func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	resp, err := h.Service.Register(r.Context(), req)
	if err != nil {
		switch err {
		case ErrEmailExists:
			respondJSON(w, http.StatusConflict, map[string]string{"error": "email already registered"})
			return
		case ErrInvalidCredentials:
			respondJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid email or password"})
			return
		default:
			respondJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
			return
		}
	}
	respondJSON(w, http.StatusCreated, resp)
}

// Login handles POST /auth/login.
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	resp, err := h.Service.Login(r.Context(), req)
	if err != nil {
		if err == ErrInvalidCredentials {
			respondJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid credentials"})
			return
		}
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}
	respondJSON(w, http.StatusOK, resp)
}

// Refresh handles POST /auth/refresh.
func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req RefreshRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	resp, err := h.Service.Refresh(r.Context(), req)
	if err != nil {
		if err == ErrRefreshTokenInvalid {
			respondJSON(w, http.StatusUnauthorized, map[string]string{"error": "refresh token invalid or revoked"})
			return
		}
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}
	respondJSON(w, http.StatusOK, resp)
}

// Logout handles POST /auth/logout.
func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req RefreshRequest
	_ = json.NewDecoder(r.Body).Decode(&req)
	_ = h.Service.Logout(r.Context(), req.RefreshToken)
	w.WriteHeader(http.StatusNoContent)
}

func respondJSON(w http.ResponseWriter, status int, body interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
