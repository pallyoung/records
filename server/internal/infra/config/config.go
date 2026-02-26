package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port          string
	JWTSecret     string
	DatabaseURL   string
	RedisURL      string
	CORSOrigins   string // comma-separated; empty = no CORS, "*" = allow all
	RateLimitAuth int    // max requests per minute per IP to auth endpoints; 0 = disabled
}

func Load() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "dev-secret-change-in-production"
	}
	databaseURL := os.Getenv("DATABASE_URL")
	redisURL := os.Getenv("REDIS_URL")
	corsOrigins := os.Getenv("CORS_ORIGINS")
	rateLimitAuth, _ := strconv.Atoi(os.Getenv("RATE_LIMIT_AUTH"))

	return Config{
		Port:          port,
		JWTSecret:     jwtSecret,
		DatabaseURL:   databaseURL,
		RedisURL:      redisURL,
		CORSOrigins:   corsOrigins,
		RateLimitAuth: rateLimitAuth,
	}
}
