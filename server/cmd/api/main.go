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
	redisclient "records/server/internal/infra/redis"
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
	}
	if cfg.RedisURL != "" {
		rdb, err := redisclient.Open(cfg.RedisURL)
		if err != nil {
			log.Fatalf("redis open: %v", err)
		}
		defer rdb.Close()
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		if err := rdb.Ping(ctx); err != nil {
			cancel()
			log.Fatalf("redis ping: %v", err)
		}
		cancel()
		tokenRepo = auth.NewRedisRefreshRepo(rdb)
		log.Print("redis connected (refresh tokens)")
	} else if db != nil {
		tokenRepo = auth.NewPostgresRefreshRepo(db)
	} else {
		if userRepo == nil {
			userRepo = auth.NewInMemoryUserRepo()
		}
		tokenRepo = auth.NewInMemoryRefreshRepo()
	}
	if userRepo == nil {
		userRepo = auth.NewInMemoryUserRepo()
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
	var cursorRepo sync.CursorRepo
	var changeLogRepo sync.ChangeLogRepo
	if db != nil {
		cursorRepo = sync.NewPostgresCursorRepo(db)
		changeLogRepo = sync.NewPostgresChangeLogRepo(db)
	} else {
		cursorRepo = sync.NewInMemoryCursorRepo()
		changeLogRepo = sync.NewInMemoryChangeLogRepo()
	}
	syncSvc := &sync.Service{
		TaskRepo:       syncTaskRepo,
		CursorRepo:     cursorRepo,
		ChangeLogRepo:  changeLogRepo,
		Metrics:        syncMetrics,
		FailureTracker: sync.NewMemFailureTracker(0), // 0 = default budget 3
	}
	syncHandler := &sync.Handler{Service: syncSvc, Metrics: syncMetrics}

	var fileRepo storage.FileRepository
	if db != nil {
		fileRepo = storage.NewPostgresFileRepo(db)
	} else {
		fileRepo = storage.NewInMemoryFileRepo()
	}
	storageSvc := &storage.Service{
		Presigner: &storage.MockPresigner{},
		Repo:      fileRepo,
		Bucket:    "attachments",
	}
	storageHandler := &storage.Handler{Service: storageSvc}

	var aiLogRepo ai.RequestLogRepo
	if db != nil {
		aiLogRepo = ai.NewPostgresRequestLogRepo(db)
	} else {
		aiLogRepo = ai.NewInMemoryRequestLogRepo()
	}
	aiSvc := &ai.Service{
		Provider: &ai.MockProvider{Content: ""},
		LogRepo:  aiLogRepo,
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
		CORSOrigins:    cfg.CORSOrigins,
		RateLimitAuth:  cfg.RateLimitAuth,
	})

	addr := ":" + cfg.Port
	log.Printf("api listening on %s", addr)
	if err := http.ListenAndServe(addr, router); err != nil {
		log.Fatalf("api server exited: %v", err)
	}
}
