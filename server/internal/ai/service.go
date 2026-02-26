package ai

import (
	"context"
	"errors"
	"time"
)

var ErrProviderTimeout = errors.New("provider timeout")

// Service handles chat via provider and logs requests.
type Service struct {
	Provider Provider
	LogRepo  RequestLogRepo
	Timeout  time.Duration
}

const defaultTimeout = 30 * time.Second

// ChatRequestDTO is the HTTP body for POST /ai/chat.
type ChatRequestDTO struct {
	Message  string `json:"message"`
	Provider string `json:"provider,omitempty"`
	Model    string `json:"model,omitempty"`
}

// ChatResponseDTO is the HTTP response for POST /ai/chat.
type ChatResponseDTO struct {
	Content string `json:"content"`
}

// Chat runs the provider and logs the request.
func (s *Service) Chat(ctx context.Context, userID string, req ChatRequestDTO) (*ChatResponseDTO, error) {
	if req.Message == "" {
		return nil, ErrInvalidRequest
	}
	timeout := s.Timeout
	if timeout <= 0 {
		timeout = defaultTimeout
	}
	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	start := time.Now()
	providerReq := ChatRequest{Message: req.Message, Provider: req.Provider, Model: req.Model}
	resp, err := s.Provider.Chat(ctx, providerReq)
	latencyMs := time.Since(start).Milliseconds()

	status := "ok"
	if err != nil {
		status = "error"
		if errors.Is(err, context.DeadlineExceeded) {
			status = "timeout"
		}
	}
	if s.LogRepo != nil {
		entry := RequestLogEntry{
			UserID:     userID,
			Provider:   req.Provider,
			Model:      req.Model,
			TokenUsage: 0,
			LatencyMs:  latencyMs,
			Status:     status,
			CreatedAt:  time.Now().UTC(),
		}
		if resp != nil {
			entry.TokenUsage = resp.TokenUsage
			entry.Model = resp.Model
		}
		_ = s.LogRepo.Append(ctx, entry)
	}

	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			return nil, ErrProviderTimeout
		}
		return nil, err
	}
	return &ChatResponseDTO{Content: resp.Content}, nil
}
