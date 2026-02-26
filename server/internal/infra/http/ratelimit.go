package http

import (
	"net/http"
	"strings"
	"sync"
	"time"
)

// AuthRateLimiter limits requests per IP to auth endpoints (login/register).
// Uses a simple fixed window: max N requests per window per IP.
type AuthRateLimiter struct {
	mu       sync.Mutex
	perIP    map[string]*windowCount
	max      int
	window   time.Duration
	authPath map[string]struct{}
}

type windowCount struct {
	count int
	start time.Time
}

// NewAuthRateLimiter returns a limiter that allows max requests per window per IP
// for paths in authPaths (e.g. "/auth/login", "/auth/register").
// If max is 0, the limiter does nothing.
func NewAuthRateLimiter(maxPerMinute int, authPaths []string) *AuthRateLimiter {
	if maxPerMinute <= 0 {
		return &AuthRateLimiter{max: 0}
	}
	m := make(map[string]struct{})
	for _, p := range authPaths {
		m[p] = struct{}{}
	}
	return &AuthRateLimiter{
		perIP:    make(map[string]*windowCount),
		max:      maxPerMinute,
		window:   time.Minute,
		authPath: m,
	}
}

func (l *AuthRateLimiter) Allow(ip, path string) bool {
	if l.max <= 0 {
		return true
	}
	if _, ok := l.authPath[path]; !ok {
		return true
	}
	l.mu.Lock()
	defer l.mu.Unlock()
	now := time.Now()
	w, ok := l.perIP[ip]
	if !ok || now.Sub(w.start) >= l.window {
		l.perIP[ip] = &windowCount{count: 1, start: now}
		return true
	}
	if w.count >= l.max {
		return false
	}
	w.count++
	return true
}

// Middleware returns a middleware that returns 429 when limit exceeded for auth paths.
func (l *AuthRateLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := r.RemoteAddr
		if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
			if first := strings.TrimSpace(strings.Split(xff, ",")[0]); first != "" {
				ip = first
			}
		}
		if !l.Allow(ip, r.URL.Path) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusTooManyRequests)
			w.Write([]byte(`{"error":"rate limit exceeded"}`))
			return
		}
		next.ServeHTTP(w, r)
	})
}
