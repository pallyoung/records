package observability

import (
	"testing"
	"time"
)

func TestMemMetrics_SyncPushIncrements(t *testing.T) {
	m := &MemMetrics{}
	m.RecordSyncPushSuccess()
	m.RecordSyncPushSuccess()
	m.RecordSyncPushFailure()
	m.RecordSyncPushConflict(2)

	if m.SyncPushSuccess != 2 {
		t.Errorf("SyncPushSuccess = %d, want 2", m.SyncPushSuccess)
	}
	if m.SyncPushFailure != 1 {
		t.Errorf("SyncPushFailure = %d, want 1", m.SyncPushFailure)
	}
	if m.SyncPushConflict != 2 {
		t.Errorf("SyncPushConflict = %d, want 2", m.SyncPushConflict)
	}
}

func TestMemMetrics_SyncPullIncrements(t *testing.T) {
	m := &MemMetrics{}
	m.RecordSyncPullSuccess()
	m.RecordSyncPullFailure()

	if m.SyncPullSuccess != 1 {
		t.Errorf("SyncPullSuccess = %d, want 1", m.SyncPullSuccess)
	}
	if m.SyncPullFailure != 1 {
		t.Errorf("SyncPullFailure = %d, want 1", m.SyncPullFailure)
	}
}

func TestMemMetrics_DurationRecorded(t *testing.T) {
	m := &MemMetrics{}
	m.RecordSyncPushDuration(100 * time.Millisecond)
	m.RecordSyncPushDuration(50 * time.Millisecond)
	m.RecordSyncPullDuration(200 * time.Millisecond)

	if m.SyncPushDurationMs != 150 {
		t.Errorf("SyncPushDurationMs = %d, want 150", m.SyncPushDurationMs)
	}
	if m.SyncPullDurationMs != 200 {
		t.Errorf("SyncPullDurationMs = %d, want 200", m.SyncPullDurationMs)
	}
}

func TestMemMetrics_DeadLetterIncrements(t *testing.T) {
	m := &MemMetrics{}
	m.RecordSyncDeadLetter()
	m.RecordSyncDeadLetter()

	if m.SyncDeadLetter != 2 {
		t.Errorf("SyncDeadLetter = %d, want 2", m.SyncDeadLetter)
	}
}

func TestNoOpMetrics_DoesNotPanic(t *testing.T) {
	var m NoOpMetrics
	m.RecordSyncPushSuccess()
	m.RecordSyncPushFailure()
	m.RecordSyncPushConflict(1)
	m.RecordSyncPullSuccess()
	m.RecordSyncPullFailure()
	m.RecordSyncPushDuration(time.Second)
	m.RecordSyncPullDuration(time.Second)
	m.RecordSyncDeadLetter()
}
