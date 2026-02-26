export interface SyncOperation {
  op_id: string;
  entity_id: string;
  operation: "create" | "update" | "delete";
  base_version: number;
  payload?: Record<string, unknown>;
}

const QUEUE_KEY = "sync_queue";

function loadQueue(): SyncOperation[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as SyncOperation[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveQueue(ops: SyncOperation[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(ops));
}

export const syncQueue = {
  add(op: SyncOperation): void {
    const q = loadQueue();
    if (q.some((x) => x.op_id === op.op_id)) return;
    q.push(op);
    saveQueue(q);
  },

  getPending(): SyncOperation[] {
    return loadQueue();
  },

  markApplied(opIds: string[]): void {
    const set = new Set(opIds);
    const q = loadQueue().filter((op) => !set.has(op.op_id));
    saveQueue(q);
  },

  clear(): void {
    saveQueue([]);
  },
};
