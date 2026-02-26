package tasks

import (
	"encoding/json"
	"net/http"

	"records/server/internal/auth"
)

// Handler exposes task HTTP endpoints. Requires auth middleware.
type Handler struct {
	Service *Service
}

// List handles GET /tasks.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}
	list, err := h.Service.List(r.Context(), userID)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}
	if list == nil {
		list = []*Task{}
	}
	respondJSON(w, http.StatusOK, list)
}

// Create handles POST /tasks.
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}
	var req CreateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	task, err := h.Service.Create(r.Context(), userID, req)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}
	respondJSON(w, http.StatusCreated, task)
}

// Get handles GET /tasks/:id.
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	id := r.PathValue("id")
	if id == "" {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "missing task id"})
		return
	}
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}
	task, err := h.Service.Get(r.Context(), id, userID)
	if err != nil {
		if err == ErrTaskNotFound {
			respondJSON(w, http.StatusNotFound, map[string]string{"error": "task not found"})
			return
		}
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}
	respondJSON(w, http.StatusOK, task)
}

// Update handles PATCH /tasks/:id.
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch && r.Method != http.MethodPut {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	id := r.PathValue("id")
	if id == "" {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "missing task id"})
		return
	}
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}
	var req UpdateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	task, err := h.Service.Update(r.Context(), id, userID, req)
	if err != nil {
		if err == ErrTaskNotFound {
			respondJSON(w, http.StatusNotFound, map[string]string{"error": "task not found"})
			return
		}
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}
	respondJSON(w, http.StatusOK, task)
}

// Delete handles DELETE /tasks/:id.
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	id := r.PathValue("id")
	if id == "" {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "missing task id"})
		return
	}
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}
	if err := h.Service.Delete(r.Context(), id, userID); err != nil {
		if err == ErrTaskNotFound {
			respondJSON(w, http.StatusNotFound, map[string]string{"error": "task not found"})
			return
		}
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func respondJSON(w http.ResponseWriter, status int, body interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
