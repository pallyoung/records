package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"time"
)

const refreshTokenExpiry = 7 * 24 * time.Hour

// AuthService handles registration, login, refresh, and logout.
type AuthService struct {
	Users   UserRepository
	Tokens  RefreshTokenRepository
	JWTSecret string
}

// RegisterRequest is the payload for registration.
type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginRequest is the payload for login.
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// RefreshRequest is the payload for token refresh.
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

// AuthTokenResponse is the response for login and refresh.
type AuthTokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

// Register creates a user and returns tokens.
func (s *AuthService) Register(ctx context.Context, req RegisterRequest) (*AuthTokenResponse, error) {
	if req.Email == "" || req.Password == "" {
		return nil, ErrInvalidCredentials
	}
	hash, err := HashPassword(req.Password)
	if err != nil {
		return nil, err
	}
	user, err := s.Users.Create(ctx, req.Email, hash)
	if err != nil {
		return nil, err
	}
	return s.issueTokenPair(ctx, user.ID)
}

// Login validates credentials and returns tokens.
func (s *AuthService) Login(ctx context.Context, req LoginRequest) (*AuthTokenResponse, error) {
	if req.Email == "" || req.Password == "" {
		return nil, ErrInvalidCredentials
	}
	user, err := s.Users.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, ErrInvalidCredentials
	}
	if err := VerifyPassword(req.Password, user.PasswordHash); err != nil {
		return nil, ErrInvalidCredentials
	}
	return s.issueTokenPair(ctx, user.ID)
}

// Refresh validates the refresh token and returns a new token pair (rotation).
func (s *AuthService) Refresh(ctx context.Context, req RefreshRequest) (*AuthTokenResponse, error) {
	if req.RefreshToken == "" {
		return nil, ErrRefreshTokenInvalid
	}
	hash := HashToken(req.RefreshToken)
	rec, err := s.Tokens.Get(ctx, hash)
	if err != nil {
		return nil, err
	}
	// Revoke old token (rotation)
	_ = s.Tokens.Revoke(ctx, hash)
	return s.issueTokenPair(ctx, rec.UserID)
}

// Logout revokes the given refresh token.
func (s *AuthService) Logout(ctx context.Context, refreshToken string) error {
	if refreshToken == "" {
		return nil
	}
	return s.Tokens.Revoke(ctx, HashToken(refreshToken))
}

func (s *AuthService) issueTokenPair(ctx context.Context, userID string) (*AuthTokenResponse, error) {
	access, err := CreateAccessToken(userID, s.JWTSecret)
	if err != nil {
		return nil, err
	}
	refresh, err := generateRefreshToken()
	if err != nil {
		return nil, err
	}
	hash := HashToken(refresh)
	expires := time.Now().UTC().Add(refreshTokenExpiry)
	if err := s.Tokens.Store(ctx, hash, userID, expires); err != nil {
		return nil, err
	}
	return &AuthTokenResponse{AccessToken: access, RefreshToken: refresh}, nil
}

func generateRefreshToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
