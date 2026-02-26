package main

import (
	"log"
	"net/http"

	"records/server/internal/auth"
	"records/server/internal/infra/config"
	serverhttp "records/server/internal/infra/http"
)

func main() {
	cfg := config.Load()

	authSvc := &auth.AuthService{
		Users:      auth.NewInMemoryUserRepo(),
		Tokens:     auth.NewInMemoryRefreshRepo(),
		JWTSecret:  cfg.JWTSecret,
	}
	authHandler := &auth.Handler{Service: authSvc}

	router := serverhttp.NewRouter(authHandler)

	addr := ":" + cfg.Port
	log.Printf("api listening on %s", addr)
	if err := http.ListenAndServe(addr, router); err != nil {
		log.Fatalf("api server exited: %v", err)
	}
}
