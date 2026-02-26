package storage

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"records/server/internal/auth"
)

func TestPresignUploadReturnsSignedPayload(t *testing.T) {
	mock := &MockPresigner{UploadURL: "https://upload.example/signed"}
	svc := &Service{Presigner: mock, Repo: NewInMemoryFileRepo(), Bucket: "test"}
	h := &Handler{Service: svc}
	userID := "user-1"

	body := `{"filename":"pic.png","mime_type":"image/png","size":1024}`
	req := httptest.NewRequest(http.MethodPost, "/files/presign-upload", bytes.NewReader([]byte(body)))
	req = req.WithContext(contextWithUserID(req.Context(), userID))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.PresignUpload(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("presign status %d: %s", w.Code, w.Body.String())
	}
	var resp PresignUploadResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.URL != "https://upload.example/signed" || resp.Method != "PUT" || resp.ObjectKey == "" {
		t.Fatalf("unexpected response: %+v", resp)
	}
	if resp.Headers["Content-Type"] != "image/png" {
		t.Fatalf("headers: %+v", resp.Headers)
	}
}

func TestCompletePersistsMetadataOwnedByUser(t *testing.T) {
	repo := NewInMemoryFileRepo()
	svc := &Service{Presigner: &MockPresigner{}, Repo: repo}
	h := &Handler{Service: svc}
	userID := "user-2"

	// First get an object_key from presign (we don't need to actually upload to OSS)
	presignBody := `{"filename":"x.pdf","mime_type":"application/pdf","size":100}`
	presignReq := httptest.NewRequest(http.MethodPost, "/files/presign-upload", bytes.NewReader([]byte(presignBody)))
	presignReq = presignReq.WithContext(contextWithUserID(presignReq.Context(), userID))
	presignReq.Header.Set("Content-Type", "application/json")
	presignW := httptest.NewRecorder()
	h.PresignUpload(presignW, presignReq)
	var presignResp PresignUploadResponse
	_ = json.Unmarshal(presignW.Body.Bytes(), &presignResp)
	objectKey := presignResp.ObjectKey

	completeBody := `{"object_key":"` + objectKey + `","size":100,"mime_type":"application/pdf"}`
	req := httptest.NewRequest(http.MethodPost, "/files/complete", bytes.NewReader([]byte(completeBody)))
	req = req.WithContext(contextWithUserID(req.Context(), userID))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Complete(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("complete status %d: %s", w.Code, w.Body.String())
	}
	var meta FileMetadata
	if err := json.Unmarshal(w.Body.Bytes(), &meta); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if meta.OwnerID != userID || meta.ObjectKey != objectKey || meta.Size != 100 {
		t.Fatalf("metadata: %+v", meta)
	}

	// Verify in repo
	got, _ := repo.GetByID(context.Background(), meta.ID)
	if got == nil || got.OwnerID != userID {
		t.Fatalf("repo get: %+v", got)
	}
}

func TestDownloadURLDeniesNonOwnerAndSignsForOwner(t *testing.T) {
	repo := NewInMemoryFileRepo()
	mock := &MockPresigner{DownloadURL: "https://download.example/signed"}
	svc := &Service{Presigner: mock, Repo: repo}
	h := &Handler{Service: svc}
	ownerID := "owner-1"
	otherID := "other-2"

	// Create a file owned by owner-1
	f := &FileMetadata{OwnerID: ownerID, Bucket: "b", ObjectKey: "k", MimeType: "image/png", Size: 10}
	_ = repo.Create(context.Background(), f)

	// Use a mux so PathValue("id") is set when matching "GET /files/{id}/download-url"
	mux := http.NewServeMux()
	mux.HandleFunc("GET /files/{id}/download-url", h.DownloadURL)

	// Other user requests download -> 404 (don't leak existence)
	reqOther := httptest.NewRequest(http.MethodGet, "http://test/files/"+f.ID+"/download-url", nil)
	reqOther = reqOther.WithContext(contextWithUserID(reqOther.Context(), otherID))
	wOther := httptest.NewRecorder()
	mux.ServeHTTP(wOther, reqOther)
	if wOther.Code != http.StatusNotFound {
		t.Fatalf("non-owner expected 404, got %d: %s", wOther.Code, wOther.Body.String())
	}

	// Owner requests download -> 200 with url
	reqOwner := httptest.NewRequest(http.MethodGet, "http://test/files/"+f.ID+"/download-url", nil)
	reqOwner = reqOwner.WithContext(contextWithUserID(reqOwner.Context(), ownerID))
	wOwner := httptest.NewRecorder()
	mux.ServeHTTP(wOwner, reqOwner)
	if wOwner.Code != http.StatusOK {
		t.Fatalf("owner expected 200, got %d: %s", wOwner.Code, wOwner.Body.String())
	}
	var resp DownloadURLResponse
	if err := json.Unmarshal(wOwner.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.URL != "https://download.example/signed" || resp.ExpiresInSeconds <= 0 {
		t.Fatalf("download response: %+v", resp)
	}
}

func contextWithUserID(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, auth.UserIDContextKey, userID)
}
