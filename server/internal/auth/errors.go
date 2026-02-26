package auth

import "errors"

var (
	ErrEmailExists         = errors.New("email already registered")
	ErrUserNotFound        = errors.New("user not found")
	ErrInvalidCredentials  = errors.New("invalid credentials")
	ErrRefreshTokenInvalid = errors.New("refresh token invalid or revoked")
)
