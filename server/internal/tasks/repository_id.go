package tasks

import (
	"crypto/rand"
	"encoding/hex"
)

func mustGenID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
