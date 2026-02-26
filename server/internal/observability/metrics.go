package observability

import (
	"sync"
	"time"
)

// SyncMetrics records sync endpoint metrics for observability.
type SyncMetrics interface {
	RecordSyncPushSuccess()
	RecordSyncPushFailure()
	RecordSyncPushConflict(count int)
	RecordSyncPullSuccess()
	RecordSyncPullFailure()
	RecordSyncPushDuration(d time.Duration)
	RecordSyncPullDuration(d time.Duration)
	RecordSyncDeadLetter()
}

// NoOpMetrics is a no-op implementation of SyncMetrics.
type NoOpMetrics struct{}

func (NoOpMetrics) RecordSyncPushSuccess()              {}
func (NoOpMetrics) RecordSyncPushFailure()               {}
func (NoOpMetrics) RecordSyncPushConflict(int)          {}
func (NoOpMetrics) RecordSyncPullSuccess()              {}
func (NoOpMetrics) RecordSyncPullFailure()              {}
func (NoOpMetrics) RecordSyncPushDuration(time.Duration) {}
func (NoOpMetrics) RecordSyncPullDuration(time.Duration) {}
func (NoOpMetrics) RecordSyncDeadLetter()               {}

// MemMetrics is an in-memory implementation for tests and simple deployments.
type MemMetrics struct {
	mu sync.Mutex

	SyncPushSuccess   int64
	SyncPushFailure   int64
	SyncPushConflict  int64
	SyncPullSuccess   int64
	SyncPullFailure   int64
	SyncPushDurationMs int64
	SyncPullDurationMs int64
	SyncDeadLetter    int64
}

// RecordSyncPushSuccess increments push success counter.
func (m *MemMetrics) RecordSyncPushSuccess() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.SyncPushSuccess++
}

// RecordSyncPushFailure increments push failure counter.
func (m *MemMetrics) RecordSyncPushFailure() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.SyncPushFailure++
}

// RecordSyncPushConflict increments push conflict counter by count.
func (m *MemMetrics) RecordSyncPushConflict(count int) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.SyncPushConflict += int64(count)
}

// RecordSyncPullSuccess increments pull success counter.
func (m *MemMetrics) RecordSyncPullSuccess() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.SyncPullSuccess++
}

// RecordSyncPullFailure increments pull failure counter.
func (m *MemMetrics) RecordSyncPullFailure() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.SyncPullFailure++
}

// RecordSyncPushDuration records push latency in milliseconds.
func (m *MemMetrics) RecordSyncPushDuration(d time.Duration) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.SyncPushDurationMs += d.Milliseconds()
}

// RecordSyncPullDuration records pull latency in milliseconds.
func (m *MemMetrics) RecordSyncPullDuration(d time.Duration) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.SyncPullDurationMs += d.Milliseconds()
}

// RecordSyncDeadLetter increments dead-letter counter.
func (m *MemMetrics) RecordSyncDeadLetter() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.SyncDeadLetter++
}
