package config

import "os"

type Config struct {
	Port         string
	JWTSecret    string
	DatabaseURL  string
	RedisURL     string
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

	return Config{
		Port:        port,
		JWTSecret:   jwtSecret,
		DatabaseURL: databaseURL,
		RedisURL:    redisURL,
	}
}
