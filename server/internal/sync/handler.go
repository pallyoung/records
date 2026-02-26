package sync

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"records/server/internal/auth"
	"records/server/internal/observability"
)

// Handler exposes sync HTTP endpoints. Requires auth middleware.
type Handler struct {
	Service *Service
	Metrics observability.SyncMetrics
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
	start := time.Now()
	resp, err := h.Service.Push(r.Context(), userID, req)
	if h.Metrics != nil {
		h.Metrics.RecordSyncPushDuration(time.Since(start))
	}
	if err != nil {
		if h.Metrics != nil {
			h.Metrics.RecordSyncPushFailure()
		}
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}
	if h.Metrics != nil {
		if len(resp.Conflicts) > 0 {
			h.Metrics.RecordSyncPushConflict(len(resp.Conflicts))
		} else {
			h.Metrics.RecordSyncPushSuccess()
		}
	}
	respondJSON(w, http.StatusOK, resp)
}

// Pull handles GET /sync/pull?cursor=...&limit=...
func (h *Handler) Pull(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}
	cursor := r.URL.Query().Get("cursor")
	limit := 0
	if l := r.URL.Query().Get("limit"); l != "" {
		if n, err := parseInt(l); err == nil && n > 0 {
			limit = n
		}
	}
	start := time.Now()
	resp, err := h.Service.Pull(r.Context(), userID, cursor, limit)
	if h.Metrics != nil {
		h.Metrics.RecordSyncPullDuration(time.Since(start))
	}
	if err != nil {
		if h.Metrics != nil {
			h.Metrics.RecordSyncPullFailure()
		}
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}
	if h.Metrics != nil {
		h.Metrics.RecordSyncPullSuccess()
	}
	respondJSON(w, http.StatusOK, resp)
}

func parseInt(s string) (int, error) {
	return strconv.Atoi(s)
}

func respondJSON(w http.ResponseWriter, status int, body interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
