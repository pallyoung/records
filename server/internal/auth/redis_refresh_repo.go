package auth

import (
	"context"
	"time"

	"records/server/internal/infra/redis"
)

// RedisRefreshRepo implements RefreshTokenRepository using Redis.
type RedisRefreshRepo struct {
	client *redis.Client
}

// NewRedisRefreshRepo returns a new Redis-backed refresh token repository.
func NewRedisRefreshRepo(client *redis.Client) *RedisRefreshRepo {
	return &RedisRefreshRepo{client: client}
}

func (r *RedisRefreshRepo) Store(ctx context.Context, tokenHash, userID string, expiresAt time.Time) error {
	return r.client.SetRefreshToken(ctx, tokenHash, userID, expiresAt)
}

func (r *RedisRefreshRepo) Get(ctx context.Context, tokenHash string) (*RefreshTokenRecord, error) {
	userID, expiresAt, err := r.client.GetRefreshToken(ctx, tokenHash)
	if err != nil {
		if err == redis.ErrNotFound {
			return nil, ErrRefreshTokenInvalid
		}
		return nil, err
	}
	if time.Now().After(expiresAt) {
		return nil, ErrRefreshTokenInvalid
	}
	return &RefreshTokenRecord{
		UserID:    userID,
		ExpiresAt: expiresAt,
		Revoked:   false,
	}, nil
}

func (r *RedisRefreshRepo) Revoke(ctx context.Context, tokenHash string) error {
	return r.client.DeleteRefreshToken(ctx, tokenHash)
}
