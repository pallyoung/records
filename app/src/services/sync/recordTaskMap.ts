import type { Record } from "../../types";
import type { PullChange } from "./syncEngine";

/** Server task payload for sync push (title, status, due_at, attachment_ids). */
export interface TaskPayload {
  title: string;
  status: string;
  due_at?: string;
  attachment_ids?: string[];
}

/**
 * Maps a local Record to the payload shape expected by the sync push API.
 */
export function recordToPayload(record: Record): TaskPayload {
  const title =
    typeof record.content === "string" && record.content.trim().length > 0
      ? record.content
      : "Untitled";
  const dueAt =
    record.plannedEndTime ?? record.plannedStartTime ?? undefined;
  const payload: TaskPayload = {
    title,
    status: record.status,
    ...(dueAt && { due_at: dueAt instanceof Date ? dueAt.toISOString() : String(dueAt) }),
  };
  if (record.images?.length) {
    payload.attachment_ids = [...record.images];
  }
  return payload;
}

/**
 * Maps a server pull change snapshot to a partial Record for upsert into Dexie.
 * Used when applying onPullChanges; does not include all Record fields.
 */
export function snapshotToRecord(
  snapshot: PullChange["snapshot"],
  userId?: string,
): Partial<Record> & { id: string } {
  if (!snapshot?.ID) {
    return { id: "" };
  }
  const content =
    typeof snapshot.Title === "string" && snapshot.Title.length > 0
      ? snapshot.Title
      : "";
  const status =
    snapshot.Status === "pending" ||
    snapshot.Status === "in_progress" ||
    snapshot.Status === "completed"
      ? snapshot.Status
      : "pending";
  const updatedAt = new Date();
  let plannedEndTime: Date | undefined;
  if (snapshot.DueAt != null && snapshot.DueAt !== "") {
    const d = new Date(snapshot.DueAt as string);
    if (!Number.isNaN(d.getTime())) plannedEndTime = d;
  }
  const version =
    typeof snapshot.Version === "number" && snapshot.Version > 0
      ? snapshot.Version
      : 1;

  const attachmentIds =
    (snapshot as { AttachmentIDs?: string[] }).AttachmentIDs ??
    (snapshot as { attachment_ids?: string[] }).attachment_ids;
  const partial: Partial<Record> & { id: string } = {
    id: snapshot.ID,
    content,
    status,
    images: Array.isArray(attachmentIds) ? [...attachmentIds] : [],
    tags: [],
    updatedAt,
    version,
  };
  if (plannedEndTime) partial.plannedEndTime = plannedEndTime;
  if (userId) partial.userId = userId;
  return partial;
}
