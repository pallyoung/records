package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const accessTokenExpiry = 15 * time.Minute

// AccessClaims is the JWT payload for access tokens.
type AccessClaims struct {
	jwt.RegisteredClaims
	UserID string `json:"user_id"`
}

// CreateAccessToken returns a signed JWT for the user, expiring in 15 minutes.
func CreateAccessToken(userID, secret string) (string, error) {
	claims := AccessClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(accessTokenExpiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   userID,
		},
		UserID: userID,
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// ParseAccessToken verifies and parses the JWT, returning the user ID.
func ParseAccessToken(tokenString, secret string) (userID string, err error) {
	token, err := jwt.ParseWithClaims(tokenString, &AccessClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})
	if err != nil {
		return "", err
	}
	claims, ok := token.Claims.(*AccessClaims)
	if !ok || !token.Valid {
		return "", errors.New("invalid token")
	}
	return claims.UserID, nil
}
