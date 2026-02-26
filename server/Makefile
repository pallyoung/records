SHELL := /bin/bash

.PHONY: run test migrate-up migrate-down

run:
	go run ./cmd/api

test:
	go test ./... -v

# Database migrations (requires golang-migrate CLI and DATABASE_URL)
# Install: go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
migrate-up:
	migrate -path migrations -database "$${DATABASE_URL}" -verbose up

migrate-down:
	migrate -path migrations -database "$${DATABASE_URL}" -verbose down 1
