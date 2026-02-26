// Progress calculation utilities for tasks

// Get effective start time (planned or createdAt)
export function getEffectiveStartTime(record: {
  plannedStartTime?: Date;
  createdAt: Date;
}): Date {
  if (record.plannedStartTime) {
    return new Date(record.plannedStartTime);
  }
  return new Date(record.createdAt);
}

// Get effective end time (planned or end of today)
export function getEffectiveEndTime(record: { plannedEndTime?: Date }): Date {
  if (record.plannedEndTime) {
    return new Date(record.plannedEndTime);
  }
  // Default: end of today 23:59:59
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );
}

// Calculate progress percentage (0-100)
export function calculateProgress(record: {
  plannedStartTime?: Date;
  plannedEndTime?: Date;
  createdAt: Date;
  status: string;
}): number {
  // Completed tasks are 100%
  if (record.status === "completed") {
    return 100;
  }

  const startTime = getEffectiveStartTime(record);
  const endTime = getEffectiveEndTime(record);
  const now = new Date();

  // Not started yet
  if (now < startTime) {
    return 0;
  }

  // Already past end time
  if (now > endTime) {
    return 100;
  }

  // Calculate progress
  const totalMs = endTime.getTime() - startTime.getTime();
  const elapsedMs = now.getTime() - startTime.getTime();
  const progress = Math.round((elapsedMs / totalMs) * 100);

  return Math.min(100, Math.max(0, progress));
}

// Check if task is overdue
export function isOverdue(record: {
  plannedEndTime?: Date;
  plannedStartTime?: Date;
  createdAt: Date;
  status: string;
}): boolean {
  if (record.status === "completed") {
    return false;
  }

  const endTime = getEffectiveEndTime(record);
  const now = new Date();

  return now > endTime;
}

// Get overdue days
export function getOverdueDays(record: {
  plannedEndTime?: Date;
  plannedStartTime?: Date;
  createdAt: Date;
  status: string;
}): number {
  if (!isOverdue(record)) {
    return 0;
  }

  const endTime = getEffectiveEndTime(record);
  const now = new Date();
  const diffMs = now.getTime() - endTime.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return diffDays;
}

// Get start delay in days (actual vs planned)
export function getStartDelayDays(record: {
  plannedStartTime?: Date;
  actualStartTime?: Date;
}): number {
  if (!record.plannedStartTime || !record.actualStartTime) {
    return 0;
  }

  const planned = new Date(record.plannedStartTime);
  const actual = new Date(record.actualStartTime);
  const diffMs = actual.getTime() - planned.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
}
