package http

import (
	"net/http"

	"records/server/internal/ai"
	"records/server/internal/auth"
	"records/server/internal/storage"
	"records/server/internal/sync"
	"records/server/internal/tasks"
)

// RouterDeps holds optional handlers and config for the API router.
type RouterDeps struct {
	AuthHandler    *auth.Handler
	TasksHandler   *tasks.Handler
	SyncHandler    *sync.Handler
	StorageHandler *storage.Handler
	AIHandler      *ai.Handler
	JWTSecret      string
}

// NewRouter returns the API router.
func NewRouter(deps RouterDeps) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", HealthHandler)

	if deps.AuthHandler != nil {
		mux.HandleFunc("POST /auth/register", deps.AuthHandler.Register)
		mux.HandleFunc("POST /auth/login", deps.AuthHandler.Login)
		mux.HandleFunc("POST /auth/refresh", deps.AuthHandler.Refresh)
		mux.HandleFunc("POST /auth/logout", deps.AuthHandler.Logout)
	}

	if deps.TasksHandler != nil && deps.JWTSecret != "" {
		wrap := auth.RequireAuth(deps.JWTSecret)
		mux.Handle("GET /tasks", wrap(http.HandlerFunc(deps.TasksHandler.List)))
		mux.Handle("POST /tasks", wrap(http.HandlerFunc(deps.TasksHandler.Create)))
		mux.Handle("GET /tasks/{id}", wrap(http.HandlerFunc(deps.TasksHandler.Get)))
		mux.Handle("PATCH /tasks/{id}", wrap(http.HandlerFunc(deps.TasksHandler.Update)))
		mux.Handle("PUT /tasks/{id}", wrap(http.HandlerFunc(deps.TasksHandler.Update)))
		mux.Handle("DELETE /tasks/{id}", wrap(http.HandlerFunc(deps.TasksHandler.Delete)))
	}

	if deps.SyncHandler != nil && deps.JWTSecret != "" {
		wrap := auth.RequireAuth(deps.JWTSecret)
		mux.Handle("POST /sync/push", wrap(http.HandlerFunc(deps.SyncHandler.Push)))
		mux.Handle("GET /sync/pull", wrap(http.HandlerFunc(deps.SyncHandler.Pull)))
	}

	if deps.StorageHandler != nil && deps.JWTSecret != "" {
		wrap := auth.RequireAuth(deps.JWTSecret)
		mux.Handle("POST /files/presign-upload", wrap(http.HandlerFunc(deps.StorageHandler.PresignUpload)))
		mux.Handle("POST /files/complete", wrap(http.HandlerFunc(deps.StorageHandler.Complete)))
		mux.Handle("GET /files/{id}/download-url", wrap(http.HandlerFunc(deps.StorageHandler.DownloadURL)))
	}

	if deps.AIHandler != nil && deps.JWTSecret != "" {
		wrap := auth.RequireAuth(deps.JWTSecret)
		mux.Handle("POST /ai/chat", wrap(http.HandlerFunc(deps.AIHandler.Chat)))
	}

	return mux
}
