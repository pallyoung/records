package ai

import "context"

// ChatRequest is the input for a single chat call.
type ChatRequest struct {
	Message  string
	Provider string
	Model    string
}

// ChatResponse is the output from a provider.
type ChatResponse struct {
	Content     string
	TokenUsage  int64
	Model       string
}

// Provider calls an external model API.
type Provider interface {
	Chat(ctx context.Context, req ChatRequest) (*ChatResponse, error)
}

// MockProvider returns fixed content for tests.
type MockProvider struct {
	Content    string
	TokenUsage int64
	Model      string
	Err        error
}

func (m *MockProvider) Chat(ctx context.Context, req ChatRequest) (*ChatResponse, error) {
	if m.Err != nil {
		return nil, m.Err
	}
	content := m.Content
	if content == "" {
		content = "mock response"
	}
	model := m.Model
	if model == "" {
		model = "mock"
	}
	usage := m.TokenUsage
	if usage == 0 {
		usage = 10
	}
	return &ChatResponse{Content: content, TokenUsage: usage, Model: model}, nil
}
