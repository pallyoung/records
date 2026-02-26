import type { Record } from "../../types";
import { db } from "../../db";
import type { PullChange } from "./syncEngine";
import { snapshotToRecord } from "./recordTaskMap";

/**
 * Applies pulled sync changes to Dexie. Does not go through recordStore actions
 * so that these updates do not get enqueued for push.
 */
export async function applyPullChanges(
  changes: PullChange[],
  userId?: string,
): Promise<void> {
  for (const change of changes) {
    if (change.deleted) {
      await db.records.delete(change.entity_id);
      continue;
    }
    const partial = snapshotToRecord(change.snapshot, userId);
    if (!partial.id) continue;

    const existing = await db.records.get(partial.id);
    const now = new Date();
    const merged: Record = {
      content: "",
      images: [],
      tags: [],
      status: "pending",
      createdAt: now,
      updatedAt: now,
      ...existing,
      ...partial,
      id: partial.id,
    };
    merged.createdAt = (existing?.createdAt as Date) ?? merged.createdAt ?? now;
    merged.updatedAt = (merged.updatedAt as Date) ?? now;
    await db.records.put(merged);
  }
}
