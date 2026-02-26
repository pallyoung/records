package config

import "os"

type Config struct {
	Port      string
	JWTSecret string
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

	return Config{
		Port:      port,
		JWTSecret: jwtSecret,
	}
}
