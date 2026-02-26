package auth

import (
	"context"
	"net/http"
	"strings"
)

type contextKey string

const UserIDContextKey contextKey = "user_id"

// RequireAuth returns a middleware that parses Bearer token and sets user ID in context.
// If token is missing or invalid, it responds 401 and does not call next.
func RequireAuth(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			auth := r.Header.Get("Authorization")
			if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
				http.Error(w, `{"error":"missing or invalid authorization"}`, http.StatusUnauthorized)
				return
			}
			token := strings.TrimPrefix(auth, "Bearer ")
			userID, err := ParseAccessToken(token, jwtSecret)
			if err != nil {
				http.Error(w, `{"error":"invalid or expired token"}`, http.StatusUnauthorized)
				return
			}
			ctx := context.WithValue(r.Context(), UserIDContextKey, userID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// UserIDFromContext returns the user ID set by RequireAuth, or "" if not set.
func UserIDFromContext(ctx context.Context) string {
	v, _ := ctx.Value(UserIDContextKey).(string)
	return v
}
