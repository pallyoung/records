package main

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"time"

	"records/server/internal/ai"
	"records/server/internal/auth"
	"records/server/internal/infra/config"
	infradb "records/server/internal/infra/db"
	serverhttp "records/server/internal/infra/http"
	"records/server/internal/observability"
	"records/server/internal/storage"
	"records/server/internal/sync"
	"records/server/internal/tasks"
)

func main() {
	cfg := config.Load()

	var db *sql.DB
	if cfg.DatabaseURL != "" {
		conn, err := infradb.Open(cfg.DatabaseURL)
		if err != nil {
			log.Fatalf("database open: %v", err)
		}
		defer conn.Close()
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		if err := infradb.Ping(ctx, conn); err != nil {
			cancel()
			log.Fatalf("database ping: %v", err)
		}
		cancel()
		db = conn
		log.Print("database connected")
	}

	var userRepo auth.UserRepository
	var tokenRepo auth.RefreshTokenRepository
	if db != nil {
		userRepo = auth.NewPostgresUserRepo(db)
		tokenRepo = auth.NewPostgresRefreshRepo(db)
	} else {
		userRepo = auth.NewInMemoryUserRepo()
		tokenRepo = auth.NewInMemoryRefreshRepo()
	}
	authSvc := &auth.AuthService{
		Users:     userRepo,
		Tokens:    tokenRepo,
		JWTSecret: cfg.JWTSecret,
	}
	authHandler := &auth.Handler{Service: authSvc}

	var taskRepo tasks.Repository
	if db != nil {
		taskRepo = tasks.NewPostgresRepo(db)
	} else {
		taskRepo = tasks.NewInMemoryRepo()
	}
	tasksHandler := &tasks.Handler{Service: &tasks.Service{Repo: taskRepo}}

	syncTaskRepo := sync.TaskRepoFromTasksRepo(taskRepo)
	syncMetrics := &observability.MemMetrics{}
	syncSvc := &sync.Service{
		TaskRepo:       syncTaskRepo,
		CursorRepo:     sync.NewInMemoryCursorRepo(),
		ChangeLogRepo:  sync.NewInMemoryChangeLogRepo(),
		Metrics:        syncMetrics,
		FailureTracker: sync.NewMemFailureTracker(0), // 0 = default budget 3
	}
	syncHandler := &sync.Handler{Service: syncSvc, Metrics: syncMetrics}

	storageSvc := &storage.Service{
		Presigner: &storage.MockPresigner{},
		Repo:      storage.NewInMemoryFileRepo(),
		Bucket:    "attachments",
	}
	storageHandler := &storage.Handler{Service: storageSvc}

	aiSvc := &ai.Service{
		Provider: &ai.MockProvider{Content: ""},
		LogRepo:  ai.NewInMemoryRequestLogRepo(),
		Timeout:  30 * time.Second,
	}
	aiHandler := &ai.Handler{Service: aiSvc}

	router := serverhttp.NewRouter(serverhttp.RouterDeps{
		AuthHandler:    authHandler,
		TasksHandler:   tasksHandler,
		SyncHandler:    syncHandler,
		StorageHandler: storageHandler,
		AIHandler:      aiHandler,
		JWTSecret:      cfg.JWTSecret,
	})

	addr := ":" + cfg.Port
	log.Printf("api listening on %s", addr)
	if err := http.ListenAndServe(addr, router); err != nil {
		log.Fatalf("api server exited: %v", err)
	}
}
