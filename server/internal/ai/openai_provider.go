package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

const defaultOpenAIModel = "gpt-3.5-turbo"

// OpenAIProvider calls an OpenAI-compatible chat API (OpenAI, Azure, local LLM, etc.).
type OpenAIProvider struct {
	BaseURL string // e.g. https://api.openai.com
	APIKey  string
	Model   string
	Client  *http.Client
}

// NewOpenAIProvider creates a provider that POSTs to BaseURL/v1/chat/completions.
func NewOpenAIProvider(baseURL, apiKey, defaultModel string) *OpenAIProvider {
	if defaultModel == "" {
		defaultModel = defaultOpenAIModel
	}
	return &OpenAIProvider{
		BaseURL: strings.TrimSuffix(baseURL, "/"),
		APIKey:  apiKey,
		Model:   defaultModel,
		Client:  &http.Client{Timeout: 60 * time.Second},
	}
}

type openAIReq struct {
	Model    string    `json:"model"`
	Messages []openAIMsg `json:"messages"`
}

type openAIMsg struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openAIResp struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Usage *struct {
		TotalTokens int64 `json:"total_tokens"`
	} `json:"usage"`
}

func (p *OpenAIProvider) Chat(ctx context.Context, req ChatRequest) (*ChatResponse, error) {
	model := req.Model
	if model == "" {
		model = p.Model
	}
	body := openAIReq{
		Model: model,
		Messages: []openAIMsg{{Role: "user", Content: req.Message}},
	}
	jsonBody, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, p.BaseURL+"/v1/chat/completions", bytes.NewReader(jsonBody))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+p.APIKey)
	resp, err := p.Client.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ai api: status %d", resp.StatusCode)
	}
	var out openAIResp
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}
	if len(out.Choices) == 0 {
		return nil, fmt.Errorf("ai api: no choices")
	}
	content := out.Choices[0].Message.Content
	usage := int64(0)
	if out.Usage != nil {
		usage = out.Usage.TotalTokens
	}
	return &ChatResponse{Content: content, TokenUsage: usage, Model: model}, nil
}
