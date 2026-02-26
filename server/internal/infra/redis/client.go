package redis

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

var ErrNotFound = errors.New("redis: key not found")

const defaultPrefix = "records"

// Client wraps a Redis client and optional key prefix.
type Client struct {
	*redis.Client
	prefix string
}

// Options for creating a Redis client.
type Options struct {
	URL    string
	Prefix string
}

// Open creates a Redis client from a URL (e.g. redis://localhost:6379/0).
func Open(url string) (*Client, error) {
	if url == "" {
		return nil, fmt.Errorf("redis URL is empty")
	}
	opt, err := redis.ParseURL(url)
	if err != nil {
		return nil, err
	}
	client := redis.NewClient(opt)
	return &Client{Client: client, prefix: defaultPrefix}, nil
}

// Ping verifies the Redis connection is alive.
func (c *Client) Ping(ctx context.Context) error {
	return c.Client.Ping(ctx).Err()
}

// Key returns a prefixed key for the given name (e.g. "records:refresh:abc").
func (c *Client) Key(name string) string {
	if c.prefix == "" {
		return name
	}
	return c.prefix + ":" + name
}

// SetRefreshToken stores a refresh token entry with TTL until expiresAt.
func (c *Client) SetRefreshToken(ctx context.Context, tokenHash, userID string, expiresAt time.Time) error {
	key := c.Key("refresh:" + tokenHash)
	ttl := time.Until(expiresAt)
	if ttl <= 0 {
		ttl = time.Second
	}
	value := userID + "|" + fmt.Sprintf("%d", expiresAt.Unix())
	return c.Set(ctx, key, value, ttl).Err()
}

// GetRefreshToken returns userID and expiresAt if the token exists and is not expired.
func (c *Client) GetRefreshToken(ctx context.Context, tokenHash string) (userID string, expiresAt time.Time, err error) {
	key := c.Key("refresh:" + tokenHash)
	val, err := c.Get(ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			return "", time.Time{}, ErrNotFound
		}
		return "", time.Time{}, err
	}
	parts := strings.SplitN(val, "|", 2)
	if len(parts) != 2 {
		return "", time.Time{}, fmt.Errorf("redis: invalid refresh token value")
	}
	userID = parts[0]
	unix, err := strconv.ParseInt(parts[1], 10, 64)
	if err != nil {
		return "", time.Time{}, err
	}
	return userID, time.Unix(unix, 0), nil
}

// DeleteRefreshToken removes a refresh token (revocation).
func (c *Client) DeleteRefreshToken(ctx context.Context, tokenHash string) error {
	key := c.Key("refresh:" + tokenHash)
	return c.Del(ctx, key).Err()
}
