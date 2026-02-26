import { session } from "../auth/session";
import { createApiClient, getApiBaseUrl } from "../api/client";
import { db } from "../../db";
import { syncQueue } from "./syncQueue";

const CURSOR_KEY = "sync_cursor";
const PUSH_INTERVAL_MS = 5000;
const PULL_INTERVAL_MS = 10000;

function getCursor(): string {
  return localStorage.getItem(CURSOR_KEY) ?? "0";
}

function setCursor(c: string): void {
  localStorage.setItem(CURSOR_KEY, c);
}

export type OnPullChanges = (changes: PullChange[]) => void;

export interface PullChange {
  cursor: string;
  entity_id: string;
  operation: string;
  snapshot?: {
    ID?: string;
    Title?: string;
    Status?: string;
    DueAt?: string | null;
    Version?: number;
  };
  deleted?: boolean;
}

let intervalPush: ReturnType<typeof setInterval> | null = null;
let intervalPull: ReturnType<typeof setInterval> | null = null;

async function refreshTokens(): Promise<boolean> {
  const refreshToken = session.getRefreshToken();
  if (!refreshToken) return false;
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) return false;
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
    };
    if (data.access_token && data.refresh_token) {
      session.setTokens({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function startSyncEngine(onPullChanges?: OnPullChanges): void {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl || !session.hasTokens()) return;

  const client = createApiClient(
    baseUrl,
    () => session.getAccessToken(),
    refreshTokens,
  );

  function pushLoop(): void {
    const pending = syncQueue.getPending();
    if (pending.length === 0) return;
    client
      .post<{
        applied: string[];
        conflicts: Array<{ op_id?: string; latest?: { Version?: number } }>;
        new_cursor: string;
      }>("/sync/push", { operations: pending })
      .then((res) => {
        syncQueue.markApplied(res.applied);
        setCursor(res.new_cursor);
        if (res.conflicts?.length && pending.length > 0) {
          const byOpId = new Map(pending.map((op) => [op.op_id, op]));
          for (const c of res.conflicts) {
            const op = c.op_id ? byOpId.get(c.op_id) : undefined;
            const entityId = op?.entity_id;
            const version = c.latest?.Version;
            if (entityId != null && typeof version === "number" && version > 0) {
              db.records.update(entityId, { version });
            }
          }
        }
      })
      .catch(() => {
        // Retry later
      });
  }

  function pullLoop(): void {
    const cursor = getCursor();
    client
      .get<{ changes: PullChange[]; next_cursor: string }>(
        `/sync/pull?cursor=${encodeURIComponent(cursor)}&limit=200`,
      )
      .then((res) => {
        if (res.changes?.length) {
          setCursor(res.next_cursor);
          onPullChanges?.(res.changes);
        }
      })
      .catch(() => {});
  }

  if (intervalPush !== null) clearInterval(intervalPush);
  if (intervalPull !== null) clearInterval(intervalPull);
  intervalPush = setInterval(pushLoop, PUSH_INTERVAL_MS);
  intervalPull = setInterval(pullLoop, PULL_INTERVAL_MS);
  pushLoop();
  pullLoop();
}

export function stopSyncEngine(): void {
  if (intervalPush !== null) {
    clearInterval(intervalPush);
    intervalPush = null;
  }
  if (intervalPull !== null) {
    clearInterval(intervalPull);
    intervalPull = null;
  }
}
