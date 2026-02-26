package main

import (
	"log"
	"net/http"
	"time"

	"records/server/internal/ai"
	"records/server/internal/auth"
	"records/server/internal/infra/config"
	serverhttp "records/server/internal/infra/http"
	"records/server/internal/storage"
	"records/server/internal/sync"
	"records/server/internal/tasks"
)

func main() {
	cfg := config.Load()

	authSvc := &auth.AuthService{
		Users:     auth.NewInMemoryUserRepo(),
		Tokens:    auth.NewInMemoryRefreshRepo(),
		JWTSecret: cfg.JWTSecret,
	}
	authHandler := &auth.Handler{Service: authSvc}

	taskRepo := tasks.NewInMemoryRepo()
	tasksHandler := &tasks.Handler{Service: &tasks.Service{Repo: taskRepo}}

	syncTaskRepo := sync.TaskRepoFromTasksRepo(taskRepo)
	syncSvc := &sync.Service{
		TaskRepo:      syncTaskRepo,
		CursorRepo:    sync.NewInMemoryCursorRepo(),
		ChangeLogRepo: sync.NewInMemoryChangeLogRepo(),
	}
	syncHandler := &sync.Handler{Service: syncSvc}

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
