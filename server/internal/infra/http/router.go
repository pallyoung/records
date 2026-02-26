package http

import (
	"net/http"

	"records/server/internal/auth"
)

// NewRouter returns the API router. Auth handler may be nil to skip auth routes.
func NewRouter(authHandler *auth.Handler) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", HealthHandler)

	if authHandler != nil {
		mux.HandleFunc("/auth/register", authHandler.Register)
		mux.HandleFunc("/auth/login", authHandler.Login)
		mux.HandleFunc("/auth/refresh", authHandler.Refresh)
		mux.HandleFunc("/auth/logout", authHandler.Logout)
	}

	return mux
}
