package ai

import "context"

// MCPToolClient is a seam for calling MCP tools (e.g. from an AI flow).
// Implementations can call external MCP servers; this package does not depend on any MCP SDK.
type MCPToolClient interface {
	Call(ctx context.Context, toolName string, args map[string]interface{}) (result string, err error)
}

// NoopMCPToolClient is a no-op implementation for when MCP is not configured.
type NoopMCPToolClient struct{}

func (NoopMCPToolClient) Call(ctx context.Context, toolName string, args map[string]interface{}) (string, error) {
	return "", nil
}
