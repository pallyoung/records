package storage

import "errors"

var (
	ErrFileNotFound   = errors.New("file not found")
	ErrInvalidSize    = errors.New("invalid size")
	ErrInvalidComplete = errors.New("invalid complete request")
)
