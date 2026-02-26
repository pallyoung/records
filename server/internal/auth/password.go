package auth

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"

	"golang.org/x/crypto/argon2"
)

const (
	argon2Time    = 1
	argon2Memory  = 64 * 1024
	argon2Threads  = 2
	argon2KeyLen  = 32
	argon2SaltLen = 16
)

// HashPassword returns an Argon2id hash of password, encoded as "argon2id$params$salt$key".
func HashPassword(password string) (string, error) {
	salt := make([]byte, argon2SaltLen)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}
	key := argon2.IDKey([]byte(password), salt, argon2Time, argon2Memory, argon2Threads, argon2KeyLen)
	b64Salt := base64.RawStdEncoding.EncodeToString(salt)
	b64Key := base64.RawStdEncoding.EncodeToString(key)
	return fmt.Sprintf("$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
		argon2.Version, argon2Memory, argon2Time, argon2Threads, b64Salt, b64Key), nil
}

// VerifyPassword compares password with the stored hash. Returns nil if they match.
func VerifyPassword(password, encodedHash string) error {
	params, salt, key, err := decodeHash(encodedHash)
	if err != nil {
		return err
	}
	derived := argon2.IDKey([]byte(password), salt, params.Time, params.Memory, params.Threads, params.KeyLen)
	if subtle.ConstantTimeCompare(derived, key) != 1 {
		return errors.New("invalid password")
	}
	return nil
}

type argon2Params struct {
	Time    uint32
	Memory  uint32
	Threads uint8
	KeyLen  uint32
}

func decodeHash(encoded string) (argon2Params, []byte, []byte, error) {
	var p argon2Params
	if !strings.HasPrefix(encoded, "$argon2id$") {
		return p, nil, nil, errors.New("invalid argon2id hash format")
	}
	parts := strings.Split(encoded, "$")
	if len(parts) != 6 {
		return p, nil, nil, errors.New("invalid hash segments")
	}
	var v int
	_, _ = fmt.Sscanf(parts[2], "v=%d", &v)
	_, _ = fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &p.Memory, &p.Time, &p.Threads)
	p.KeyLen = argon2KeyLen
	salt, err := base64.RawStdEncoding.DecodeString(parts[4])
	if err != nil {
		return p, nil, nil, err
	}
	key, err := base64.RawStdEncoding.DecodeString(parts[5])
	if err != nil {
		return p, nil, nil, err
	}
	return p, salt, key, nil
}
