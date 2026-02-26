package sync

import (
	"encoding/json"
	"net/http"

	"records/server/internal/auth"
)

// Handler exposes sync HTTP endpoints. Requires auth middleware.
type Handler struct {
	Service *Service
}

// Push handles POST /sync/push.
func (h *Handler) Push(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}
	var req PushRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	if req.Operations == nil {
		req.Operations = []Operation{}
	}
	resp, err := h.Service.Push(r.Context(), userID, req)
	if err != nil {
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
