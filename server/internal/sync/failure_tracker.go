package sync

import (
	"context"
	"sync"
)

// FailureTracker tracks per-op failure counts and determines when to dead-letter.
type FailureTracker interface {
	RecordFailure(ctx context.Context, userID, opID string)
	ShouldDeadLetter(ctx context.Context, userID, opID string) bool
	MarkDeadLetter(ctx context.Context, userID, opID string)
}

const defaultRetryBudget = 3

// MemFailureTracker is an in-memory failure tracker with a retry budget.
type MemFailureTracker struct {
	mu       sync.RWMutex
	budget   int
	failures map[string]map[string]int // userID -> opID -> count
	deadLetter map[string]map[string]struct{} // userID -> opID
}

// NewMemFailureTracker returns a tracker with the given retry budget (0 = default 3).
func NewMemFailureTracker(budget int) *MemFailureTracker {
	if budget <= 0 {
		budget = defaultRetryBudget
	}
	return &MemFailureTracker{
		budget:    budget,
		failures:  make(map[string]map[string]int),
		deadLetter: make(map[string]map[string]struct{}),
	}
}

func (f *MemFailureTracker) RecordFailure(ctx context.Context, userID, opID string) {
	f.mu.Lock()
	defer f.mu.Unlock()
	if f.failures[userID] == nil {
		f.failures[userID] = make(map[string]int)
	}
	f.failures[userID][opID]++
}

func (f *MemFailureTracker) ShouldDeadLetter(ctx context.Context, userID, opID string) bool {
	f.mu.RLock()
	defer f.mu.RUnlock()
	if f.deadLetter[userID] != nil {
		if _, ok := f.deadLetter[userID][opID]; ok {
			return false // already dead-lettered
		}
	}
	n := f.failures[userID][opID]
	return n >= f.budget
}

func (f *MemFailureTracker) MarkDeadLetter(ctx context.Context, userID, opID string) {
	f.mu.Lock()
	defer f.mu.Unlock()
	if f.deadLetter[userID] == nil {
		f.deadLetter[userID] = make(map[string]struct{})
	}
	f.deadLetter[userID][opID] = struct{}{}
}
