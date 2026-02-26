import { createApiClient, getApiBaseUrl } from "./client";
import { session } from "../auth/session";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MiB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

function getClient() {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) return null;
  return createApiClient(
    baseUrl,
    () => session.getAccessToken(),
    async () => {
      const refresh = session.getRefreshToken();
      if (!refresh) return false;
      const res = await fetch(`${baseUrl.replace(/\/$/, "")}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
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
    },
  );
}

export async function uploadAttachment(file: File): Promise<string> {
  if (file.size <= 0 || file.size > MAX_SIZE) {
    throw new Error("文件大小需在 1 字节到 10MB 之间");
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("仅支持图片格式：JPEG、PNG、GIF、WebP");
  }
  const client = getClient();
  if (!client) throw new Error("未配置 API 地址或未登录");

  const presign = await client.post<{
    url: string;
    method: string;
    headers: Record<string, string>;
    object_key: string;
  }>("/files/presign-upload", {
    filename: file.name,
    mime_type: file.type,
    size: file.size,
  });

  await fetch(presign.url, {
    method: presign.method || "PUT",
    body: file,
    headers: presign.headers ?? {},
  });

  const complete = await client.post<{ id?: string; ID?: string }>(
    "/files/complete",
    {
      object_key: presign.object_key,
      size: file.size,
      mime_type: file.type,
    },
  );
  return complete.ID ?? complete.id ?? "";
}

export async function getAttachmentDownloadUrl(fileId: string): Promise<string> {
  const client = getClient();
  if (!client) throw new Error("未配置 API 地址或未登录");
  const res = await client.get<{ url: string }>(
    `/files/${encodeURIComponent(fileId)}/download-url`,
  );
  return res.url;
}
