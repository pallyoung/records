package ai

import (
	"encoding/json"
	"errors"
	"net/http"

	"records/server/internal/auth"
)

// Handler exposes AI HTTP endpoints. Requires auth middleware.
type Handler struct {
	Service *Service
}

// Chat handles POST /ai/chat.
func (h *Handler) Chat(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}
	var req ChatRequestDTO
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	resp, err := h.Service.Chat(r.Context(), userID, req)
	if err != nil {
		if err == ErrInvalidRequest {
			respondJSON(w, http.StatusBadRequest, map[string]string{"error": "message required"})
			return
		}
		if errors.Is(err, ErrProviderTimeout) {
			respondJSON(w, http.StatusGatewayTimeout, map[string]string{"error": "provider timeout"})
			return
		}
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}
	respondJSON(w, http.StatusOK, resp)
}

func respondJSON(w http.ResponseWriter, status int, body interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
