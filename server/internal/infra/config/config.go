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
	CORSOrigins   string
	RateLimitAuth int

	// OSS (Aliyun): all set to enable real presign; else mock
	OSSEndpoint        string
	OSSAccessKeyID     string
	OSSAccessKeySecret string
	OSSBucket          string

	// AI (OpenAI-compatible): all set to enable real provider; else mock
	AIApiURL        string
	AIApiKey        string
	AIDefaultModel  string
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
		Port:               port,
		JWTSecret:          jwtSecret,
		DatabaseURL:        databaseURL,
		RedisURL:           redisURL,
		CORSOrigins:        corsOrigins,
		RateLimitAuth:      rateLimitAuth,
		OSSEndpoint:        os.Getenv("OSS_ENDPOINT"),
		OSSAccessKeyID:     os.Getenv("OSS_ACCESS_KEY_ID"),
		OSSAccessKeySecret: os.Getenv("OSS_ACCESS_KEY_SECRET"),
		OSSBucket:          os.Getenv("OSS_BUCKET"),
		AIApiURL:           os.Getenv("AI_API_URL"),
		AIApiKey:           os.Getenv("AI_API_KEY"),
		AIDefaultModel:     os.Getenv("AI_DEFAULT_MODEL"),
	}
}
