package sync

// Operation is a single sync operation in a push.
type Operation struct {
	OpID        string                 `json:"op_id"`
	EntityID    string                 `json:"entity_id"`
	Operation   string                 `json:"operation"` // create, update, delete
	BaseVersion int64                  `json:"base_version"`
	Payload     map[string]interface{} `json:"payload,omitempty"`
}

// PushRequest is the body of POST /sync/push.
type PushRequest struct {
	Operations []Operation `json:"operations"`
}

// PushResponse is the response of POST /sync/push.
type PushResponse struct {
	Applied   []string      `json:"applied"`
	Conflicts []interface{} `json:"conflicts"`
	NewCursor string        `json:"new_cursor"`
}

// ChangeEntry is a single change in the pull stream (create/update/delete).
type ChangeEntry struct {
	Cursor   string         `json:"cursor"`
	EntityID string         `json:"entity_id"`
	Operation string        `json:"operation"`
	Snapshot *TaskSnapshot  `json:"snapshot,omitempty"`
	Deleted  bool           `json:"deleted"`
}

// PullResponse is the response of GET /sync/pull.
type PullResponse struct {
	Changes    []ChangeEntry `json:"changes"`
	NextCursor string        `json:"next_cursor"`
}
