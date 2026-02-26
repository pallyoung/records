package storage

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"path"
	"strings"
	"time"
)

const (
	defaultBucket     = "attachments"
	uploadExpiry      = 15 * time.Minute
	downloadExpiry    = 60 * time.Second
	maxPresignSize    = 100 << 20 // 100 MiB
)

// Service handles presign upload, complete, and signed download.
type Service struct {
	Presigner Presigner
	Repo      FileRepository
	Bucket    string
}

// PresignUploadRequest is the body for POST /files/presign-upload.
type PresignUploadRequest struct {
	Filename string `json:"filename"`
	MimeType string `json:"mime_type"`
	Size     int64  `json:"size"`
}

// PresignUploadResponse is the response with URL and headers for client upload.
type PresignUploadResponse struct {
	URL       string            `json:"url"`
	Method   string            `json:"method"`
	Headers  map[string]string `json:"headers"`
	ObjectKey string           `json:"object_key"`
}

// CompleteRequest is the body for POST /files/complete.
type CompleteRequest struct {
	ObjectKey string `json:"object_key"`
	Size      int64  `json:"size"`
	MimeType  string `json:"mime_type"`
	SHA256    string `json:"sha256,omitempty"`
}

// DownloadURLResponse is the response for GET /files/{id}/download-url.
type DownloadURLResponse struct {
	URL               string `json:"url"`
	ExpiresInSeconds  int    `json:"expires_in_seconds"`
}

// PresignUpload generates object key and signed upload URL for the user.
func (s *Service) PresignUpload(ctx context.Context, userID string, req PresignUploadRequest) (*PresignUploadResponse, error) {
	if req.Size <= 0 || req.Size > maxPresignSize {
		return nil, ErrInvalidSize
	}
	bucket := s.Bucket
	if bucket == "" {
		bucket = defaultBucket
	}
	objectKey := objectKeyForUser(userID, req.Filename)
	url, method, headers, err := s.Presigner.PresignUpload(bucket, objectKey, req.MimeType, uploadExpiry)
	if err != nil {
		return nil, err
	}
	return &PresignUploadResponse{
		URL:       url,
		Method:   method,
		Headers:  headers,
		ObjectKey: objectKey,
	}, nil
}

// Complete persists file metadata after client uploads to OSS.
func (s *Service) Complete(ctx context.Context, userID string, req CompleteRequest) (*FileMetadata, error) {
	if req.ObjectKey == "" || req.Size <= 0 {
		return nil, ErrInvalidComplete
	}
	bucket := s.Bucket
	if bucket == "" {
		bucket = defaultBucket
	}
	f := &FileMetadata{
		OwnerID:   userID,
		Bucket:    bucket,
		ObjectKey: req.ObjectKey,
		MimeType:  req.MimeType,
		Size:      req.Size,
		SHA256:    req.SHA256,
	}
	if err := s.Repo.Create(ctx, f); err != nil {
		return nil, err
	}
	return f, nil
}

// DownloadURL returns a signed download URL if the file belongs to the user.
func (s *Service) DownloadURL(ctx context.Context, fileID, userID string) (*DownloadURLResponse, error) {
	f, err := s.Repo.GetByID(ctx, fileID)
	if err != nil {
		return nil, err
	}
	if f.OwnerID != userID {
		return nil, ErrFileNotFound
	}
	url, err := s.Presigner.PresignDownload(f.Bucket, f.ObjectKey, downloadExpiry)
	if err != nil {
		return nil, err
	}
	return &DownloadURLResponse{
		URL:              url,
		ExpiresInSeconds: int(downloadExpiry.Seconds()),
	}, nil
}

func objectKeyForUser(userID, filename string) string {
	ext := path.Ext(filename)
	if ext == "" {
		ext = ".bin"
	}
	u := make([]byte, 16)
	_, _ = rand.Read(u)
	return userID + "/" + hex.EncodeToString(u) + strings.ToLower(ext)
}
