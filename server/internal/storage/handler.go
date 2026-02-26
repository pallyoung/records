package storage

import (
	"encoding/json"
	"net/http"

	"records/server/internal/auth"
)

// Handler exposes file upload/download HTTP endpoints. Requires auth middleware.
type Handler struct {
	Service *Service
}

// PresignUpload handles POST /files/presign-upload.
func (h *Handler) PresignUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}
	var req PresignUploadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	resp, err := h.Service.PresignUpload(r.Context(), userID, req)
	if err != nil {
		if err == ErrInvalidSize {
			respondJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid size"})
			return
		}
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}
	respondJSON(w, http.StatusOK, resp)
}

// Complete handles POST /files/complete.
func (h *Handler) Complete(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}
	var req CompleteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	f, err := h.Service.Complete(r.Context(), userID, req)
	if err != nil {
		if err == ErrInvalidComplete {
			respondJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request"})
			return
		}
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}
	respondJSON(w, http.StatusCreated, f)
}

// DownloadURL handles GET /files/{id}/download-url.
func (h *Handler) DownloadURL(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	id := r.PathValue("id")
	if id == "" {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "missing file id"})
		return
	}
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}
	resp, err := h.Service.DownloadURL(r.Context(), id, userID)
	if err != nil {
		if err == ErrFileNotFound {
			respondJSON(w, http.StatusNotFound, map[string]string{"error": "file not found"})
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
