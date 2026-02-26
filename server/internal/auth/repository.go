package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"sync"
	"time"
)

// User holds persisted user data.
type User struct {
	ID           string
	Email        string
	PasswordHash string
	CreatedAt    time.Time
}

// RefreshTokenRecord holds a refresh token entry for revocation check.
type RefreshTokenRecord struct {
	UserID    string
	ExpiresAt time.Time
	Revoked   bool
}

// UserRepository abstracts user persistence.
type UserRepository interface {
	Create(ctx context.Context, email, passwordHash string) (*User, error)
	GetByID(ctx context.Context, id string) (*User, error)
	GetByEmail(ctx context.Context, email string) (*User, error)
}

// RefreshTokenRepository abstracts refresh token storage and revocation.
type RefreshTokenRepository interface {
	Store(ctx context.Context, tokenHash, userID string, expiresAt time.Time) error
	Get(ctx context.Context, tokenHash string) (*RefreshTokenRecord, error)
	Revoke(ctx context.Context, tokenHash string) error
}

// InMemoryUserRepo is an in-memory UserRepository (for development).
type InMemoryUserRepo struct {
	mu    sync.RWMutex
	byID  map[string]*User
	byEmail map[string]*User
}

// NewInMemoryUserRepo returns a new in-memory user repository.
func NewInMemoryUserRepo() *InMemoryUserRepo {
	return &InMemoryUserRepo{
		byID:    make(map[string]*User),
		byEmail: make(map[string]*User),
	}
}

func (r *InMemoryUserRepo) Create(ctx context.Context, email, passwordHash string) (*User, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for _, u := range r.byEmail {
		if u.Email == email {
			return nil, ErrEmailExists
		}
	}
	user := &User{
		ID:           mustGenerateID(),
		Email:        email,
		PasswordHash: passwordHash,
		CreatedAt:    time.Now().UTC(),
	}
	r.byID[user.ID] = user
	r.byEmail[user.Email] = user
	return user, nil
}

func (r *InMemoryUserRepo) GetByID(ctx context.Context, id string) (*User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	u, ok := r.byID[id]
	if !ok {
		return nil, ErrUserNotFound
	}
	return u, nil
}

func (r *InMemoryUserRepo) GetByEmail(ctx context.Context, email string) (*User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	u, ok := r.byEmail[email]
	if !ok {
		return nil, ErrUserNotFound
	}
	return u, nil
}

// InMemoryRefreshRepo is an in-memory RefreshTokenRepository.
type InMemoryRefreshRepo struct {
	mu   sync.RWMutex
	byHash map[string]*RefreshTokenRecord
}

// NewInMemoryRefreshRepo returns a new in-memory refresh token repository.
func NewInMemoryRefreshRepo() *InMemoryRefreshRepo {
	return &InMemoryRefreshRepo{byHash: make(map[string]*RefreshTokenRecord)}
}

func (r *InMemoryRefreshRepo) Store(ctx context.Context, tokenHash, userID string, expiresAt time.Time) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.byHash[tokenHash] = &RefreshTokenRecord{UserID: userID, ExpiresAt: expiresAt}
	return nil
}

func (r *InMemoryRefreshRepo) Get(ctx context.Context, tokenHash string) (*RefreshTokenRecord, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	rec, ok := r.byHash[tokenHash]
	if !ok || rec.Revoked || time.Now().After(rec.ExpiresAt) {
		return nil, ErrRefreshTokenInvalid
	}
	return rec, nil
}

func (r *InMemoryRefreshRepo) Revoke(ctx context.Context, tokenHash string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if rec, ok := r.byHash[tokenHash]; ok {
		rec.Revoked = true
	}
	return nil
}

// HashToken returns SHA-256 hex of the token for storage.
func HashToken(token string) string {
	h := sha256.Sum256([]byte(token))
	return hex.EncodeToString(h[:])
}

func mustGenerateID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
